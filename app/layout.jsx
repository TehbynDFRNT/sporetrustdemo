import { Geist, JetBrains_Mono, Montserrat } from "next/font/google";
import Script from "next/script";
import BookingTakeover from "../components/BookingTakeover";
import MetaPixel from "../components/MetaPixel";
import QuizTakeover from "../components/QuizTakeover";
import ReportDemoTakeover from "../components/ReportDemoTakeover";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import "./globals.css";

const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const jetBrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

// Montserrat is wordmark-only — used in MegaNav / Brand chrome which is
// hidden under /admin/*. Skip the preload link so admin pages don't pay
// the unused-preload warning; marketing pages just fetch it on first use,
// which is fine for a non-critical wordmark.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
});

export const metadata = {
  metadataBase: new URL("https://sporetrust.com.au"),
  title: "Sporetrust - Independent Mould & Moisture Diagnostics",
  description:
    "If you suspect mould, get a definitive answer. Independent testing, damage assessment and repair cost estimate. Plain-English report in 48 hours.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/sporetrace-icon.svg?v=5", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "Sporetrust - If you suspect mould, you're probably right",
    description:
      "Most mould problems are bigger and older than what's visible. We test, locate it, document the damage and price the fix. Plain-English report in 48 hours.",
  },
};

export const viewport = {
  themeColor: "#F1F0EE",
};

export default function RootLayout({ children }) {
  const fontClasses = [
    geist.variable,
    jetBrains.variable,
    montserrat.variable,
  ].join(" ");

  return (
    <html lang="en-AU" className={fontClasses} suppressHydrationWarning>
      <body>
        {/* Lock viewport height before first paint: sets --vph to the current
            window.innerHeight in px so CSS height calcs don't recompute as the
            mobile URL bar collapses on scroll. Only re-measures on width
            changes (orientation flips), which filters out URL bar animations
            since those only change height. CSS falls back to 100dvh until
            this runs, so SSR + first paint stay correct.
            `next/script` with `beforeInteractive` runs the inline body once
            before hydration without React warning about <script> tags in
            client renders. */}
        <Script id="vph-lock" strategy="beforeInteractive">
          {`(function(){var d=document.documentElement;function s(){d.style.setProperty('--vph',window.innerHeight+'px');}s();var w=window.innerWidth;window.addEventListener('resize',function(){if(Math.abs(window.innerWidth-w)>50){w=window.innerWidth;s();}},{passive:true});window.addEventListener('orientationchange',s);})();`}
        </Script>

        {/* Meta Pixel — base snippet fires the FIRST PageView with a shared
            event id; <MetaPixel/> mirrors it to CAPI + handles route changes.
            Next hoists the preconnect <link>s into <head>. */}
        {metaPixelId ? (
          <>
            <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
            <link rel="preconnect" href="https://www.facebook.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="//connect.facebook.net" />
            <link rel="dns-prefetch" href="//www.facebook.com" />
            <Script id="meta-pixel-base" strategy="beforeInteractive">
              {`(function(){var p=location.pathname;if(p.indexOf('/admin')===0||p.indexOf('/r/')===0||p.indexOf('/r2/')===0)return;!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');window.__sporetrustInitialPageViewEventId='page_view_'+Date.now()+'_'+Math.random().toString(36).slice(2,10);fbq('track','PageView',{},{eventID:window.__sporetrustInitialPageViewEventId});})();`}
            </Script>
            <noscript>
              <img
                alt=""
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              />
            </noscript>
            <MetaPixel />
          </>
        ) : null}

        <SiteHeader />
        {children}
        <SiteFooter />
        <BookingTakeover />
        <QuizTakeover />
        <ReportDemoTakeover />
      </body>
    </html>
  );
}
