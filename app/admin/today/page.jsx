// Workflow-oriented entry: the technician's run-sheet for today. Not built
// yet — this stub keeps the sidebar nav from 404ing and documents the
// intended shape for the next pass.
export default function TodayRunSheetPage() {
  return (
    <>
      <h1>Today's run-sheet</h1>
      <p>
        Technician-facing view of every inspection scheduled for today —
        booking time, customer, property, suburb, and a "Start" link into
        the inspection workspace.
      </p>
      <p>
        <em>Coming soon.</em> This page filters{" "}
        <code>inspections</code> by{" "}
        <code>scheduled_at::date = today AND technician_id = current_user</code>
        {" "}and surfaces them in chronological order, prefixed with the
        in-progress one (if any) so a tech mid-job lands back on their
        current visit.
      </p>
    </>
  );
}
