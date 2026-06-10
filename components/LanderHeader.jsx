import ArrowIcon from "./icons/ArrowIcon";
import Brand from "./Brand";

export default function LanderHeader() {
  return (
    <header className="lander-header" aria-label="Sporetrust">
      <div className="lander-header__inner">
        <Brand />
        <a className="lander-header__cta" href="#enquire">
          Request your inspection
          <ArrowIcon />
        </a>
      </div>
    </header>
  );
}
