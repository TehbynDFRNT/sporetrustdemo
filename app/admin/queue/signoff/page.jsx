import { redirect } from "next/navigation";

// The sign-off queue is now the "Sign-off" tab inside the Inspections page.
// This legacy route just forwards there so old links/bookmarks keep working.
export default function SignoffQueueRedirect() {
  redirect("/admin/inspections?view=signoff");
}
