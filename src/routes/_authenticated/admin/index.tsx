import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Users, Store, Factory, FileCheck, AlertCircle, BarChart3, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { seedTestData } from '@/lib/data/seed';

export const Route = createFileRoute('/_authenticated/admin/')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, signOut } = useAuth();

  const handleSeed = async () => {
    toast.promise(seedTestData(), {
      loading: 'Gerando dados de teste...',
      success: 'Dados de teste gerados com sucesso!',
      error: 'Erro ao gerar dados de teste',
    });
  };

  const stats = [
    { label: 'Visitas Previstas Hoje', value: '24', color: 'bg-blue-500' },
    { label: 'Visitas Enviadas Hoje', value: '18', color: 'bg-green-500' },
    { label: 'Pendentes de Conferência', value: '6', color: 'bg-amber-500' },
    { label: 'Ocorrências Abertas', value: '2', color: 'bg-red-500' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Mockup */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-400">Rota do Promotor</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Admin Panel</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-800 bg-slate-800">
            <BarChart3 className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
            <FileCheck className="mr-2 h-4 w-4" /> Conferência
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
            <Users className="mr-2 h-4 w-4" /> Promotores
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
            <Store className="mr-2 h-4 w-4" /> Lojas
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
            <Factory className="mr-2 h-4 w-4" /> Indústrias
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
            <AlertCircle className="mr-2 h-4 w-4" /> Ocorrências
          </Button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-800">Dashboard Geral</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSeed}>
              <Plus className="mr-2 h-4 w-4" /> Dados de Teste
            </Button>
            <Button size="sm">
              Novo Relatório
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <Card key={i} className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
                <div className={`h-1 w-full ${stat.color} rounded-b-xl`} />
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Últimas Visitas Enviadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                          J{i}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Promotor João Silva</p>
                          <p className="text-xs text-slate-500">Atacadão QNL • Indústria King</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-400">Há 10 min</p>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">Pendente</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Ocorrências Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2].map((_, i) => (
                    <div key={i} className="p-3 rounded-lg border border-red-50 px-4 flex items-start gap-3 bg-red-50/30">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-900">Ruptura de Estoque</p>
                        <p className="text-xs text-red-700/70">Atacadão Sul • Produto: Detergente King 500ml</p>
                        <Button variant="link" size="sm" className="h-auto p-0 text-red-600 font-bold text-xs mt-1">Ver detalhes</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
