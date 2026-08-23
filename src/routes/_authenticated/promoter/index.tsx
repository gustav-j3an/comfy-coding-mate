import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  MapPin, 
  Calendar,
  LayoutDashboard,
  CheckCircle,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { cachePromoterVisits, getCachedVisits, getSyncQueue, isOnline, getVisitDraft } from '@/lib/offline';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';


export const Route = createFileRoute('/_authenticated/promoter/')({
  component: PromoterDashboard,
});

function PromoterDashboard() {
  const { user, profile, previewPromoter } = useAuth();
  
  // Simulation states
  const [simulatedDay, setSimulatedDay] = useState<number>(new Date().getDay()); // 0=Sunday, 1=Monday...
  
  // Calculate simulated date based on today and simulatedDay
  const getSimulatedDate = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = simulatedDay - currentDay;
    const target = new Date(today);
    target.setDate(today.getDate() + diff);
    return target;
  };

  const simulatedDate = getSimulatedDate();
  const scheduledDateStr = simulatedDate.toISOString().split('T')[0];

  const [online, setOnline] = useState(isOnline());
  const [syncQueueSize, setSyncQueueSize] = useState(0);

  useEffect(() => {
    const handleStatus = () => setOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    // Check sync queue
    if (user?.id) {
      getSyncQueue(user.id).then(queue => setSyncQueueSize(queue.length));
    }

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, [user?.id]);


  const { data: visits, refetch } = useSuspenseQuery({
    queryKey: ['promoter-visits', user?.id, scheduledDateStr, previewPromoter?.id, simulatedDay],
    queryFn: async () => {
      const currentUserId = user?.id;
      const effectiveUserId = previewPromoter?.id || currentUserId;
      const currentPromoterId = previewPromoter?.id || profile?.promoter_id || null;
      if (!effectiveUserId) return [];

      const isRealToday = new Date().getDay() === simulatedDay && 
                         new Date().toISOString().split('T')[0] === scheduledDateStr;
      
      try {
        // AUTH REINFORCEMENT: If accessing another promoter's data, verify admin role
        if (previewPromoter?.id) {
          const { data: hasRole } = await supabase.rpc('has_role', {
            _user_id: currentUserId as any,
            _role: 'admin'
          });
          
          if (!hasRole) {
            toast.error("Acesso negado: Apenas administradores podem visualizar dados de outros promotores.");
            return [];
          }
        }

        // 1. Get materialized visits for the date
        let query = supabase
          .from('visits')
          .select(`
            *,
            store:stores(name, address),
            industry:industries(name)
          `)
          .eq('scheduled_date', scheduledDateStr as any);

        if (currentPromoterId) {
          query = query.eq('promoter_id', currentPromoterId);
        } else {
          query = query.eq('executor_id', effectiveUserId);
        }

        const { data: materializedVisits, error: matError } = await query.order('visit_order', { ascending: true });
        if (matError) throw matError;

        // 2. Fetch theoretical stops from the active route to show what's planned.
        // We ALWAYS check for theoretical visits if in preview mode OR if no materialized visits exist yet.
        const { data: activeRoutes, error: routesError } = await supabase
          .from('routes')
          .select(`
            id,
            name,
            valid_from,
            route_stops (
              id,
              store_id,
              day_of_week,
              visit_order,
              frequency,
              biweekly_start_date,
              observation,
              store:stores(name, address),
              stop_tasks (
                industry_id,
                industry:industries(name)
              )
            )
          `)
          .eq('promoter_id', currentPromoterId as any)
          .eq('active', true)
          .in('status', ['published', 'archived'] as any);

        if (routesError) console.error("Error fetching active routes:", routesError);

        const theoreticalVisits: any[] = [];
        if (activeRoutes && activeRoutes.length > 0) {
          activeRoutes.forEach(route => {
            // Filter stops by day of week
            const stopsForDay = (route.route_stops || []).filter((s: any) => Number(s.day_of_week) === simulatedDay);
            
            stopsForDay.forEach((stop: any) => {
              // Check frequency (biweekly logic)
              let shouldShow = true;
              if (stop.frequency === 'biweekly') {
                const start = stop.biweekly_start_date ? new Date(stop.biweekly_start_date) : (route.valid_from ? new Date(route.valid_from) : new Date());
                const diffTime = Math.abs(simulatedDate.getTime() - start.getTime());
                const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
                shouldShow = diffWeeks % 2 === 0;
              }

              if (shouldShow) {
                // For each task, create a theoretical visit
                (stop.stop_tasks || []).forEach((task: any) => {
                  // Avoid duplicates if visit is already materialized (by store and industry)
                  const isAlreadyMaterialized = (materializedVisits || []).some(mv => 
                    mv.store_id === stop.store_id && mv.industry_id === task.industry_id
                  );
                  
                  if (!isAlreadyMaterialized) {
                    theoreticalVisits.push({
                      id: `theoretical-${stop.id}-${task.industry_id}`,
                      store_id: stop.store_id,
                      industry_id: task.industry_id,
                      status: 'planned',
                      scheduled_date: scheduledDateStr,
                      visit_order: stop.visit_order,
                      store: stop.store,
                      industry: task.industry,
                       observation: stop.observation,
                       frequency: stop.frequency,
                       is_theoretical: true
                     });
                  }
                });
              }
            });
          });
        }

        // Merge and sort
        const allVisits = [...(materializedVisits || []), ...theoreticalVisits].sort((a, b) => 
          (a.visit_order || 0) - (b.visit_order || 0)
        );

        if (isRealToday && !previewPromoter?.id) {
          await cachePromoterVisits(effectiveUserId, allVisits);
        }
        
        return allVisits;
      } catch (err) {
        console.warn('Network error or query error:', err);
        return await getCachedVisits(effectiveUserId);
      }
    }
  });


  const stats = {
    total: visits.length,
    completed: (visits as any[]).filter(v => ['submitted', 'approved'].includes(v.status || '')).length,
    pending: (visits as any[]).filter(v => ['planned', 'pending'].includes(v.status || '')).length,
  };

  const nextStop = (visits as any[]).find(v => v.status === 'planned');

  const [offlineDrafts, setOfflineDrafts] = useState<Record<string, any>>({});

  useEffect(() => {
    if (user?.id) {
      const loadDrafts = async () => {
        const drafts: Record<string, any> = {};
        for (const v of visits) {
          const draft = await getVisitDraft(user.id, v.id);
          if (draft) {
            drafts[v.id] = draft;
          }
        }
        setOfflineDrafts(drafts);
      };
      loadDrafts();
    }
  }, [visits, user?.id]);

  const getStatusBadge = (visit: any) => {
    if (visit.is_theoretical) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Visita Planejada</Badge>;
    }

    const draft = offlineDrafts[visit.id];
    const status = draft ? draft.status : visit.status;

    switch (status) {
      case 'planned': return <Badge variant="outline" className="bg-slate-100">Prevista</Badge>;
      case 'pending': return <Badge variant="secondary">Em andamento</Badge>;
      case 'awaiting_media': return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Mídia Pendente</Badge>;
      case 'ready_to_send': return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">Pronta p/ Enviar</Badge>;
      case 'offline_draft': return <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">Rascunho</Badge>;
      case 'submitted': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">Enviada</Badge>;
      case 'approved': return <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">Aprovada</Badge>;
      case 'rejected': return <Badge variant="destructive">Reprovada</Badge>;
      default: return <Badge variant="outline" className="border-slate-200">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 safe-area-inset-bottom">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-b-3xl shadow-lg relative overflow-hidden">
        {/* Connection Indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {syncQueueSize > 0 && (
            <Badge className="bg-orange-500 text-white border-none animate-pulse">
              <RefreshCw className="h-3 w-3 mr-1" /> {syncQueueSize} pendentes
            </Badge>
          )}
          {online ? (
            <Badge className="bg-green-500/20 text-green-100 border-none backdrop-blur-sm">
              <Wifi className="h-3 w-3 mr-1" /> Online
            </Badge>
          ) : (
            <Badge className="bg-red-500 text-white border-none shadow-lg">
              <WifiOff className="h-3 w-3 mr-1" /> Offline
            </Badge>
          )}
        </div>

        <div className="flex justify-between items-start mb-6 pt-2">
          <div>
            <h1 className="text-2xl font-bold">Olá, {profile?.full_name?.split(' ')[0]}</h1>
            <p className="text-blue-100 opacity-90">{format(simulatedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
            <p className="text-xs text-blue-100 uppercase font-semibold">Total</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
            <p className="text-xs text-blue-100 uppercase font-semibold">Feitas</p>
            <p className="text-xl font-bold">{stats.completed}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
            <p className="text-xs text-blue-100 uppercase font-semibold">Faltam</p>
            <p className="text-xl font-bold">{stats.pending}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Weekly Simulation for Admin */}
        {previewPromoter && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-amber-100">
            <h3 className="text-sm font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Roteiro da Semana (Simulação)
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const dayName = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][day];
                const isSelected = simulatedDay === day;
                const isRealToday = new Date().getDay() === day;
                
                return (
                  <button
                    key={day}
                    onClick={() => setSimulatedDay(day)}
                    className={cn(
                      "flex-shrink-0 w-14 h-16 rounded-xl flex flex-col items-center justify-center transition-all border-2",
                      isSelected 
                        ? "bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-100" 
                        : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    <span className="text-[10px] font-bold uppercase">{dayName}</span>
                    <span className="text-lg font-black">{isRealToday ? "HOJE" : ""}</span>
                    {isRealToday && !isSelected && <div className="w-1 h-1 bg-amber-500 rounded-full mt-1" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-amber-600 mt-2 font-bold leading-tight">
              Selecione um dia para simular a agenda do promotor.
              <br />Ações de escrita continuam bloqueadas.
            </p>
          </div>
        )}

        {/* Next Stop highlight */}

        {nextStop && (
          <div className="mt-[-20px]">
            <Card className="border-none shadow-md bg-white overflow-hidden">
              <div className="bg-orange-500 h-1" />
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Próxima Parada</span>
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">Agora</Badge>
                </div>
                <h3 className="text-lg font-bold text-slate-800">{(nextStop as any).store?.name}</h3>
                <div className="flex items-center text-slate-500 text-sm mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span className="truncate">{(nextStop as any).store?.address}</span>
                </div>
                <Button asChild className="w-full mt-4 bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold rounded-xl shadow-blue-200 shadow-lg active:scale-[0.98] transition-transform">
                  <Link 
                    to={(nextStop as any).is_theoretical ? "#" : ("/promoter/visit/$visitId" as any)} 
                    params={(nextStop as any).is_theoretical ? {} : ({ visitId: String(nextStop.id) } as any)}
                    onClick={(e) => {
                      if ((nextStop as any).is_theoretical) {
                        e.preventDefault();
                        toast.info("Esta é uma prévia do roteiro. Visitas materializadas estarão disponíveis na data real.");
                      }
                    }}
                  >
                    {(nextStop as any).is_theoretical ? "Visualizar Planejamento" : "Iniciar Visita"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* List of stops */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 px-1 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            {simulatedDay === new Date().getDay() ? "Roteiro do Dia" : `Agenda de ${["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][simulatedDay]}`}
          </h2>

          
          <div className="space-y-3">
            {visits.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-8 text-center text-slate-500 font-medium">
                  <p>Nenhuma visita planejada para {simulatedDay === new Date().getDay() ? "hoje" : ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"][simulatedDay]}.</p>
                </CardContent>
              </Card>
            ) : (

              (visits as any[]).map((visit, index) => (
                <Link 
                  key={visit.id} 
                  to={visit.is_theoretical ? "#" : ("/promoter/visit/$visitId" as any)}
                  params={visit.is_theoretical ? {} : ({ visitId: String(visit.id) } as any)}
                  onClick={(e) => {
                    if (visit.is_theoretical) {
                      e.preventDefault();
                      toast.info("Esta é uma prévia do roteiro. Visitas materializadas estarão disponíveis na data real.");
                    }
                  }}
                  className="block"
                >
                  <Card className={`overflow-hidden transition-all hover:shadow-md border-none active:bg-slate-50 ${visit.status === 'approved' ? 'opacity-75' : ''}`}>
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className={`w-12 flex flex-col items-center justify-center text-sm font-bold ${
                          visit.status === 'approved' ? 'bg-green-500 text-white' : 
                          visit.status === 'submitted' ? 'bg-blue-500 text-white' : 
                          'bg-slate-200 text-slate-500'
                        }`}>
                          {visit.status === 'approved' ? <CheckCircle className="h-5 w-5" /> : index + 1}
                        </div>
                        <div className="flex-1 p-3 px-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-800">{(visit as any).store?.name}</h4>
                              <p className="text-xs text-slate-500 font-medium">{(visit as any).industry?.name}</p>
                            </div>
                            {getStatusBadge(visit)}
                          </div>
                          <div className="flex items-center text-slate-400 text-[10px] mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">{(visit as any).store?.address}</span>
                          </div>
                          {visit.observation && (
                            <p className="text-[9px] text-slate-400 mt-1 italic line-clamp-1">
                              Obs: {visit.observation}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
