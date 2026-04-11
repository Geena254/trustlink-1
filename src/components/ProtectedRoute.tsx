import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Profile } from "@/types/escrow";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

export function ProtectedRoute({ children, requireSubscription = false }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkAuthAndProfile = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;
        
        if (mounted) {
          setAuthenticated(!!session);
          
          if (session) {
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();
            
            if (profileError && profileError.code !== "PGRST116") {
              console.error("Profile fetch error:", profileError);
            }
            
            if (mounted) {
              setProfile(profileData as Profile || null);
            }
          }
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Auth check failed:", err);
        if (mounted) {
          setError(err.message || "Failed to connect to authentication service.");
          setLoading(false);
        }
      }
    };

    checkAuthAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setAuthenticated(!!session);
        if (!session) {
          setProfile(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Allow access to Create Escrow page unconditionally
  if (location.pathname === "/create") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card p-8 rounded-3xl border border-destructive/20 shadow-2xl text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-black mb-2">Connection Error</h2>
          <p className="text-muted-foreground mb-8">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full h-12 rounded-xl font-bold">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireSubscription && !profile?.is_subscriber) {
    return <Navigate to="/subscribe" replace />;
  }

  return <>{children}</>;
}