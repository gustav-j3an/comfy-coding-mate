import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '@/lib/audit.functions';
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Shield, 
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute('/_authenticated/admin/audit')({
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-audit-logs', page, searchTerm, moduleFilter, actionFilter, resultFilter],
    queryFn: () => getAuditLogs({
      data: {
        page,
        pageSize: 20,
        filters: {
          search: searchTerm || undefined,
          module: moduleFilter === 'all' ? undefined : moduleFilter,
          action: actionFilter === 'all' ? undefined : actionFilter,
          result: resultFilter === 'all' ? undefined : resultFilter,
        }
      }
    })
  });

  const getModuleBadge = (module: string) => {
    switch (module) {
      case 'visits': return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Visitas</Badge>;
      case 'billing': return <Badge variant="secondary" className="bg-purple-100 text-purple-700">Cobrança</Badge>;
      case 'users': return <Badge variant="secondary" className="bg-green-100 text-green-700">Usuários</Badge>;
      case 'automation': return <Badge variant="secondary" className="bg-orange-100 text-orange-700">Automação</Badge>;
      default: return <Badge variant="outline">{module}</Badge>;
    }
  };

  const getResultBadge = (result: string) => {
    return result === 'success' 
      ? <Badge className="bg-green-500 text-white">Sucesso</Badge> 
      : <Badge variant="destructive">Falha</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            Auditoria Administrativa
          </h1>
          <p className="text-slate-500">Rastreabilidade completa de ações críticas no sistema.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar por ID, e-mail ou resumo..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Módulos</SelectItem>
                <SelectItem value="visits">Visitas</SelectItem>
                <SelectItem value="billing">Cobrança</SelectItem>
                <SelectItem value="users">Usuários</SelectItem>
                <SelectItem value="automation">Automação</SelectItem>
              </SelectContent>
            </Select>

            <Select value={resultFilter} onValueChange={(v) => { setResultFilter(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Resultados</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="failure">Falha</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setModuleFilter('all');
              setResultFilter('all');
              setPage(1);
            }}>
              Limpar Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-20">
              <Shield className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
              <h3 className="font-bold text-slate-900">Erro ao carregar logs</h3>
              <p className="text-slate-500">Não foi possível recuperar os dados de auditoria.</p>
            </div>
          ) : data?.logs?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <Info className="h-10 w-10 text-slate-300 mb-4" />
              <h3 className="font-bold text-slate-900">Nenhum log encontrado</h3>
              <p className="text-slate-500">Tente ajustar seus filtros de busca.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[180px]">Data e Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Resumo</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.logs.map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-xs font-medium text-slate-500 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(log.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(log.created_at), "HH:mm:ss")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            {log.user_email || 'Sistema'}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                            {log.user_role}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getModuleBadge(log.module)}</TableCell>
                      <TableCell className="font-medium text-xs text-slate-600">
                        {log.action.replace(/_/g, ' ').toUpperCase()}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="text-sm text-slate-600 truncate" title={log.summary}>
                          {log.summary}
                        </p>
                        {log.entity_id && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {log.entity_id}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getResultBadge(log.result)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                <p className="text-sm text-slate-500 font-medium">
                  Total: <span className="text-slate-900">{data?.totalCount}</span> registros
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                  </Button>
                  <div className="text-sm font-bold px-3">
                    Página {page}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page * 20 >= (data?.totalCount || 0)}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Próxima <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
