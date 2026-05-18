import DataTable from "../../../../components/admin/DataTable";
import { subscriptions } from "../../../../lib/admin/types/subscriptions";

export default function SubscriptionsPage() {
  return (
    <>
      <h1>Subscriptions</h1>
      <p>{subscriptions.description}</p>
      <DataTable config={subscriptions} />
    </>
  );
}
