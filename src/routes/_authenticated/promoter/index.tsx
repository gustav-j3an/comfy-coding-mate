import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LogOut, MapPin, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/_authenticated/promoter/')({
  component: PromoterDashboard,
});

function PromoterDashboard() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stops, setStops] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const dayOfWeek = new Date().getDay();

  useEffect(() => {
    fetchTodayRoute();
  }, [user]);

  async function fetchTodayRoute() {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch the route for the promoter
      const { data: routeData, error: routeError } = await (supabase as any)
        .from('routes')
        .select('id')
        .eq('promoter_id', user.id)
        .eq('active', true)
        .single();

      if (routeError) throw routeError;

      // Fetch stops for today
      const { data: stopsData, error: stopsError } = await (supabase as any)
        .from('route_stops')
        .select(`
          id,
          visit_order,
          stores (
            id,
            name,
            address
          ),
          stop_tasks (
            id,
            industries (
              id,
              name
            )
          )
        `)
        .eq('route_id', routeData.id)
        .eq('day_of_week', dayOfWeek)
        .order('visit_order', { ascending: true });

      if (stopsError) throw stopsError;

      // Fetch visits already made today to calculate progress
      const { data: visitsData } = await (supabase as any)
        .from('visits')
        .select('store_id, industry_id, status')
        .eq('promoter_id', user.id)
        .eq('scheduled_date', format(new Date(), 'yyyy-MM-dd'));

      // Process stops with their status
      const processedStops = stopsData.map((stop: any) => {
        const tasks = stop.stop_tasks.map((task: any) => {
          const visit = visitsData?.find(
            (v: any) => v.store_id === stop.stores.id && v.industry_id === task.industries.id
          );
          return {
            ...task,
            status: visit?.status || 'pending'
          };
        });

        const completedTasks = tasks.filter((t: any) => t.status !== 'pending').length;
        const isCompleted = completedTasks === tasks.length && tasks.length > 0;

        return {
          ...stop,
          tasks,
          isCompleted
        };
      });

      setStops(processedStops);
      
      const totalTasks = processedStops.reduce((acc: number, stop: any) => acc + stop.tasks.length, 0);
      const completedTotal = processedStops.reduce(
        (acc: number, stop: any) => acc + stop.tasks.filter((t: any) => t.status !== 'pending').length,
        0
      );
      setProgress(totalTasks > 0 ? (completedTotal / totalTasks) * 100 : 0);

    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-4 flex justify-center items-center min-h-screen">Carregando roteiro...</div>;
  }

  const nextStop = stops.find(s => !s.isCompleted);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
      <header className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">Meu roteiro de hoje</h1>
            <p className="text-primary-foreground/80 flex items-center gap-1 mt-1">
              <Clock className="w-4 h-4" />
              {today}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-primary-foreground">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-2 mt-6">
          <div className="flex justify-between text-sm font-medium">
            <span>Progresso do dia</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3 bg-white/20" />
        </div>
      </header>

      <main className="p-4 flex-1 space-y-6">
        {nextStop && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Próxima parada</h2>
            <Card className="border-l-4 border-l-blue-500 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{nextStop.stores.name}</h3>
                    <p className="text-slate-500 text-sm">{nextStop.stores.address}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {nextStop.tasks.map((task: any) => (
                        <span key={task.id} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium">
                          {task.industries.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Lista de visitas</h2>
          <div className="space-y-3">
            {stops.length === 0 ? (
              <div className="text-center py-10 text-slate-400">Nenhuma visita programada para hoje.</div>
            ) : (
              stops.map((stop, index) => (
                <Card key={stop.id} className={stop.isCompleted ? 'opacity-70 grayscale bg-slate-50' : ''}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${stop.isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-600'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold">{stop.stores.name}</h4>
                        <p className="text-xs text-slate-500">{stop.tasks.length} {stop.tasks.length === 1 ? 'indústria' : 'indústrias'}</p>
                      </div>
                    </div>
                    {stop.isCompleted ? (
                      <CheckCircle2 className="text-green-500 w-6 h-6" />
                    ) : (
                      <Button size="sm" variant="outline">Detalhes</Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Bottom Nav Mockup */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around items-center z-10">
        <Button variant="ghost" className="flex flex-col gap-1 items-center h-auto py-2 text-primary">
          <Clock className="w-6 h-6" />
          <span className="text-[10px]">Roteiro</span>
        </Button>
        <Button variant="ghost" className="flex flex-col gap-1 items-center h-auto py-2 text-slate-400">
          <CheckCircle2 className="w-6 h-6" />
          <span className="text-[10px]">Visitas</span>
        </Button>
      </nav>
    </div>
  );
}
