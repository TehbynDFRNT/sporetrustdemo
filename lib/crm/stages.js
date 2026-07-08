/* Pipeline stage config — the single place stage labels/order/hints live.
   The DB CHECK on crm_cards.stage pins the slugs; everything display-side
   reads this. Renaming a stage = edit here; adding one = one-line CHECK
   migration + an entry here. `waitlist` is first-class: the business is
   validation-stage, so qualified leads park there until capacity opens. */

export const STAGES = [
  { slug: "new",      label: "New",             hint: "Untouched enquiry — first contact within 24h", tone: "active" },
  { slug: "working",  label: "In conversation", hint: "Contacted — qualifying, answering questions" },
  { slug: "waitlist", label: "Waitlist",        hint: "Qualified, parked until inspection capacity opens" },
  { slug: "booked",   label: "Booked",          hint: "Inspection scheduled" },
  { slug: "done",     label: "Completed",       hint: "Inspection delivered", muted: true },
  { slug: "lost",     label: "Lost",            hint: "Unqualified, unresponsive or withdrew", muted: true },
];

export const STAGE_SLUGS = STAGES.map((s) => s.slug);

export function stageLabel(slug) {
  return STAGES.find((s) => s.slug === slug)?.label ?? slug;
}
