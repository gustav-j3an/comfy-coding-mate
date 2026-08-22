import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Filter, FileText, Download, 
  ChevronRight, Calendar, BarChart3,
  TrendingUp, TrendingDown, Factory
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
  const [industries, setIndustries] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('industries')
        .select('*');

      if (error) throw error;
      setIndustries(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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
              <CardTitle className="text-xs font-bold text-slate-500 uppercase">Performance Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black text-slate-900">94.8%</div>
                <div className="flex items-center text-green-600 text-xs font-bold">
                  <TrendingUp className="w-3 h-3 mr-1" /> +2.4%
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase">Ruptura Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black text-slate-900">3.2%</div>
                <div className="flex items-center text-red-600 text-xs font-bold">
                  <TrendingDown className="w-3 h-3 mr-1" /> -0.8%
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase">Visitas Realizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black text-slate-900">1,284</div>
                <div className="flex items-center text-blue-600 text-xs font-bold">
                  <Calendar className="w-3 h-3 mr-1" /> Mês Atual
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Filtrar por indústria..." 
                className="pl-10 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="font-bold">
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
                    Carregando relatórios...
                  </TableCell>
                </TableRow>
              ) : industries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    Nenhuma indústria para gerar relatórios.
                  </TableCell>
                </TableRow>
              ) : (
                industries.map((ind) => (
                  <TableRow key={ind.id} className="hover:bg-slate-50 group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm">
                          <Factory className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-slate-900">{ind.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm font-medium text-slate-600">Agosto / 2026</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-100 text-green-700 border-none font-bold">Consolidado</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
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
