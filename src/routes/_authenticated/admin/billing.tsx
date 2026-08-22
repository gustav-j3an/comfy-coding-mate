import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, Search, Filter, CreditCard, 
  Download, ExternalLink, Calendar,
  TrendingUp, Wallet, ArrowUpRight,
  MoreVertical, Factory, CheckCircle2,
  FileDown, Loader2, AlertCircle, FileText,
  History, Info, DollarSign, XCircle
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useServerFn } from '@tanstack/react-start';
import { getBillings, calculateBillingPreview, createBilling, updateBillingStatus, getBillingItems } from '@/lib/billing.functions';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/_authenticated/admin/billing')({
  component: BillingPage,
});

function BillingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [billings, setBillings] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isNewBillingOpen, setIsNewBillingOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<any>(null);
  const [billingItems, setBillingItems] = useState<any[]>([]);
  
  const [formLoading, setFormLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  
  const getBillingsFn = useServerFn(getBillings);
  const calculatePreviewFn = useServerFn(calculateBillingPreview);
  const createBillingFn = useServerFn(createBilling);
  const updateStatusFn = useServerFn(updateBillingStatus);
  const getItemsFn = useServerFn(getBillingItems);

  const [formData, setFormData] = useState({
    industry_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    due_date: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10), 'yyyy-MM-dd'),
    discount: 0,
    increase: 0,
    notes: '',
    adjustment_reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [billingsData, industriesRes] = await Promise.all([
        getBillingsFn(),
        supabase.from('industries').select('id, name').eq('active', true).order('name')
      ]);
      setBillings(billingsData || []);
      setIndustries(industriesRes.data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!formData.industry_id) {
      toast.error("Selecione uma indústria");
      return;
    }
    try {
      setFormLoading(true);
      const data = await calculatePreviewFn({ data: {
        industry_id: formData.industry_id,
        month: Number(formData.month),
        year: Number(formData.year)
      }});
      setPreviewData(data);
    } catch (error: any) {
      toast.error(error.message);
      setPreviewData(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateBilling = async () => {
    if (!previewData) return;
    try {
      setFormLoading(true);
      const total = previewData.subtotal - formData.discount + formData.increase;
      
      await createBillingFn({ data: {
        industry_id: formData.industry_id,
        contract_id: previewData.contract.id,
        competence_month: Number(formData.month),
        competence_year: Number(formData.year),
        approved_visits_count: previewData.approvedCount,
        unit_value: previewData.unitValue,
        subtotal: previewData.subtotal,
        discount: formData.discount,
        increase: formData.increase,
        total_value: total,
        due_date: formData.due_date,
        notes: formData.notes,
        adjustment_reason: formData.adjustment_reason,
        visits: previewData.visits
      }});

      toast.success("Cobrança gerada com sucesso!");
      setIsNewBillingOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao gerar cobrança: " + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: any) => {
    try {
      await updateStatusFn({ data: { id, status } });
      toast.success("Status atualizado!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const viewDetails = async (billing: any) => {
    setSelectedBilling(billing);
    setIsDetailsOpen(true);
    try {
      const items = await getItemsFn({ data: { billingId: billing.id } });
      setBillingItems(items || []);
    } catch (error: any) {
      toast.error("Erro ao carregar itens: " + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 border-none font-bold">Pago</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700 border-none font-bold">Atrasado</Badge>;
      case 'issued':
        return <Badge className="bg-blue-100 text-blue-700 border-none font-bold">Emitida</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-100 text-slate-400 border-none font-bold">Cancelada</Badge>;
      case 'sent':
        return <Badge className="bg-indigo-100 text-indigo-700 border-none font-bold">Enviada</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 border-none font-bold">Rascunho</Badge>;
    }
  };

  const filteredBillings = billings.filter(b => 
    b.industry?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.billing_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBilled = billings.filter(b => b.status !== 'cancelled').reduce((acc, b) => acc + Number(b.total_value), 0);
  const totalPaid = billings.filter(b => b.status === 'paid').reduce((acc, b) => acc + Number(b.total_value), 0);
  const totalOverdue = billings.filter(b => b.status === 'overdue').reduce((acc, b) => acc + Number(b.total_value), 0);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight text-left">Faturamento</h2>
          <p className="text-sm text-slate-500 text-left">Cobranças e histórico financeiro por indústria</p>
        </div>
        <div className="flex gap-2">
          <Link to={"/admin/contracts" as any}>
            <Button variant="outline" className="font-bold border-slate-200">
              <FileText className="mr-2 h-4 w-4" /> Contratos
            </Button>
          </Link>
          <Button onClick={() => setIsNewBillingOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold">
            <Plus className="mr-2 h-4 w-4" /> Nova Cobrança
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm bg-blue-600 text-white border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold opacity-70 uppercase tracking-widest text-left text-white">Total Faturado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black tabular-nums">R$ {totalBilled.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="p-2 bg-white/10 rounded-lg text-white">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest text-left">Total Recebido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black text-slate-900 tabular-nums">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="p-2 bg-green-50 text-green-600 rounded-lg border border-green-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm text-left">
            <CardHeader className="pb-2 text-left">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest text-left">Atrasado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black text-red-600 tabular-nums">R$ {totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50/30">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Indústria ou número..." 
                className="pl-10 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link to="/admin/exports">
                <Button variant="outline" size="sm" className="font-bold flex-1 sm:flex-none">
                  <Download className="h-4 w-4 mr-2" /> Exportar Financeiro
                </Button>
              </Link>
            </div>
          </div>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700 text-left">Indústria / Ref</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Vencimento</TableHead>
                <TableHead className="font-bold text-slate-700 text-right">Valor Total</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Carregando cobranças...
                  </TableCell>
                </TableRow>
              ) : filteredBillings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    Nenhum registro de cobrança encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBillings.map((bill) => (
                  <TableRow key={bill.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                          <Factory className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-900">{bill.industry?.name}</p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(2024, bill.competence_month - 1, 1), 'MMM/yyyy', { locale: ptBR })} • {bill.billing_number}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium text-slate-600">
                        {format(new Date(bill.due_date), 'dd/MM/yyyy')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-black text-slate-900 tabular-nums">
                        R$ {Number(bill.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(bill.status)}
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
                          <DropdownMenuItem onClick={() => viewDetails(bill)}>
                            <Info className="mr-2 h-4 w-4" /> Ver Detalhes
                          </DropdownMenuItem>
                          {bill.status === 'draft' && (
                            <DropdownMenuItem className="text-blue-600 font-bold" onClick={() => handleStatusChange(bill.id, 'issued')}>
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Emitir Cobrança
                            </DropdownMenuItem>
                          )}
                          {bill.status === 'issued' && (
                            <DropdownMenuItem className="text-green-600 font-bold" onClick={() => handleStatusChange(bill.id, 'paid')}>
                              <DollarSign className="mr-2 h-4 w-4" /> Confirmar Pagamento
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate({ to: '/admin/reports' })}>
                            <FileDown className="mr-2 h-4 w-4" /> Relatório do Mês
                          </DropdownMenuItem>
                          {bill.status !== 'paid' && bill.status !== 'cancelled' && (
                            <DropdownMenuItem className="text-red-600" onClick={() => handleStatusChange(bill.id, 'cancelled')}>
                              <XCircle className="mr-2 h-4 w-4" /> Cancelar
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

      {/* New Billing Dialog */}
      <Dialog open={isNewBillingOpen} onOpenChange={setIsNewBillingOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">Gerar Nova Cobrança</DialogTitle>
            <DialogDescription className="text-left">Selecione a indústria e a competência para calcular o faturamento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 text-left">
                <Label>Indústria</Label>
                <Select value={formData.industry_id} onValueChange={(val) => setFormData({...formData, industry_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {industries.map(ind => <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 text-left">
                <Label>Competência</Label>
                <div className="flex gap-2">
                  <Select value={formData.month.toString()} onValueChange={(val) => setFormData({...formData, month: Number(val)})}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {format(new Date(2024, i, 1), 'MMMM', { locale: ptBR })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input 
                    type="number" 
                    className="w-24" 
                    value={formData.year} 
                    onChange={e => setFormData({...formData, year: Number(e.target.value)})} 
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button onClick={handlePreview} variant="outline" className="w-full border-blue-200 text-blue-700 bg-blue-50 font-bold" disabled={formLoading}>
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Calcular'}
                </Button>
              </div>
            </div>

            {previewData && (
              <div className="space-y-6 border-t pt-6 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-left">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 text-left">Visitas Aprovadas</p>
                    <p className="text-xl font-black text-slate-900">{previewData.approvedCount}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-left">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 text-left">Valor Unitário</p>
                    <p className="text-xl font-black text-slate-900">R$ {Number(previewData.unitValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-left">
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1 text-left">Subtotal</p>
                    <p className="text-xl font-black text-blue-900">R$ {Number(previewData.subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-left">
                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-1 text-left">Total Final</p>
                    <p className="text-xl font-black text-indigo-900">
                      R$ {(previewData.subtotal - formData.discount + formData.increase).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-2 text-left">
                      <Label>Vencimento</Label>
                      <Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2 text-left">
                        <Label>Desconto (R$)</Label>
                        <Input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-2 text-left">
                        <Label>Acréscimo (R$)</Label>
                        <Input type="number" value={formData.increase} onChange={e => setFormData({...formData, increase: Number(e.target.value)})} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <Label>Justificativa de Ajustes / Observações</Label>
                    <textarea 
                      className="w-full h-[105px] px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.notes} 
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      placeholder="Obrigatório em caso de descontos ou acréscimos..."
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewBillingOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateBilling} className="bg-blue-600" disabled={formLoading}>
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Confirmar e Gerar Rascunho'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">Detalhamento da Cobrança</DialogTitle>
            <DialogDescription className="text-left">
              {selectedBilling?.billing_number} • {selectedBilling?.industry?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedBilling && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-left">Competência</p>
                  <p className="font-bold">{format(new Date(2024, selectedBilling.competence_month - 1, 1), 'MMMM yyyy', { locale: ptBR })}</p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-left">Vencimento</p>
                  <p className="font-bold">{format(new Date(selectedBilling.due_date), 'dd/MM/yyyy')}</p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-left">Valor Final</p>
                  <p className="font-bold text-lg text-blue-600">R$ {Number(selectedBilling.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-left font-bold">Loja</TableHead>
                      <TableHead className="text-left font-bold">Promotor</TableHead>
                      <TableHead className="text-center font-bold">Data Visita</TableHead>
                      <TableHead className="text-center font-bold">Aprovação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingItems.length > 0 ? (
                      billingItems.map((item) => (
                        <TableRow key={item.id} className="text-xs">
                          <TableCell className="text-left font-medium">{item.store_name}</TableCell>
                          <TableCell className="text-left">{item.promoter_name}</TableCell>
                          <TableCell className="text-center">{format(new Date(item.visit_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-center text-green-600 font-medium">
                            {item.approved_at ? format(new Date(item.approved_at), 'dd/MM HH:mm') : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-slate-500 italic">
                          Evidências detalhadas expiradas conforme política de retenção de 90 dias.
                          O snapshot financeiro acima permanece preservado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
