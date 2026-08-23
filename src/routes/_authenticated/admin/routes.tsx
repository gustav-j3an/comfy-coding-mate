import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Plus, Search, Filter, MoreVertical, 
  MapPin, Calendar, Clock, ArrowRight,
  User, CheckCircle2, AlertCircle, Eye,
  Copy, Edit2, Play, Pause, Trash2, Archive,
  Info
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  duplicateRoute, 
  archiveRoute, 
  toggleRouteActive, 
  deleteRouteSafely 
} from '@/lib/routes.functions';


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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

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

  const handleEditRoute = (routeId: string) => {
    navigate({ to: `/admin/routes_new`, search: { routeId } as any });
  };

  const handleDuplicate = async (routeId: string) => {
    try {
      const res = await duplicateRoute({ data: { routeId } });
      if (res.success) {
        toast.success("Roteiro duplicado com sucesso!");
        fetchData();
      }
    } catch (error: any) {
      toast.error("Erro ao duplicar: " + (error.message || "Erro desconhecido"));
    }
  };

  const handleToggleActive = async (routeId: string, currentActive: boolean) => {
    try {
      const res = await toggleRouteActive({ data: { routeId, active: !currentActive } });
      if (res.success) {
        toast.success(currentActive ? "Roteiro pausado com sucesso" : "Roteiro reativado com sucesso");
        fetchData();
      }
    } catch (error: any) {
      toast.error("Erro ao alterar status: " + (error.message || "Erro desconhecido"));
    }
  };

  const handleArchive = async (routeId: string) => {
    if (!confirm("Tem certeza que deseja arquivar este roteiro? Ele não aparecerá mais na listagem ativa.")) return;
    try {
      const res = await archiveRoute({ data: { routeId } });
      if (res.success) {
        toast.success("Roteiro arquivado com sucesso");
        fetchData();
      }
    } catch (error: any) {
      toast.error("Erro ao arquivar: " + (error.message || "Erro desconhecido"));
    }
  };

  const handleDelete = async () => {
    if (!routeToDelete) return;
    try {
      const res = await deleteRouteSafely({ data: { routeId: routeToDelete } });
      if (res.success) {
        toast.success("Roteiro excluído com sucesso");
        fetchData();
      }
    } catch (error: any) {
      toast.error("Erro ao excluir: " + (error.message || "Tente arquivar em vez de excluir."));
    } finally {
      setDeleteConfirmOpen(false);
      setRouteToDelete(null);
    }
  };



  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Rotas e Roteiros</h2>
          <p className="text-sm text-slate-500 font-medium italic">Gestão e Simulação de Campo</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Select 
            value={selectedPromoterId} 
            onValueChange={(value) => {
              setSelectedPromoterId(value);
              const p = promoters.find(promoter => promoter.id === value);
              if (p) setSelectedPromoterName(p.name);
              // Clear preview if promoter changes
              if (previewPromoter && previewPromoter.id !== value) {
                setPreviewPromoter(null);
              }
            }}
          >
            <SelectTrigger className="w-full sm:w-64 bg-slate-50 border-slate-200 h-11 font-bold">
              <SelectValue placeholder="Selecione um promotor" />
            </SelectTrigger>
            <SelectContent className="font-sans font-bold">
              {promoters.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleCreateRoute}
            disabled={!selectedPromoterId}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 w-full sm:w-auto h-11 font-bold"
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
              <Button 
                variant="ghost" 
                className={cn(
                  "flex items-center gap-2 font-bold transition-all",
                  selectedPromoterId ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" : "text-slate-300"
                )}
                disabled={!selectedPromoterId}
                onClick={() => {
                  if (!selectedPromoterId) {
                    toast.error("Selecione um promotor para visualizar");
                    return;
                  }
                  navigate({ 
                    to: '/admin/visualizar-promotor', 
                    search: { promoterId: selectedPromoterId } as any 
                  });
                }}
              >
                <Eye className="h-4 w-4" /> Visualizar roteiro do promotor
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
            routes
              .filter(r => !selectedPromoterId || r.promoter_id === selectedPromoterId)
              .filter(r => 
                r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                r.promoter_name?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((route) => (
              <Card key={route.id} className={cn(
                "hover:shadow-md transition-shadow overflow-hidden border-slate-200",
                route.active === false ? "opacity-75 grayscale-[0.5]" : ""
              )}>
                <CardHeader className="pb-3 bg-slate-50/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={(route as any).status === 'published' ? 'default' : 'secondary'} className={cn(
                          (route as any).status === 'published' ? "bg-green-600 hover:bg-green-700" : ""
                        )}>
                          {(route as any).status === 'published' ? 'Publicado' : 'Rascunho'}
                        </Badge>
                        {route.active === false && (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Pausado</Badge>
                        )}
                        {(route as any).status === 'archived' && (
                          <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50">Arquivado</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg text-slate-900">{route.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1 font-bold">
                        <User className="h-3 w-3" />
                        {route.promoter_name}
                      </CardDescription>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-slate-200 rounded-full h-8 w-8">
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 font-bold">
                        <DropdownMenuItem onClick={() => handleEditRoute(route.id)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Editar Roteiro
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(route.id)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicar Roteiro
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(route.id, !!route.active)}>
                          {route.active ? (
                            <>
                              <Pause className="mr-2 h-4 w-4 text-amber-500" /> Pausar Roteiro
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4 text-green-500" /> Reativar Roteiro
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleArchive(route.id)}>
                          <Archive className="mr-2 h-4 w-4 text-slate-500" /> Arquivar Roteiro
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => {
                            setRouteToDelete(route.id);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir Roteiro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-600 font-black text-xs hover:no-underline"
                      onClick={() => handleEditRoute(route.id)}
                    >
                      EDITAR ROTEIRO
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium">
              Deseja realmente excluir este roteiro? Esta ação não poderá ser desfeita.
              <br /><br />
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <Info className="h-3 w-3" /> Apenas roteiros sem visitas executadas podem ser excluídos.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 font-bold"
            >
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

