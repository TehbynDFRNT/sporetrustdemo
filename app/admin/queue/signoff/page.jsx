// Workflow-oriented entry: the qualified-technician sign-off queue. Not
// built yet — this stub keeps the sidebar nav from 404ing.
export default function SignoffQueuePage() {
  return (
    <>
      <h1>Sign-off queue</h1>
      <p>
        Inspections waiting on a qualified technician to review the field
        report and sign off before publishing.
      </p>
      <p>
        <em>Coming soon.</em> Filters{" "}
        <code>inspections</code> by{" "}
        <code>
          report_status = 'draft' AND completed_at IS NOT NULL AND
          signed_off_at IS NULL
        </code>{" "}
        ordered by <code>completed_at ASC</code>. Opening a row jumps
        into a read-only review of the inspection plus a "Sign off" CTA
        that stamps <code>signed_off_by_technician_id</code> +{" "}
        <code>signed_off_at</code>.
      </p>
    </>
  );
}
