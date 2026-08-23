import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Smartphone, Download, CheckCircle2, ArrowRight, Loader2, Info, AlertCircle, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/primeiro-acesso')({
  component: PrimeiroAcesso,
});

function PrimeiroAcesso() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [errorState, setErrorState] = useState<{ type: 'expired' | 'invalid' | null }>({ type: null });

  useEffect(() => {
    // Check URL parameters for errors from callback
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorCode = params.get('error_code');
    const errorDescription = params.get('error_description');

    if (error || errorCode) {
      if (errorDescription?.toLowerCase().includes('expired') || errorCode === 'otp_expired') {
        setErrorState({ type: 'expired' });
      } else {
        setErrorState({ type: 'invalid' });
      }
    }
  }, []);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      setIsInstalled(true);
    }

    // iOS detection
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check if app is installed (approximate)
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      toast.success('Aplicativo instalado com sucesso!');
    });

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        toast.info("No iPhone, toque em 'Compartilhar' e depois em 'Adicionar à Tela de Início'.");
      } else {
        toast.info("O seu navegador não suporta a instalação direta. Procure por 'Instalar Aplicativo' no menu do navegador.");
      }
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleContinue = () => {
    if (role === 'admin') navigate({ to: '/admin' });
    else if (role === 'promoter') navigate({ to: '/promoter/' as any });
    else if (role === 'industry') navigate({ to: '/industry/' as any });
    else navigate({ to: '/' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (errorState.type) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-slate-800 bg-slate-900 text-white shadow-2xl">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20 mb-2 border border-red-500/30">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Acesso Expirado</CardTitle>
            <CardDescription className="text-slate-400">
              {errorState.type === 'expired' 
                ? 'Este link de acesso expirou ou já foi utilizado. Peça ao administrador para reenviar o convite.'
                : 'Este link de acesso é inválido ou já foi utilizado.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button 
              onClick={() => navigate({ to: '/' })}
              className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl"
            >
              <LogIn className="mr-2 w-4 h-4" />
              Voltar para o Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-slate-800 bg-slate-900 text-white shadow-2xl">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20 mb-2">
            <Smartphone className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Bem-vindo ao Rota</CardTitle>
          <CardDescription className="text-slate-400">
            Sua senha foi criada! Agora, instale o aplicativo para começar.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="flex gap-3 items-start p-3 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 font-bold text-sm">1</div>
              <p className="text-sm text-slate-300">Acesse seu roteiro e envie evidências fotográficas em tempo real.</p>
            </div>
            <div className="flex gap-3 items-start p-3 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 font-bold text-sm">2</div>
              <p className="text-sm text-slate-300">Funciona offline: continue trabalhando mesmo sem sinal de internet.</p>
            </div>
          </div>

          <div className="space-y-3">
            {!isStandalone && (
              <Button 
                onClick={handleInstall}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-900/20"
              >
                <Download className="mr-2 w-5 h-5" />
                Instalar Aplicativo
              </Button>
            )}

            {isStandalone && (
              <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 text-green-400 rounded-xl border border-green-500/20">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold text-sm">Aplicativo Instalado</span>
              </div>
            )}

            <Button 
              variant="ghost" 
              onClick={handleContinue}
              className="w-full h-12 text-slate-400 hover:text-white hover:bg-slate-800 font-medium"
            >
              Prosseguir para o Painel
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {isIOS && !isStandalone && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Info className="w-4 h-4" /> Instruções iPhone
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Toque no ícone de <span className="text-white font-bold">Compartilhar</span> (quadrado com seta) e depois em <span className="text-white font-bold">Adicionar à Tela de Início</span>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}