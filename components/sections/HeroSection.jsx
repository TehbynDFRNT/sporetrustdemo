import HeroAvailabilityForm from "../HeroAvailabilityForm";
import ThermalReveal from "../ThermalReveal";
import TrustBadge from "../ui/TrustBadge";

export default function HeroSection({ trustBadge }) {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">[ Independent Mould Diagnostics and Reporting ]</span>
            <h1>Catch hidden mould with lab verified testing</h1>
            <p className="lede">
              Independent inspection, moisture mapping and reporting for tenants, homeowners and property managers.
              We document the cause, extent and likely repair pathway before anyone starts selling you the fix.
            </p>
            <HeroAvailabilityForm />
            <div className="hero-trust">
              <span>60-min on-site</span>
              <span>48-hour report</span>
              <span>Fixed price, no callout fees</span>
            </div>
            <TrustBadge className="hero-proof" quote={trustBadge.quote} meta={trustBadge.meta} />
          </div>
          <aside className="hero-visual" aria-label="Visible light and thermal capture comparison">
            <ThermalReveal />

            <div className="thermal-proof-copy">
              <p className="lede">
                Thermal capture. Brisbane apartment, 2025. The occupant had been told it was "just condensation" for
                months. Our diagnostics captures hidden moisture, airborne spores, and early damage before mould is
                visible to the eye.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
