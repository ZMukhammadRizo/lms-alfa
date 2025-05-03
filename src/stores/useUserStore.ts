import { create } from 'zustand';
import { supabase } from '../services/supabaseClient'; // Adjust path if necessary
import { User } from '@supabase/supabase-js'; // Supabase user type

// Define and EXPORT the state structure
export interface UserState {
  user: User | null;
  role: string | null; // Store user role (e.g., 'parent', 'admin', etc.)
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setRole: (role: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchUserSession: () => Promise<void>; // Function to check session on load
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  role: null,
  isLoading: true, // Start loading initially to check session
  error: null,

  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Fetch user session (e.g., on app startup)
  fetchUserSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      const currentUser = session?.user ?? null;
      set({ user: currentUser });
      
      // Fetch user role from your database if user exists
      if (currentUser) {
         // Example: Fetch role from 'users' table based on user.id
         // Replace with your actual logic to get the role
         const { data: userData, error: userError } = await supabase
           .from('users') // Your user profile/metadata table
           .select('role')
           .eq('id', currentUser.id)
           .single();

         if (userError) {
             console.error("Error fetching user role:", userError);
             // Handle error - maybe logout user or set default role?
             set({ role: null }); 
         } else {
             set({ role: userData?.role || null });
         }
      } else {
          set({ role: null }); // No user, no role
      }
      
    } catch (error: any) {
      console.error('Error fetching user session:', error);
      set({ error: error.message || 'Failed to fetch session', user: null, role: null });
    } finally {
      set({ isLoading: false });
    }
  },

  // Logout function
  logout: async () => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error logging out:", error);
        set({ error: error.message, isLoading: false });
    } else {
        set({ user: null, role: null, isLoading: false, error: null });
    }
  },
}));

// Optional: Call fetchUserSession when the app initializes
// This depends on your app structure, might be called in App.tsx or similar
// useUserStore.getState().fetchUserSession(); 