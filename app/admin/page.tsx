import { getAdminData } from "./admin-data";
import { AdminDashboardView } from "./admin-view";

export default async function AdminPage() {
  // Server component - handles data fetching and authentication
  const stats = await getAdminData();

  return (
    <AdminDashboardView initialStats={stats} />
  );
}




