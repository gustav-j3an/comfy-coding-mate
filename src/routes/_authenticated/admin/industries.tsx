import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, Search, MoreVertical, 
  Edit, Trash2, Phone, Mail, 
  Loader2, AlertCircle, Building2,
  FileText, BarChart3, UserPlus
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
import { industrySchema } from '@/lib/schemas/admin';

export const Route = createFileRoute('/_authenticated/admin/industries')({
  component: IndustriesPage,
});

interface IndustryItem {
  id: string;
  name: string;
  cnpj: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  active: boolean | null;
  stores_count?: number;
  visits_this_month?: number;
}

function IndustriesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState<IndustryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<IndustryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    contact_name: '',
    email: '',
    phone: '',
    active: true
  });

  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('industries')
        .select('*')
        .order('name');
      if (error) throw error;
      setIndustries(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar indústrias: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredIndustries = industries.filter(i => {
    const matchesSearch = i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         i.cnpj?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && i.active) || 
                         (statusFilter === 'inactive' && !i.active);
    return matchesSearch && matchesStatus;
  });

  const handleOpenForm = (industry?: IndustryItem) => {
    if (industry) {
      setEditingIndustry(industry);
      setFormData({
        name: industry.name || '',
        cnpj: industry.cnpj || '',
        contact_name: industry.contact_name || '',
        email: industry.email || '',
        phone: industry.phone || '',
        active: industry.active ?? true
      });
    } else {
      setEditingIndustry(null);
      setFormData({
        name: '',
        cnpj: '',
        contact_name: '',
        email: '',
        phone: '',
        active: true
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      const validated = industrySchema.parse(formData);
      
      const payload = {
        name: validated.name,
        cnpj: validated.cnpj || null,
        contact_name: validated.contact_name || null,
        email: validated.email || null,
        phone: validated.phone || null,
        active: validated.active
      };

      if (editingIndustry) {
        const { error } = await supabase
          .from('industries')
          .update(payload)
          .eq('id', editingIndustry.id);
        if (error) throw error;
        toast.success('Indústria atualizada!');
      } else {
        const { error } = await supabase
          .from('industries')
          .insert([payload]);
        if (error) throw error;
        toast.success('Indústria cadastrada!');
      }
      
      setIsFormOpen(false);
      fetchIndustries();
    } catch (error: any) {
      if (error.errors) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('Erro: ' + error.message);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: canDelete, error: rpcError } = await supabase
        .rpc('can_delete_industry' as any, { i_id: id });
        
      if (rpcError) throw rpcError;
      
      if (!canDelete) {
        toast.error('Indústria possui dados vinculados. Inative-a.');
        setIsDeleting(null);
        return;
      }

      const { error } = await supabase
        .from('industries')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Excluída!');
      fetchIndustries();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleStatus = async (industry: IndustryItem) => {
    try {
      const { error } = await supabase
        .from('industries')
        .update({ active: !industry.active })
        .eq('id', industry.id);
      if (error) throw error;
      fetchIndustries();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Indústrias</h2>
          <p className="text-sm text-slate-500">Parceiros e fabricantes</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Nova Indústria
        </Button>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome ou CNPJ..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold whitespace-nowrap text-slate-700">Indústria</TableHead>
                  <TableHead className="font-bold whitespace-nowrap text-slate-700">Contato</TableHead>
                  <TableHead className="font-bold whitespace-nowrap text-slate-700">Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredIndustries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    Nenhuma indústria encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredIndustries.map((industry) => (
                  <TableRow key={industry.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 font-bold">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{industry.name}</div>
                          {industry.cnpj && <div className="text-[10px] text-slate-400 font-medium">CNPJ: {industry.cnpj}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-700">{industry.contact_name}</div>
                      <div className="flex gap-2 text-[10px] text-slate-400">
                        {industry.email && <span className="flex items-center gap-0.5"><Mail className="h-2.5 w-2.5" />{industry.email}</span>}
                        {industry.phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{industry.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={industry.active ? 'default' : 'secondary'} className="font-bold">
                        {industry.active ? 'Ativo' : 'Inativo'}
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
                          <DropdownMenuItem onClick={() => (navigate as any)({ to: '/admin/users' })}>
                            <BarChart3 className="mr-2 h-4 w-4" /> Visão Indústria
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => (navigate as any)({ to: '/admin/users', search: { invite: 'industry', id: industry.id } })}>
                            <UserPlus className="mr-2 h-4 w-4" /> Convidar Usuário
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenForm(industry)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(industry)}>
                            <AlertCircle className="mr-2 h-4 w-4" /> {industry.active ? 'Inativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsDeleting(industry.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingIndustry ? 'Editar Indústria' : 'Nova Indústria'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4 px-1">
            <div className="space-y-2">
              <Label>Nome da Indústria *</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ (opcional)</Label>
              <Input 
                value={formData.cnpj} 
                onChange={e => setFormData({...formData, cnpj: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Nome do Contato Principal</Label>
              <Input 
                value={formData.contact_name} 
                onChange={e => setFormData({...formData, contact_name: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input 
                  type="email"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label>Status Ativo</Label>
              <Switch 
                checked={formData.active} 
                onCheckedChange={val => setFormData({...formData, active: val})} 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600" disabled={formLoading}>
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!isDeleting} onOpenChange={() => setIsDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir indústria?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível e requer que não haja dados vinculados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => isDeleting && handleDelete(isDeleting)} className="bg-red-600">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
