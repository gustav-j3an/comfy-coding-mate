import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter,
  MessageSquare,
  Building2,
  MapPin
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
          visit:visit_id(
            id,
            stores:store_id(name, city),
            industries:industry_id(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOccurrences(data || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-700 border-none font-bold">Crítica</Badge>;
      case 'attention':
        return <Badge className="bg-amber-100 text-amber-700 border-none font-bold">Atenção</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-700 border-none font-bold">Aberta</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-700 border-none font-bold">Resolvida</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filtered = occurrences.filter(o => 
    o.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.visit?.stores?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Ocorrências em Campo</h2>
          <p className="text-sm text-slate-500">Gestão de rupturas e incidentes</p>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por tipo ou loja..." 
              className="pl-10 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 whitespace-nowrap">Tipo / Severidade</TableHead>
                  <TableHead className="font-bold text-slate-700 whitespace-nowrap">Loja / Indústria</TableHead>
                  <TableHead className="font-bold text-slate-700 whitespace-nowrap">Data</TableHead>
                  <TableHead className="font-bold text-slate-700 whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">Carregando...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">Nenhuma ocorrência encontrada.</TableCell>
                </TableRow>
              ) : (
                filtered.map((occ) => (
                  <TableRow key={occ.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900">{occ.type}</span>
                        {getSeverityBadge(occ.severity)}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm font-bold text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {occ.visit?.stores?.name}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <Building2 className="w-3 h-3" />
                          {occ.visit?.industries?.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-bold uppercase whitespace-nowrap">
                      {occ.created_at ? format(new Date(occ.created_at), "dd MMM, HH:mm", { locale: ptBR }) : '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getStatusBadge(occ.status)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
