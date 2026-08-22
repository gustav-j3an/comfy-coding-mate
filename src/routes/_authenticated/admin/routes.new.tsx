import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChevronLeft, Plus, Trash2, GripVertical, 
  Save, CheckCircle2, Calendar, Clock,
  MapPin, Building2, Info
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { publishRoute } from '@/lib/routes.functions';

export const Route = createFileRoute('/_authenticated/admin/routes/new')({
  component: RouteEditorPage,
});

const DAYS_OF_WEEK = [
  { id: 1, name: 'Segunda-feira' },
  { id: 2, name: 'Terça-feira' },
  { id: 3, name: 'Quarta-feira' },
  { id: 4, name: 'Quinta-feira' },
  { id: 5, name: 'Sexta-feira' },
  { id: 6, name: 'Sábado' },
  { id: 0, name: 'Domingo' },
];

function RouteEditorPage() {
  const navigate = useNavigate();
  const [promoters, setPromoters] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  
  const [routeName, setRouteName] = useState('');
  const [selectedPromoterId, setSelectedPromoterId] = useState('');
  const [validFrom, setValidFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedDay, setSelectedDay] = useState(1); // Monday
  
  // Day-specific stops: { [dayId]: Stop[] }
  const [stopsByDay, setStopsByDay] = useState<Record<number, any[]>>({
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [promData, storeData, indData] = await Promise.all([
        supabase.from('promoters').select('*').eq('active', true),
        supabase.from('stores').select('*').eq('active', true),
        supabase.from('industries').select('*').eq('active', true)
      ]);
      
      setPromoters(promData.data || []);
      setStores(storeData.data || []);
      setIndustries(indData.data || []);
    } catch (error: any) {
      toast.error('Erro ao carrerar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addStop = () => {
    const newStop = {
      id: crypto.randomUUID(),
      store_id: '',
      visit_order: stopsByDay[selectedDay].length + 1,
      frequency: 'weekly',
      biweekly_start_date: format(new Date(), 'yyyy-MM-dd'),
      observation: '',
      industry_ids: []
    };
    
    setStopsByDay(prev => ({
      ...prev,
      [selectedDay]: [...prev[selectedDay], newStop]
    }));
  };

  const removeStop = (stopId: string) => {
    setStopsByDay(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].filter(s => s.id !== stopId)
    }));
  };

  const updateStop = (stopId: string, updates: any) => {
    setStopsByDay(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map(s => 
        s.id === stopId ? { ...s, ...updates } : s
      )
    }));
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(stopsByDay[selectedDay]);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update order
    const updatedItems = items.map((item, index) => ({
      ...item,
      visit_order: index + 1
    }));
    
    setStopsByDay(prev => ({
      ...prev,
      [selectedDay]: updatedItems
    }));
  };

  const handleSave = async (publish = false) => {
    if (!routeName || !selectedPromoterId) {
      toast.error('Preencha o nome da rota e selecione um promotor');
      return;
    }

    setSaving(true);
    try {
      // 1. Create Route record
      const { data: route, error: routeError } = await supabase
        .from('routes')
        .insert({
          name: routeName,
          promoter_id: selectedPromoterId,
          valid_from: validFrom,
          active: publish,
          status: publish ? 'published' : ('draft' as any),
          version: 1
        })
        .select()
        .single();

      if (routeError) throw routeError;

      // 2. Prepare all stops and tasks
      const allStops = [];
      for (const day of Object.keys(stopsByDay)) {
        const dayStops = stopsByDay[Number(day)];
        for (const stop of dayStops) {
          allStops.push({
            route_id: route.id,
            store_id: stop.store_id,
            day_of_week: Number(day),
            visit_order: stop.visit_order,
            frequency: stop.frequency,
            biweekly_start_date: stop.biweekly_start_date,
            observation: stop.observation,
            industry_ids: stop.industry_ids // Temporary to map tasks
          });
        }
      }

      // 3. Insert stops
      for (const stopToInsert of allStops) {
        const { industry_ids, ...stopData } = stopToInsert;
        const { data: insertedStop, error: stopError } = await supabase
          .from('route_stops')
          .insert(stopData)
          .select()
          .single();
        
        if (stopError) throw stopError;

        // 4. Insert tasks for this stop
        if (industry_ids.length > 0) {
          const tasks = industry_ids.map(iid => ({
            stop_id: insertedStop.id,
            industry_id: iid
          }));
          await supabase.from('stop_tasks').insert(tasks);
        }
      }

      if (publish) {
        await publishRoute({ data: { routeId: route.id } });
        toast.success('Roteiro publicado e visitas geradas!');
      } else {
        toast.success('Rascunho salvo com sucesso!');
      }

      navigate({ to: '/admin/routes' });
    } catch (error: any) {
      toast.error('Erro ao salvar roteiro: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Carregando editor...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin/routes' })}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Novo Roteiro</h2>
            <p className="text-sm text-slate-500">Planejamento semanal fixo</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            Salvar Rascunho
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 font-bold" onClick={() => handleSave(true)} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> Publicar Roteiro
          </Button>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Dados Básicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Roteiro</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Roteiro Sul - Semanal" 
                  value={routeName}
                  onChange={e => setRouteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promoter">Promotor Responsável</Label>
                <Select value={selectedPromoterId} onValueChange={setSelectedPromoterId}>
                  <SelectTrigger id="promoter">
                    <SelectValue placeholder="Selecione o promotor" />
                  </SelectTrigger>
                  <SelectContent>
                    {promoters.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="validFrom">Vigência Inicial</Label>
                <Input 
                  id="validFrom" 
                  type="date" 
                  value={validFrom}
                  onChange={e => setValidFrom(e.target.value)}
                />
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                  <Info className="h-4 w-4" />
                  Informação
                </div>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Ao publicar, o sistema gerará automaticamente as visitas para os próximos 90 dias com base na programação configurada.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 border-none shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Programação Semanal</CardTitle>
                <Button size="sm" onClick={addStop} className="h-8 bg-blue-600">
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Parada
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 overflow-x-auto pb-2">
                {DAYS_OF_WEEK.map(day => (
                  <Button
                    key={day.id}
                    variant={selectedDay === day.id ? 'default' : 'ghost'}
                    size="sm"
                    className={`rounded-full h-9 px-4 font-bold ${selectedDay === day.id ? 'bg-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setSelectedDay(day.id)}
                  >
                    {day.name}
                    {stopsByDay[day.id].length > 0 && (
                      <Badge className="ml-2 bg-white/20 text-white border-none h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                        {stopsByDay[day.id].length}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="min-h-[400px]">
              {stopsByDay[selectedDay].length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl mt-4">
                  <Calendar className="h-10 w-10 mb-2 opacity-10" />
                  <p className="text-sm">Nenhuma parada configurada para {DAYS_OF_WEEK.find(d => d.id === selectedDay)?.name.toLowerCase()}.</p>
                  <Button variant="link" className="text-blue-600 font-bold" onClick={addStop}>
                    Adicionar a primeira parada agora
                  </Button>
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="stops">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 mt-4">
                        {stopsByDay[selectedDay].map((stop, index) => (
                          <Draggable key={stop.id} draggableId={stop.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm group hover:border-blue-200 transition-colors"
                              >
                                <div className="flex gap-4">
                                  <div {...provided.dragHandleProps} className="pt-2 text-slate-300 group-hover:text-slate-400">
                                    <GripVertical className="h-5 w-5" />
                                  </div>
                                  
                                  <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-3 flex-1">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs border border-slate-200">
                                          {index + 1}
                                        </div>
                                        <div className="flex-1 max-w-sm">
                                          <Select 
                                            value={stop.store_id} 
                                            onValueChange={val => updateStop(stop.id, { store_id: val })}
                                          >
                                            <SelectTrigger className="h-10 font-bold">
                                              <SelectValue placeholder="Selecione a loja" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {stores.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-slate-300 hover:text-red-500 hover:bg-red-50"
                                        onClick={() => removeStop(stop.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Indústrias</Label>
                                        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-slate-100 rounded-lg bg-slate-50/50">
                                          {industries.map(ind => {
                                            const isSelected = stop.industry_ids.includes(ind.id);
                                            return (
                                              <button
                                                key={ind.id}
                                                type="button"
                                                onClick={() => {
                                                  const newIds = isSelected 
                                                    ? stop.industry_ids.filter((id: string) => id !== ind.id)
                                                    : [...stop.industry_ids, ind.id];
                                                  updateStop(stop.id, { industry_ids: newIds });
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                                  isSelected 
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100 scale-105' 
                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                                }`}
                                              >
                                                {ind.name}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Frequência</Label>
                                          <Select 
                                            value={stop.frequency} 
                                            onValueChange={val => updateStop(stop.id, { frequency: val })}
                                          >
                                            <SelectTrigger className="h-10 font-bold bg-white">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="weekly">Semanal</SelectItem>
                                              <SelectItem value="biweekly">Quinzenal</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {stop.frequency === 'biweekly' && (
                                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Semana Inicial</Label>
                                            <Input 
                                              type="date" 
                                              className="h-10"
                                              value={stop.biweekly_start_date}
                                              onChange={e => updateStop(stop.id, { biweekly_start_date: e.target.value })}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Observação Operacional</Label>
                                      <Input 
                                        placeholder="Ex: Verificar validade dos iogurtes no fundo da gôndola"
                                        className="h-10 text-sm"
                                        value={stop.observation}
                                        onChange={e => updateStop(stop.id, { observation: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
