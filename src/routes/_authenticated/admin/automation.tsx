import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Zap, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Settings2,
  History,
  ExternalLink,
  ShieldCheck,
  Webhook
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { 
  getAutomationSettings, 
  updateAutomationSettings, 
  getWebhookLogs, 
  getCleanupPreview,
  executeManualCleanup 
} from '@/lib/automation.functions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/_authenticated/admin/automation')({
  component: AutomationPage,
});

function AutomationPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const getSettingsFn = useServerFn(getAutomationSettings);
  const updateSettingsFn = useServerFn(updateAutomationSettings);
  const getLogsFn = useServerFn(getWebhookLogs);
  
  const cleanupFn = useServerFn(executeManualCleanup);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsData, logsData] = await Promise.all([
        getSettingsFn(),
        getLogsFn()
      ]);
      setSettings(settingsData || {
        is_active: false,
        retention_days: 90,
        is_configured: false
      });
      setLogs(logsData || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateSettingsFn({ data: settings });
      toast.success("Configurações salvas!");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };


  const getPreviewFn = useServerFn(getCleanupPreview);

  const handleCleanup = async () => {
    try {
      setIsCleaning(true);
      const preview = await getPreviewFn();
      
      const message = `Prévia de Limpeza:\n` +
                      `- Visitas: ${(preview as any).visits}\n` +
                      `- Evidências: ${(preview as any).evidences}\n` +
                      `- Logs: ${(preview as any).logs}\n\n` +
                      `Para confirmar a exclusão destes dados expirados, digite exatamente:\nEXCLUIR DADOS EXPIRADOS`;
      
      const confirmation = prompt(message);
      
      if (confirmation !== 'EXCLUIR DADOS EXPIRADOS') {
        if (confirmation !== null) toast.error("Confirmação incorreta.");
        return;
      }

      await cleanupFn({ data: { confirmation } });
      toast.success("Limpeza executada com sucesso!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCleaning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight text-left">Automação e Integrações</h2>
          <p className="text-sm text-slate-500 text-left">Conecte o sistema ao n8n e gerencie a retenção de dados.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={true}>
            <Zap className="mr-2 h-4 w-4" />
            Testar Webhook
          </Button>
          <Button variant="destructive" onClick={handleCleanup} disabled={isCleaning}>
            {isCleaning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Limpeza Manual
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg text-left">Configuração n8n</CardTitle>
              </div>
              <CardDescription className="text-left">Configure o destino dos eventos e a chave de segurança.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2 text-left">
                    <Label htmlFor="webhook_url" className="text-slate-700">URL do Webhook n8n (Configurado via ENV)</Label>
                    <div className="relative">
                      <Webhook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        id="webhook_url"
                        disabled={true}
                        className="pl-10 bg-slate-100"
                        value={settings.is_configured ? '************' : 'Não configurado'}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-left">
                    <Label htmlFor="secret" className="text-slate-700">Segredo do Webhook (HMAC Secret - ENV)</Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        id="secret"
                        type="password"
                        disabled={true}
                        className="pl-10 bg-slate-100"
                        value={settings.is_configured ? '************' : 'Não configurado'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 text-left">
                      <Label htmlFor="retention" className="text-slate-700">Prazo de Retenção (Dias)</Label>
                      <Input 
                        id="retention"
                        type="number"
                        min="90"
                        value={settings.retention_days}
                        onChange={e => setSettings({...settings, retention_days: Math.max(90, Number(e.target.value))})}
                      />
                    </div>
                    <div className="flex flex-col justify-end space-y-2 text-left">
                      <Label className="text-slate-700">Integração Ativa</Label>
                      <div className="flex items-center space-x-2 h-10">
                        <Switch 
                          checked={settings.is_active}
                          onCheckedChange={val => setSettings({...settings, is_active: val})}
                        />
                        <span className="text-sm font-medium text-slate-600">
                          {settings.is_active ? 'Sim' : 'Não'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Configurações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg text-left">Diretrizes de Segurança</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 text-left space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  <strong>Importante:</strong> Mídias (fotos, vídeos, PDFs) nunca são enviadas ao n8n. O sistema envia apenas metadados e IDs para preservar a privacidade e segurança dos dados.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-3 list-disc pl-4 font-medium">
                <li>A URL do n8n e o Segredo HMAC devem ser configurados via variáveis de ambiente (N8N_WEBHOOK_URL, N8N_HMAC_SECRET).</li>
                <li>Cada webhook é assinado com HMAC-SHA256 e timestamp para evitar ataques de repetição.</li>
                <li>A retenção mínima é de 90 dias conforme política de compliance.</li>
                <li>A limpeza manual exige confirmação por texto e registra auditoria.</li>
                <li>Os arquivos físicos do storage são excluídos permanentemente na rotina.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b pb-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-lg text-left">Histórico de Webhooks</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchData} className="h-8">
              <RefreshCw className="h-3 w-3 mr-2" /> Atualizar
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-left">Evento</TableHead>
                  <TableHead className="font-bold text-left">Data / Hora</TableHead>
                  <TableHead className="font-bold text-center">Status</TableHead>
                  <TableHead className="font-bold text-left">Payload</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                      Nenhum registro de webhook encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="text-xs">
                      <TableCell className="font-bold text-slate-900">{log.event_type}</TableCell>
                      <TableCell className="text-slate-500">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-center">
                        {log.status_code === 200 || log.status_code === 201 ? (
                          <Badge className="bg-green-100 text-green-700 border-none font-bold">200 OK</Badge>
                        ) : log.error_message ? (
                          <Badge className="bg-red-100 text-red-700 border-none font-bold">ERRO</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 border-none font-bold">{log.status_code || '---'}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 max-w-[200px] truncate">
                        {JSON.stringify(log.payload)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          alert(JSON.stringify(log, null, 2));
                        }}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
