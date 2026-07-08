import { redirect } from "next/navigation";

// The action queue is now a view inside the CRM page (?view=actions). This
// legacy route just forwards there so old links/bookmarks keep working.
export default function CrmQueueRedirect() {
  redirect("/admin/crm?view=actions");
}
