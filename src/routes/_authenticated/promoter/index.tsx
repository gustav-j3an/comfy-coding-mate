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
  RefreshCw,
  Plus
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect, useMemo } from 'react';
import { cachePromoterVisits, getCachedVisits, getSyncQueue, isOnline, getVisitDraft } from '@/lib/offline';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PWAInstallBanner } from '@/components/common/pwa-install-banner';
import { getPromoterAgenda } from '@/lib/execution.functions';
import { StopDetailDrawer } from '@/components/promoter/stop-detail-drawer';


export const Route = createFileRoute('/_authenticated/promoter/')({
  component: PromoterDashboard,
});

function PromoterDashboard() {
  const { user, profile, role, loading: authLoading, previewPromoter } = useAuth();
  
  // Weekly selection state
  const [simulatedDay, setSimulatedDay] = useState<number>(new Date().getDay()); // 0=Sunday, 1=Monday...
  
  // Memoize days of the week for the selector
  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 });
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(start, i);
      return {
        label: format(date, 'eee', { locale: ptBR }).toUpperCase().replace('.', ''),
        fullLabel: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][i],
        day: i,
        date
      };
    });
  }, []);

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
  const scheduledDateStr = format(simulatedDate, 'yyyy-MM-dd');

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

  const isPromoterLinked = !!(previewPromoter?.id || profile?.promoter_id);
  const isAuthReady = !authLoading && !!user;


  const { data: visits = [], refetch, isLoading, isError, error } = useSuspenseQuery({
    queryKey: ['promoter-visits', user?.id, scheduledDateStr, previewPromoter?.id, simulatedDay],
    queryFn: async () => {
      const currentUserId = user?.id;
      const effectivePromoterId = previewPromoter?.id || profile?.promoter_id || null;
      
      if (!currentUserId || !effectivePromoterId) return [];

      const allItems = await getPromoterAgenda({
        data: {
          date: scheduledDateStr,
          promoterId: previewPromoter?.id
        }
      });

      if (!allItems || !Array.isArray(allItems)) return [];

      const isRealToday = new Date().getDay() === simulatedDay && 
                         format(new Date(), 'yyyy-MM-dd') === scheduledDateStr;

      if (isRealToday && !previewPromoter?.id) {
        await cachePromoterVisits(currentUserId, allItems).catch(e => console.error('Cache error:', e));
      }
      
      const groupedVisitsMap = new Map<string, any>();
      
      allItems.forEach((item: any) => {
        if (!item || !item.store_id) return;
        const storeId = item.store_id;
        if (!groupedVisitsMap.has(storeId)) {
          groupedVisitsMap.set(storeId, {
            ...item,
            id: `grouped-${storeId}`,
            industries: item.industry ? [item.industry] : [],
            all_items: [item],
            status: item.status
          });
        } else {
          const group = groupedVisitsMap.get(storeId);
          if (item.industry) {
            const indName = item.industry.name;
            if (!group.industries.some((i: any) => i.name === indName)) {
              group.industries.push(item.industry);
            }
          }
          group.all_items.push(item);
          
          if (group.status === 'approved' && item.status !== 'approved') {
            group.status = item.status;
          } else if (group.status === 'planned' && item.status !== 'planned') {
            group.status = item.status;
          }
        }
      });

      return Array.from(groupedVisitsMap.values());
    }
  });

  const { data: weeklyVisits = [] } = useSuspenseQuery({
    queryKey: ['promoter-visits-weekly', user?.id, previewPromoter?.id],
    queryFn: async () => {
      try {
        const effectivePromoterId = previewPromoter?.id || profile?.promoter_id;
        if (!effectivePromoterId) return [];
        
        const start = startOfWeek(new Date(), { weekStartsOn: 0 });
        const weekPromises = Array.from({ length: 7 }).map((_, i) => {
          const d = format(addDays(start, i), 'yyyy-MM-dd');
          return getPromoterAgenda({ data: { date: d, promoterId: previewPromoter?.id } }).catch(e => {
            console.error(`Weekly fetch error for day ${i}:`, e);
            return [];
          });
        });
        
        const results = await Promise.all(weekPromises);
        return results.flat();
      } catch (err) {
        console.error('Weekly agenda fetch error:', err);
        return [];
      }
    }
  });

  const weeklyStats = useMemo(() => {
    if (!weeklyVisits) return { total: 0, completed: 0, pending: 0 };
    
    // Group weekly results by store_id and date to count unique stops per PDV/Day
    const uniqueStops = new Set();
    const completedStops = new Set();
    
    weeklyVisits.forEach((item: any) => {
      const key = `${item.store_id}-${item.scheduled_date}`;
      uniqueStops.add(key);
      if (['submitted', 'approved'].includes(item.status)) {
        completedStops.add(key);
      }
    });

    return {
      total: uniqueStops.size,
      completed: completedStops.size,
      pending: Math.max(0, uniqueStops.size - completedStops.size)
    };
  }, [weeklyVisits]);

  const stats = weeklyStats;
  
  // Rule 2: "Próxima parada" has its own behavior.
  // We check if there's a planned stop TODAY. If not, we find the first planned stop in the future.
  const nextStop = useMemo(() => {
    // 1. Try today's planned stop first
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isViewingToday = scheduledDateStr === todayStr;
    
    if (isViewingToday) {
      return (visits as any[]).find(v => v.status === 'planned');
    }
    
    // 2. If not viewing today or no stop today, we don't show "Agora" badge
    // The requirement says: "if there's no stop today, it can show the next future stop but with 'Next visit' label"
    // For now, let's keep it simple: only show "Próxima Parada" if it's for the selected day.
    // If we want to show future stops, we'd need to fetch more data.
    // But the bug is showing Monday stops on Sunday.
    return (visits as any[]).find(v => v.status === 'planned');
  }, [visits, scheduledDateStr]);

  const isNextStopToday = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return nextStop && nextStop.scheduled_date === todayStr;
  }, [nextStop]);

  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [offlineDrafts, setOfflineDrafts] = useState<Record<string, any>>({});

  useEffect(() => {
    if (user?.id) {
      const loadDrafts = async () => {
        try {
          const drafts: Record<string, any> = {};
          for (const v of (visits || [])) {
            if (!v.id) continue;
            const draft = await getVisitDraft(user.id, v.id).catch(() => null);
            if (draft) {
              drafts[v.id] = draft;
            }
          }
          setOfflineDrafts(drafts);
        } catch (e) {
          console.error('Draft load error:', e);
        }
      };
      loadDrafts();
    }
  }, [visits, user?.id]);

  const getStatusBadge = (visit: any) => {
    if (visit.is_theoretical) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Prévia do roteiro</Badge>;
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
            <h1 className="text-2xl font-bold">
              {authLoading ? "Carregando..." : `Olá, ${profile?.full_name?.toUpperCase() || 'PROMOTOR'}`}
            </h1>
            <p className="text-blue-100 opacity-90">{format(simulatedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
            <p className="text-[10px] text-blue-100 uppercase font-bold mb-1 opacity-70">Resumo da semana</p>
            <p className="text-xl font-bold">{isPromoterLinked ? stats.total : 0}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
            <p className="text-[10px] text-blue-100 uppercase font-bold mb-1 opacity-70">Feitas na semana</p>
            <p className="text-xl font-bold">{isPromoterLinked ? stats.completed : 0}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
            <p className="text-[10px] text-blue-100 uppercase font-bold mb-1 opacity-70">Faltam na semana</p>
            <p className="text-xl font-bold">{isPromoterLinked ? stats.pending : 0}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <PWAInstallBanner />

        {/* Weekly Selector */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex justify-between gap-1 overflow-x-auto no-scrollbar">
          {weekDays.map((day) => {
            const isToday = new Date().getDay() === day.day;
            const isSelected = simulatedDay === day.day;
            
            return (
              <button
                key={day.day}
                onClick={() => setSimulatedDay(day.day)}
                className={cn(
                  "flex-1 min-w-[44px] py-3 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95",
                  isSelected 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                    : "text-slate-400 hover:bg-slate-50",
                  isToday && !isSelected && "text-blue-600 font-bold"
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider mb-1">{day.label}</span>
                <span className="text-sm font-black">{day.date.getDate()}</span>
                {isToday && <div className={cn("w-1 h-1 rounded-full mt-1", isSelected ? "bg-white" : "bg-blue-600")} />}
              </button>
            );
          })}
        </div>

        {/* Next Stop highlight */}

        {nextStop && (
          <div className="mt-[-20px]">
            <Card 
              className="border-none shadow-md bg-white overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => setSelectedGroup(nextStop)}
            >
              <div className="bg-orange-500 h-1" />
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                    {isNextStopToday ? "Próxima Parada" : "Próxima Visita"}
                  </span>
                  {isNextStopToday ? (
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">Agora</Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500 border-slate-200">
                      {format(new Date(nextStop.scheduled_date + 'T12:00:00Z'), "eeee, dd/MM", { locale: ptBR })}
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-800">{(nextStop as any).store?.name}</h3>
                <div className="flex items-center text-slate-500 text-sm mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span className="truncate">{(nextStop as any).store?.address}</span>
                </div>
                <Button 
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold rounded-xl shadow-blue-200 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGroup(nextStop);
                  }}
                >
                  Ver Detalhes
                  <ChevronRight className="ml-2 h-4 w-4" />
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
            {!isAuthReady ? (
               <div className="p-8 text-center text-slate-500">Autenticando...</div>
            ) : !isPromoterLinked ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-8 text-center text-red-700 font-medium">
                  <AlertCircle className="h-10 w-10 mx-auto mb-2 text-red-500" />
                  <p className="text-lg font-bold">Vínculo não encontrado</p>
                  <p className="text-sm opacity-80 mt-1">Esta conta ({user?.email}) não está vinculada a um promotor. Contate o administrador.</p>
                </CardContent>
              </Card>
            ) : visits.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-8 text-center text-slate-500 font-medium">
                  <p>Nenhuma visita planejada para {simulatedDay === new Date().getDay() ? "hoje" : ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"][simulatedDay]}.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Atualizar Agenda
                  </Button>
                </CardContent>
              </Card>
            ) : (

              (visits as any[]).map((group, index) => {
                const isTheoretical = group.all_items.every((i: any) => i.is_theoretical);

                return (
                  <div 
                    key={group.id} 
                    onClick={() => setSelectedGroup(group)}
                    className="block cursor-pointer"
                  >
                    <Card className={`overflow-hidden transition-all hover:shadow-md border-none active:bg-slate-50 ${group.status === 'approved' ? 'opacity-75' : ''}`}>
                      <CardContent className="p-0">
                        <div className="flex">
                          <div className={`w-12 flex flex-col items-center justify-center text-sm font-bold ${
                            group.status === 'approved' ? 'bg-green-500 text-white' : 
                            group.status === 'submitted' ? 'bg-blue-500 text-white' : 
                            'bg-slate-200 text-slate-500'
                          }`}>
                            {group.status === 'approved' ? <CheckCircle className="h-5 w-5" /> : index + 1}
                          </div>
                          <div className="flex-1 p-3 px-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-slate-800">{group.store?.name}</h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {group.industries.map((ind: any, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-[9px] h-4 px-1.5 py-0 bg-slate-100 text-slate-600 border-none font-medium">
                                      {ind?.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {getStatusBadge(group)}
                            </div>
                            <div className="flex items-center text-slate-400 text-[10px] mt-2">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate">{group.store?.address}</span>
                            </div>
                            {group.observation && (
                              <p className="text-[9px] text-slate-400 mt-1 italic line-clamp-1">
                                Obs: {group.observation}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {selectedGroup && (
          <StopDetailDrawer
            group={selectedGroup}
            isOpen={!!selectedGroup}
            onClose={() => setSelectedGroup(null)}
            selectedDate={simulatedDate}
          />
        )}
      </div>
    </div>
  );
}
