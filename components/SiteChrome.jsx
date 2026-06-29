"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Footer from "./Footer";
import LanderFooter from "./LanderFooter";
import LanderHeader from "./LanderHeader";
import MegaNav from "./MegaNav";
import UtilityBanner from "./UtilityBanner";

/* Paths that render with the slim paid-media chrome (logo + book CTA) instead
   of the full MegaNav, and without the site footer.
   Important: every chrome component stays mounted at all times — CSS toggles
   visibility via body[data-lander]. Per the prior fix (a7bc9f8 / fc6efb9),
   MegaNav and the takeovers must NOT unmount on navigation or their
   document.addEventListener cleanups race and kill every interactive surface.
   MegaNav also stays a direct child of <body> so its `position: sticky`
   containing block is the full page, not a wrapper div. */
const LANDER_PATHS = new Set(["/renting-mould-assessment"]);

function isLanderPath(pathname) {
  return LANDER_PATHS.has(pathname);
}

function isAdminPath(pathname) {
  return typeof pathname === "string" && pathname.startsWith("/admin");
}

function isReportPath(pathname) {
  if (typeof pathname !== "string") return false;
  return pathname.startsWith("/r/") || pathname.startsWith("/r2/");
}

export function SiteHeader() {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isAdminPath(pathname)) {
      document.body.dataset.admin = "true";
    } else {
      delete document.body.dataset.admin;
    }
    if (isLanderPath(pathname)) {
      document.body.dataset.lander = "true";
    } else {
      delete document.body.dataset.lander;
    }
    if (isReportPath(pathname)) {
      document.body.dataset.report = "true";
    } else {
      delete document.body.dataset.report;
    }
  }, [pathname]);
  return (
    <>
      <UtilityBanner />
      <MegaNav />
      <LanderHeader />
    </>
  );
}

export function SiteFooter() {
  return (
    <>
      <Footer />
      <LanderFooter />
    </>
  );
}
