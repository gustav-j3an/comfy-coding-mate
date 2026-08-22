import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LogOut, LayoutDashboard, Image, AlertCircle, 
  FileText, CreditCard, Loader2, BarChart3,
  Calendar, Factory, Download, Package,
  Info, ExternalLink, CheckCircle2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { getIndustryBillings, getBillingItems } from '@/lib/billing.functions';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute('/_authenticated/industry/billing')({
  component: IndustryBillingPage,
});

function IndustryBillingPage() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [billings, setBillings] = useState<any[]>([]);
  const [industryId, setIndustryId] = useState<string | null>(null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<any>(null);
  const [billingItems, setBillingItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const getBillingsFn = useServerFn(getIndustryBillings);
  const getItemsFn = useServerFn(getBillingItems);

  useEffect(() => {
    if (user?.email) {
      fetchIndustryAndBillings();
    }
  }, [user]);

  const fetchIndustryAndBillings = async () => {
    try {
      setLoading(true);
      // First get industry ID from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('industry_id')
        .eq('id', user!.id)
        .single();
      
      if (profileError || !profile?.industry_id) {
        throw new Error("Perfil de indústria não encontrado.");
      }

      setIndustryId(profile.industry_id);
      const billingsData = await getBillingsFn({ data: { industryId: profile.industry_id } });
      setBillings(billingsData || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (billing: any) => {
    setSelectedBilling(billing);
    setIsDetailsOpen(true);
    try {
      setItemsLoading(true);
      const items = await getItemsFn({ data: { billingId: billing.id } });
      setBillingItems(items || []);
    } catch (error: any) {
      toast.error("Erro ao carregar itens: " + error.message);
    } finally {
      setItemsLoading(false);
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
      case 'sent':
        return <Badge className="bg-indigo-100 text-indigo-700 border-none font-bold">Enviada</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-100 text-slate-400 border-none font-bold">Cancelada</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 border-none font-bold">Pendente</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-400">Portal Indústria</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Financeiro</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link to="/industry">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Relatórios Mensais
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-800 bg-slate-800">
            <CreditCard className="mr-2 h-4 w-4" /> Financeiro
          </Button>
          <Link to="/industry/exports">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
              <Package className="mr-2 h-4 w-4" /> Exportações
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
            <Image className="mr-2 h-4 w-4" /> Evidências
          </Button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800">Minhas Faturas</h2>
          <Badge variant="outline" className="font-bold border-blue-200 text-blue-700 bg-blue-50">
            <Factory className="h-3 w-3 mr-1" /> {user?.email}
          </Badge>
        </header>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : billings.length === 0 ? (
            <Card className="border-dashed border-2 py-12">
              <CardContent className="flex flex-col items-center text-slate-400">
                <CreditCard className="h-12 w-12 mb-4 opacity-20" />
                <p>Nenhuma fatura emitida até o momento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 text-left">Fatura / Ref</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Vencimento</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Valor Total</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
                    <TableHead className="w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billings.map((bill) => (
                    <TableRow key={bill.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div className="text-left">
                          <p className="font-bold text-slate-900">{bill.billing_number}</p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(2024, bill.competence_month - 1, 1), 'MMMM/yyyy', { locale: ptBR })}
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
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => viewDetails(bill)} title="Ver Detalhes">
                            <Info className="h-4 w-4 text-blue-600" />
                          </Button>
                          {bill.attachment_url && (
                            <Button variant="ghost" size="icon" asChild title="Baixar Fatura">
                              <a href={bill.attachment_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 text-slate-600" />
                              </a>
                            </Button>
                          )}
                          {bill.payment_link && (
                            <Button variant="ghost" size="icon" asChild title="Link de Pagamento">
                              <a href={bill.payment_link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 text-green-600" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">Detalhamento Financeiro</DialogTitle>
            <DialogDescription className="text-left">
              Fatura {selectedBilling?.billing_number} • Referência {selectedBilling && format(new Date(2024, selectedBilling.competence_month - 1, 1), 'MMMM/yyyy', { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBilling && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-left">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-left mb-1">Visitas</p>
                  <p className="font-bold text-lg">{selectedBilling.approved_visits_count}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-left">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-left mb-1">Valor Unitário</p>
                  <p className="font-bold text-lg">R$ {Number(selectedBilling.unit_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-left">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-left mb-1">Ajustes</p>
                  <p className="font-bold text-lg text-amber-600">R$ {(Number(selectedBilling.increase) - Number(selectedBilling.discount)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-left">
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest text-left mb-1">Total</p>
                  <p className="font-bold text-lg text-blue-900 font-black">R$ {Number(selectedBilling.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {selectedBilling.notes && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-left">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Observações da Fatura</h4>
                  <p className="text-sm text-amber-900">{selectedBilling.notes}</p>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Checklist de Visitas Cobradas</h4>
                  <Badge variant="outline" className="text-[10px] font-bold">Snapshot do Faturamento</Badge>
                </div>
                {itemsLoading ? (
                  <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="text-left font-bold text-xs">Loja</TableHead>
                        <TableHead className="text-left font-bold text-xs">Promotor</TableHead>
                        <TableHead className="text-center font-bold text-xs">Data Visita</TableHead>
                        <TableHead className="text-right font-bold text-xs">Aprovação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingItems.map((item) => (
                        <TableRow key={item.id} className="text-[11px]">
                          <TableCell className="text-left font-medium">{item.store_name}</TableCell>
                          <TableCell className="text-left">{item.promoter_name}</TableCell>
                          <TableCell className="text-center">{format(new Date(item.visit_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-right text-green-600 font-bold">
                            <div className="flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {format(new Date(item.approved_at), 'dd/MM HH:mm')}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                <p>* Snapshot gerado no momento da emissão da fatura. Alterações posteriores em visitas não afetam este checklist.</p>
                <p>Gerado por: Sistema Rota do Promotor</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
