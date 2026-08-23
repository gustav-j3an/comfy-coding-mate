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

export const Route = createFileRoute('/_authenticated/promoter/')({
  component: PromoterDashboard,
});

function PromoterDashboard() {
  const { user, profile, previewPromoter } = useAuth();
  const today = new Date().toISOString().split('T')[0];

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
  }, []);

  const { data: visits } = useSuspenseQuery({
    queryKey: ['promoter-visits', user?.id, today, previewPromoter?.id],
    queryFn: async () => {
      const currentUserId = user?.id;
      const effectiveUserId = previewPromoter?.id || currentUserId;
      const currentPromoterId = previewPromoter?.id || profile?.promoter_id || null;
      if (!effectiveUserId) return [];
      
      try {
        let query = supabase
          .from('visits')
          .select(`
            *,
            store:stores(name, address),
            industry:industries(name)
          `)
          .eq('scheduled_date', today as any);

        if (currentPromoterId) {
          query = query.eq('promoter_id', currentPromoterId);
        } else {
          query = query.eq('executor_id', currentUserId);
        }

        const { data, error } = await query.order('visit_order', { ascending: true });

        if (error) throw error;
        
        // Update cache for offline use
        await cachePromoterVisits(currentUserId, data || []);
        return data || [];
      } catch (err) {
        console.warn('Network error, loading from cache:', err);
        return await getCachedVisits(currentUserId);
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
    const draft = offlineDrafts[visit.id];
    const status = draft ? draft.status : visit.status;

    switch (status) {
      case 'planned': return <Badge variant="outline" className="bg-slate-100">Prevista</Badge>;
      case 'pending': return <Badge variant="secondary">Em andamento</Badge>;
      case 'awaiting_media': return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Mídia Pendente</Badge>;
      case 'ready_to_send': return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">Pronta p/ Enviar</Badge>;
      case 'offline_draft': return <Badge variant="outline" className="bg-slate-100 text-slate-600">Rascunho</Badge>;
      case 'submitted': return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Enviada</Badge>;
      case 'approved': return <Badge variant="default" className="bg-green-100 text-green-700">Aprovada</Badge>;
      case 'rejected': return <Badge variant="destructive">Reprovada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
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
            <p className="text-blue-100 opacity-90">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
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
                    to={"/promoter/visit/$visitId" as any} 
                    params={{ visitId: String(nextStop.id) } as any}
                  >
                    Iniciar Visita
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
            Roteiro do Dia
          </h2>
          
          <div className="space-y-3">
            {visits.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-8 text-center text-slate-500">
                  <p>Nenhuma visita planejada para hoje.</p>
                </CardContent>
              </Card>
            ) : (
              (visits as any[]).map((visit, index) => (
                <Link 
                  key={visit.id} 
                  to={"/promoter/visit/$visitId" as any}
                  params={{ visitId: String(visit.id) } as any}
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
                          <div className="flex items-center text-slate-400 text-xs mt-2">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">{(visit as any).store?.address}</span>
                          </div>
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
