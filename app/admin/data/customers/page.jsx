import DataTable from "../../../../components/admin/DataTable";
import { customers } from "../../../../lib/admin/types/customers";

export default function CustomersPage() {
  return (
    <>
      <h1>Customers</h1>
      <p>{customers.description}</p>
      <DataTable config={customers} />
    </>
  );
}
