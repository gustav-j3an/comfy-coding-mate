import { createFileRoute, Outlet, useNavigate, Link } from '@tanstack/react-router';
import { get, keys } from 'idb-keyval';
import { useAuth } from '@/lib/auth/auth-context';
import { LoginForm } from '@/components/auth/login-form';
import { useEffect, useState } from 'react';
import { Loader2, ArrowLeft, Eye } from 'lucide-react';
import { ConnectionStatus } from '@/components/common/connection-status';
import { PWAUpdateNotification } from '@/components/common/pwa-updater';
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
      <PWAUpdateNotification isUploading={window.location.pathname.includes('/promoter/visit/') || hasPendingSync || hasAwaitingMedia} />
      
      {previewPromoter && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-600 text-white px-4 py-2 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Eye className="h-4 w-4 animate-pulse" />
            <span>VOCÊ ESTÁ VISUALIZANDO COMO: <span className="underline">{previewPromoter.name.toUpperCase()}</span></span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white text-amber-700 hover:bg-slate-100 border-none h-8 font-bold text-xs"
            onClick={() => {
              setPreviewPromoter(null);
              navigate({ to: '/admin/routes' });
            }}
          >
            <ArrowLeft className="h-3 w-3 mr-1" /> VOLTAR AO PAINEL ADMIN
          </Button>
        </div>
      )}

      <div className={cn(previewPromoter ? "pt-12" : "")}>
        <Outlet />
      </div>
    </>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}