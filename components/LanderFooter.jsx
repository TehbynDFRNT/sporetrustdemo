import Brand from "./Brand";

export default function LanderFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="lander-footer">
      <div className="lander-footer__inner">
        <Brand />
        <ul className="lander-footer__links">
          <li>
            <a href="/legal/privacy">Privacy</a>
          </li>
          <li>
            <a href="/legal/terms">Terms</a>
          </li>
        </ul>
        <span className="lander-footer__copy">
          © {year} Sporetrust. Independent mould diagnostics.
        </span>
      </div>
    </footer>
  );
}
