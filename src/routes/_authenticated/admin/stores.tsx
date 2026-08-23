import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, Search, MoreVertical, 
  MapPin, Edit, Trash2, 
  Loader2, AlertCircle, ShoppingCart
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
import { storeSchema } from '@/lib/schemas/admin';

export const Route = createFileRoute('/_authenticated/admin/stores')({
  component: StoresPage,
});

interface StoreItem {
  id: string;
  name: string;
  address: string;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city: string | null;
  state: string | null;
  cep?: string | null;
  active: boolean | null;
  industries_count?: number;
  visits_this_month?: number;
}

function StoresPage() {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    active: true
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');
      if (error) throw error;

      // Mock counters for now as relationships are complex
      const mappedStores = (data || []).map((s: any) => ({
        ...s,
        industries_count: 0,
        visits_this_month: 0
      }));
      setStores(mappedStores);
    } catch (error: any) {
      toast.error('Erro ao carregar lojas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && s.active) || 
                         (statusFilter === 'inactive' && !s.active);
    return matchesSearch && matchesStatus;
  });

  const handleOpenForm = (store?: StoreItem) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        name: store.name || '',
        address: store.address || '',
        number: store.number || '',
        complement: store.complement || '',
        neighborhood: store.neighborhood || '',
        city: store.city || '',
        state: store.state || '',
        zip_code: store.cep || '',
        active: store.active ?? true
      });
    } else {
      setEditingStore(null);
      setFormData({
        name: '',
        address: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: '',
        active: true
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      const validated = storeSchema.parse(formData);
      
      const payload = {
        name: validated.name,
        address: validated.address,
        number: validated.number || null,
        complement: validated.complement || null,
        neighborhood: validated.neighborhood || null,
        city: validated.city || null,
        state: validated.state || null,
        cep: validated.zip_code || null,
        active: validated.active
      };

      if (editingStore) {
        const { error } = await supabase
          .from('stores')
          .update(payload)
          .eq('id', editingStore.id);
        if (error) throw error;
        toast.success('Loja atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('stores')
          .insert([payload]);
        if (error) throw error;
        toast.success('Loja cadastrada com sucesso!');
      }
      
      setIsFormOpen(false);
      fetchStores();
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
      const { data: canDelete, error: rpcError } = await supabase
        .rpc('can_delete_store' as any, { s_id: id });
        
      if (rpcError) throw rpcError;
      
      if (!canDelete) {
        toast.error('Não é possível excluir esta loja pois ela possui visitas ou roteiros. Inative-a.');
        setIsDeleting(null);
        return;
      }

      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Loja excluída!');
      fetchStores();
    } catch (error: any) {
      toast.error('Erro: ' + error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleStatus = async (store: StoreItem) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ active: !store.active })
        .eq('id', store.id);
      if (error) throw error;
      fetchStores();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Lojas</h2>
          <p className="text-sm text-slate-500">Pontos de venda e atendimento</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Nova Loja
        </Button>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar loja ou endereço..." 
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
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold whitespace-nowrap text-slate-700">Loja</TableHead>
                  <TableHead className="font-bold whitespace-nowrap text-slate-700">Endereço</TableHead>
                  <TableHead className="font-bold whitespace-nowrap text-slate-700">Cidade/UF</TableHead>
                  <TableHead className="font-bold whitespace-nowrap text-slate-700">Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Carregando lojas...
                  </TableCell>
                </TableRow>
              ) : filteredStores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    Nenhuma loja encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStores.map((store) => (
                  <TableRow key={store.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex-shrink-0 flex items-center justify-center text-orange-700 font-bold">
                          <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div className="font-bold text-slate-900">{store.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm text-slate-500 truncate max-w-xs">
                        {store.address}{store.number ? `, ${store.number}` : ''}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {store.neighborhood}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {store.city} / {store.state}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={store.active ? 'default' : 'secondary'} className="font-bold">
                        {store.active ? 'Ativa' : 'Inativa'}
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
                          <DropdownMenuItem onClick={() => handleOpenForm(store)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(store)}>
                            <AlertCircle className="mr-2 h-4 w-4" /> {store.active ? 'Inativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setIsDeleting(store.id)} className="text-red-600">
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingStore ? 'Editar Loja' : 'Nova Loja'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label>Nome da Loja *</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-2">
                <Label>Endereço *</Label>
                <Input 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input 
                  value={formData.number} 
                  onChange={e => setFormData({...formData, number: e.target.value})} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input 
                  value={formData.complement} 
                  onChange={e => setFormData({...formData, complement: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input 
                  value={formData.neighborhood} 
                  onChange={e => setFormData({...formData, neighborhood: e.target.value})} 
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Cidade</Label>
                <Input 
                  value={formData.city} 
                  onChange={e => setFormData({...formData, city: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input 
                  value={formData.state} 
                  onChange={e => setFormData({...formData, state: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input 
                value={formData.zip_code} 
                onChange={e => setFormData({...formData, zip_code: e.target.value})} 
              />
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
            <AlertDialogTitle>Excluir loja?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
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
