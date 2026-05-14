import Brand from "../Brand";

const defaultLinks = [
  { href: "#report", label: "The report" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function SiteNav({
  links = defaultLinks,
  ctaHref = "#book",
  ctaLabel = "Book inspection",
}) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Brand />
        <div className="nav-right">
          {links.map((link) => (
            <a className="nav-link hide-sm" href={link.href} key={`${link.href}-${link.label}`}>
              {link.label}
            </a>
          ))}
          <a className="nav-cta" href={ctaHref}>
            {ctaLabel}
          </a>
        </div>
      </div>
    </nav>
  );
}
