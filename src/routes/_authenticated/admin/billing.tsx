import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, Search, Filter, CreditCard, 
  Download, ExternalLink, Calendar,
  TrendingUp, Wallet, ArrowUpRight,
  MoreVertical, Factory, CheckCircle2,
  FileDown
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/billing')({
  component: BillingPage,
});

function BillingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [billings, setBillings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('billing')
        .select(`
          *,
          industries:industry_id(name)
        `)
        .order('month', { ascending: false });

      if (error) throw error;
      setBillings(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar cobranças: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold">Pago</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold">Atrasado</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold">Pendente</Badge>;
    }
  };

  const filteredBillings = billings.filter(b => 
    b.industries?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = billings.reduce((acc, b) => acc + (b.amount || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cobranças</h2>
          <p className="text-sm text-slate-500">Gestão financeira e faturamento por indústria</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold">
          <CreditCard className="mr-2 h-4 w-4" /> Nova Fatura
        </Button>
      </header>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm bg-blue-600 text-white border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold opacity-70 uppercase tracking-widest">Faturamento Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black tabular-nums">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="p-2 bg-white/10 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black text-slate-900 tabular-nums">R$ 4.250,00</div>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black text-slate-900 tabular-nums">R$ 1.850,00</div>
                <div className="p-2 bg-green-50 text-green-600 rounded-lg border border-green-100">
                  <ArrowUpRight className="w-5 h-5" />
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
                placeholder="Filtrar por indústria..." 
                className="pl-10 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="font-bold flex-1 sm:flex-none">
                <Filter className="h-4 w-4 mr-2" /> Filtros
              </Button>
              <Button variant="outline" size="sm" className="font-bold flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" /> Exportar
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Indústria / Mês</TableHead>
                <TableHead className="font-bold text-slate-700 text-right">Valor</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    Carregando faturamento...
                  </TableCell>
                </TableRow>
              ) : filteredBillings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
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
                        <div>
                          <p className="font-bold text-slate-900">{bill.industries?.name}</p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            <Calendar className="w-3 h-3" />
                            {bill.month}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-black text-slate-900 tabular-nums">
                        R$ {bill.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(bill.status || 'pending')}
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
                            <ExternalLink className="mr-2 h-4 w-4" /> Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate({ to: '/admin/reports' })}>
                            <FileDown className="mr-2 h-4 w-4" /> Relatório de Visitas
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" /> Baixar PDF Fatura
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-blue-600 font-bold">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar como Pago
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

