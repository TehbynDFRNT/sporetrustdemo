import DataTabs from "../../../../components/admin/DataTabs";
import { airSamples } from "../../../../lib/admin/types/air-samples";
import { airSampleFungalCounts } from "../../../../lib/admin/types/air-sample-fungal-counts";
import { airSampleParticulateCounts } from "../../../../lib/admin/types/air-sample-particulate-counts";
import { airSampleNotableObjects } from "../../../../lib/admin/types/air-sample-notable-objects";

export default function AirSamplesPage() {
  return (
    <DataTabs
      title="Air samples"
      description="Lab-issued slides per sample location, plus the full breakdown — fungal counts, non-fungal particulates and clipped notable objects (training-data candidates)."
      tabs={[
        airSamples,
        airSampleFungalCounts,
        airSampleParticulateCounts,
        airSampleNotableObjects,
      ]}
    />
  );
}
