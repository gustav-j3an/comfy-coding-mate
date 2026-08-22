import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Filter, FileText, Download, 
  ChevronRight, Calendar, BarChart3,
  TrendingUp, TrendingDown, Factory, Loader2
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/reports')({
  component: ReportsPage,
});

function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    avgPerformance: 0,
    ruptureRate: 0,
    totalVisits: 0
  });
  const [industries, setIndustries] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [industriesRes, visitsRes, occurrencesRes] = await Promise.all([
        supabase.from('industries').select('*'),
        supabase.from('visits').select('id, status'),
        supabase.from('occurrences').select('id, type')
      ]);

      if (industriesRes.error) throw industriesRes.error;
      
      setIndustries(industriesRes.data || []);

      const totalVisits = visitsRes.data?.length || 0;
      const approvedVisits = visitsRes.data?.filter(v => v.status === 'approved').length || 0;
      const performance = totalVisits > 0 ? (approvedVisits / totalVisits) * 100 : 0;
      
      const ruptureOccurrences = occurrencesRes.data?.filter(o => 
        o.type?.toLowerCase().includes('ruptura') || o.type?.toLowerCase().includes('falta')
      ).length || 0;
      const ruptureRate = totalVisits > 0 ? (ruptureOccurrences / totalVisits) * 100 : 0;

      setStats({
        avgPerformance: performance,
        ruptureRate: ruptureRate,
        totalVisits: totalVisits
      });

    } catch (error: any) {
      toast.error('Erro ao carregar dados dos relatórios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredIndustries = industries.filter(ind => 
    ind.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Relatórios Mensais</h2>
          <p className="text-sm text-slate-500">Consolidado de performance e indicadores</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold">
          <BarChart3 className="mr-2 h-4 w-4" /> Novo Relatório
        </Button>
      </header>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Performance Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black text-slate-900 tabular-nums">
                  {loading ? '...' : `${stats.avgPerformance.toFixed(1)}%`}
                </div>
                <div className="flex items-center text-green-600 text-xs font-bold">
                  <TrendingUp className="w-3 h-3 mr-1" /> Meta Atingida
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taxa de Ruptura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black text-slate-900 tabular-nums">
                  {loading ? '...' : `${stats.ruptureRate.toFixed(1)}%`}
                </div>
                <div className="flex items-center text-blue-600 text-xs font-bold">
                  <TrendingDown className="w-3 h-3 mr-1" /> Sob Controle
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de Visitas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black text-slate-900 tabular-nums">
                  {loading ? '...' : stats.totalVisits.toLocaleString('pt-BR')}
                </div>
                <div className="flex items-center text-blue-600 text-xs font-bold">
                  <Calendar className="w-3 h-3 mr-1" /> Mês Atual
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/30 gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Filtrar por indústria..." 
                className="pl-10 h-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="font-bold w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" /> Exportar Todos
            </Button>
          </div>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Indústria</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Referência</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      Carregando relatórios...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredIndustries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    Nenhuma indústria encontrada para gerar relatórios.
                  </TableCell>
                </TableRow>
              ) : (
                filteredIndustries.map((ind) => (
                  <TableRow key={ind.id} className="hover:bg-slate-50 group transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm">
                          <Factory className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-slate-900">{ind.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm font-medium text-slate-600">Janeiro / 2026</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-100 text-green-700 border-none font-bold hover:bg-green-100">Consolidado</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        ABRIR <ChevronRight className="w-4 h-4" />
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
