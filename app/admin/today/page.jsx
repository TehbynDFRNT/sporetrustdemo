import { redirect } from "next/navigation";

// The run-sheet is now the "Today" tab inside the Inspections page. This
// legacy route just forwards there so old links/bookmarks keep working.
export default function TodayRunSheetRedirect() {
  redirect("/admin/inspections?view=today");
}
