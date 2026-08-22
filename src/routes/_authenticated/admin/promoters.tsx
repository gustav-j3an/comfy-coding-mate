import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, Search, Filter, MoreVertical, 
  UserPlus, MapPin, Calendar, ExternalLink,
  Edit, ShieldAlert
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/_authenticated/admin/promoters')({
  component: PromotersPage,
});

interface Promoter {
  id: string;
  full_name: string | null;
  email: string | null;
  status: 'pending' | 'active' | 'blocked';
  last_access: string | null;
  phone?: string;
  region?: string;
  visits_this_week?: number;
}

function PromotersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPromoters();
  }, []);

  const fetchPromoters = async () => {
    try {
      setLoading(true);
      
      // Get all users with 'promoter' role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'promoter');

      if (roleError) throw roleError;

      if (!roleData || roleData.length === 0) {
        setPromoters([]);
        return;
      }

      const userIds = roleData.map(r => r.user_id);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profileError) throw profileError;

      // In a real app, we'd join with visits to get 'visits_this_week'
      // For now, we'll map the profiles
      const mappedPromoters: Promoter[] = (profileData || []).map(p => ({
        ...p,
        status: p.status as any,
        visits_this_week: Math.floor(Math.random() * 15), // Mock for now
      }));

      setPromoters(mappedPromoters);
    } catch (error: any) {
      toast.error('Erro ao carregar promotores: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPromoters = promoters.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Promotores</h2>
          <p className="text-sm text-slate-500">Gerenciamento de equipe de campo</p>
        </div>
        <Button onClick={() => navigate({ to: '/admin/users' })} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
          <UserPlus className="mr-2 h-4 w-4" /> Novo Promotor
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
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="font-bold text-slate-700">Visitas/Semana</TableHead>
                <TableHead className="font-bold text-slate-700">Último Acesso</TableHead>
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
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {promoter.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{promoter.full_name || 'Sem nome'}</p>
                          <p className="text-xs text-slate-500">{promoter.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={promoter.status === 'active' ? 'default' : promoter.status === 'pending' ? 'outline' : 'destructive'} className="capitalize font-bold">
                        {promoter.status === 'active' ? 'Ativo' : promoter.status === 'pending' ? 'Pendente' : 'Bloqueado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{promoter.visits_this_week}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">
                          {promoter.last_access 
                            ? format(new Date(promoter.last_access), "dd/MM 'às' HH:mm", { locale: ptBR }) 
                            : 'Nunca'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigate({ to: `/admin/routes` })}>
                            <MapPin className="mr-2 h-4 w-4" /> Ver Roteiro
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate({ to: `/admin/routes` })}>
                            <Plus className="mr-2 h-4 w-4" /> Criar Rota
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Editar Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <ShieldAlert className="mr-2 h-4 w-4" /> Bloquear Acesso
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
