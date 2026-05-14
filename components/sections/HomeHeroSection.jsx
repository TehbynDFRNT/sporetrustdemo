import HeroAvailabilityForm from "../HeroAvailabilityForm";
import TrustBadge from "../ui/TrustBadge";

const systemSteps = ["Diagnose", "Scope", "Remediate", "Clear", "Prevent"];

export default function HomeHeroSection({ trustBadge }) {
  return (
    <section className="hero home-hero home-hero-system">
      <div className="wrap">
        <div className="home-hero-layout">
          <div className="hero-copy">
            <span className="eyebrow">[ Mould Diagnostics, Clearance and Prevention ]</span>
            <h1>Mould care that starts with proof and keeps going after the report.</h1>
            <p className="lede">
              Independent testing when something feels wrong. Trusted pathways when work is needed. Sentinel prevention
              when you want the home monitored before mould becomes visible again.
            </p>
            <div className="home-hero-actions">
              <a className="btn" href="#book">
                Book a diagnosis -&gt;
              </a>
              <a className="btn route-secondary" href="/sporetrust-sentinel">
                Explore Sentinel
              </a>
            </div>
            <div className="hero-trust">
              <span>Independent report</span>
              <span>Sentinel prevention</span>
              <span>Remediation and repair handoff</span>
            </div>
            <TrustBadge className="hero-proof" quote={trustBadge.quote} meta={trustBadge.meta} />
          </div>

          <aside className="home-system-panel" aria-label="Sporetrust mould care system">
            <div className="home-system-card primary">
              <span>First response</span>
              <h2>Independent diagnostic report</h2>
              <p>
                Moisture mapping, thermal capture, optional lab sampling, damage documentation and a clear next-step
                pathway.
              </p>
            </div>
            <div className="home-system-flow" aria-label="Sporetrust service pathway">
              {systemSteps.map((step, index) => (
                <div className="home-system-step" key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>
            <div className="home-availability-card">
              <span>Check your suburb</span>
              <HeroAvailabilityForm />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
