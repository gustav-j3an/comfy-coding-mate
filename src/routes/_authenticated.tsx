import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { LoginForm } from '@/components/auth/login-form';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading, role } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <LoginForm />
      </div>
    );
  }

  return <Outlet />;
}
