import ThermalReveal from "../ThermalReveal";

export default function ThermalProofSection() {
  return (
    <section className="thermal-proof problem-bg">
      <div className="wrap thermal-proof-wrap">
        <div className="thermal-proof-head">
          <h2>This is the same wall.</h2>
        </div>

        <ThermalReveal />

        <div className="thermal-proof-copy">
          <p className="lede">
            Thermal capture. Brisbane apartment, 2025. The occupant had been told it was "just condensation" for
            months. Our diagnostics captures hidden moisture, airborne spores, and early damage before mould is visible
            to the eye.
          </p>
        </div>
      </div>
    </section>
  );
}
