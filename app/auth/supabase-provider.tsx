'use client';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/client/client';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect } from 'react';

type SupabaseContext = {
  session: Session | null;
  supabase: SupabaseClient;
};

type SupabaseProviderProps = {
  children: React.ReactNode;
  session?: Session | null; // Optional session prop
};

export const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({
  children,
  session = null // Set a default value
}: SupabaseProviderProps) {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_, _session) => {
      if (_session?.access_token !== session?.access_token) {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, session?.access_token, supabase.auth]);

  return (
    <Context.Provider value={{ supabase, session }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Database = any,
  SchemaName extends string & keyof Database = 'public' extends keyof Database
    ? 'public'
    : string & keyof Database
>() => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }
  return context.supabase as SupabaseClient<Database, SchemaName>;
};

export const useSession = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSession must be used inside SupabaseProvider');
  }
  return context.session;
};
