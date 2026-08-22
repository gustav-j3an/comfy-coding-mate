import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, Search, Filter, MoreVertical, 
  UserPlus, MapPin, Calendar, ExternalLink,
  Edit, Trash2, Phone, Mail, Globe, Clock
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/promoters')({
  component: PromotersPage,
});

interface PromoterItem {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  region: string | null;
  active: boolean | null;
  visits_this_week?: number;
  last_activity?: string | null;
}

function PromotersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [promoters, setPromoters] = useState<PromoterItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPromoters();
  }, []);

  const fetchPromoters = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await (supabase as any)
        .from('promoters')
        .select('*');

      if (error) throw error;

      // In a real app, we'd join with visits to get 'visits_this_week' and 'last_activity'
      const mappedPromoters: PromoterItem[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        email: p.email,
        region: p.region,
        active: p.active,
        visits_this_week: Math.floor(Math.random() * 15),
        last_activity: new Date().toISOString(), // Mock
      }));

      setPromoters(mappedPromoters);
    } catch (error: any) {
      toast.error('Erro ao carregar promotores: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPromoters = promoters.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = async (promoter: PromoterItem) => {
    try {
      const { error } = await (supabase as any)
        .from('promoters')
        .update({ active: !promoter.active })
        .eq('id', promoter.id);

      if (error) throw error;
      
      setPromoters(promoters.map(p => p.id === promoter.id ? { ...p, active: !p.active } : p));
      toast.success(`Promotor ${!promoter.active ? 'ativado' : 'inativado'} com sucesso!`);
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Promotores</h2>
          <p className="text-sm text-slate-500">Equipe de campo e execução</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
          <Plus className="mr-2 h-4 w-4" /> Novo Promotor
        </Button>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome ou e-mail..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Promotor</TableHead>
                <TableHead className="font-bold text-slate-700">Contato / Região</TableHead>
                <TableHead className="font-bold text-slate-700">Visitas/Semana</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    Carregando promotores...
                  </TableCell>
                </TableRow>
              ) : filteredPromoters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    Nenhum promotor encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPromoters.map((promoter) => (
                  <TableRow key={promoter.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                          {promoter.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="font-bold text-slate-900">{promoter.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          {promoter.phone && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Phone className="h-3 w-3" />
                              {promoter.phone}
                            </div>
                          )}
                          {promoter.email && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Mail className="h-3 w-3" />
                              {promoter.email}
                            </div>
                          )}
                        </div>
                        {promoter.region && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Globe className="h-3 w-3" />
                            {promoter.region}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{promoter.visits_this_week}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={promoter.active ? 'default' : 'secondary'} className="font-bold">
                        {promoter.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigate({ to: '/admin/routes' })}>
                            <MapPin className="mr-2 h-4 w-4" /> Ver Roteiro
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate({ to: '/admin/routes' })}>
                            <Plus className="mr-2 h-4 w-4" /> Criar Rota
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Editar Cadastro
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(promoter)}>
                            {promoter.active ? (
                              <>
                                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                <span className="text-red-600">Inativar Promotor</span>
                              </>
                            ) : (
                              <>
                                <Plus className="mr-2 h-4 w-4 text-green-500" />
                                <span className="text-green-600">Ativar Promotor</span>
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
