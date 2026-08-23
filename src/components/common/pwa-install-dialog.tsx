import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-mobile";
import { PWAPlatform } from "@/hooks/use-pwa-install";
import { Share, MoreVertical, PlusSquare, Info } from "lucide-react";

interface PWAInstallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  platform: PWAPlatform;
  isIncognito: boolean;
}

export function PWAInstallDialog({ isOpen, onClose, platform, isIncognito }: PWAInstallDialogProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const content = (
    <div className="space-y-6 p-4">
      {isIncognito ? (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800">
          <Info className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">
            Você está em uma janela anônima. Abra o aplicativo em uma janela normal para poder instalá-lo.
          </p>
        </div>
      ) : (
        <>
          {platform === 'ios' && (
            <div className="space-y-4">
              <p className="text-slate-600 font-medium">Siga estes passos para instalar no seu iPhone:</p>
              <ol className="space-y-4">
                <li className="flex gap-3 items-start">
                  <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">1</span>
                  <div className="flex flex-wrap items-center gap-1.5 text-slate-700">
                    Toque no botão <span className="bg-slate-100 p-1 rounded-lg"><Share className="h-4 w-4" /></span> compartilhar na barra inferior.
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">2</span>
                  <div className="flex flex-wrap items-center gap-1.5 text-slate-700">
                    Role para baixo e toque em <span className="font-bold border border-slate-200 px-2 py-0.5 rounded-lg bg-slate-50 flex items-center gap-1.5"><PlusSquare className="h-4 w-4" /> Adicionar à Tela de Início</span>.
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">3</span>
                  <p className="text-slate-700">Confirme o nome e toque em <span className="font-bold text-blue-600">Adicionar</span>.</p>
                </li>
              </ol>
            </div>
          )}

          {platform === 'android' && (
            <div className="space-y-4">
              <p className="text-slate-600 font-medium">Como instalar no seu Android:</p>
              <ol className="space-y-4">
                <li className="flex gap-3 items-start">
                  <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">1</span>
                  <div className="flex flex-wrap items-center gap-1.5 text-slate-700">
                    Toque nos <span className="bg-slate-100 p-1 rounded-lg"><MoreVertical className="h-4 w-4" /></span> três pontos no canto superior do Chrome.
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">2</span>
                  <p className="text-slate-700">Toque em <span className="font-bold border border-slate-200 px-2 py-0.5 rounded-lg bg-slate-50 text-blue-600">Instalar aplicativo</span>.</p>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">3</span>
                  <p className="text-slate-700">Confirme a instalação no aviso que aparecerá.</p>
                </li>
              </ol>
            </div>
          )}

          {platform === 'chrome' && !isMobile && (
            <div className="space-y-4">
              <p className="text-slate-600 font-medium">Instalação no Computador:</p>
              <ol className="space-y-4">
                <li className="flex gap-3 items-start">
                  <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">1</span>
                  <p className="text-slate-700">Clique no ícone de <span className="font-bold text-blue-600">Instalar</span> na barra de endereço (lado direito).</p>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">2</span>
                  <div className="flex flex-wrap items-center gap-1.5 text-slate-700">
                    Alternativamente, clique nos <span className="bg-slate-100 p-1 rounded-lg"><MoreVertical className="h-4 w-4" /></span> três pontos e escolha <span className="font-bold border border-slate-200 px-2 py-0.5 rounded-lg bg-slate-50 text-blue-600 italic">Instalar Rota do Promotor</span>.
                  </div>
                </li>
              </ol>
            </div>
          )}

          {(platform === 'other' || (platform === 'chrome' && isMobile)) && (
            <div className="space-y-4">
              <p className="text-slate-600 font-medium leading-relaxed">Seu navegador não suporta a instalação direta, mas você pode adicionar manualmente:</p>
              <p className="text-sm text-slate-500 italic">Dica: O Rota do Promotor funciona melhor quando instalado no Chrome ou Safari.</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-xl font-black text-slate-900">Como Instalar</DrawerTitle>
            <DrawerDescription>
              Acesse o Rota do Promotor rapidamente da sua tela inicial.
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">Instalar Rota do Promotor</DialogTitle>
          <DialogDescription>
            Tenha a melhor experiência instalando o aplicativo no seu dispositivo.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
