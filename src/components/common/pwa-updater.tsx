import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

export const usePWAUpdater = (isUploading: boolean = false) => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered');
    },
    onRegisterError(error: any) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
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

  return { needRefresh, updateServiceWorker, close };
};

export function PWAUpdateNotification({ isUploading = false }: { isUploading?: boolean }) {
  usePWAUpdater(isUploading);
  return null;
}
