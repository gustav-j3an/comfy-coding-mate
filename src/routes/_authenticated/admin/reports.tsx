import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Download, 
  ChevronRight, Calendar, BarChart3,
  TrendingUp, TrendingDown, Factory, Loader2,
  FileText, Plus, Eye, Send, Package
} from 'lucide-react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { getReports, createReportSnapshot, publishReport } from '@/lib/reports.functions';
import { useServerFn } from '@tanstack/react-start';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/admin/reports')({
  component: ReportsPage,
});

function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [newReport, setNewReport] = useState({
    industryId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const fetchReportsFn = useServerFn(getReports);
  const createReportFn = useServerFn(createReportSnapshot);
  const publishReportFn = useServerFn(publishReport);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, industriesRes] = await Promise.all([
        fetchReportsFn(),
        supabase.from('industries').select('id, name').eq('active', true)
      ]);
      setReports(reportsData || []);
      setIndustries(industriesRes.data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (report: any) => {
    const url = `/api/reports/pdf?industryId=${report.industry_id}&month=${report.month}&year=${report.year}`;
    window.open(url, '_blank');
  };

  const handleCreateReport = async () => {

    if (!newReport.industryId) {
      toast.error('Selecione uma indústria');
      return;
    }
    setCreating(true);
    try {
      await createReportFn({ data: newReport });
      toast.success('Relatório gerado com sucesso!');
      setIsCreateOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Erro ao gerar relatório: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (reportId: string) => {
    try {
      await publishReportFn({ data: { reportId } });
      toast.success('Relatório publicado para a indústria!');
      loadData();
    } catch (error: any) {
      toast.error('Erro ao publicar: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'publicado':
        return <Badge className="bg-green-100 text-green-700 border-none font-bold">Publicado</Badge>;
      case 'em_montagem':
        return <Badge className="bg-blue-100 text-blue-700 border-none font-bold">Em Montagem</Badge>;
      case 'pronto_revisao':
        return <Badge className="bg-yellow-100 text-yellow-700 border-none font-bold">Revisão</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredReports = reports.filter(rep => 
    rep.industry?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2024, i, 1), 'MMMM', { locale: ptBR })
  }));

  const years = [new Date().getFullYear(), new Date().getFullYear() - 1];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Relatórios Mensais</h2>
          <p className="text-sm text-slate-500">BI e consolidado executivo por indústria</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/exports">
            <Button variant="outline" className="font-bold border-slate-200">
              <Package className="mr-2 h-4 w-4" /> Exportações
            </Button>
          </Link>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold">
                <Plus className="mr-2 h-4 w-4" /> Novo Relatório
              </Button>
            </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Novo Relatório</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Indústria</label>
                <Select onValueChange={(val) => setNewReport(prev => ({ ...prev, industryId: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a indústria" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map(ind => (
                      <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mês</label>
                  <Select 
                    defaultValue={newReport.month.toString()}
                    onValueChange={(val) => setNewReport(prev => ({ ...prev, month: parseInt(val) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => (
                        <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ano</label>
                  <Select 
                    defaultValue={newReport.year.toString()}
                    onValueChange={(val) => setNewReport(prev => ({ ...prev, year: parseInt(val) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button 
                className="bg-blue-600" 
                onClick={handleCreateReport}
                disabled={creating}
              >
                {creating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                Gerar Snapshot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/30 gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Filtrar indústria..." 
                className="pl-10 h-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Indústria</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Competência</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Execução</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
                <TableHead className="w-[200px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                  </TableCell>
                </TableRow>
              ) : filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    Nenhum relatório encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((rep) => (
                  <TableRow key={rep.id} className="hover:bg-slate-50 group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 border">
                          <Factory className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-slate-900">{rep.industry?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium text-slate-600">
                      {months.find(m => m.value === rep.month)?.label} / {rep.year}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-slate-900">
                          {rep.total_visits_planned > 0 
                            ? Math.round((rep.total_visits_sent / rep.total_visits_planned) * 100) 
                            : 0}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {rep.total_visits_sent}/{rep.total_visits_planned} visitas
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(rep.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {rep.status === 'em_montagem' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-700 font-bold"
                            onClick={() => handlePublish(rep.id)}
                          >
                            <Send className="h-4 w-4 mr-1" /> Publicar
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-slate-400">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-400"
                          onClick={() => handleDownloadPDF(rep)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
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
