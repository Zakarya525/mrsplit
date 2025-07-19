import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Ensure user row exists for all auth flows (sign in, OAuth, session restore)
    const ensureUserRow = async () => {
      if (user) {
        const { data: userRows, error: userFetchError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();
        if (userFetchError || !userRows) {
          await supabase.from('users').insert({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || user.email || 'User',
          });
        }
      }
    };
    ensureUserRow();
  }, [user]);

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (data.user && !error) {
      // Create user profile
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        name,
      });
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (result.data.user && !result.error) {
      // Ensure user profile exists
      const { data: userRows, error: userFetchError } = await supabase
        .from('users')
        .select('id')
        .eq('id', result.data.user.id)
        .single();
      if (userFetchError || !userRows) {
        // Insert user profile if missing
        await supabase.from('users').insert({
          id: result.data.user.id,
          email: result.data.user.email!,
          name:
            result.data.user.user_metadata?.name ||
            result.data.user.email ||
            'User',
        });
      }
    }
    return result;
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email);
  };

  return {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
}
