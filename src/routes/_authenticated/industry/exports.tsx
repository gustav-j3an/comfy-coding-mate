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
import { useAuth } from '@/lib/auth/auth-context';

export const Route = createFileRoute('/_authenticated/industry/exports')({
  component: IndustryExportsPage,
});

function IndustryExportsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [requesting, setRequesting] = useState(false);
  
  const createExportFn = useServerFn(createExportTask);
  const fetchTasksFn = useServerFn(getExportTasks);
  const getDownloadUrlFn = useServerFn(getDownloadUrl);

  useEffect(() => {
    let interval: any;
    if (profile?.industry_id) {
      loadTasks();
      interval = setInterval(() => {
        const hasPending = tasks.some(t => ['solicitada', 'processando'].includes(t.status));
        if (hasPending) {
          loadTasks();
        }
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [profile?.industry_id, tasks.some(t => ['solicitada', 'processando'].includes(t.status))]);


  const loadTasks = async () => {
    if (!profile?.industry_id) return;
    try {
      if (tasks.length === 0) setLoading(true);
      const tasksData = await fetchTasksFn({ data: { industryId: profile.industry_id } });
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestExport = async (format: 'xlsx' | 'zip') => {
    if (!profile?.industry_id) return;
    setRequesting(true);
    try {
      await createExportFn({ 
        data: { 
          format, 
          filters: { industryId: profile.industry_id },
          industryId: profile.industry_id
        } 
      });
      toast.success('Exportação solicitada! O processamento pode levar alguns minutos.');
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
        return <Badge className="bg-blue-100 text-blue-700 border-none font-bold"><Clock className="w-3 h-3 mr-1" /> Fila</Badge>;
      case 'processando':
        return <Badge className="bg-yellow-100 text-yellow-700 border-none font-bold"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Gerando</Badge>;
      case 'falhou':
        return <Badge className="bg-red-100 text-red-700 border-none font-bold"><AlertCircle className="w-3 h-3 mr-1" /> Erro</Badge>;
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Exportações da Indústria</h2>
          <p className="text-sm text-slate-500">Extraia seus dados de execução e evidências</p>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-slate-900 text-lg">
                <FileSpreadsheet className="mr-2 h-5 w-5 text-green-600" /> 
                Dados de Execução (Excel)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-6">
                Planilha completa com visitas, status, horários e ocorrências da sua indústria.
              </p>
              <Button 
                onClick={() => handleRequestExport('xlsx')}
                disabled={requesting}
                className="w-full bg-slate-900 hover:bg-slate-800 font-bold"
              >
                {requesting ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2 h-4 w-4" />}
                Gerar Planilha Mensal
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-slate-900 text-lg">
                <FileArchive className="mr-2 h-5 w-5 text-blue-600" /> 
                Pacote de Fotos (ZIP)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-6">
                Todas as fotos de evidências enviadas pelos promotores no período, organizadas.
              </p>
              <Button 
                onClick={() => handleRequestExport('zip')}
                disabled={requesting}
                className="w-full bg-slate-900 hover:bg-slate-800 font-bold"
              >
                {requesting ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2 h-4 w-4" />}
                Gerar Pacote de Fotos
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-white border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center">
              <History className="mr-2 h-5 w-5 text-slate-500" />
              Minhas Exportações
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={loadTasks} className="text-slate-500">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Formato</TableHead>
                <TableHead className="font-bold text-slate-700">Solicitado em</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500 italic">
                    Você ainda não solicitou exportações.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {task.format === 'xlsx' ? 
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">XLSX</Badge> : 
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">ZIP</Badge>
                        }
                        <span className="text-xs text-slate-500">#{task.id.slice(0,6)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {format(new Date(task.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(task.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {task.status === 'pronta' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 border-slate-300 font-bold hover:bg-slate-100"
                            onClick={() => handleDownload(task.id)}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" /> Baixar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-xs text-slate-600">
          <p className="font-bold mb-2 flex items-center">
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-slate-500" /> Observação Importante:
          </p>
          <p>
            As exportações são processadas em segundo plano. Arquivos grandes podem levar alguns minutos para ficarem prontos. 
            Os links expiram automaticamente após 7 dias por motivos de segurança.
          </p>
        </div>
      </div>
    </div>
  );
}

import { RefreshCw } from 'lucide-react';
