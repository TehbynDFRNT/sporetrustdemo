import { redirect } from "next/navigation";

// Land on the workflow entry rather than a Data page, so the sidebar's
// Data group stays collapsed on first visit (it auto-expands only when
// pathname matches a Data item).
export default function AdminIndexPage() {
  redirect("/admin/inspections");
}
