import Brand from "../Brand";

export default function SiteFooter() {
  return (
    <footer>
      <div className="wrap foot-grid">
        <Brand />
        <div className="foot-links">
          <a href="#report">The report</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <a href="#book">Book</a>
        </div>
        <div className="foot-meta">&copy; 2026 Sporetrust Diagnostics - Brisbane & SEQ</div>
      </div>
    </footer>
  );
}
