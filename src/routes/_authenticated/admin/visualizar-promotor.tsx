import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, User, AlertCircle, Info, MapPin, Calendar, Clock, CheckCircle2, Archive, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getPromoterItineraryData } from '@/lib/routes.functions';
import { useServerFn } from '@tanstack/react-start';


export const Route = createFileRoute('/_authenticated/admin/visualizar-promotor')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      promoterId: (search['promoterId'] as string) || '',
    };
  },
  component: VisualizarPromotorPage,
});

function VisualizarPromotorPage() {
  const { promoterId } = Route.useSearch() as { promoterId: string };
  const { role } = useAuth();
  const navigate = useNavigate();

  const { data: promoter, isLoading, error } = useSuspenseQuery({
    queryKey: ['admin-preview-promoter', promoterId],
    queryFn: async () => {
      // 1. Validar Admin no servidor (via RPC ou checagem direta se necessário, mas aqui faremos no handler)
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: (await supabase.auth.getUser()).data.user?.id as any,
        _role: 'admin'
      });

      if (!isAdmin) {
        throw new Error('Não autorizado: Acesso restrito a administradores.');
      }

      if (!promoterId) {
        throw new Error('ID do promotor não fornecido.');
      }

      // 2. Validar existência e status do promotor
      const { data, error } = await supabase
        .from('promoters')
        .select('*')
        .eq('id', promoterId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Promotor não encontrado.');
      if (!data.active) throw new Error('Este promotor está inativo.');

      return data;
    }
  });

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900">Acesso Negado</h1>
        <p className="text-slate-600 mt-2">Esta página é restrita a administradores.</p>
        <Button className="mt-6" onClick={() => navigate({ to: '/' })}>
          Voltar para Início
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900">Erro de Validação</h1>
        <p className="text-slate-600 mt-2">{(error as Error).message}</p>
        <Button className="mt-6" onClick={() => navigate({ to: '/admin/routes' })}>
          Voltar para Rotas
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="font-bold text-slate-600"
            onClick={() => navigate({ to: '/admin/routes' })}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Rotas e Roteiros
          </Button>
          <Badge className="bg-blue-100 text-blue-700 border-none px-3 py-1 font-bold">
            MODO VISUALIZADOR ADMIN
          </Badge>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="bg-white border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <User className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900">
                  {promoter?.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold">
                    Ativo
                  </Badge>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    ID: {promoter?.id.split('-')[0]}...
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 text-center bg-white rounded-b-xl">
            <div className="py-12 flex flex-col items-center">
              <div className="bg-amber-50 p-6 rounded-2xl border-2 border-dashed border-amber-200 inline-block">
                <Info className="h-10 w-10 text-amber-500 mb-3 mx-auto" />
                <h3 className="text-lg font-bold text-amber-800">Visualizador em preparação</h3>
                <p className="text-amber-700 mt-2 max-w-sm font-medium">
                  A agenda semanal será adicionada na próxima missão. Aqui você poderá simular a visão do promotor sem afetar a conta real.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
