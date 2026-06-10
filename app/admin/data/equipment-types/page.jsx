import Link from "next/link";
import DataTable from "../../../../components/admin/DataTable";
import { equipmentTypes } from "../../../../lib/admin/types/equipment-types";

export default function EquipmentTypesPage() {
  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>{equipmentTypes.label}</h1>
          <p>{equipmentTypes.description}</p>
        </div>
        <Link href="/admin/data/equipment-types/new" className="admin-btn admin-btn--primary">
          + New equipment type
        </Link>
      </div>
      <DataTable config={equipmentTypes} />
    </>
  );
}
