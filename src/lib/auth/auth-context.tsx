import { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { clearUserOfflineData } from '@/lib/offline';
import type { User, Session } from '@supabase/supabase-js';

type AppRole = 'admin' | 'promoter' | 'industry';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  previewPromoter: { id: string; name: string } | null;
  setPreviewPromoter: (promoter: { id: string; name: string } | null) => void;
}

// A safe default keeps consumers rendering (in a loading state) even if they
// mount in a module/render context where the provider isn't visible yet
// (e.g. code-split route components during hydration).
const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  role: null,
  profile: null,
  loading: true,
  signOut: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchRole(userId: string) {
    try {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setRole(data?.role as AppRole);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  useEffect(() => {
    // Initial check
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await Promise.all([
            fetchRole(session.user.id),
            fetchProfile(session.user.id)
          ]);
        }
      } catch (e) {
        console.error('Session check error:', e);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setLoading(true);
        await Promise.all([
          fetchRole(session.user.id),
          fetchProfile(session.user.id)
        ]);
        setLoading(false);
      } else {
        setRole(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Clean up sensitive local data
    if (user?.id) {
      await clearUserOfflineData(user.id);
    }
    
    localStorage.removeItem('sb-' + (import.meta.env['VITE_SUPABASE_URL']?.split('.')[0].split('//')[1] || '') + '-auth-token');
    sessionStorage.clear();
    
    // Clear all non-essential items
    const keysToKeep = ['pwa-installed', 'theme'];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    }

    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
