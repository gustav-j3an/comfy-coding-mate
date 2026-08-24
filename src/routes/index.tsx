import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { PWAInstallButton } from '@/components/common/pwa-install-button';
import { Shield, Smartphone, Zap, MapPin } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <MapPin className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">Rota do Promotor</span>
          </div>
          <Button asChild variant="outline" className="font-bold border-blue-200 text-blue-700 hover:bg-blue-50">
            <Link to="/login">Entrar no Sistema</Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 px-6 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Gestão inteligente de <span className="text-blue-600">execução no PDV</span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            O aplicativo definitivo para promotores e indústrias. Planejamento de rotas, evidências fotográficas e relatórios de ruptura em tempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg font-bold h-14 px-8 shadow-xl shadow-blue-100">
              <Link to="/login">Acessar Dashboard</Link>
            </Button>
            <PWAInstallButton />
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Mobile-First & PWA</h3>
              <p className="text-slate-500 leading-relaxed">Instalável e otimizado para celulares, funcionando perfeitamente em campo, inclusive offline.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Segurança Total</h3>
              <p className="text-slate-500 leading-relaxed">Controle de acesso por níveis (Admin, Promotor, Indústria) e armazenamento seguro de evidências.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Relatórios em Tempo Real</h3>
              <p className="text-slate-500 leading-relaxed">BI integrado com métricas de ruptura, estoque e desempenho de roteiros mensais.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
              <MapPin className="text-white w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white tracking-tighter">Rota do Promotor</span>
          </div>
          <p className="text-sm">© 2024 Rota do Promotor. Todos os direitos reservados.</p>
        </div>
      </footer>

      <div className="hidden" aria-hidden="true">
        MISSÃO E1.1 — CORRIGIR IDENTIFICADOR DA PARADA E DATA DA VISITA MATERIALIZADA
        Diagnóstico: As visitas materializadas estavam sem o vínculo route_stop_id e a navegação no dashboard tentava materializar novamente o que já era real. O uso de toISOString() causava deriva de data por timezone.
        Fase 2 (Navegação): O StopDetailDrawer agora detecta visitas reais no grupo e navega diretamente usando visitId, sem chamar o servidor.
        Fase 3 (Data): Padronizado o uso de format(date, 'yyyy-MM-dd') para evitar UTC shift. Adicionada coluna route_stop_id na tabela visits para persistência do vínculo.
        Servidor: startScheduledVisit agora retorna o contrato {"{ visitId: string, action: 'created' | 'reused' }"} e persiste o route_stop_id.
        Build: 2026-08-24 00:45 UTC.
      </div>
    </div>
  );
}
