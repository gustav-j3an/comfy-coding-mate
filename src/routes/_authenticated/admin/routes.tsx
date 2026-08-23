import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Plus, Search, Filter, MoreVertical, 
  MapPin, Calendar, Clock, ArrowRight,
  User, CheckCircle2, AlertCircle, Eye
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/routes')({
  component: RoutesPage,
});

interface RouteItem {
  id: string;
  name: string;
  promoter_id: string;
  promoter_name?: string;
  active: boolean | null;
  version: number | null;
  valid_from: string | null;
  stop_count?: number;
}

function RoutesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [promoters, setPromoters] = useState<any[]>([]);
  const [selectedPromoterId, setSelectedPromoterId] = useState<string>('');
  const [selectedPromoterName, setSelectedPromoterName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { role, setPreviewPromoter, previewPromoter } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: routesData, error: routesError } = await supabase
        .from('routes')
        .select('*, route_stops(id)')
        .order('created_at', { ascending: false });

      if (routesError) {
        console.error('Error fetching routes:', routesError);
        throw routesError;
      }

      const { data: promotersData } = await supabase
        .from('promoters')
        .select('*');

      setPromoters(promotersData || []);

      const mappedRoutes: RouteItem[] = (routesData || []).map(r => ({
        ...r,
        promoter_name: promotersData?.find((p: any) => p.id === r.promoter_id)?.name || 'Desconhecido',
        stop_count: (r as any).route_stops?.length || 0,
        status: (r as any).status || 'draft',
        version: (r as any).version || 1
      }));

      setRoutes(mappedRoutes);
    } catch (error: any) {
      console.error('Fetch data error:', error);
      toast.error('Erro ao carregar roteiros: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoute = () => {
    if (!selectedPromoterId) {
      toast.error('Selecione um promotor primeiro');
      return;
    }
    navigate({ to: `/admin/routes_new`, search: { promoterId: selectedPromoterId } as any });
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Rotas e Roteiros</h2>
          <p className="text-sm text-slate-500">Planejamento logístico e paradas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPromoterId} onValueChange={setSelectedPromoterId}>
            <SelectTrigger className="w-56 bg-slate-50">
              <SelectValue placeholder="Selecione um promotor" />
            </SelectTrigger>
            <SelectContent>
              {promoters.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleCreateRoute}
            disabled={!selectedPromoterId}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
          >
            <Plus className="mr-2 h-4 w-4" /> Criar Rota
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome da rota ou promotor..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
             <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filtros
              </Button>
              <Button variant="ghost" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold">
                <Eye className="h-4 w-4" /> Visualizar como Promotor
              </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-slate-100 rounded-t-xl" />
                <CardContent className="h-32 bg-slate-50 rounded-b-xl" />
              </Card>
            ))
          ) : routes.length === 0 ? (
            <div className="col-span-full h-48 flex flex-col items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
              <MapPin className="h-10 w-10 mb-2 opacity-20" />
              <p>Nenhuma rota cadastrada ainda.</p>
            </div>
          ) : (
            routes.map((route) => (
              <Card key={route.id} className="hover:shadow-md transition-shadow overflow-hidden border-slate-200">
                <CardHeader className="pb-3 bg-slate-50/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant={(route as any).status === 'published' ? 'default' : 'secondary'} className={cn(
                        "mb-2",
                        (route as any).status === 'published' ? "bg-green-600 hover:bg-green-700" : ""
                      )}>
                        {(route as any).status === 'published' ? 'Publicado' : 'Rascunho'}
                      </Badge>
                      <CardTitle className="text-lg text-slate-900">{route.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1 font-bold">
                        <User className="h-3 w-3" />
                        {route.promoter_name}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Versão Atual</p>
                      <p className="text-sm font-black text-slate-900">v{route.version || 1}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Paradas / Lojas</p>
                      <p className="text-sm font-black text-slate-900">{route.stop_count} lojas</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-[9px] text-blue-600/70 font-bold uppercase">Vigência a partir de</p>
                      <p className="text-xs font-bold text-blue-900">
                        {route.valid_from ? new Date(route.valid_from).toLocaleDateString() : 'Imediata'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-blue-300" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                      <Clock className="h-3 w-3" />
                      Alterado em {new Date().toLocaleDateString()}
                    </div>
                    <Button variant="link" className="p-0 h-auto text-blue-600 font-black text-xs hover:no-underline">
                      EDITAR ROTEIRO
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
