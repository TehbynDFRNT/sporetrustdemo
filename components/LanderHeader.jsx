import ArrowIcon from "./icons/ArrowIcon";
import Brand from "./Brand";

export default function LanderHeader() {
  return (
    <header className="lander-header" aria-label="Sporetrust">
      <div className="lander-header__inner">
        <Brand />
        <a className="lander-header__cta" href="#book">
          Book inspection
          <ArrowIcon />
        </a>
      </div>
    </header>
  );
}
