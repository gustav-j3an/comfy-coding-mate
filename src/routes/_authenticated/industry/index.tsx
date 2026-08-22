import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, LayoutDashboard, Image, AlertCircle, FileText, CreditCard, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/industry/')({
  component: IndustryPortal,
});

function IndustryPortal() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    visitsPerformed: 0,
    visitsTotal: 0,
    approved: 0,
    occurrences: 0,
    storesServed: 0
  });

  useEffect(() => {
    if (user) fetchIndustryData();
  }, [user]);

  const fetchIndustryData = async () => {
    try {
      setLoading(true);
      // 1. Get industry_id from profile
      if (!user?.id) return;
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('industry_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.industry_id) throw new Error('Indústria não vinculada ao perfil.');

      const industryId = profile.industry_id;

      // 2. Fetch visits for this industry
      const { data: visits, error: visitsError } = await supabase
        .from('visits')
        .select('id, status, store_id')
        .eq('industry_id', industryId);

      if (visitsError) throw visitsError;

      // 3. Fetch occurrences
      const { count: occurrencesCount, error: occError } = await supabase
        .from('occurrences')
        .select('id', { count: 'exact', head: true })
        .in('visit_id', visits?.map(v => v.id) || []);

      const uniqueStores = new Set(visits?.map(v => v.store_id));

      setStats({
        visitsPerformed: visits?.filter(v => v.status !== 'pending').length || 0,
        visitsTotal: visits?.length || 0,
        approved: visits?.filter(v => v.status === 'approved').length || 0,
        occurrences: occurrencesCount || 0,
        storesServed: uniqueStores.size
      });

    } catch (error: any) {
      toast.error('Erro ao carregar dados da indústria: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-400">Portal Indústria</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Dashboard King</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-800 bg-slate-800">
            <LayoutDashboard className="mr-2 h-4 w-4" /> Visão Geral
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
            <Image className="mr-2 h-4 w-4" /> Galeria de Evidências
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
            <AlertCircle className="mr-2 h-4 w-4" /> Ocorrências
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
            <FileText className="mr-2 h-4 w-4" /> Relatórios
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
            <CreditCard className="mr-2 h-4 w-4" /> Cobrança
          </Button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Dashboard Mensal</h2>
          <Button size="sm" variant="outline">
            Baixar Relatório (PDF)
          </Button>
        </header>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-sm text-slate-500">Visitas Realizadas</p>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">{stats.visitsPerformed} / {stats.visitsTotal}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-sm text-slate-500">Aprovadas</p>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold text-green-600">{stats.approved}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-sm text-slate-500">Ocorrências</p>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold text-red-600">{stats.occurrences}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-sm text-slate-500">Lojas Atendidas</p>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">{stats.storesServed}</CardContent>
                </Card>
              </div>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimas Evidências de Campo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className="aspect-square bg-slate-200 rounded-lg overflow-hidden relative group">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      <Image className="w-8 h-8" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-[10px] transform translate-y-full group-hover:translate-y-0 transition-transform">
                      Atacadão QNL
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
