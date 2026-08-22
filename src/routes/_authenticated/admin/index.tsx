import { useState, useEffect } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Plus, Calendar, Clock, CheckCircle2, ChevronRight, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { seedTestData } from '@/lib/data/seed';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export const Route = createFileRoute('/_authenticated/admin/')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [hasData, setHasData] = useState(true);
  const [loading, setLoading] = useState(true);
  const [realStats, setRealStats] = useState({
    predicted: 0,
    sent: 0,
    pending: 0,
    occurrences: 0
  });
  const [latestVisits, setLatestVisits] = useState<any[]>([]);
  const [recentOccurrences, setRecentOccurrences] = useState<any[]>([]);

  useEffect(() => {
    checkData();
    fetchRealStats();
    fetchRecentData();
  }, []);

  const checkData = async () => {
    try {
      const { count: promoterCount } = await supabase.from('promoters').select('*', { count: 'exact', head: true });
      const { count: storeCount } = await supabase.from('stores').select('*', { count: 'exact', head: true });
      const { count: industryCount } = await supabase.from('industries').select('*', { count: 'exact', head: true });
      
      setHasData((promoterCount || 0) > 0 || (storeCount || 0) > 0 || (industryCount || 0) > 0);
    } catch (e) {
      setHasData(true);
    }
  };

  const fetchRealStats = async () => {
    try {
      setLoading(true);
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      // Predictions (pending visits today)
      const { count: predicted } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('scheduled_date', todayStr)
        .eq('status', 'pending');

      // Sent (submitted visits today)
      const { count: sent } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('scheduled_date', todayStr)
        .eq('status', 'submitted');

      // Pending (all submitted visits)
      const { count: pending } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');

      // Occurrences (open)
      const { count: occurrences } = await supabase
        .from('occurrences')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      setRealStats({
        predicted: predicted || 0,
        sent: sent || 0,
        pending: pending || 0,
        occurrences: occurrences || 0
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentData = async () => {
    try {
      // Latest Visits
      const { data: visits } = await supabase
        .from('visits')
        .select(`
          *,
          profiles:promoter_id(full_name),
          stores:store_id(name),
          industries:industry_id(name)
        `)
        .eq('status', 'submitted')
        .order('created_at', { ascending: false })
        .limit(4);
      
      setLatestVisits(visits || []);

      // Recent Occurrences
      const { data: occs } = await supabase
        .from('occurrences')
        .select(`
          *,
          visit:visit_id(
            id,
            stores:store_id(name),
            industries:industry_id(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      setRecentOccurrences(occs || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeed = async () => {
    toast.promise(seedTestData(), {
      loading: 'Gerando dados de teste...',
      success: 'Dados de teste gerados com sucesso!',
      error: 'Erro ao gerar dados de teste',
    });
    setHasData(true);
    fetchRealStats();
    fetchRecentData();
  };

  const stats = [
    { 
      label: 'Visitas Previstas Hoje', 
      value: loading ? '...' : realStats.predicted.toString(), 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      to: '/admin/visits' as const,
      search: { filter: 'predicted-today' }
    },
    { 
      label: 'Visitas Enviadas Hoje', 
      value: loading ? '...' : realStats.sent.toString(), 
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      borderColor: 'border-green-100',
      to: '/admin/visits' as const,
      search: { filter: 'sent-today' }
    },
    { 
      label: 'Pendentes de Conferência', 
      value: loading ? '...' : realStats.pending.toString(), 
      color: 'text-amber-600', 
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      to: '/admin/visits' as const,
      search: { filter: 'pending' }
    },
    { 
      label: 'Ocorrências Abertas', 
      value: loading ? '...' : realStats.occurrences.toString(), 
      color: 'text-red-600', 
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100',
      to: '/admin/occurrences' as const,
      search: { status: 'open' }
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard Geral</h2>
          <p className="text-sm text-slate-500">Bem-vindo ao centro de operações</p>
        </div>
        <div className="flex gap-3">
          {!hasData && (
            <Button variant="outline" size="sm" onClick={handleSeed} className="hidden sm:flex items-center gap-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold">
              <Plus className="h-4 w-4" /> Gerar Dados de Teste
            </Button>
          )}
          <Button size="sm" onClick={() => navigate({ to: '/admin/reports' })} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold">
            Novo Relatório
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-8 animate-in fade-in duration-500">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Link key={i} to={stat.to} search={stat.search} className="group">
              <Card className={cn(
                "border-2 transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-md cursor-pointer",
                stat.borderColor,
                stat.bgColor
              )}>
                <CardHeader className="pb-2 space-y-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{stat.label}</p>
                    <div className={cn("p-1.5 rounded-lg", stat.bgColor, "border", stat.borderColor)}>
                      <TrendingUp className={cn("h-4 w-4", stat.color)} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className={cn("text-3xl font-black tabular-nums", stat.color)}>{stat.value}</div>
                    <span className="text-[10px] font-bold text-slate-400">+12% vs ontem</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Latest Visits */}
          <Card className="lg:col-span-2 border-slate-200/60 shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Últimas Visitas Enviadas</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Atividade recente dos promotores em campo</p>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600 font-bold text-xs" onClick={() => navigate({ to: '/admin/visits' })}>
                Ver todas
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    Carregando visitas...
                  </div>
                ) : latestVisits.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">Nenhuma visita recente enviada.</div>
                ) : (
                  latestVisits.map((visit) => (
                    <div key={visit.id} 
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => navigate({ to: `/admin/visits`, search: { filter: 'pending' } })}
                    >
                      <div className="flex gap-4 items-center">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-lg shadow-inner border border-slate-200">
                            {visit.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'P'}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {visit.profiles?.full_name || 'Promotor desconhecido'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500 font-medium">{visit.stores?.name}</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-xs text-slate-500 font-medium">{visit.industries?.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div className="hidden sm:block">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            <Clock className="w-3 h-3" />
                            {visit.created_at ? format(new Date(visit.created_at), "HH:mm") : '--:--'}
                          </div>
                          <span className="inline-block mt-1 text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase">Pendente</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Occurrences Card */}
          <Card className="border-slate-200/60 shadow-sm flex flex-col">
            <CardHeader className="border-b bg-red-50/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <CardTitle className="text-lg font-bold text-slate-900">Ocorrências Recentes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4 text-slate-400">Carregando...</div>
              ) : recentOccurrences.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-sm">Nenhuma ocorrência em aberto.</div>
              ) : (
                recentOccurrences.map((occ) => (
                  <div key={occ.id} className="group p-4 rounded-xl border-2 border-red-50 bg-white hover:border-red-100 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate({ to: `/admin/occurrences` })}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                        occ.severity === 'critical' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {occ.severity === 'critical' ? 'Crítica' : 'Atenção'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {occ.created_at ? format(new Date(occ.created_at), "HH:mm") : '--:--'}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 mb-1 group-hover:text-red-600 transition-colors">
                      {occ.type}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {occ.visit?.stores?.name} • {occ.visit?.industries?.name}
                    </p>
                    <div className="mt-3 pt-3 border-t border-red-50 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">ID: #{occ.id.slice(0, 4)}</span>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-red-600 font-black text-[10px] hover:bg-transparent uppercase tracking-wider">
                        Detalhes
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
