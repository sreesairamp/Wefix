import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { createUserProfile } from "../utils/createUserProfile";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check active session on refresh
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user ?? null;
      
      // If user exists, ensure profile exists
      if (user) {
        try {
          await createUserProfile(user);
        } catch (err) {
          console.error("Error checking/creating profile:", err);
        }
      }
      
      setUser(user);
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      
      // Ensure profile exists when auth state changes (e.g., after OAuth callback)
      if (user) {
        try {
          await createUserProfile(user);
        } catch (err) {
          console.error("Error checking/creating profile:", err);
        }
      }
      
      setUser(user);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
