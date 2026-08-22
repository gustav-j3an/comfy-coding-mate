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
        // Redirect to a path that is covered by the _authenticated layout
        // Since it's a pathless layout, we can try to navigate to any of its children
        // or just wait for the router to handle it if we are at / and it matches.
        // Actually, if we are at / and user is null, _authenticated layout will handle the redirect if we set it up.
        // But for now, let's just go to /admin and let it trigger the login.
        navigate({ to: '/admin' });
      } else {
        if (role === 'admin') {
          navigate({ to: '/admin' });
        } else if (role === 'promoter') {
          navigate({ to: '/promoter' });
        } else if (role === 'industry') {
          navigate({ to: '/industry' });
        } else {
          navigate({ to: '/admin' });
        }
      }
    }
  }, [user, role, loading, navigate]);

  return <div className="flex items-center justify-center min-h-screen">Redirecionando...</div>;
}
