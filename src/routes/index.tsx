import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { useEffect } from 'react';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate({ to: '/_authenticated' });
      } else {
        if (role === 'admin') {
          navigate({ to: '/_authenticated/admin' });
        } else if (role === 'promoter') {
          navigate({ to: '/_authenticated/promoter' });
        } else if (role === 'industry') {
          navigate({ to: '/_authenticated/industry' });
        } else {
          // Default or error
          navigate({ to: '/_authenticated' });
        }
      }
    }
  }, [user, role, loading, navigate]);

  return <div className="flex items-center justify-center min-h-screen">Redirecionando...</div>;
}
