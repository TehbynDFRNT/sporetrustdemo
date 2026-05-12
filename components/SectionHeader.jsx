import Eyebrow from "./Eyebrow";

export default function SectionHeader({
  eyebrow,
  title,
  lede,
  titleMax,
  ledeMax,
  align = "left",
  tone = "default",
  children,
  className = "",
  id,
}) {
  const hasAside = Boolean(children);
  const headerClass = [
    "section-header",
    `section-header--${align}`,
    `section-header--${tone}`,
    hasAside ? "section-header--has-aside" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClass} id={id}>
      <div className="section-header__main">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        {title ? (
          <h2
            className="section-header__title"
            style={titleMax ? { maxWidth: titleMax } : undefined}
          >
            {title}
          </h2>
        ) : null}
        {lede ? (
          <p
            className="section-header__lede lede"
            style={ledeMax ? { maxWidth: ledeMax } : undefined}
          >
            {lede}
          </p>
        ) : null}
      </div>
      {hasAside ? <div className="section-header__aside">{children}</div> : null}
    </header>
  );
}
