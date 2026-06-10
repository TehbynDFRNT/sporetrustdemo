import Link from "next/link";
import DataTable from "../../../../components/admin/DataTable";
import { technicianEquipment } from "../../../../lib/admin/types/technician-equipment";

export default function TechnicianEquipmentPage() {
  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>{technicianEquipment.label}</h1>
          <p>{technicianEquipment.description}</p>
        </div>
        <Link href="/admin/data/technician-equipment/new" className="admin-btn admin-btn--primary">
          + Assign equipment
        </Link>
      </div>
      <DataTable config={technicianEquipment} />
    </>
  );
}
