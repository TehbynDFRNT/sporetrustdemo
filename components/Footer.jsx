import Brand from "./Brand";

const DEFAULT_LINKS = [
  { href: "/#report", label: "The report" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/sporetrust-sentinel", label: "Sentinel" },
  { href: "/#faq", label: "FAQ" },
  { href: "#book", label: "Book" },
];

export default function Footer({
  links = DEFAULT_LINKS,
  meta = "© 2026 Sporetrust Diagnostics — Brisbane & SEQ — ABN 00 000 000 000",
}) {
  return (
    <footer>
      <div className="wrap foot-grid">
        <Brand />
        <div className="foot-links">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="foot-meta">{meta}</div>
      </div>
    </footer>
  );
}
