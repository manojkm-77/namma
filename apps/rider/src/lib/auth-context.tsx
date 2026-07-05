import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode
} from 'react';
import { supabase } from '@namma/api';
import { Session, User } from '@supabase/supabase-js';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setIsLoading(false);
    }).catch(err => {
      console.error('[Supabase Auth getSession Error]:', err);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Supabase Auth signOut Exception]:', err);
    }
  }, []);

  const isAuthenticated = !!session?.user;
  const user = session?.user ?? null;

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, user, session, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>. Wrap _layout.tsx with AuthProvider.');
  }
  return ctx;
}

