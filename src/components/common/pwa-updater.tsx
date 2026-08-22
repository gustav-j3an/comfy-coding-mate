import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

// This is a simplified way to track global upload state
// In a real app, this would be in a Context or State Management
export const usePWAUpdater = (isUploading: boolean = false) => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered');
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  useEffect(() => {
    if (needRefresh) {
      if (isUploading) {
        console.log('Update available, but upload in progress. Waiting...');
        return;
      }

      toast("Nova versão disponível!", {
        description: "Atualize para ter as últimas melhorias e correções.",
        action: {
          label: "Atualizar Agora",
          onClick: () => updateServiceWorker(true),
        },
        duration: Infinity,
        cancel: {
          label: "Depois",
          onClick: close
        }
      });
    }
  }, [needRefresh, isUploading]);

  return { offlineReady, needRefresh, updateServiceWorker, close };
};

export function PWAUpdateNotification({ isUploading = false }: { isUploading?: boolean }) {
  // The logic is handled by the hook above, but we can render a custom UI if needed
  usePWAUpdater(isUploading);
  return null;
}
