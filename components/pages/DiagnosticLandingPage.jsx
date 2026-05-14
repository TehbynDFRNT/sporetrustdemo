import Script from "next/script";
import BookingTakeover from "../BookingTakeover";
import AudienceEvidenceSection from "../sections/AudienceEvidenceSection";
import ContaminationSignsSection from "../sections/ContaminationSignsSection";
import FaqSection from "../sections/FaqSection";
import HeroSection from "../sections/HeroSection";
import IndependenceSection from "../sections/IndependenceSection";
import JourneySection from "../sections/JourneySection";
import MethodologySection from "../sections/MethodologySection";
import PricingSection from "../sections/PricingSection";
import ProblemTheatre from "../sections/ProblemTheatre";
import ProcessStepsSection from "../sections/ProcessStepsSection";
import ReportSection from "../sections/ReportSection";
import SiteFooter from "../sections/SiteFooter";
import SiteNav from "../sections/SiteNav";
import ThermalProofSection from "../sections/ThermalProofSection";
import {
  audiencePanels,
  contaminationSigns,
  faqs,
  journeyItems,
  methods,
  pricingTiers,
  reportItems,
  steps,
  theatreMould,
  trustBadges,
} from "../../lib/landingContent";

export default function DiagnosticLandingPage() {
  return (
    <>
      <main>
        <ProblemTheatre mould={theatreMould}>
          <SiteNav />
          <HeroSection trustBadge={trustBadges[3]} />
          <ThermalProofSection />
          <ContaminationSignsSection signs={contaminationSigns} />
          <AudienceEvidenceSection panels={audiencePanels} />
        </ProblemTheatre>

        <MethodologySection methods={methods} trustBadge={trustBadges[2]} />
        <ReportSection reportItems={reportItems} trustBadge={trustBadges[0]} />
        <ProcessStepsSection steps={steps} />
        <JourneySection items={journeyItems} />
        <PricingSection tiers={pricingTiers} trustBadge={trustBadges[1]} />
        <IndependenceSection />
        <FaqSection items={faqs} />
      </main>

      <SiteFooter />

      <a className="sticky-cta" href="#book">
        Book inspection -&gt;
      </a>

      <a className="financial-napkin-cta" href="/financial-napkin-math.html" target="_blank" rel="noreferrer">
        See financial napkin math
      </a>

      <BookingTakeover />
      <Script src="/mould-contamination.js?v=37" strategy="afterInteractive" />
    </>
  );
}
