import { useState, useEffect } from 'react';
import supabase from '../config/supabaseClient';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'student' | 'teacher' | 'admin' | 'parent' | string;
}

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true);
        
        // Get authenticated session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error('Session error: ' + sessionError.message);
        }
        
        if (!session) {
          console.log('No active session found');
          setUser(null);
          setLoading(false);
          return;
        }
        
        const userId = session.user?.id;
        
        if (!userId) {
          throw new Error('No user ID found in session');
        }
        
        // Get additional user data from profiles table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, firstName, lastName, role')
          .eq('id', userId)
          .single();
        
        if (userError) {
          // If user profile query fails, create minimal user data from auth
          console.warn('Failed to fetch user profile, using auth data:', userError);
          setUser({
            id: userId,
            email: session.user?.email || '',
            role: 'student' // Default role if not found
          });
        } else {
          // Set full user data
          setUser(userData as User);
        }
      } catch (err) {
        console.error('Error in useUser hook:', err);
        setError(err instanceof Error ? err.message : 'Unknown error in useUser hook');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Set up auth state change subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        getUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, error };
}; 