import DataTabs from "../../../../components/admin/DataTabs";
import { scopeItems } from "../../../../lib/admin/types/scope-items";
import { partnerOrganizations } from "../../../../lib/admin/types/partner-organizations";
import { partnerSkills } from "../../../../lib/admin/types/partner-skills";
import { partnerHandoffs } from "../../../../lib/admin/types/partner-handoffs";

export default function ScopePartnersPage() {
  return (
    <DataTabs
      title="Scope & partners"
      description="Inspection-level scope of works, the partner directory, the skill mapping, and the handoff lifecycle."
      tabs={[scopeItems, partnerOrganizations, partnerSkills, partnerHandoffs]}
    />
  );
}
