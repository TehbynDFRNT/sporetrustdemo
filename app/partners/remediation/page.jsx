import RouteIntroPage from "../../../components/pages/RouteIntroPage";

const page = {
  eyebrow: "[ remediation partners ]",
  title: "Remediation providers who work from evidence.",
  lede:
    "Sporetrust connects customers with remediation providers suited to the report findings, containment needs and clearance expectations.",
  cards: [
    {
      eyebrow: "Containment",
      title: "Control the affected area.",
      copy:
        "Good remediation starts with understanding what is contaminated and how to prevent spread during works.",
    },
    {
      eyebrow: "Removal",
      title: "Remove what cannot be cleaned.",
      copy:
        "Some affected plaster, carpet, cabinetry or ceiling materials need removal before repair can happen.",
    },
    {
      eyebrow: "Cleaning",
      title: "Decontaminate properly.",
      copy:
        "Surface treatment alone is not enough when contaminated material or hidden moisture remains.",
    },
    {
      eyebrow: "Clearance",
      title: "Verify the result.",
      copy:
        "We can return after works to check whether the issue has been addressed and document the result.",
    },
  ],
};

export default function RemediationPartnersPage() {
  return <RouteIntroPage {...page} cta="Book diagnosis" />;
}
