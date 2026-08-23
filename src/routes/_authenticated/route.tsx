import { createFileRoute, Outlet, useNavigate, Link } from '@tanstack/react-router';
import { get, keys } from 'idb-keyval';
import { useAuth } from '@/lib/auth/auth-context';
import { LoginForm } from '@/components/auth/login-form';
import { useEffect, useState } from 'react';
import { Loader2, ArrowLeft, Eye } from 'lucide-react';
import { ConnectionStatus } from '@/components/common/connection-status';
import { PWAUpdateNotification } from '@/components/common/pwa-updater';
import { ChangePasswordModal } from '@/components/auth/change-password-modal';
import { Button } from '@/components/ui/button';
import { getSyncQueue, getVisitDraft } from '@/lib/offline';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading, role, previewPromoter, setPreviewPromoter } = useAuth();
  const navigate = useNavigate();
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const [hasAwaitingMedia, setHasAwaitingMedia] = useState(false);

  useEffect(() => {
    const checkSyncStatus = async () => {
      if (!user?.id) return;
      
      // Check sync queue
      const queue = await getSyncQueue(user.id);
      setHasPendingSync(queue.length > 0);

      // Check for awaiting_media drafts
      const allKeys = await keys();
      const userPrefix = `user_${user.id}_visit_draft_`;
      let awaitingMedia = false;
      for (const key of allKeys) {
        if (typeof key === 'string' && key.startsWith(userPrefix)) {
          const draft = await getVisitDraft(user.id, key.replace(userPrefix, ''));
          if (draft?.status === 'awaiting_media') {
            awaitingMedia = true;
            break;
          }
        }
      }
      setHasAwaitingMedia(awaitingMedia);
    };
    checkSyncStatus();
    
    // Polling sync queue status every 10 seconds
    const interval = setInterval(checkSyncStatus, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (!loading && user) {
      const path = window.location.pathname;
      // If we are exactly at the root of authenticated or index, redirect to dashboard
      if (path === '/_authenticated' || path === '/') {
        if (role === 'admin') navigate({ to: '/admin' });
        else if (role === 'promoter') navigate({ to: '/promoter/' as any });
        else if (role === 'industry') navigate({ to: '/industry/' as any });
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
      <PWAUpdateNotification isUploading={window.location.pathname.includes('/promoter/visit/') || hasPendingSync || hasAwaitingMedia} />
      
      <div className="pt-0 min-h-screen flex flex-col">
        <Outlet />
      </div>
    </>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}