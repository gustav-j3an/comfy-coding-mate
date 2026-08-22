import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LogOut, LayoutDashboard, Image, AlertCircle, 
  FileText, CreditCard, Loader2, BarChart3,
  Calendar, Factory, TrendingUp, Download
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getIndustryReports } from '@/lib/reports.functions';
import { useServerFn } from '@tanstack/react-start';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export const Route = createFileRoute('/_authenticated/industry/')({
  component: IndustryPortal,
});

function IndustryPortal() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  
  const getIndustryReportsFn = useServerFn(getIndustryReports);

  useEffect(() => {
    if (user?.email) {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await getIndustryReportsFn({ data: { industryEmail: user!.email! } });
      setReports(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar relatórios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getMonthLabel = (month: number) => {
    return format(new Date(2024, month - 1, 1), 'MMMM', { locale: ptBR });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-400">Portal Indústria</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Dashboard Executivo</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-800 bg-slate-800">
            <LayoutDashboard className="mr-2 h-4 w-4" /> Relatórios Mensais
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
            <Image className="mr-2 h-4 w-4" /> Evidências
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
            <AlertCircle className="mr-2 h-4 w-4" /> Ocorrências
          </Button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800">Relatórios Publicados</h2>
          <Badge variant="outline" className="font-bold border-blue-200 text-blue-700 bg-blue-50">
            <Factory className="h-3 w-3 mr-1" /> {user?.email}
          </Badge>
        </header>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <Card className="border-dashed border-2 py-12">
              <CardContent className="flex flex-col items-center text-slate-400">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p>Nenhum relatório mensal publicado até o momento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reports.map((report) => (
                <Card key={report.id} className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
                  <CardHeader className="bg-slate-50 border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-black text-slate-900 capitalize">
                          {getMonthLabel(report.month)} {report.year}
                        </CardTitle>
                        <p className="text-xs text-slate-500 flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" /> Publicado em {format(new Date(report.published_at), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <Badge className="bg-green-600 text-white font-bold">Oficial</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Execução</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-blue-900">
                            {report.total_visits_planned > 0 
                              ? Math.round((report.total_visits_sent / report.total_visits_planned) * 100) 
                              : 0}%
                          </span>
                          <TrendingUp className="h-3 w-3 text-blue-600" />
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Ocorrências</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-900">{report.occurrences_count}</span>
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Visitas Aprovadas</span>
                        <span className="font-bold text-slate-900">{report.total_visits_approved}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Lojas Atendidas</span>
                        <span className="font-bold text-slate-900">{report.stores_served} / {report.stores_planned}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 bg-slate-900 hover:bg-black font-bold text-xs uppercase tracking-widest">
                        <BarChart3 className="h-4 w-4 mr-2" /> Abrir BI
                      </Button>
                      <Button variant="outline" className="font-bold text-xs uppercase tracking-widest border-slate-300">
                        <Download className="h-4 w-4 mr-2" /> PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
