import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsReconnecting(true);
      setTimeout(() => {
        setIsOnline(true);
        setIsReconnecting(false);
      }, 2000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !isReconnecting) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-[100] flex items-center justify-center p-2 text-white text-xs font-bold transition-all duration-300 animate-in slide-in-from-top",
      isReconnecting ? "bg-amber-500" : "bg-destructive"
    )}>
      {isReconnecting ? (
        <>
          <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
          Reconectando...
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 mr-2" />
          Sem conexão com a internet
        </>
      )}
    </div>
  );
}
