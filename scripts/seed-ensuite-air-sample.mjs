// Seed an air sample + per-species fungal counts for the Master ensuite
// of inspection 1. Mirrors the Bedroom 1 lab return but with the lower
// total / mostly-outdoor profile expected of a low-pressure room.
//
// Run: node scripts/seed-ensuite-air-sample.mjs
//
// Idempotent — if an air sample already exists for this sample_location,
// the script reports it and exits without modifying data.

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Master ensuite is sample_location 2 (inspection 1). Low mould pressure,
// thermal delta -1.2 °C — the lab return should reflect a room mostly at
// outdoor baseline with a mild Cladosporium / Aspergillus-Penicillium
// amplification, not the water-damage-indicator profile Bedroom 1 shows.
const SAMPLE_LOCATION_ID = 2;

const AIR_SAMPLE = {
  sample_location_id: SAMPLE_LOCATION_ID,
  lab_partner: "lab",
  lab_sample_id: "LAB-2026-04-1189",
  sampled_at: "2026-04-20T23:50:00Z",
  received_by_lab_at: "2026-04-22T01:00:00Z",
  reported_by_lab_at: "2026-04-24T03:00:00Z",
  total_spores_per_m3: 222,
  dominant_fungal_classification_id: 5, // Cladosporium (allergenic, indoor_outdoor group)
};

// fungal_classification_id values match the seeded reference set:
//   1 Ascospore                · predominantly_outdoor
//   2 Basidiospore             · predominantly_outdoor
//   4 Aspergillus / Penicillium · indoor_outdoor
//   5 Cladosporium             · indoor_outdoor
//   6 Alternaria               · predominantly_outdoor
//   10 Epicoccum               · predominantly_outdoor
//   12 Mucor / Rhizopus        · indoor_outdoor
const COUNTS = [
  { fungal_classification_id: 5,  spores_per_m3: 80, level: "normal" },
  { fungal_classification_id: 4,  spores_per_m3: 60, level: "normal" },
  { fungal_classification_id: 1,  spores_per_m3: 30, level: "normal" },
  { fungal_classification_id: 2,  spores_per_m3: 25, level: "normal" },
  { fungal_classification_id: 6,  spores_per_m3: 14, level: "normal" },
  { fungal_classification_id: 12, spores_per_m3: 8,  level: "normal" },
  { fungal_classification_id: 10, spores_per_m3: 5,  level: "normal" },
];

async function main() {
  const { data: existing, error: lookupErr } = await supabase
    .from("air_samples")
    .select("air_sample_id, total_spores_per_m3, air_sample_fungal_counts(air_sample_fungal_count_id)")
    .eq("sample_location_id", SAMPLE_LOCATION_ID)
    .maybeSingle();
  if (lookupErr) throw new Error(`Lookup failed: ${lookupErr.message}`);

  let airSampleId;
  if (existing) {
    if (existing.total_spores_per_m3 != null && (existing.air_sample_fungal_counts || []).length > 0) {
      console.log(
        `air_sample ${existing.air_sample_id} for sample_location ${SAMPLE_LOCATION_ID} already has results (total ${existing.total_spores_per_m3} cts/m³, ${existing.air_sample_fungal_counts.length} counts). Skipping.`,
      );
      return;
    }
    // Placeholder row exists — update it with the real lab return.
    const { error: updateErr } = await supabase
      .from("air_samples")
      .update(AIR_SAMPLE)
      .eq("air_sample_id", existing.air_sample_id);
    if (updateErr) throw new Error(`Update air_sample failed: ${updateErr.message}`);
    airSampleId = existing.air_sample_id;
    console.log(`Updated existing air_sample ${airSampleId} with lab return data.`);
  } else {
    const { data: sample, error: sampleErr } = await supabase
      .from("air_samples")
      .insert(AIR_SAMPLE)
      .select("air_sample_id")
      .single();
    if (sampleErr) throw new Error(`Insert air_sample failed: ${sampleErr.message}`);
    airSampleId = sample.air_sample_id;
    console.log(`Inserted new air_sample ${airSampleId}.`);
  }

  const countsRows = COUNTS.map((c) => ({ ...c, air_sample_id: airSampleId }));
  const { error: countsErr } = await supabase
    .from("air_sample_fungal_counts")
    .insert(countsRows);
  if (countsErr) throw new Error(`Insert counts failed: ${countsErr.message}`);

  console.log(
    `Seeded ${countsRows.length} per-species counts (total ${AIR_SAMPLE.total_spores_per_m3} cts/m³) on air_sample ${airSampleId}.`,
  );
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exitCode = 1;
});
