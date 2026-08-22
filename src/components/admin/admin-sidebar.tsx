import { Link, useLocation } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { 
  LogOut, Users, Store, Factory, FileCheck, 
  AlertCircle, BarChart3, Map, Calendar, 
  FileText, Download, CreditCard, ChevronRight,
  Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

function SidebarItem({ to, icon: Icon, label, active, onClick, className }: SidebarItemProps) {
  return (
    <Link to={to} onClick={onClick} className="block w-full">
      <Button 
        variant="ghost" 
        className={cn(
          "w-full justify-start font-medium transition-all duration-200",
          active 
            ? "bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300" 
            : "text-slate-400 hover:bg-slate-800/50 hover:text-white",
          className
        )}
      >
        <Icon className={cn("mr-3 h-5 w-5", active ? "text-blue-400" : "text-slate-500")} />
        {label}
        {active && <ChevronRight className="ml-auto h-4 w-4" />}
      </Button>
    </Link>
  );
}

export function AdminSidebar({ className }: { className?: string }) {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { to: '/admin', icon: BarChart3, label: 'Dashboard Geral' },
    { to: '/admin/routes', icon: Map, label: 'Rotas e Roteiros' },
    { to: '/admin/visits', icon: FileCheck, label: 'Visitas para Conferência' },
    { to: '/admin/occurrences', icon: AlertCircle, label: 'Ocorrências' },
  ];

  const cadastroItems = [
    { to: '/admin/promoters', icon: Users, label: 'Promotores' },
    { to: '/admin/stores', icon: Store, label: 'Lojas' },
    { to: '/admin/industries', icon: Factory, label: 'Indústrias' },
  ];

  const adminItems = [
    { to: '/admin/users', icon: Users, label: 'Usuários e Acessos' },
    { to: '/admin/reports', icon: FileText, label: 'Relatórios Mensais' },
    { to: '/admin/exports', icon: Download, label: 'Exportações' },
    { to: '/admin/billing', icon: CreditCard, label: 'Cobranças' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      <div className="p-6 border-b border-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Map className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Rota do Promotor</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Painel Administrativo</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-thin scrollbar-thumb-slate-800">
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Principal</p>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <SidebarItem 
                key={item.to} 
                {...item} 
                active={location.pathname === item.to}
                onClick={() => setIsOpen(false)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Cadastros</p>
          <div className="space-y-1">
            {cadastroItems.map((item) => (
              <SidebarItem 
                key={item.to} 
                {...item} 
                active={location.pathname === item.to}
                onClick={() => setIsOpen(false)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Administração</p>
          <div className="space-y-1">
            {adminItems.map((item) => (
              <SidebarItem 
                key={item.to} 
                {...item} 
                active={location.pathname === item.to}
                onClick={() => setIsOpen(false)}
              />
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-900 bg-slate-950/50">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-red-900/20 hover:text-red-400 transition-colors" 
          onClick={() => signOut()}
        >
          <LogOut className="mr-3 h-5 w-5" /> Sair
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Trigger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white border-slate-200 shadow-sm">
              <Menu className="h-5 w-5 text-slate-600" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-none">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className={cn("w-72 hidden md:flex flex-col fixed inset-y-0 z-40 border-r border-slate-900 shadow-2xl", className)}>
        <SidebarContent />
      </aside>
    </>
  );
}
