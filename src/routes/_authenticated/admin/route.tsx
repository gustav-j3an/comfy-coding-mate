import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { useAuth } from '@/lib/auth/auth-context';

export const Route = createFileRoute('/_authenticated/admin')({
  component: AdminLayout,
  loader: async ({ context }) => {
    // We already have a gate in _authenticated/route.tsx, 
    // but we add an extra role check here for /admin routes
    // Note: context.auth is not standard in TanStack Start unless we add it,
    // so we rely on the client-side check in the component or a middleware.
    return {};
  }
});

function AdminLayout() {
  const { role, loading } = useAuth();

  if (loading) return null;

  // Extra safety check for role
  if (role !== 'admin') {
    return redirect({ to: '/' });
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AdminSidebar />
      <main className="flex-1 md:pl-72 flex flex-col min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
