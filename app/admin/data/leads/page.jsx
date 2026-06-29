import DataTable from "../../../../components/admin/DataTable";
import { leads } from "../../../../lib/admin/types/leads";

export default function LeadsPage() {
  return (
    <>
      <h1>Leads</h1>
      <p>{leads.description}</p>
      <DataTable config={leads} />
    </>
  );
}
