import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMPLATES = new Set(["homeowner", "tenant", "insurance"]);

// PDF generation endpoint. Launches headless Chrome (puppeteer-core +
// @sparticuz/chromium), navigates to the paper-first render route at
// /r2/[slug]/print/render?template=…, waits for images to load, then
// captures the page as a PDF at A4 portrait with proper page margins.
//
// Local dev (macOS): expects system Chrome at the default location, or
// PUPPETEER_EXECUTABLE_PATH env var to override. In production (Vercel /
// any Linux serverless) it falls back to the @sparticuz/chromium binary
// bundled in node_modules, which fits inside the 50MB function limit.

async function getExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    return await chromium.executablePath();
  }
  // Local dev defaults — override via PUPPETEER_EXECUTABLE_PATH if these
  // don't match your system.
  if (process.platform === "darwin") {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }
  if (process.platform === "linux") {
    return "/usr/bin/google-chrome";
  }
  // Last-ditch fall back to the bundled chromium — may not work on macOS
  // but lets prod-config dev environments through.
  return await chromium.executablePath();
}

export async function GET(request, { params }) {
  const { slug } = await params;
  const url = new URL(request.url);
  const templateRaw = url.searchParams.get("template") || "homeowner";
  const template = TEMPLATES.has(templateRaw) ? templateRaw : "homeowner";
  const wantsDownload = url.searchParams.get("download") === "1";

  // Build the URL Puppeteer will fetch. Use the inbound request's
  // proto/host so this works in any environment without env var setup.
  const proto = request.headers.get("x-forwarded-proto") || (url.protocol.replace(":", ""));
  const host = request.headers.get("host") || url.host;
  const renderUrl = `${proto}://${host}/r2/${encodeURIComponent(slug)}/print/render?template=${template}`;

  let browser;
  try {
    const executablePath = await getExecutablePath();
    console.log("[print/pdf] launching chrome at", executablePath);
    browser = await puppeteer.launch({
      args: process.env.VERCEL || process.env.NODE_ENV === "production"
        ? chromium.args
        : ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 2 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    // The render route is pure server-rendered HTML — no client JS needed
    // to settle the layout. Disabling JS skips Next.js HMR websockets in
    // dev (which keep `networkidle0` from ever firing) and shaves a few
    // seconds off the cold render.
    await page.setJavaScriptEnabled(false);
    await page.emulateMediaType("print");
    console.log("[print/pdf] navigating to", renderUrl);
    await page.goto(renderUrl, { waitUntil: "load", timeout: 20000 });

    // Explicit image wait — `load` fires when the document's load event
    // fires, but Supabase Storage CDN sometimes resolves images slightly
    // after. Block until every <img> is either complete or errored.
    console.log("[print/pdf] waiting for images");
    await page.evaluate(async () => {
      const imgs = Array.from(document.images);
      await Promise.all(
        imgs.map((img) =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise((res) => {
                img.addEventListener("load", res, { once: true });
                img.addEventListener("error", res, { once: true });
                // Hard cap per image so a single hung CDN request can't
                // block the whole PDF.
                setTimeout(res, 6000);
              }),
        ),
      );
    });

    console.log("[print/pdf] capturing PDF");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "16mm", right: "16mm", bottom: "18mm", left: "16mm" },
    });
    console.log("[print/pdf] done, bytes:", pdfBuffer.length);

    const filename = `sporetrust-${template}-${slug}.pdf`;
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${wantsDownload ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "private, max-age=0, no-store",
      },
    });
  } catch (err) {
    console.error("[print/pdf] generation failed:", err);
    return new Response(
      JSON.stringify({
        error: "PDF generation failed",
        detail: err?.message || String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}
