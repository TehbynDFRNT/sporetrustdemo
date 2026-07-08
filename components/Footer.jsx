import Brand from "./Brand";

const FOOTER_COLUMNS = [
  {
    heading: "Diagnostics",
    links: [
      { href: "/visible-mould", label: "I have mould already" },
      { href: "/suspected-mould", label: "I suspect mould" },
      { href: "/mould-prevention", label: "Mould prevention" },
      { label: "Do I have mould? — Quiz", trigger: "quiz" },
    ],
  },
  {
    heading: "Service",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/sporetrust-sentinel", label: "Sporetrust Sentinel" },
      { label: "Sample digital report demo", trigger: "report-demo" },
    ],
  },
  {
    heading: "About",
    links: [
      { href: "/why-sporetrust", label: "Why Sporetrust" },
      { href: "/partners/contractors", label: "Repair contractor network" },
      { href: "/partners/remediation", label: "Remediation partners" },
    ],
  },
];

const TRIGGER_ATTR = {
  quiz: "data-quiz-trigger",
  "report-demo": "data-report-demo-trigger",
  booking: "data-booking-trigger",
};

const CONTACT = [
  { label: "Service area", value: "Brisbane & South-East Queensland" },
  { label: "Email", value: "contact@sporetrust.com.au", href: "mailto:contact@sporetrust.com.au" },
  { label: "Phone", value: "07 4802 3011", href: "tel:+61748023011" },
];

export default function Footer({
  meta = "© 2026 Sporetrust Diagnostics · Brisbane & SEQ",
}) {
  return (
    <footer>
      <div className="wrap foot-grid">
        <div className="foot-col foot-col--brand">
          <Brand />
          <p className="foot-tagline">
            Independent mould & moisture diagnostics. We don't sell the fix — the report is the
            product.
          </p>
          <ul className="foot-accreditation" aria-label="Accreditation">
            <li>
              <img src="/logos/iicrc.svg" alt="IICRC certified" loading="lazy" />
            </li>
            <li>
              <img src="/logos/nata.png" alt="NATA-accredited lab partners" loading="lazy" />
            </li>
          </ul>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div className="foot-col" key={col.heading}>
            <span className="foot-col__heading">{col.heading}</span>
            <ul className="foot-links">
              {col.links.map((link) => (
                <li key={link.href || link.trigger}>
                  {link.trigger ? (
                    <button
                      type="button"
                      className="foot-trigger"
                      {...{ [TRIGGER_ATTR[link.trigger]]: "" }}
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a href={link.href}>{link.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="foot-col foot-col--contact">
          <span className="foot-col__heading">Contact</span>
          <dl className="foot-contact">
            {CONTACT.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.href ? <a href={item.href}>{item.value}</a> : item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="wrap foot-base">
        <span className="foot-meta">{meta}</span>
        <ul className="foot-legal">
          <li><a href="/legal/privacy">Privacy</a></li>
          <li><a href="/legal/terms">Terms</a></li>
        </ul>
      </div>
    </footer>
  );
}
