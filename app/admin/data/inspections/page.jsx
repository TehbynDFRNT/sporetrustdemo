import DataTabs from "../../../../components/admin/DataTabs";
import { inspections } from "../../../../lib/admin/types/inspections";
import { sampleLocations } from "../../../../lib/admin/types/sample-locations";
import { imageCaptures } from "../../../../lib/admin/types/image-captures";
import { moistureReadings } from "../../../../lib/admin/types/moisture-readings";
import { locationFindings } from "../../../../lib/admin/types/location-findings";
import { locationSources } from "../../../../lib/admin/types/location-sources";

export default function InspectionsPage() {
  return (
    <DataTabs
      title="Inspections"
      description="The diagnostic visit and everything captured at each sample location on the day."
      tabs={[
        inspections,
        sampleLocations,
        imageCaptures,
        moistureReadings,
        locationFindings,
        locationSources,
      ]}
    />
  );
}
