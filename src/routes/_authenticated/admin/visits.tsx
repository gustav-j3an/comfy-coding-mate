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
  MessageSquare
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

const visitsSearchSchema = z.object({
  filter: z.string().optional(),
});

export const Route = createFileRoute('/_authenticated/admin/visits')({
  validateSearch: (search) => visitsSearchSchema.parse(search),
  component: VisitsPage,
});

function VisitsPage() {
  const search = Route.useSearch();
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(search.filter || 'all');

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
          profiles:promoter_id(full_name),
          stores:store_id(name, city),
          industries:industry_id(name)
        `);

      const todayStr = format(new Date(), 'yyyy-MM-dd');

      if (search.filter === 'predicted-today') {
        query = query.eq('scheduled_date', todayStr).eq('status', 'pending');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold"><CheckCircle2 className="w-3 h-3 mr-1" /> Aprovada</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold"><AlertCircle className="w-3 h-3 mr-1" /> Rejeitada</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold"><Clock className="w-3 h-3 mr-1" /> Em Conferência</Badge>;
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
              <option value="pending">Agendadas</option>
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
                      <Button variant="ghost" size="sm" className="font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
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
    </div>
  );
}
