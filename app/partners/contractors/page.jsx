import RouteIntroPage from "../../../components/pages/RouteIntroPage";

const page = {
  eyebrow: "[ repair contractors ]",
  title: "Plan the repair before the home is in pieces.",
  lede:
    "Many remediation scopes remove affected materials but do not rebuild them. Sporetrust helps surface repair needs earlier so the handoff is less chaotic.",
  cards: [
    {
      eyebrow: "Builders",
      title: "Rebuild affected areas.",
      copy:
        "For plaster, framing, flooring, cabinetry and room reinstatement after contaminated material is removed.",
    },
    {
      eyebrow: "Waterproofing",
      title: "Fix wet-area causes.",
      copy:
        "Bathrooms, laundries, balconies and showers often need trade work before mould risk is actually controlled.",
    },
    {
      eyebrow: "Ventilation",
      title: "Reduce recurrence conditions.",
      copy:
        "Fans, airflow, HVAC and condensation control can be the difference between repair and relapse.",
    },
    {
      eyebrow: "Handoff",
      title: "Quote from the same facts.",
      copy:
        "Contractors receive clearer evidence about affected materials, likely cause and urgency before quoting.",
    },
  ],
};

export default function ContractorPartnersPage() {
  return <RouteIntroPage {...page} cta="Book diagnosis" />;
}
