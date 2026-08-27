import { useState } from "react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerFooter,
  DrawerDescription
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  Info, 
  CheckCircle2, 
  Play,
  Clock,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useServerFn } from "@tanstack/react-start";
import { startScheduledVisit } from "@/lib/execution.functions";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

interface StopDetailDrawerProps {
  group: any;
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

export function StopDetailDrawer({ group, isOpen, onClose, selectedDate }: StopDetailDrawerProps) {
  const [isStarting, setIsStarting] = useState(false);
  const navigate = useNavigate();
  const startVisit = useServerFn(startScheduledVisit);

  const isTheoretical = group.all_items.every((i: any) => i.is_theoretical);
  const isToday = format(new Date(), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  const industries = Array.isArray(group.industries) ? group.industries.filter((ind: any) => ind?.id && ind?.name) : [];

  if (import.meta.env.DEV && isOpen && industries.length === 0) {
    console.error('[StopDetailDrawer] Nenhuma indústria foi vinculada a esta parada', {
      visitId: group.visitId || group.id,
      stopId: group.route_stop_id,
    });
  }
  
  const handleStartVisit = async (industryId?: string) => {
    if (!industryId) {
      toast.info("Selecione uma indústria para iniciar a visita.");
      return;
    }
    // If we have a real visit in the group, we navigate directly to the first real one
    const realVisit = group.all_items.find((i: any) => !i.is_theoretical);
    
    if (realVisit && realVisit.id && !realVisit.id.startsWith('theoretical-')) {
      navigate({ to: "/promoter/visit/$visitId", params: { visitId: realVisit.id }, search: { industryId } });
      onClose();
      return;
    }

    if (!isToday) {
      toast.warning("Esta visita só estará disponível na data programada.");
      return;
    }

    setIsStarting(true);
    try {
      // For materialization, we need the stop ID from a theoretical item
      const theoreticalItem = group.all_items.find((i: any) => i.is_theoretical);
      const stopId = theoreticalItem?.route_stop_id || group.all_items[0].route_stop_id;

      if (!stopId) {
        throw new Error("Identificador da parada não encontrado.");
      }

      const result = await startVisit({
        data: {
          routeStopId: stopId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          industryId: industryId as string
        }
      });

      if (result && result.visitId) {
        toast.success(result.action === 'reused' ? "Visita recuperada!" : "Visita iniciada com sucesso!");
        navigate({ to: "/promoter/visit/$visitId", params: { visitId: result.visitId }, search: { industryId } });
        onClose();
      } else {
        throw new Error("Falha ao materializar visita: ID não retornado.");
      }
    } catch (error: any) {
      console.error("Start visit error:", error);
      toast.error(error.message || "Não foi possível iniciar esta visita. Verifique sua conexão e tente novamente.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleSelectIndustry = async (industryId: string) => {
    const selectedIndustry = industries.find((industry: any) => industry.id === industryId);
    if (selectedIndustry && ['submitted', 'approved', 'rejected'].includes(selectedIndustry.status)) {
      const confirmed = window.confirm('Este atendimento já foi enviado. Deseja corrigir e reenviar?');
      if (!confirmed) return;
    }
    const realVisit = group.all_items.find((i: any) => !i.is_theoretical);
    if (realVisit?.id && !realVisit.id.startsWith('theoretical-')) {
      navigate({ to: "/promoter/visit/$visitId", params: { visitId: realVisit.id }, search: { industryId } });
      onClose();
      return;
    }
    await handleStartVisit(industryId);
  };

  const dayOfWeekLabel = format(selectedDate, "EEEE", { locale: ptBR });

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-xl font-bold flex items-start justify-between">
            <span>{group.store?.name}</span>
            {isTheoretical ? (
               <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Prevista</Badge>
            ) : (
               <Badge variant="secondary" className="bg-green-100 text-green-700">Real</Badge>
            )}
          </DrawerTitle>
          <DrawerDescription className="flex items-center text-slate-500 mt-1">
            <MapPin className="h-3 w-3 mr-1" />
            {group.store?.address}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-2 space-y-6 overflow-y-auto">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Dia Agendado</span>
              <div className="flex items-center text-sm font-semibold text-slate-700">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                {dayOfWeekLabel}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Frequência</span>
              <div className="flex items-center text-sm font-semibold text-slate-700">
                <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                {group.frequency === 'biweekly' ? 'Quinzenal' : 'Semanal'}
              </div>
            </div>
          </div>

          {/* Source Route */}
          {group.route_name && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50/50 p-2 px-3 rounded-lg border border-blue-100/50">
              <Info className="h-3 w-3 text-blue-500" />
              <span>Roteiro: <span className="font-semibold text-slate-700">{group.route_name}</span></span>
            </div>
          )}

          {/* Industries & Checklist */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center">
              Indústrias e Checklist
            </h4>
            <div className="space-y-3">
              {industries.length === 0 ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  Nenhuma indústria foi vinculada a esta parada
                </div>
              ) : industries.map((ind: any, i: number) => (
                <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-2 px-3 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">{ind?.name}</span>
                    <Badge variant="outline" className="text-[9px] h-4">Material obrigatório</Badge>
                  </div>
                  <div className="p-3 space-y-2">
                    <Button
                      size="sm"
                      className={`w-full font-bold ${
                        ['submitted', 'approved'].includes(ind.status)
                          ? 'bg-green-600 hover:bg-green-700'
                          : ind.status === 'rejected'
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                      onClick={() => handleSelectIndustry(ind.id)}
                    >
                      {['submitted', 'approved'].includes(ind.status) ? <CheckCircle2 className="mr-2 h-4 w-4" /> : ind.status === 'rejected' ? <AlertCircle className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      {['submitted', 'approved'].includes(ind.status) ? 'Atendimento realizado' : ind.status === 'rejected' ? 'Corrigir atendimento' : 'Atender indústria'}
                    </Button>
                    <div className="flex items-center text-xs text-slate-600 gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-slate-300" />
                      Registrar relatório (opcional)
                    </div>
                    {['KING', 'DON LUIZ', 'FRUTA POLPA'].includes(ind?.name || '') && (
                      <div className="flex items-center text-xs text-slate-600 gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        Foto obrigatória da reposição
                      </div>
                    )}
                    <div className="flex items-center text-xs text-slate-600 gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-slate-300" />
                      Foto do estoque/ruptura (quando aplicável)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Observations */}
          {group.observation && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
              <span className="text-[10px] text-amber-700 uppercase font-bold block mb-1">Observações Operacionais</span>
              <p className="text-xs text-amber-800 leading-relaxed">{group.observation}</p>
            </div>
          )}

          {/* Final Status */}
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-medium">
             {isTheoretical ? (
               <>
                 <AlertCircle className="h-4 w-4 text-blue-500" />
                 <span className="text-slate-600">Visita prevista para {dayOfWeekLabel}</span>
               </>
             ) : (
               <>
                 <CheckCircle2 className="h-4 w-4 text-green-500" />
                 <span className="text-slate-600">Visita materializada em execução</span>
               </>
             )}
          </div>
        </div>

        <DrawerFooter className="pt-2">
          {isToday ? (
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold rounded-xl shadow-lg active:scale-95 transition-all"
              onClick={() => handleStartVisit()}
              disabled={isStarting}
            >
              {isStarting ? (
                <>Carregando...</>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Iniciar Visita
                </>
              )}
            </Button>
          ) : (
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 text-lg font-bold rounded-xl border-slate-200 text-slate-400"
              disabled
            >
              Disponível no dia da visita
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className="text-slate-500">
            Voltar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
