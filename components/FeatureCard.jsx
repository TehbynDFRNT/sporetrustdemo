import ArrowIcon from "./icons/ArrowIcon";

/**
 * FeatureCard — dark rounded-corner showcase card with content on the left
 * and a full-bleed image on the right (image edge fades into the dark veil).
 *
 * Accepts:
 *   eyebrow          — small pill tag at top-left (uppercase mono)
 *   title            — large 1-2 line headline
 *   stats            — array of { icon?, figure, label } shown in a row under a divider
 *   primaryCta       — { label, href }   — filled paper-on-ink pill
 *   secondaryCta     — { label, href }   — ghost (transparent w/ ring) pill
 *   footnote         — small grey text at the bottom (e.g. "* Based on N patients...")
 *   image            — required, src for the right-side bleed image
 *   imageAlt         — accessible image label
 *   imageSide        — "right" (default) or "left"
 */
export default function FeatureCard({
  eyebrow,
  title,
  stats = [],
  primaryCta,
  secondaryCta,
  footnote,
  image,
  imageAlt = "",
  imageSide = "right",
  className = "",
}) {
  return (
    <article
      className={`feature-card feature-card--image-${imageSide}${className ? ` ${className}` : ""}`}
      aria-label={typeof title === "string" ? title : undefined}
    >
      {image ? (
        <div
          className="feature-card__media"
          role="img"
          aria-label={imageAlt}
          style={{ backgroundImage: `url("${image}")` }}
        />
      ) : null}
      <div className="feature-card__veil" aria-hidden="true" />

      <div className="feature-card__content">
        {eyebrow ? <span className="feature-card__eyebrow">{eyebrow}</span> : null}
        {title ? <h2 className="feature-card__title">{title}</h2> : null}

        {stats.length ? (
          <>
            <hr className="feature-card__divider" />
            <div className="feature-card__stats">
              {stats.map((stat, index) => (
                <div className="feature-card__stat" key={`${stat.figure}-${index}`}>
                  {stat.icon ? (
                    <span className="feature-card__stat-icon" aria-hidden="true">
                      {stat.icon}
                    </span>
                  ) : null}
                  <span className="feature-card__stat-figure">{stat.figure}</span>
                  <span className="feature-card__stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {primaryCta || secondaryCta || footnote ? (
          <div className="feature-card__footer">
            {primaryCta || secondaryCta ? (
              <div className="feature-card__actions">
                {primaryCta ? (
                  <a
                    className="feature-card__cta feature-card__cta--primary"
                    href={primaryCta.href}
                    onClick={primaryCta.onClick}
                  >
                    <span>{primaryCta.label}</span>
                    <ArrowIcon />
                  </a>
                ) : null}
                {secondaryCta ? (
                  <a
                    className="feature-card__cta feature-card__cta--ghost"
                    href={secondaryCta.href}
                    onClick={secondaryCta.onClick}
                  >
                    <span>{secondaryCta.label}</span>
                    <ArrowIcon />
                  </a>
                ) : null}
              </div>
            ) : null}
            {footnote ? <p className="feature-card__footnote">{footnote}</p> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
