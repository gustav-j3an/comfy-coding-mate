import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Filter, CheckCircle2, Clock, 
  AlertCircle, Eye, ChevronRight, MapPin,
  Calendar, User, X, Check, Loader2,
  ExternalLink,
  MessageSquare,
  FileText
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { auditVisit, getSignedUrl } from '@/lib/execution.functions';
import { useAuth } from '@/lib/auth/auth-context';
import { Textarea } from '@/components/ui/textarea';

const visitsSearchSchema = z.object({
  filter: z.string().optional(),
});

export const Route = createFileRoute('/_authenticated/admin/visits')({
  validateSearch: (search) => visitsSearchSchema.parse(search),
  component: VisitsPage,
});

function VisitsPage() {
  const search = Route.useSearch();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(search.filter || 'all');
  
  // Audit Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [auditReason, setAuditReason] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [evidences, setEvidences] = useState<any[]>([]);
  const [loadingEvidences, setLoadingEvidences] = useState(false);

  useEffect(() => {
    fetchVisits();
  }, [search.filter]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('visits')
        .select(`
          *,
          profiles:executor_id(full_name),
          stores:store_id(name, city),
          industries:industry_id(name)
        `);

      const todayStr = format(new Date(), 'yyyy-MM-dd');

      if (search.filter === 'predicted-today') {
        query = query.eq('scheduled_date', todayStr).eq('status', 'planned' as any);
      } else if (search.filter === 'sent-today') {
        query = query.eq('scheduled_date', todayStr).eq('status', 'submitted');
      } else if (search.filter === 'pending') {
        query = query.eq('status', 'submitted');
      }

      const { data, error } = await query.order('scheduled_date', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar visitas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvidences = async (visitId: string) => {
    try {
      setLoadingEvidences(true);
      const { data, error } = await supabase
        .from('visit_evidence')
        .select('*')
        .eq('visit_id', visitId);

      if (error) throw error;

      // Get signed URLs for each evidence
      const evidencesWithUrls = await Promise.all(
        (data || []).map(async (ev) => {
          try {
            const url = await getSignedUrl({ data: { filePath: ev.file_path } });
            return { ...ev, signedUrl: url };
          } catch (e) {
            console.error('Error getting signed URL:', e);
            return ev;
          }
        })
      );

      setEvidences(evidencesWithUrls);
    } catch (error: any) {
      toast.error('Erro ao carregar evidências: ' + error.message);
    } finally {
      setLoadingEvidences(false);
    }
  };

  const handleOpenAudit = (visit: any) => {
    setSelectedVisit(visit);
    setAuditReason(visit.rejection_reason || '');
    setIsAuditModalOpen(true);
    fetchEvidences(visit.id);
  };

  const handleAudit = async (decision: 'approved' | 'rejected') => {
    if (decision === 'rejected' && !auditReason) {
      toast.error('Informe o motivo da reprovação.');
      return;
    }

    try {
      setIsAuditing(true);
      await auditVisit({
        data: {
          visitId: selectedVisit.id,
          auditorId: authUser!.id,
          decision,
          reason: auditReason
        }
      });

      toast.success(decision === 'approved' ? 'Visita aprovada!' : 'Visita reprovada.');
      setIsAuditModalOpen(false);
      fetchVisits();
    } catch (error: any) {
      toast.error('Erro ao auditar visita: ' + error.message);
    } finally {
      setIsAuditing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold"><CheckCircle2 className="w-3 h-3 mr-1" /> Aprovada</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold"><AlertCircle className="w-3 h-3 mr-1" /> Rejeitada</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold"><Clock className="w-3 h-3 mr-1" /> Em Conferência</Badge>;
      case 'planned':
        return <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none font-bold">Planejada</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none font-bold">Pendente</Badge>;
    }
  };

  const filteredVisits = visits.filter(v => {
    const matchesSearch = 
      v.stores?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.industries?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && v.status === statusFilter;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Visitas para Conferência</h2>
          <p className="text-sm text-slate-500">Auditoria e validação de evidências</p>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-4 flex-1 w-full max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar por loja, promotor ou indústria..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">Todos os Status</option>
              <option value="submitted">Pendentes de Conferência</option>
              <option value="approved">Aprovadas</option>
              <option value="rejected">Rejeitadas</option>
              <option value="planned">Agendadas</option>
            </select>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Mais Filtros
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Data / Loja</TableHead>
                <TableHead className="font-bold text-slate-700">Promotor / Indústria</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    Carregando visitas...
                  </TableCell>
                </TableRow>
              ) : filteredVisits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    Nenhuma visita encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVisits.map((visit) => (
                  <TableRow key={visit.id} className="hover:bg-slate-50 transition-colors group">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(visit.scheduled_date), "dd 'de' MMMM", { locale: ptBR })}
                        </div>
                        <div className="font-bold text-slate-900">{visit.stores?.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {visit.stores?.city}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                          <User className="w-3 h-3 text-slate-400" />
                          {visit.profiles?.full_name || 'Promotor não vinculado'}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Badge variant="outline" className="text-[9px] h-4 font-bold border-slate-200">
                            {visit.industries?.name}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(visit.status)}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenAudit(visit)}
                        className="font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        AUDITAR <ChevronRight className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Auditoria de Visita</span>
              {selectedVisit && (
                <Badge variant="outline" className="ml-4 font-bold">
                  {selectedVisit.stores?.name}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedVisit && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" /> Detalhes da Execução
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Promotor</p>
                        <p className="font-bold text-slate-900">{selectedVisit.profiles?.full_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Indústria</p>
                        <p className="font-bold text-slate-900">{selectedVisit.industries?.name}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Check-in</p>
                        <p className="font-bold text-slate-900">
                          {selectedVisit.checkin_at ? format(new Date(selectedVisit.checkin_at), 'HH:mm', { locale: ptBR }) : '--:--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Check-out</p>
                        <p className="font-bold text-slate-900">
                          {selectedVisit.checkout_at ? format(new Date(selectedVisit.checkout_at), 'HH:mm', { locale: ptBR }) : '--:--'}
                        </p>
                      </div>
                      {selectedVisit.execution_latitude && (
                        <div className="col-span-2">
                          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Localização GPS</p>
                          <a 
                            href={`https://www.google.com/maps?q=${selectedVisit.execution_latitude},${selectedVisit.execution_longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            {selectedVisit.execution_latitude.toFixed(6)}, {selectedVisit.execution_longitude.toFixed(6)}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" /> Observações do Promotor
                    </h3>
                    <div className="bg-white border p-3 rounded-lg text-sm text-slate-600 min-h-[60px]">
                      {selectedVisit.observation || 'Nenhuma observação informada.'}
                    </div>
                  </div>

                  {selectedVisit.status === 'rejected' && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <h3 className="font-bold text-red-700 text-sm flex items-center gap-2 mb-1">
                        <X className="w-4 h-4" /> Motivo da Reprovação
                      </h3>
                      <p className="text-sm text-red-600">{selectedVisit.rejection_reason}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" /> Evidências
                  </h3>
                  
                  {loadingEvidences ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : evidences.length === 0 ? (
                    <div className="bg-slate-50 border-dashed border-2 p-8 text-center text-slate-500 rounded-lg">
                      Nenhuma evidência anexada.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {evidences.map((ev, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden border bg-slate-100 aspect-square">
                          {ev.file_type?.startsWith('image/') ? (
                            <img 
                              src={ev.signedUrl} 
                              alt="evidencia" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                              <FileText className="h-8 w-8 text-slate-400 mb-2" />
                              <span className="text-[10px] font-bold text-slate-500 truncate w-full">
                                {ev.evidence_type}
                              </span>
                            </div>
                          )}
                          <a 
                            href={ev.signedUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <ExternalLink className="text-white h-6 w-6" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <h3 className="font-bold text-slate-800">Decisão da Auditoria</h3>
                <Textarea 
                  placeholder="Descreva o motivo caso deseje reprovar esta visita..."
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsAuditModalOpen(false)}
              disabled={isAuditing}
            >
              Cancelar
            </Button>
            {selectedVisit?.status === 'submitted' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => handleAudit('rejected')}
                  disabled={isAuditing}
                  className="font-bold"
                >
                  {isAuditing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
                  Reprovar
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 font-bold"
                  onClick={() => handleAudit('approved')}
                  disabled={isAuditing}
                >
                  {isAuditing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Aprovar Visita
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
