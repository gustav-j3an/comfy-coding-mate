import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, Search, MoreVertical, 
  Edit, Trash2, Calendar, FileText,
  Loader2, Factory, DollarSign,
  Copy, History, CheckCircle2, XCircle
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServerFn } from '@tanstack/react-start';
import { getContracts, createContract, updateContract } from '@/lib/billing.functions';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/admin/contracts')({
  component: ContractsPage,
});

function ContractsPage() {
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  const getContractsFn = useServerFn(getContracts);
  const createContractFn = useServerFn(createContract);
  const updateContractFn = useServerFn(updateContract);

  const [formData, setFormData] = useState({
    industry_id: '',
    contract_number: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    value_per_visit: 0,
    min_monthly_visits: 0,
    billing_day: 10,
    commercial_responsible: '',
    billing_details: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contractsData, industriesRes] = await Promise.all([
        getContractsFn(),
        supabase.from('industries').select('id, name').eq('active', true).order('name')
      ]);
      setContracts(contractsData || []);
      setIndustries(industriesRes.data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (contract?: any) => {
    if (contract) {
      setEditingContract(contract);
      setFormData({
        industry_id: contract.industry_id,
        contract_number: contract.contract_number,
        start_date: contract.start_date,
        end_date: contract.end_date || '',
        status: contract.status,
        value_per_visit: Number(contract.value_per_visit),
        min_monthly_visits: contract.min_monthly_visits || 0,
        billing_day: contract.billing_day,
        commercial_responsible: contract.commercial_responsible || '',
        billing_details: contract.billing_details || '',
        notes: contract.notes || ''
      });
    } else {
      setEditingContract(null);
      setFormData({
        industry_id: '',
        contract_number: `CONT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        start_date: new Date().toISOString().split('T')[0] as string,
        end_date: '',
        status: 'draft',
        value_per_visit: 0,
        min_monthly_visits: 0,
        billing_day: 10,
        commercial_responsible: '',
        billing_details: '',
        notes: ''
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      const payload = {
        ...formData,
        end_date: formData.end_date || null,
        min_monthly_visits: formData.min_monthly_visits || null,
      };

      if (editingContract) {
        await updateContractFn({ data: { id: editingContract.id, updates: payload } });
        toast.success('Contrato atualizado!');
      } else {
        await createContractFn({ data: payload });
        toast.success('Contrato criado!');
      }
      
      setIsFormOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-none font-bold">Ativo</Badge>;
      case 'terminated':
        return <Badge className="bg-slate-100 text-slate-700 border-none font-bold">Encerrado</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 border-none font-bold">Rascunho</Badge>;
    }
  };

  const filteredContracts = contracts.filter(c => 
    c.industry?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contract_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight text-left">Contratos Comerciais</h2>
          <p className="text-sm text-slate-500 text-left">Regras de faturamento por indústria</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Novo Contrato
        </Button>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por indústria ou número..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-left">Contrato / Indústria</TableHead>
                <TableHead className="font-bold text-center">Início</TableHead>
                <TableHead className="font-bold text-right">Valor/Visita</TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Carregando contratos...
                  </TableCell>
                </TableRow>
              ) : filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    Nenhum contrato encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract) => (
                  <TableRow key={contract.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-slate-900">{contract.industry?.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{contract.contract_number}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm font-medium text-slate-700">
                        {new Date(contract.start_date).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-black text-slate-900 tabular-nums">
                        R$ {Number(contract.value_per_visit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(contract.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleOpenForm(contract)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <History className="mr-2 h-4 w-4" /> Histórico
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {contract.status === 'active' ? (
                            <DropdownMenuItem className="text-red-600 font-bold">
                              <XCircle className="mr-2 h-4 w-4" /> Encerrar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-600 font-bold">
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Ativar
                            </DropdownMenuItem>
                          )}
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">{editingContract ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
            <DialogDescription className="text-left">Defina as regras comerciais e valores de faturamento.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4 px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-left">
                <Label>Indústria *</Label>
                <Select 
                  value={formData.industry_id} 
                  onValueChange={(val) => setFormData({...formData, industry_id: val})}
                  disabled={!!editingContract}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map(ind => (
                      <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 text-left">
                <Label>Número do Contrato *</Label>
                <Input 
                  value={formData.contract_number} 
                  onChange={e => setFormData({...formData, contract_number: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-left">
                <Label>Data de Início *</Label>
                <Input 
                  type="date"
                  value={formData.start_date} 
                  onChange={e => setFormData({...formData, start_date: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2 text-left">
                <Label>Data de Fim (opcional)</Label>
                <Input 
                  type="date"
                  value={formData.end_date} 
                  onChange={e => setFormData({...formData, end_date: e.target.value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 text-left">
                <Label>Valor por Visita (R$) *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.value_per_visit} 
                  onChange={e => setFormData({...formData, value_per_visit: Number(e.target.value)})} 
                  required 
                />
              </div>
              <div className="space-y-2 text-left">
                <Label>Dia de Vencimento *</Label>
                <Input 
                  type="number"
                  min="1"
                  max="31"
                  value={formData.billing_day} 
                  onChange={e => setFormData({...formData, billing_day: Number(e.target.value)})} 
                  required 
                />
              </div>
              <div className="space-y-2 text-left">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val: any) => setFormData({...formData, status: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="terminated">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <Label>Responsável Comercial</Label>
              <Input 
                value={formData.commercial_responsible} 
                onChange={e => setFormData({...formData, commercial_responsible: e.target.value})} 
              />
            </div>

            <div className="space-y-2 text-left">
              <Label>Detalhes de Cobrança (Dados Bancários / Pix)</Label>
              <textarea 
                className="w-full min-h-[80px] px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.billing_details} 
                onChange={e => setFormData({...formData, billing_details: e.target.value})}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600" disabled={formLoading}>
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Salvar Contrato'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
