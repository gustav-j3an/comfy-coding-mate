import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { useServerFn } from '@tanstack/react-start';
import { getPromoterAgenda } from '@/lib/execution.functions';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/_authenticated/admin/diagnostico')({
  component: AdminDiagnosticPage,
});

function AdminDiagnosticPage() {
  const { user } = useAuth();
  const [promoterEmail, setPromoterEmail] = useState('gustavo@example.com'); // Default example
  const [date, setDate] = useState('2026-08-24');
  const [searchTrigger, setSearchTrigger] = useState(0);

  const fetchAgenda = useServerFn(getPromoterAgenda);

  const { data: diagnosticData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-diagnostic', promoterEmail, date, searchTrigger],
    queryFn: async () => {
      // 1. Resolve promoter by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, promoter_id')
        .eq('email', promoterEmail)
        .maybeSingle();

      if (userError) throw userError;
      if (!userData) throw new Error("Usuário não encontrado");

      const promoterId = userData.promoter_id;
      if (!promoterId) throw new Error("Usuário não é um promotor");

      // 2. Call the real server function
      const agenda = await fetchAgenda({
        data: {
          date,
          promoterId
        }
      });

      // 3. Fetch raw debug info
      const { data: routes } = await supabase
        .from('routes')
        .select(`
          id, name, status, active, valid_from, promoter_id,
          route_stops (
            id, store_id, day_of_week, visit_order, frequency, biweekly_start_date
          )
        `)
        .eq('promoter_id', promoterId);

      return {
        profile: userData,
        agenda,
        routes: routes || [],
        serverTime: new Date().toISOString(),
        buildDate: '2026-08-23 23:50 UTC'
      };
    },
    enabled: searchTrigger > 0
  });

  const handleSearch = () => setSearchTrigger(prev => prev + 1);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diagnóstico de Agenda do Promotor</h1>
          <p className="text-slate-500">Ferramenta administrativa para depuração de rotas</p>
        </div>
        <Badge variant="outline" className="bg-slate-100">Versão: {diagnosticData?.buildDate || 'Loading...'}</Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="email">Email do Promotor</Label>
              <Input 
                id="email" 
                value={promoterEmail} 
                onChange={e => setPromoterEmail(e.target.value)} 
                placeholder="ex: gustavo@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data da Agenda</Label>
              <Input 
                id="date" 
                type="date"
                value={date} 
                onChange={e => setDate(e.target.value)} 
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading} className="bg-blue-600">
              <Search className="w-4 h-4 mr-2" />
              {isLoading ? "Diagnosticando..." : "Executar Diagnóstico"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p>{(error as Error).message}</p>
        </div>
      )}

      {diagnosticData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase text-slate-500">Informações do Usuário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nome:</span>
                  <span className="font-medium">{diagnosticData.profile.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Profile ID:</span>
                  <code className="bg-slate-100 px-1 rounded">{diagnosticData.profile.id}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Promoter ID:</span>
                  <code className="bg-slate-100 px-1 rounded">{diagnosticData.profile.promoter_id}</code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase text-slate-500">Estado do Servidor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Data Solicitada:</span>
                  <span className="font-medium">{format(new Date(date + 'T12:00:00Z'), "EEEE, d/MM/yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dia da Semana (JS):</span>
                  <span className="font-medium">{new Date(date + 'T12:00:00Z').getDay()} (1 = Segunda)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hora do Servidor:</span>
                  <span className="font-medium">{diagnosticData.serverTime}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Roteiros Encontrados ({diagnosticData.routes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {diagnosticData.routes.map((route: any) => (
                  <div key={route.id} className="border rounded-lg p-4 bg-slate-50/50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900">{route.name}</h4>
                        <p className="text-xs text-slate-500">ID: {route.id}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={route.active ? "default" : "secondary"}>
                          {route.active ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant={route.status === 'published' ? "default" : "outline"} className={route.status === 'published' ? "bg-green-600" : ""}>
                          {route.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs space-y-1">
                      <p><span className="text-slate-500">Vigência Inicial:</span> {route.valid_from}</p>
                      <p><span className="text-slate-500">Paradas Totais:</span> {route.route_stops?.length || 0}</p>
                      <p><span className="text-slate-500">Paradas para Segunda (1):</span> {route.route_stops?.filter((s: any) => Number(s.day_of_week) === 1).length || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Resultado Final (getPromoterAgenda)</CardTitle>
              <Badge className="bg-blue-600">{diagnosticData.agenda.length} itens</Badge>
            </CardHeader>
            <CardContent>
              {diagnosticData.agenda.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed rounded-xl">
                  <Info className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-slate-500 font-medium">Nenhum resultado retornado pela função.</p>
                  <p className="text-xs text-slate-400">Verifique se o roteiro está como 'published', 'active' e se a data está dentro da vigência.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {diagnosticData.agenda.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{item.store?.name}</p>
                        <p className="text-xs text-slate-500">{item.industry?.name} • Ordem: {item.visit_order}</p>
                      </div>
                      <Badge variant="outline" className={item.is_theoretical ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-green-50 text-green-600 border-green-200"}>
                        {item.is_theoretical ? "Teórica" : "Materializada"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
