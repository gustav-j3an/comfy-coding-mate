import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, Search, Filter, MoreVertical, 
  Store, MapPin, ExternalLink,
  Edit, Trash2, Building2
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

export const Route = createFileRoute('/_authenticated/admin/stores')({
  component: StoresPage,
});

interface StoreItem {
  id: string;
  name: string;
  address: string;
  city: string | null;
  active: boolean | null;
  industry_count?: number;
}

function StoresPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await (supabase as any)
        .from('stores')
        .select('*');

      if (error) throw error;

      // In a real app, we'd join with stop_tasks to count industries
      const mappedStores: StoreItem[] = (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        city: s.city || null,
        active: s.active,
        industry_count: Math.floor(Math.random() * 5), // Mock
      }));

      setStores(mappedStores);
    } catch (error: any) {
      toast.error('Erro ao carregar lojas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = async (store: StoreItem) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ active: !store.active })
        .eq('id', store.id);

      if (error) throw error;
      
      setStores(stores.map(s => s.id === store.id ? { ...s, active: !s.active } : s));
      toast.success(`Loja ${!store.active ? 'ativada' : 'inativada'} com sucesso!`);
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Lojas</h2>
          <p className="text-sm text-slate-500">Rede de pontos de venda</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
          <Plus className="mr-2 h-4 w-4" /> Nova Loja
        </Button>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome ou endereço..." 
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
                <TableHead className="font-bold text-slate-700">Loja</TableHead>
                <TableHead className="font-bold text-slate-700">Localização</TableHead>
                <TableHead className="font-bold text-slate-700">Indústrias</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
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
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                          <Store className="h-5 w-5" />
                        </div>
                        <div className="font-bold text-slate-900">{store.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1 flex-col">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {store.address}
                        </div>
                        {store.city && <span className="text-[10px] text-slate-400 font-bold uppercase ml-4">{store.city}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{store.industry_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
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
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Editar Loja
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(store)}>
                            {store.active ? (
                              <>
                                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                <span className="text-red-600">Inativar Loja</span>
                              </>
                            ) : (
                              <>
                                <Plus className="mr-2 h-4 w-4 text-green-500" />
                                <span className="text-green-600">Ativar Loja</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <ExternalLink className="mr-2 h-4 w-4" /> Ver no Mapa
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
