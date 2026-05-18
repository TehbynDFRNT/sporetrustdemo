import DataTable from "../../../../components/admin/DataTable";
import { properties } from "../../../../lib/admin/types/properties";

export default function PropertiesPage() {
  return (
    <>
      <h1>Properties</h1>
      <p>{properties.description}</p>
      <DataTable config={properties} />
    </>
  );
}
