import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, Search, Filter, MoreVertical, 
  Factory, User, Store, ExternalLink,
  Edit, Trash2, Phone, Mail, Building2
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

export const Route = createFileRoute('/_authenticated/admin/industries')({
  component: IndustriesPage,
});

interface IndustryItem {
  id: string;
  name: string;
  active: boolean | null;
  cnpj: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  stores_count?: number;
  promoters_count?: number;
  visits_this_month?: number;
}

function IndustriesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState<IndustryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('industries')
        .select('*');

      if (error) throw error;

      // In a real app, we'd join with stop_tasks, routes, and visits
      const mappedIndustries: IndustryItem[] = (data || []).map(i => ({
        ...i,
        stores_count: Math.floor(Math.random() * 20),
        promoters_count: Math.floor(Math.random() * 8),
        visits_this_month: Math.floor(Math.random() * 150),
      }));

      setIndustries(mappedIndustries);
    } catch (error: any) {
      toast.error('Erro ao carregar indústrias: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredIndustries = industries.filter(i => 
    i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = async (industry: IndustryItem) => {
    try {
      const { error } = await supabase
        .from('industries')
        .update({ active: !industry.active })
        .eq('id', industry.id);

      if (error) throw error;
      
      setIndustries(industries.map(i => i.id === industry.id ? { ...i, active: !i.active } : i));
      toast.success(`Indústria ${!industry.active ? 'ativada' : 'inativada'} com sucesso!`);
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Indústrias</h2>
          <p className="text-sm text-slate-500">Parceiros e fabricantes</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
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
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Indústria</TableHead>
                <TableHead className="font-bold text-slate-700">Contato</TableHead>
                <TableHead className="font-bold text-slate-700">Métricas (Mês)</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    Carregando indústrias...
                  </TableCell>
                </TableRow>
              ) : filteredIndustries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    Nenhuma indústria encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredIndustries.map((industry) => (
                  <TableRow key={industry.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                          <Factory className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{industry.name}</div>
                          {industry.cnpj && <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{industry.cnpj}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                          <User className="h-3 w-3 text-slate-400" />
                          {industry.contact_name || 'Não informado'}
                        </div>
                        <div className="flex items-center gap-3">
                          {industry.phone && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Phone className="h-3 w-3" />
                              {industry.phone}
                            </div>
                          )}
                          {industry.email && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Mail className="h-3 w-3" />
                              {industry.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xs font-black text-slate-900">{industry.stores_count}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Lojas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-black text-slate-900">{industry.promoters_count}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Promotores</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-black text-blue-600">{industry.visits_this_month}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Visitas</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={industry.active ? 'default' : 'secondary'} className="font-bold">
                        {industry.active ? 'Ativa' : 'Inativa'}
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
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Editar Indústria
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(industry)}>
                            {industry.active ? (
                              <>
                                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                <span className="text-red-600">Inativar Indústria</span>
                              </>
                            ) : (
                              <>
                                <Plus className="mr-2 h-4 w-4 text-green-500" />
                                <span className="text-green-600">Ativar Indústria</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate({ to: '/industry' })}>
                            <ExternalLink className="mr-2 h-4 w-4 text-blue-500" />
                            <span className="text-blue-600 font-bold">Acessar Visão da Indústria</span>
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
