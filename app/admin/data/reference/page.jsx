import DataTabs from "../../../../components/admin/DataTabs";
import { tradeCategories } from "../../../../lib/admin/types/trade-categories";
import { fungalClassifications } from "../../../../lib/admin/types/fungal-classifications";
import { particulateTypes } from "../../../../lib/admin/types/particulate-types";

export default function ReferencePage() {
  return (
    <DataTabs
      title="Reference data"
      description="The lookup tables that everything else FKs into. Seed once, update when the lab partner publishes new glossary entries."
      tabs={[tradeCategories, fungalClassifications, particulateTypes]}
    />
  );
}
