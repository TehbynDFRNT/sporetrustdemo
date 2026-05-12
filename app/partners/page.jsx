import RouteIntroPage from "../../components/pages/RouteIntroPage";
import { routePages } from "../../lib/routePageContent";

export default function PartnersPage() {
  return <RouteIntroPage {...routePages.partners} cta="Discuss a pathway" />;
}
