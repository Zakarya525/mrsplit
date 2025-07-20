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
        try {
          const { data: userRows, error: userFetchError } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();
          
          if (userFetchError && userFetchError.code === 'PGRST116') {
            // User doesn't exist, create them
            const { error: insertError } = await supabase.from('users').insert({
              id: user.id,
              email: user.email!,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            });
            
            if (insertError) {
              console.error('Error creating user profile:', insertError);
            }
          }
        } catch (error) {
          console.error('Error ensuring user row:', error);
        }
      }
    };
    ensureUserRow();
  }, [user]);

  const signUp = async (email: string, password: string, name: string) => {
    try {
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
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          name,
        });
        
        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }

      return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (result.data.user && !result.error) {
        // Ensure user profile exists
        try {
          const { data: userRows, error: userFetchError } = await supabase
            .from('users')
            .select('id')
            .eq('id', result.data.user.id)
            .single();
            
          if (userFetchError && userFetchError.code === 'PGRST116') {
            // Insert user profile if missing
            const { error: insertError } = await supabase.from('users').insert({
              id: result.data.user.id,
              email: result.data.user.email!,
              name:
                result.data.user.user_metadata?.name ||
                result.data.user.email?.split('@')[0] ||
                'User',
            });
            
            if (insertError) {
              console.error('Error creating user profile:', insertError);
            }
          }
        } catch (profileError) {
          console.error('Error checking user profile:', profileError);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: { user: null, session: null }, error };
    }
  };

  const signOut = async () => {
    try {
      return await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      return await supabase.auth.resetPasswordForEmail(email);
    } catch (error) {
      console.error('Reset password error:', error);
      return { error };
    }
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
