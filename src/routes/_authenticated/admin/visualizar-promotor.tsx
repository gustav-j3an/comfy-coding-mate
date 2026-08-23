import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, ArrowLeft, User, AlertCircle, Info, MapPin, 
  Calendar, Clock, CheckCircle2, Archive, FileText, 
  ChevronRight, CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { format, startOfWeek, differenceInCalendarWeeks, isBefore, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { getPromoterItineraryData } from '@/lib/routes.functions';
import { useServerFn } from '@tanstack/react-start';


export const Route = createFileRoute('/_authenticated/admin/visualizar-promotor')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      promoterId: (search['promoterId'] as string) || '',
    };
  },
  component: VisualizarPromotorPage,
});

function VisualizarPromotorPage() {
  const { promoterId } = Route.useSearch() as { promoterId: string };
  const { role } = useAuth();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

  const fetchItineraryData = useServerFn(getPromoterItineraryData);

  const { data: promoter, isLoading: promoterLoading, error: promoterError } = useSuspenseQuery({
    queryKey: ['admin-preview-promoter-info', promoterId],
    queryFn: async () => {
      if (!promoterId) throw new Error('ID do promotor não fornecido.');

      const { data, error } = await supabase
        .from('promoters')
        .select('*')
        .eq('id', promoterId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Promotor não encontrado.');
      if (!data.active) throw new Error('Este promotor está inativo.');

      return data;
    }
  });

  const { data: routes, isLoading: routesLoading, error: routesError } = useSuspenseQuery({
    queryKey: ['admin-preview-promoter-routes', promoterId],
    queryFn: () => fetchItineraryData({ data: { promoterId } })
  });

  const isLoading = promoterLoading || routesLoading;
  const error = promoterError || routesError;

  const agendaStops = useMemo(() => {
    if (!routes) return [];

    const today = startOfDay(new Date());
    
    // 1. Filtrar roteiros válidos (publicados, ativos e dentro da vigência)
    const activeRoutes = routes.filter((r: any) => {
      const isPublished = r.status === 'published';
      const isActive = r.active !== false;
      const isValidFrom = r.valid_from ? !isBefore(today, startOfDay(parseISO(r.valid_from))) : true;
      return isPublished && isActive && isValidFrom;
    });

    const stops: any[] = [];

    activeRoutes.forEach((route: any) => {
      const routeStops = route.route_stops || [];
      
      routeStops.forEach((stop: any) => {
        // Filtrar pelo dia da semana
        if (stop.day_of_week !== selectedDay) return;

        // Lógica de frequência
        let shouldShow = true;
        if (stop.frequency === 'biweekly') {
          const refDate = stop.biweekly_start_date 
            ? parseISO(stop.biweekly_start_date) 
            : (route.valid_from ? parseISO(route.valid_from) : today);
          
          const weeksDiff = Math.abs(differenceInCalendarWeeks(today, startOfWeek(refDate)));
          shouldShow = weeksDiff % 2 === 0;
        }

        if (shouldShow) {
          stops.push({
            ...stop,
            routeName: route.name
          });
        }
      });
    });

    // Ordenar por visit_order
    return stops.sort((a, b) => (a.visit_order || 0) - (b.visit_order || 0));
  }, [routes, selectedDay]);

  const daysConfig = [
    { label: 'DOM', value: 0 },
    { label: 'SEG', value: 1 },
    { label: 'TER', value: 2 },
    { label: 'QUA', value: 3 },
    { label: 'QUI', value: 4 },
    { label: 'SEX', value: 5 },
    { label: 'SÁB', value: 6 },
  ];



  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900">Acesso Negado</h1>
        <p className="text-slate-600 mt-2">Esta página é restrita a administradores.</p>
        <Button className="mt-6" onClick={() => navigate({ to: '/' })}>
          Voltar para Início
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900">Erro de Validação</h1>
        <p className="text-slate-600 mt-2">{(error as Error).message}</p>
        <Button className="mt-6" onClick={() => navigate({ to: '/admin/routes' })}>
          Voltar para Rotas
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="font-bold text-slate-600"
            onClick={() => navigate({ to: '/admin/routes' })}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Rotas e Roteiros
          </Button>
          <Badge className="bg-blue-100 text-blue-700 border-none px-3 py-1 font-bold">
            MODO VISUALIZADOR ADMIN
          </Badge>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="bg-white border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <User className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900">
                  {promoter?.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold">
                    Ativo
                  </Badge>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    ID: {promoter?.id.split('-')[0]}...
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 bg-white rounded-b-xl overflow-hidden">
            {/* Agenda Semanal */}
            <div className="p-6 sm:p-8 bg-white border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <CalendarDays className="h-6 w-6 text-blue-600" />
                    Agenda semanal de {promoter?.name}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    Visualize a programação teórica baseada nos roteiros ativos.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {daysConfig.map((day) => (
                    <Button
                      key={day.value}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-9 px-3 text-[10px] font-black rounded-lg transition-all",
                        selectedDay === day.value 
                          ? "bg-white text-blue-600 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                      )}
                      onClick={() => setSelectedDay(day.value)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {agendaStops.length > 0 ? (
                  agendaStops.map((stop, index) => {
                    const industries = stop.stop_tasks?.map((t: any) => t.industries?.name).filter(Boolean).join(', ') || 'Nenhuma';
                    return (
                      <div key={stop.id} className="relative pl-4 border-l-4 border-blue-500 bg-slate-50/50 rounded-r-xl p-4 transition-all hover:bg-slate-50">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-blue-600 text-white h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 shadow-sm shadow-blue-200">
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-base font-black text-slate-900">{stop.stores?.name}</h4>
                                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-none text-[9px] font-black uppercase tracking-wider px-2">
                                  Prévia do roteiro
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {stop.stores?.address || 'Sem endereço disponível'}
                              </p>
                              
                              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Indústria</span>
                                  <span className="text-xs font-bold text-slate-700">{industries}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Frequência</span>
                                  <span className="text-xs font-bold text-slate-700 capitalize">
                                    {stop.frequency === 'biweekly' ? 'Quinzenal' : 'Semanal'}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Origem</span>
                                  <span className="text-xs font-bold text-blue-600 underline decoration-blue-200 underline-offset-2 italic">
                                    Roteiro: {stop.routeName}
                                  </span>
                                </div>
                              </div>

                              {stop.observation && (
                                <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-100 text-[10px] text-amber-700 font-medium flex items-start gap-2">
                                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                                  <span><strong className="font-black uppercase tracking-tighter">OBS:</strong> {stop.observation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                    <Calendar className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 font-medium italic">
                      Nenhuma parada programada para {daysConfig.find(d => d.value === selectedDay)?.label.toLowerCase()}.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Listagem Técnica (Roteiros Encontrados) */}

            <div className="p-6 sm:p-8 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Roteiros encontrados para {promoter?.name}
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Visualização real da estrutura de roteiros e paradas cadastradas.
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {routes && routes.length > 0 ? (
                routes.map((route: any) => (
                  <div key={route.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-black text-slate-900">{route.name}</h4>
                          <Badge variant={route.status === 'published' ? 'default' : 'secondary'} className={route.status === 'published' ? 'bg-green-600 hover:bg-green-700' : ''}>
                            {route.status === 'published' ? 'Publicado' : route.status === 'archived' ? 'Arquivado' : 'Rascunho'}
                          </Badge>
                          {route.active === false && (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Pausado</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Vigência: {route.valid_from ? new Date(route.valid_from).toLocaleDateString() : 'Imediata'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Versão: v{route.version || 1}
                          </span>
                          <span className="flex items-center gap-1 text-blue-600">
                            <MapPin className="h-3 w-3" />
                            {route.route_stops?.length || 0} Paradas
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {route.route_stops && route.route_stops.length > 0 ? (
                        route.route_stops.map((stop: any) => {
                          const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
                          const dayName = days[stop.day_of_week] || 'Indefinido';
                          const industries = stop.stop_tasks?.map((t: any) => t.industries?.name).filter(Boolean).join(', ') || 'Nenhuma';
                          
                          return (
                            <div key={stop.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className="mt-1 bg-slate-100 p-2 rounded-lg text-slate-500 hidden sm:block">
                                  <MapPin className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900">{stop.stores?.name}</p>
                                  <p className="text-xs text-slate-500 font-medium">{stop.stores?.address || 'Sem endereço'}</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-bold whitespace-nowrap">
                                  {dayName}
                                </Badge>
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Indústria</span>
                                  <span className="text-xs font-bold text-slate-700">{industries}</span>
                                </div>
                                <div className="flex flex-col items-end min-w-[80px]">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Freq.</span>
                                  <span className="text-xs font-bold text-slate-700 capitalize">{stop.frequency === 'biweekly' ? 'Quinzenal' : 'Semanal'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center text-slate-400 font-medium italic">
                          Nenhuma parada cadastrada neste roteiro.
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center">
                  <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 inline-block">
                    <AlertCircle className="h-10 w-10 text-slate-300 mb-3 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-500">Nenhum roteiro encontrado</h3>
                    <p className="text-slate-400 mt-2 max-w-sm font-medium italic text-center">
                      Este promotor não possui roteiros ativos ou rascunhos vinculados.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

        </Card>
      </div>
    </div>
  );
}
