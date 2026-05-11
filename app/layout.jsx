import { Geist, JetBrains_Mono, Montserrat } from "next/font/google";
import "./globals.css";

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

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata = {
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
    <html lang="en-AU" className={fontClasses}>
      <body>{children}</body>
    </html>
  );
}
