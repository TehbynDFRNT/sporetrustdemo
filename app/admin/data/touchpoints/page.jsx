import DataTable from "../../../../components/admin/DataTable";
import { touchpoints } from "../../../../lib/admin/types/touchpoints";

export default function TouchpointsPage() {
  return (
    <>
      <h1>Touchpoints</h1>
      <p>{touchpoints.description}</p>
      <DataTable config={touchpoints} />
    </>
  );
}
