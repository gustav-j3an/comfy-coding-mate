import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone, Info } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { PWAInstallDialog } from './pwa-install-dialog';

export function PWAInstallBanner() {
  const { 
    isInstalled, 
    install, 
    canInstallNative, 
    platform, 
    isIncognito 
  } = usePWAInstall();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Show after 2 seconds if not installed and not dismissed recently
    const isDismissed = localStorage.getItem('pwa-banner-dismissed');
    const timer = setTimeout(() => {
      if (!isInstalled && !isDismissed && !isIncognito) {
        setIsVisible(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInstalled, isIncognito]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for 7 days
    const expiry = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa-banner-dismissed', expiry.toString());
  };

  const handleInstallClick = async () => {
    if (canInstallNative) {
      await install();
      setIsVisible(false);
    } else {
      setIsDialogOpen(true);
    }
  };

  if (!isVisible || isInstalled) return null;

  return (
    <>
      <div className="fixed bottom-20 left-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-none shadow-2xl bg-blue-600 text-white overflow-hidden">
          <CardContent className="p-4 relative">
            <button 
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 text-blue-200 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-start gap-3 pr-6">
              <div className="bg-white/20 p-2 rounded-xl">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm leading-tight">
                  Instale o Rota do Promotor
                </h4>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Acesse seu roteiro mais rápido e trabalhe offline com o app instalado.
                </p>
              </div>
            </div>
            
            <div className="mt-3 flex gap-2">
              <Button 
                onClick={handleInstallClick}
                size="sm"
                className="bg-white text-blue-600 hover:bg-blue-50 font-bold w-full rounded-lg h-9"
              >
                <Download className="h-3.5 w-3.5 mr-2" />
                Instalar agora
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <PWAInstallDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        platform={platform}
        isIncognito={isIncognito}
      />
    </>
  );
}