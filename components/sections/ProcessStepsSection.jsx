import ToolIcon from "../icons/ToolIcon";

const tools = [
  ["camera", "Thermal camera"],
  ["meter", "Moisture meter"],
  ["clock", "Hygrometer"],
  ["sampler", "Air sampler"],
];

export default function ProcessStepsSection({ steps }) {
  return (
    <section className="solution">
      <div className="wrap">
        <span className="eyebrow">[ how it works ]</span>
        <h2 style={{ marginTop: 28, maxWidth: "28ch" }}>Four steps to start. No upsell.</h2>
        <p className="lede how-lede">From the moment you book, you'll know what's coming and what it costs.</p>
        <div className="steps">
          {steps.map((step) => (
            <div className="step" key={step.num}>
              <div className="step-num">{step.num}</div>
              <h4>{step.title}</h4>
              <p>{step.copy}</p>
            </div>
          ))}
        </div>
        <div className="tools-strip">
          <div className="ts-label">In the kit</div>
          <div className="ts-icons">
            {tools.map(([type, label]) => (
              <div className="ts-icon" key={type}>
                <ToolIcon type={type} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
