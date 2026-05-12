import RouteIntroPage from "../../components/pages/RouteIntroPage";
import { routePages } from "../../lib/routePageContent";

export default function SporetrustSentinelPage() {
  return <RouteIntroPage {...routePages.sentinel} cta="Ask about Sentinel" />;
}
