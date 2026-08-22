import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Download, Loader2, 
  FileSpreadsheet, FileArchive, 
  History, Clock, CheckCircle2, AlertCircle,
  ExternalLink
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
import { useServerFn } from '@tanstack/react-start';
import { createExportTask, getExportTasks, getDownloadUrl } from '@/lib/exports.functions';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/admin/exports')({
  component: ExportsPage,
});

function ExportsPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  const [requesting, setRequesting] = useState(false);
  
  const createExportFn = useServerFn(createExportTask);
  const fetchTasksFn = useServerFn(getExportTasks);
  const getDownloadUrlFn = useServerFn(getDownloadUrl);

  useEffect(() => {
    loadData();
    // Refresh tasks every 30 seconds if any are pending
    const interval = setInterval(() => {
      const hasPending = tasks.some(t => ['solicitada', 'processando'].includes(t.status));
      if (hasPending) {
        loadTasks();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [tasks]);

  const loadData = async () => {
    try {
      setLoading(true);
      const industriesRes = await supabase.from('industries').select('id, name').eq('active', true);
      setIndustries(industriesRes.data || []);
      await loadTasks();
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const tasksData = await fetchTasksFn();
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleRequestExport = async (format: 'xlsx' | 'zip') => {
    setRequesting(true);
    try {
      await createExportFn({ 
        data: { 
          format, 
          filters: {} 
        } 
      });
      toast.success('Exportação solicitada com sucesso!');
      loadTasks();
    } catch (error: any) {
      toast.error('Erro ao solicitar: ' + error.message);
    } finally {
      setRequesting(false);
    }
  };

  const handleDownload = async (taskId: string) => {
    try {
      const url = await getDownloadUrlFn({ data: { taskId } });
      window.open(url, '_blank');
      toast.success('Download iniciado!');
      loadTasks();
    } catch (error: any) {
      toast.error('Erro ao obter link: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pronta':
        return <Badge className="bg-green-100 text-green-700 border-none font-bold"><CheckCircle2 className="w-3 h-3 mr-1" /> Pronta</Badge>;
      case 'solicitada':
        return <Badge className="bg-blue-100 text-blue-700 border-none font-bold"><Clock className="w-3 h-3 mr-1" /> Solicitada</Badge>;
      case 'processando':
        return <Badge className="bg-yellow-100 text-yellow-700 border-none font-bold"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processando</Badge>;
      case 'falhou':
        return <Badge className="bg-red-100 text-red-700 border-none font-bold"><AlertCircle className="w-3 h-3 mr-1" /> Falhou</Badge>;
      case 'expirada':
        return <Badge variant="outline" className="text-slate-400">Expirada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Exportações e Backup</h2>
          <p className="text-sm text-slate-500">Baixe dados estruturados e evidências fotográficas</p>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-100 bg-blue-50/30 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileSpreadsheet size={80} className="text-blue-600" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <FileSpreadsheet className="mr-2 h-5 w-5 text-blue-600" /> 
                Exportar Dados (XLSX)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Gera uma planilha consolidada com todas as visitas, roteiros e ocorrências registradas no sistema.
              </p>
              <Button 
                onClick={() => handleRequestExport('xlsx')}
                disabled={requesting}
                className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
              >
                {requesting ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2 h-4 w-4" />}
                Solicitar Nova Planilha
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-purple-100 bg-purple-50/30 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileArchive size={80} className="text-purple-600" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center text-purple-900">
                <FileArchive className="mr-2 h-5 w-5 text-purple-600" /> 
                Pacote de Evidências (ZIP)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Compacta todas as fotos de visitas e evidências de ruptura em um único arquivo ZIP organizado por data e loja.
              </p>
              <Button 
                onClick={() => handleRequestExport('zip')}
                disabled={requesting}
                className="w-full bg-purple-600 hover:bg-purple-700 font-bold"
              >
                {requesting ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2 h-4 w-4" />}
                Solicitar Pacote de Fotos
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center">
              <History className="mr-2 h-5 w-5 text-slate-500" />
              Histórico de Solicitações
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={loadTasks} className="text-slate-500">
              Atualizar
            </Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Arquivo</TableHead>
                  <TableHead className="font-bold text-slate-700">Solicitado em</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">Downloads</TableHead>
                  <TableHead className="w-[150px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                    </TableCell>
                  </TableRow>
                ) : tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-slate-500 italic">
                      Nenhuma exportação solicitada recentemente.
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.id} className="hover:bg-slate-50 group transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                            task.format === 'xlsx' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                          }`}>
                            {task.format === 'xlsx' ? <FileSpreadsheet className="h-5 w-5" /> : <FileArchive className="h-5 w-5" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {task.format === 'xlsx' ? 'Relatório Excel' : 'Pacote ZIP'}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-medium">
                              Ref: {task.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium text-sm">
                        {format(new Date(task.created_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(task.status)}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-700 text-sm">
                        {task.download_count || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end">
                          {task.status === 'pronta' ? (
                            <Button 
                              size="sm" 
                              className="bg-slate-900 hover:bg-slate-800 font-bold"
                              onClick={() => handleDownload(task.id)}
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                              Baixar
                            </Button>
                          ) : task.status === 'falhou' ? (
                            <span className="text-xs text-red-500 font-medium px-3 py-1 bg-red-50 rounded-full">Erro no processamento</span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Aguardando...</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3 text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold mb-1">Políticas de Retenção</p>
            <ul className="list-disc list-inside space-y-1 opacity-90">
              <li>Arquivos gerados ficam disponíveis para download por <strong>7 dias</strong>.</li>
              <li>Após este período, o arquivo é removido para garantir a segurança e economia de espaço.</li>
              <li>Fotos e dados originais continuam no sistema por até 90 dias conforme a política padrão.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
