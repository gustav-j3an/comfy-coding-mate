import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getDiagnosticStatus } from '@/lib/diagnostics.functions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Database, Cloud, HardDrive, RefreshCcw } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/admin/diagnostics')({
  component: DiagnosticsPage,
});

function StatusIndicator({ status, message }: { status: string; message: string | null | undefined }) {
  if (status === 'ok') {
    return (
      <div className="flex items-center gap-2 text-green-500">
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-medium text-sm">Operacional</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-destructive">
        <XCircle className="h-5 w-5" />
        <span className="font-medium text-sm">{status === 'missing_env' ? 'Configuração Pendente' : 'Falha'}</span>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}

function DiagnosticsPage() {
  const { data: status } = useSuspenseQuery({
    queryKey: ['diagnostics'],
    queryFn: () => getDiagnosticStatus(),
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Diagnóstico do Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral da integridade dos serviços e infraestrutura.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">Supabase (Banco de Dados)</CardTitle>
              <CardDescription>Conexão, RLS e Tabelas de Rotas</CardDescription>
            </div>
            <Database className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <StatusIndicator status={status.supabase.status} message={status.supabase.message} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">Automação n8n</CardTitle>
              <CardDescription>Webhooks e Segredos</CardDescription>
            </div>
            <Cloud className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusIndicator 
              status={status.automation.status} 
              message={status.automation.status === 'missing_env' ? 'N8N_WEBHOOK_URL ou N8N_HMAC_SECRET não definidos' : undefined} 
            />
            {status.automation.last_event && (
              <div className="text-xs text-muted-foreground">
                Última comunicação: {new Date(status.automation.last_event).toLocaleString('pt-BR')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">Storage (Arquivos)</CardTitle>
              <CardDescription>Bucket de Evidências</CardDescription>
            </div>
            <HardDrive className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <StatusIndicator status={status.storage.status} message={status.storage.message} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">Retenção de Dados</CardTitle>
              <CardDescription>Limpeza Automática</CardDescription>
            </div>
            <RefreshCcw className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {status.cleanup.last_run ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium text-sm">Ativo</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Última execução: {new Date(status.cleanup.last_run as string).toLocaleString('pt-BR')}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-500">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium text-sm">Nenhuma execução registrada</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração de Produção</CardTitle>
          <CardDescription>Guia para implantação em ambiente real</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Variáveis de Ambiente Necessárias</h4>
            <div className="grid gap-2 text-sm font-mono bg-muted p-3 rounded-md">
              <div>VITE_SUPABASE_URL</div>
              <div>VITE_SUPABASE_ANON_KEY</div>
              <div>SUPABASE_SERVICE_ROLE_KEY</div>
              <div>N8N_WEBHOOK_URL</div>
              <div>N8N_HMAC_SECRET</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Checklist de Domínio</h4>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Apontar CNAME/A para o servidor de produção</li>
              <li>Configurar "Site URL" no Supabase Auth Settings</li>
              <li>Adicionar domínio às URLs permitidas de redirecionamento</li>
            </ul>
          </div>
          
          <div className="pt-4 border-t">
            <Badge variant="outline" className="text-xs">Versão do App: {status.version}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
