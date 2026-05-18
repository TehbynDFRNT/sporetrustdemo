import DataTable from "../../../../components/admin/DataTable";
import { technicians } from "../../../../lib/admin/types/technicians";

export default function TechniciansPage() {
  return (
    <>
      <h1>Technicians</h1>
      <p>{technicians.description}</p>
      <DataTable config={technicians} />
    </>
  );
}
