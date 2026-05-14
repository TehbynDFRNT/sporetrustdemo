import CheckIcon from "../icons/CheckIcon";

export default function SubscriptionModelSection({ highlights }) {
  return (
    <section className="home-subscription problem-bg">
      <div className="wrap home-subscription-grid">
        <div>
          <span className="eyebrow">[ sentinel subscription ]</span>
          <h2>Diagnostics should not be the only time you hear from us.</h2>
          <p className="lede">
            The one-off report solves the immediate uncertainty. Sentinel is the longer-term position: prevention,
            monitoring, support and a clear clearance path for homes that need ongoing confidence.
          </p>
        </div>

        <article className="sentinel-offer-card">
          <div className="sentinel-kicker">Major offer shift</div>
          <h3>From emergency mould callout to managed home-health plan.</h3>
          <ul>
            {highlights.map((item) => (
              <li key={item}>
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <a className="btn" href="/sporetrust-sentinel">
            See Sentinel -&gt;
          </a>
        </article>
      </div>
    </section>
  );
}
