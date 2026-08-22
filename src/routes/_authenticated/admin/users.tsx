import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  UserPlus, 
  MoreVertical, 
  Shield, 
  User, 
  Building2,
  Mail,
  UserX,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: UserManagement,
});

function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get profiles and their roles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (role)
        `);

      if (profileError) throw profileError;
      setUsers(profiles || []);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>;
      case 'promoter':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none"><User className="w-3 h-3 mr-1" /> Promotor</Badge>;
      case 'industry':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none"><Building2 className="w-3 h-3 mr-1" /> Indústria</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Ativo</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Bloqueado</Badge>;
      case 'pending':
        return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuários e Acessos</h1>
          <p className="text-slate-500 text-sm">Gerencie permissões e convites do sistema.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200">
          <UserPlus className="w-4 h-4 mr-2" /> Convidar Usuário
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Pesquisar por nome ou e-mail..." 
              className="pl-10 max-w-md border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Usuário</TableHead>
                  <TableHead className="font-bold text-slate-700">Perfil</TableHead>
                  <TableHead className="font-bold text-slate-700">Status</TableHead>
                  <TableHead className="font-bold text-slate-700">Último Acesso</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      Carregando usuários...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                            {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.full_name || 'Sem nome'}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.user_roles?.[0]?.role ? getRoleBadge(user.user_roles[0].role) : '—'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status || 'active')}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {user.last_access 
                          ? format(new Date(user.last_access), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })
                          : 'Nunca acessou'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="cursor-pointer">
                              <Mail className="w-4 h-4 mr-2" /> Reenviar Convite
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <RefreshCw className="w-4 h-4 mr-2" /> Redefinir Senha
                            </DropdownMenuItem>
                            {user.status === 'blocked' ? (
                              <DropdownMenuItem className="cursor-pointer text-green-600 focus:text-green-700">
                                <UserCheck className="w-4 h-4 mr-2" /> Reativar Acesso
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700">
                                <UserX className="w-4 h-4 mr-2" /> Bloquear Acesso
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
        </CardContent>
      </Card>
    </div>
  );
}
