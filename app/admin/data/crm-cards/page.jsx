import DataTable from "../../../../components/admin/DataTable";
import { crmCards } from "../../../../lib/admin/types/crm-cards";

export default function CrmCardsPage() {
  return (
    <>
      <h1>CRM cards</h1>
      <p>{crmCards.description}</p>
      <DataTable config={crmCards} />
    </>
  );
}
