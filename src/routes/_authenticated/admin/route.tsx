import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role !== 'admin') {
      navigate({ to: '/', replace: true });
    }
  }, [loading, role, navigate]);

  if (loading || role !== 'admin') return null;


  return (
    <div className="flex min-h-screen bg-slate-50 font-sans w-full overflow-x-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen w-full min-w-0">
        <main className="flex-1 overflow-y-auto w-full">
          <div className="mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
