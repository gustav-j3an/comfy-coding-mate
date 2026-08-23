import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, Search, Filter, MoreVertical, 
  MapPin, Calendar, ExternalLink,
  Edit, Trash2, Phone, Mail, Globe, Clock,
  Loader2, AlertCircle, Link as LinkIcon, UserPlus
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { promoterSchema } from '@/lib/schemas/admin';

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
  profiles?: any[];
}

function PromotersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [promoters, setPromoters] = useState<PromoterItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPromoter, setEditingPromoter] = useState<PromoterItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Form values
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    region: '',
    active: true
  });

  useEffect(() => {
    fetchPromoters();
  }, []);

  const fetchPromoters = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('promoters')
        .select(`
          *,
          profiles(id, full_name)
        `)
        .order('name');

      if (error) throw error;
      
      // Get weekly visits count (this month visits)
      const { data: visitsData } = await supabase
        .from('visits')
        .select('promoter_id, scheduled_date')
        .gte('scheduled_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const mappedPromoters = (data || []).map((p: any) => ({
        ...p,
        visits_this_week: (visitsData || []).filter(v => v.promoter_id === p.id).length
      }));

      setPromoters(mappedPromoters);
    } catch (error: any) {
      toast.error('Erro ao carregar promotores: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPromoters = promoters.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && p.active) || 
                         (statusFilter === 'inactive' && !p.active);
    return matchesSearch && matchesStatus;
  });

  const handleOpenForm = (promoter?: PromoterItem) => {
    if (promoter) {
      setEditingPromoter(promoter);
      setFormData({
        name: promoter.name || '',
        phone: promoter.phone || '',
        email: promoter.email || '',
        region: promoter.region || '',
        active: promoter.active ?? true
      });
    } else {
      setEditingPromoter(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        region: '',
        active: true
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      const validated = promoterSchema.parse(formData);
      
      if (editingPromoter) {
          const payload = {
            name: validated.name,
            phone: validated.phone,
            email: validated.email || null,
            region: validated.region || null,
            active: validated.active
          };
          const { error } = await supabase
            .from('promoters')
            .update(payload)
            .eq('id', editingPromoter.id);
        if (error) throw error;
        toast.success('Promotor atualizado com sucesso!');
      } else {
          const payload = {
            name: validated.name,
            phone: validated.phone,
            email: validated.email || null,
            region: validated.region || null,
            active: validated.active
          };
          const { error } = await supabase
            .from('promoters')
            .insert([payload]);
        if (error) throw error;
        toast.success('Promotor cadastrado com sucesso!');
      }
      
      setIsFormOpen(false);
      fetchPromoters();
    } catch (error: any) {
      if (error.errors) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('Erro ao salvar: ' + error.message);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Check if can delete via RPC
      const { data: canDelete, error: rpcError } = await supabase
        .rpc('can_delete_promoter', { p_id: id });
        
      if (rpcError) throw rpcError;
      
      if (!canDelete) {
        toast.error('Não é possível excluir este promotor pois ele possui roteiros ou visitas vinculadas. Inative-o em vez de excluir.');
        setIsDeleting(null);
        return;
      }

      const { error } = await supabase
        .from('promoters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Promotor excluído com sucesso!');
      fetchPromoters();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleStatus = async (promoter: PromoterItem) => {
    try {
      const { error } = await supabase
        .from('promoters')
        .update({ active: !promoter.active })
        .eq('id', promoter.id);

      if (error) throw error;
      fetchPromoters();
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
        <Button 
          className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
          onClick={() => handleOpenForm()}
        >
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
          <div className="flex items-center gap-2">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 whitespace-nowrap">Promotor</TableHead>
                  <TableHead className="font-bold text-slate-700 whitespace-nowrap">Contato / Região</TableHead>
                  <TableHead className="font-bold text-slate-700 whitespace-nowrap">Visitas/Semana</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center whitespace-nowrap">Login</TableHead>
                  <TableHead className="font-bold text-slate-700 whitespace-nowrap">Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      Carregando promotores...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPromoters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                    Nenhum promotor encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPromoters.map((promoter) => (
                  <TableRow key={promoter.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                          {promoter.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="font-bold text-slate-900">{promoter.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
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
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{promoter.visits_this_week}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {promoter.profiles && promoter.profiles.length > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          <Badge className="bg-green-50 text-green-700 border-green-100 font-bold hover:bg-green-50">
                            VINCULADO
                          </Badge>
                          <span className="text-[10px] text-slate-400">
                            ID: {promoter.profiles[0].id.substring(0, 8)}...
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-bold text-slate-400">
                          NÃO VINCULADO
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
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
                        <DropdownMenuContent align="end" className="w-64">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => (navigate as any)({ to: '/admin/routes' })}>
                            <MapPin className="mr-2 h-4 w-4" /> Ver Roteiro
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => (navigate as any)({ to: '/admin/routes' })}>
                            <Plus className="mr-2 h-4 w-4" /> Criar Rota
                          </DropdownMenuItem>
                          {(!promoter.profiles || promoter.profiles.length === 0) && (
                            <DropdownMenuItem onClick={() => (navigate as any)({ to: '/admin/users', search: { invite: 'promoter', id: promoter.id } })}>
                              <UserPlus className="mr-2 h-4 w-4 text-blue-600" /> 
                              <span className="text-blue-600 font-bold">Convidar para acesso</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenForm(promoter)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar Cadastro
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(promoter)}>
                            {promoter.active ? (
                              <>
                                <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
                                <span className="text-amber-600">Inativar Promotor</span>
                              </>
                            ) : (
                              <>
                                <Plus className="mr-2 h-4 w-4 text-green-500" />
                                <span className="text-green-600">Ativar Promotor</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsDeleting(promoter.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir Promotor
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

      {/* Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingPromoter ? 'Editar Promotor' : 'Novo Promotor'}</DialogTitle>
            <DialogDescription>
              Preencha os dados do promotor de campo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input 
                id="phone" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Região / Cidade</Label>
              <Input 
                id="region" 
                value={formData.region} 
                onChange={e => setFormData({...formData, region: e.target.value})} 
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="active-status">Status Ativo</Label>
              <Switch 
                id="active-status" 
                checked={formData.active} 
                onCheckedChange={val => setFormData({...formData, active: val})} 
              />
            </div>
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFormOpen(false)}
                disabled={formLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={formLoading}>
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!isDeleting} onOpenChange={() => setIsDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O promotor será excluído permanentemente do sistema se não houver vínculos ativos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => isDeleting && handleDelete(isDeleting)} className="bg-red-600 hover:bg-red-700">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
