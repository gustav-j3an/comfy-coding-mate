import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { PWAInstallDialog } from './pwa-install-dialog';
import { toast } from 'sonner';

export function PWAInstallButton() {
  const { 
    isInstalled, 
    install, 
    canInstallNative, 
    platform, 
    isIncognito 
  } = usePWAInstall();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleInstallClick = async () => {
    if (isInstalled) {
      toast.info("O aplicativo já está instalado!");
      return;
    }

    if (canInstallNative) {
      const success = await install();
      if (!success) {
        // If they cancelled, we don't do anything special, but if it failed to prompt:
        toast.info("Instalação cancelada. Você pode tentar novamente a qualquer momento.");
      }
    } else {
      // Manual instructions for iOS, Chrome (if no prompt), etc.
      setIsDialogOpen(true);
    }
  };

  if (isInstalled) {
    return (
      <Button 
        disabled
        variant="outline"
        className="h-14 border-blue-100 bg-blue-50/50 text-blue-700 font-bold text-lg rounded-2xl shadow-none flex items-center justify-center gap-2 opacity-80"
      >
        <CheckCircle2 className="h-5 w-5 text-blue-600" />
        Aplicativo instalado
      </Button>
    );
  }

  return (
    <>
      <Button 
        onClick={handleInstallClick}
        variant="outline"
        className="h-14 border-slate-200 bg-white text-slate-700 font-bold text-lg rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        <Download className="h-5 w-5" />
        Instalar aplicativo
      </Button>

      <PWAInstallDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        platform={platform}
        isIncognito={isIncognito}
      />
    </>
  );
}
