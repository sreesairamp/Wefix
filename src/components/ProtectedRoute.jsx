import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ProtectedRoute({ children, requireProfile = false }) {
  const { user, loading } = useAuth();
  const [profileComplete, setProfileComplete] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      if (requireProfile) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          setProfileComplete(data && data.full_name && data.full_name.trim().length > 0);
        } catch (err) {
          console.error("Error checking profile:", err);
          setProfileComplete(false);
        }
      } else {
        setProfileComplete(true);
      }
      setChecking(false);
    };

    if (!loading) {
      checkProfile();
    }
  }, [user, loading, requireProfile]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireProfile && !profileComplete) {
    return <Navigate to="/profile?complete=true" replace />;
  }

  return children;
}
