import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { LoginForm } from '@/components/auth/login-form';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ConnectionStatus } from '@/components/common/connection-status';
import { PWAUpdateNotification } from '@/components/common/pwa-updater';
import { getSyncQueue } from '@/lib/offline';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const [hasPendingSync, setHasPendingSync] = useState(false);

  useEffect(() => {
    const checkSync = async () => {
      const queue = await getSyncQueue();
      setHasPendingSync(queue.length > 0);
    };
    checkSync();
    
    // Polling sync queue status every 10 seconds while on promoter route
    const interval = setInterval(checkSync, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      const path = window.location.pathname;
      // If we are exactly at the root of authenticated or index, redirect to dashboard
      if (path === '/_authenticated' || path === '/') {
        if (role === 'admin') navigate({ to: '/admin' });
        else if (role === 'promoter') navigate({ to: '/promoter' });
        else if (role === 'industry') navigate({ to: '/industry' });
      }
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <LoginForm />
      </div>
    );
  }

  return (
    <>
      <ConnectionStatus />
      <PWAUpdateNotification isUploading={window.location.pathname.includes('/promoter/visit/') || hasPendingSync} />
      <Outlet />
    </>
  );
}