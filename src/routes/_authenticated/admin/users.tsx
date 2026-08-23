import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  RefreshCw,
  Link as LinkIcon,
  Trash2,
  Copy,
  MessageSquare,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { inviteUser, updateUserStatus, deleteUser, resendInvite, requestPasswordReset, generateWhatsAppInvite } from '@/lib/users.functions';
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

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: UserManagement,
});

function UserManagement() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch() as any;
  const [users, setUsers] = useState<any[]>([]);
  const [promoters, setPromoters] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [inviteRole, setInviteRole] = useState<'admin' | 'promoter' | 'industry'>('promoter');
  const [selectedPromoterId, setSelectedPromoterId] = useState<string>('');
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>('');
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const checkInviteParams = async () => {
      if (searchParams.invite === 'promoter' && searchParams.id) {
        setInviteRole('promoter');
        setSelectedPromoterId(searchParams.id);
        setIsInviteOpen(true);
        
        // If promoters are already loaded, try to find the one
        if (promoters.length > 0) {
          const p = promoters.find(item => item.id === searchParams.id);
          if (p) {
            setInviteName(p.name || '');
            setInviteEmail(p.email || '');
          }
        } else {
          // Fetch single promoter data if not loaded
          const { data } = await supabase.from('promoters').select('*').eq('id', searchParams.id).single();
          if (data) {
            setInviteName(data.name || '');
            setInviteEmail(data.email || '');
          }
        }
      } else if (searchParams.invite === 'industry' && searchParams.id) {
        setInviteRole('industry');
        setSelectedIndustryId(searchParams.id);
        setIsInviteOpen(true);
        
        if (industries.length > 0) {
          const i = industries.find(item => item.id === searchParams.id);
          if (i) {
            setInviteName(i.contact_name || i.name || '');
            setInviteEmail(i.email || '');
          }
        } else {
          const { data } = await supabase.from('industries').select('*').eq('id', searchParams.id).maybeSingle();
          if (data) {
            setInviteName(data.contact_name || data.name || '');
            setInviteEmail(data.email || '');
          }
        }
      }
    };
    
    checkInviteParams();
  }, [searchParams, promoters, industries]);

  // Action states
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [whatsAppTarget, setWhatsAppTarget] = useState<any>(null);
  const [generatingWA, setGeneratingWA] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Fetch all roles separately to avoid relationship requirement in schema cache
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Map roles to profiles
      const enrichedProfiles = (profiles || []).map(profile => ({
        ...profile,
        user_roles: (rolesData || [])
          .filter(r => r.user_id === profile.id)
          .map(r => ({ role: r.role }))
      }));

      setUsers(enrichedProfiles);

      const { data: promotersData } = await supabase.from('promoters').select('*').eq('active', true);
      setPromoters(promotersData || []);

      const { data: industriesData } = await supabase.from('industries').select('*').eq('active', true);
      setIndustries(industriesData || []);
      
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) {
      toast.error('Preencha nome e e-mail');
      return;
    }

    if (inviteRole === 'promoter' && !selectedPromoterId) {
      toast.error('Selecione um promotor para vincular');
      return;
    }

    if (inviteRole === 'industry' && !selectedIndustryId) {
      toast.error('Selecione uma indústria para vincular');
      return;
    }

    setInviting(true);
    try {
      await inviteUser({
        data: {
          email: inviteEmail,
          fullName: inviteName,
          role: inviteRole,
          promoterId: selectedPromoterId || undefined,
          industryId: selectedIndustryId || undefined,
        }
      });

      toast.success('Convite enviado com sucesso!');
      setIsInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao enviar convite: ' + error.message);
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateStatus = async (userId: string, status: 'active' | 'blocked' | 'pending') => {
    try {
      await updateUserStatus({ data: { userId, status } });
      toast.success('Status atualizado!');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser({ data: { userId: userToDelete.id } });
      toast.success('Usuário excluído!');
      setUserToDelete(null);
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const handleResendInvite = async (userId: string, email: string) => {
    try {
      const res: any = await resendInvite({ data: { userId, email } });
      if (res?.mode === 'manual_link' && res.actionLink) {
        await navigator.clipboard.writeText(res.actionLink).catch(() => {});
        toast.warning(res.message || 'Limite de e-mails atingido.', {
          description: 'Link de acesso copiado para a área de transferência. Envie manualmente ao promotor.',
          duration: 12000,
        });
      } else {
        toast.success('Novo convite enviado com sucesso!');
      }
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao reenviar convite: ' + error.message);
    }
  };


  const handleResetAccess = async (email: string) => {
    try {
      await requestPasswordReset({ data: { email } });
      toast.success('E-mail de redefinição de acesso enviado!');
    } catch (error: any) {
      toast.error('Erro ao solicitar redefinição: ' + error.message);
    }
  };

  const copyInviteLink = (email: string) => {
    // In a real app, this would be a unique link with a token
    const link = `${window.location.origin}/auth/reset-password?email=${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(link);
    toast.success('Link de convite copiado!');
  };

  const handleWhatsAppInvite = async () => {
    if (!whatsAppTarget) return;
    
    setGeneratingWA(true);
    try {
      const res: any = await generateWhatsAppInvite({ 
        data: { 
          userId: whatsAppTarget.id, 
          email: whatsAppTarget.email,
          promoterId: whatsAppTarget.promoter_id 
        } 
      });

      if (res.success && res.actionLink) {
        const message = `Olá, ${res.promoterName}! 👋\n\nVocê foi convidado para usar o Rota do Promotor.\n\nAcesse o link abaixo para criar sua senha, ver seu roteiro e instalar o aplicativo no seu celular:\n\n${res.actionLink}\n\nDepois de entrar, toque em “Instalar aplicativo” para deixar o Rota do Promotor na tela inicial do celular.`;
        
        const encodedMessage = encodeURIComponent(message);
        const waUrl = `https://wa.me/${res.phone}?text=${encodedMessage}`;
        
        window.open(waUrl, '_blank');
        toast.success('WhatsApp aberto com a mensagem pronta!');
      }
    } catch (error: any) {
      toast.error('Erro ao gerar convite WhatsApp: ' + error.message);
    } finally {
      setGeneratingWA(false);
      setWhatsAppTarget(null);
    }
  };

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
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Usuários e Acessos</h1>
          <p className="text-slate-500 text-sm">Gerencie permissões e convites do sistema.</p>
        </div>
        
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 w-full sm:w-auto">
              <UserPlus className="w-4 h-4 mr-2" /> Convidar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Convidar Novo Usuário</DialogTitle>
              <DialogDescription>
                Envie um convite por e-mail para um novo membro da equipe.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Perfil</Label>
                <Select value={inviteRole} onValueChange={(val: any) => setInviteRole(val)}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="promoter">Promotor</SelectItem>
                    <SelectItem value="industry">Indústria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {inviteRole === 'promoter' && (
                <div className="grid gap-2">
                  <Label htmlFor="promoter">Vincular a Promotor Cadastrado</Label>
                  <Select value={selectedPromoterId} onValueChange={setSelectedPromoterId}>
                    <SelectTrigger id="promoter">
                      <SelectValue placeholder="Selecione o promotor" />
                    </SelectTrigger>
                    <SelectContent>
                      {promoters
                        .filter(p => !users.some(u => u.promoter_id === p.id))
                        .map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} {p.region ? `(${p.region})` : ''}</SelectItem>
                        ))}
                      {promoters.filter(p => !users.some(u => u.promoter_id === p.id)).length === 0 && (
                        <SelectItem value="none" disabled>Nenhum promotor disponível</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedPromoterId && (
                    <div className="text-[10px] text-slate-500 mt-1 italic">
                      {promoters.find(p => p.id === selectedPromoterId)?.email} | {promoters.find(p => p.id === selectedPromoterId)?.phone}
                    </div>
                  )}
                </div>
              )}

              {inviteRole === 'industry' && (
                <div className="grid gap-2">
                  <Label htmlFor="industry">Vincular a Indústria Cadastrada</Label>
                  <Select value={selectedIndustryId} onValueChange={setSelectedIndustryId}>
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Selecione a indústria" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map(i => (
                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: João Silva" 
                  value={inviteName} 
                  onChange={e => setInviteName(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="joao@exemplo.com" 
                  value={inviteEmail} 
                  onChange={e => setInviteEmail(e.target.value)} 
                />
              </div>

              {inviteRole === 'admin' && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-700">Atenção: Perfis administradores têm acesso total ao sistema. Confirme antes de convidar.</p>
                </div>
              )}

              <DialogFooter>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold" disabled={inviting}>
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Enviar Convite'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                  <TableHead className="font-bold text-slate-700">Perfil / Vínculo</TableHead>
                  <TableHead className="font-bold text-slate-700">Status</TableHead>
                  <TableHead className="font-bold text-slate-700">Criado em</TableHead>
                  <TableHead className="font-bold text-slate-700">Último Acesso</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Carregando usuários...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 uppercase">
                            {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.full_name || 'Sem nome'}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {user.user_roles?.[0]?.role ? getRoleBadge(user.user_roles[0].role) : '—'}
                          {user.promoter_id && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase">
                              <LinkIcon className="w-2 h-2" /> {promoters.find(p => p.id === user.promoter_id)?.name || 'Promotor'}
                            </div>
                          )}
                          {user.industry_id && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase">
                              <LinkIcon className="w-2 h-2" /> {industries.find(i => i.id === user.industry_id)?.name || 'Indústria'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status || 'active')}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR }) : '—'}
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
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => copyInviteLink(user.email)}>
                              <Copy className="w-4 h-4 mr-2" /> Copiar Link de Convite
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer font-semibold text-green-600" 
                              onClick={() => {
                                if (!user.promoter_id) {
                                  toast.error('Este usuário não está vinculado a um promotor.');
                                  return;
                                }
                                setWhatsAppTarget(user);
                              }}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" /> Enviar convite por WhatsApp
                            </DropdownMenuItem>
                            {user.status === 'pending' ? (
                              <DropdownMenuItem className="cursor-pointer text-blue-600 font-semibold" onClick={() => handleResendInvite(user.id, user.email)}>
                                <RefreshCw className="w-4 h-4 mr-2" /> Reenviar Convite
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="cursor-pointer font-semibold text-amber-600" onClick={() => handleResetAccess(user.email)}>
                                <RefreshCw className="w-4 h-4 mr-2" /> Redefinir Acesso
                              </DropdownMenuItem>
                            )}
                            {user.status === 'blocked' ? (
                              <DropdownMenuItem className="cursor-pointer text-green-600 focus:text-green-700" onClick={() => handleUpdateStatus(user.id, 'active')}>
                                <UserCheck className="w-4 h-4 mr-2" /> Reativar Acesso
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="cursor-pointer text-amber-600 focus:text-amber-700" onClick={() => handleUpdateStatus(user.id, 'blocked')}>
                                <UserX className="w-4 h-4 mr-2" /> Bloquear Acesso
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700" onClick={() => setUserToDelete(user)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir Usuário
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
        </CardContent>
      </Card>

      <AlertDialog open={!!whatsAppTarget} onOpenChange={() => setWhatsAppTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Convite via WhatsApp</AlertDialogTitle>
            <AlertDialogDescription>
              Isso gerará um link de acesso seguro e abrirá o WhatsApp para enviar a mensagem para <strong>{whatsAppTarget?.full_name}</strong>.
              <br /><br />
              Telefone: {whatsAppTarget && promoters.find(p => p.id === whatsAppTarget.promoter_id)?.phone?.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4') || 'Não informado'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleWhatsAppInvite();
              }} 
              disabled={generatingWA}
              className="bg-green-600 hover:bg-green-700"
            >
              {generatingWA ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
              Gerar e Abrir WhatsApp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente o acesso do usuário <strong>{userToDelete?.full_name}</strong>. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
