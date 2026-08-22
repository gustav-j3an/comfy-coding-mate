import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Filter, AlertTriangle, Clock, 
  CheckCircle2, AlertCircle, Eye, ChevronRight,
  MessageSquare, Store, Factory
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

export const Route = createFileRoute('/_authenticated/admin/occurrences')({
  component: OccurrencesPage,
});

function OccurrencesPage() {
  const [loading, setLoading] = useState(true);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOccurrences();
  }, []);

  const fetchOccurrences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('occurrences')
        .select(`
          *,
          stores:store_id(name),
          industries:industry_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOccurrences(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar ocorrências: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold">Resolvida</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold">Aberta</Badge>;
    }
  };

  const filteredOccurrences = occurrences.filter(o => 
    o.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.stores?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.industries?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Ocorrências</h2>
          <p className="text-sm text-slate-500">Gestão de incidentes e rupturas</p>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por tipo, loja ou indústria..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2 font-bold">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Ocorrência</TableHead>
                <TableHead className="font-bold text-slate-700">Local e Indústria</TableHead>
                <TableHead className="font-bold text-slate-700">Data / Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    Carregando ocorrências...
                  </TableCell>
                </TableRow>
              ) : filteredOccurrences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    Nenhuma ocorrência encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOccurrences.map((occ) => (
                  <TableRow key={occ.id} className="hover:bg-slate-50 transition-colors group">
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{occ.type}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{occ.description || 'Sem descrição detalhada'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                          <Store className="w-3 h-3 text-slate-400" />
                          {occ.stores?.name}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Factory className="w-3 h-3 text-slate-400" />
                          {occ.industries?.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">
                          {format(new Date(occ.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        {getStatusBadge(occ.status || 'open')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        VER DETALHES <ChevronRight className="w-4 h-4" />
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
