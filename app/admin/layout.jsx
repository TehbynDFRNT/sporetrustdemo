import AdminSidebar from "../../components/admin/AdminSidebar";
import QueryProvider from "../../components/admin/QueryProvider";
import DiallerProvider from "../../components/admin/voice/DiallerProvider";
import "./admin.css";
import "./admin-forms.css";

// Admin section layout. Hosts the sidebar + TanStack QueryClientProvider so
// they mount once and persist across in-section navigation — pages inside
// /admin/* never remount the sidebar or lose query cache.
//
// TODO when Clerk env vars are wired up:
//   1. Wrap the returned tree in <ClerkProvider> (from "@clerk/nextjs").
//   2. Add a middleware.js gate on /admin(.*) + /api/admin(.*) that calls
//      auth.protect(). See docs/clerk-supabase-integration.md.
//   The sidebar already has a footer "Auth: unconfigured" pill that should
//   flip to a sign-out / user button once Clerk is live.
export default function AdminLayout({ children }) {
  return (
    <QueryProvider>
      <DiallerProvider>
        <div className="admin-root">
          <AdminSidebar />
          <main className="admin-main">{children}</main>
        </div>
      </DiallerProvider>
    </QueryProvider>
  );
}
