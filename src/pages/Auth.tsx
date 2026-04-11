import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, Lock, ArrowRight, Github, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [initError, setInitError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || "/";

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) navigate(from, { replace: true });
      } catch (err: any) {
        console.error("Supabase connection issue:", err);
        // We don't necessarily set initError here because the user might just be unauthenticated
        // Only set it if it's a persistent connection error
        if (err.message?.includes("fetch")) {
          setInitError("Unable to connect to the authentication server. Please check your internet connection or configuration.");
        }
      }
    };
    checkUser();
  }, [navigate, from]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate(from, { replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        
        if (data.user && !data.session) {
          toast.success("Check your email for the confirmation link!");
        } else {
          toast.success("Account created successfully!");
          navigate(from, { replace: true });
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full bg-card p-10 rounded-3xl shadow-2xl border border-destructive/10 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h1 className="text-2xl font-black mb-4 text-foreground">Service Unavailable</h1>
          <p className="text-muted-foreground mb-8">{initError}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full h-12 rounded-xl">
            Refresh Site
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col relative overflow-hidden bg-primary p-12 text-primary-foreground">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-lg"
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight italic">Dala Escrow</span>
          </div>
          
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            The Secure Way to Pay and Get Paid.
          </h1>
          <p className="text-xl text-primary-foreground/80 mb-8 leading-relaxed">
            Bridge the gap between blockchain security and local liquidity. Trusted by merchants across Africa.
          </p>
          
          <div className="space-y-4">
            {[
              "Automated M-Pesa Off-ramp",
              "Multi-chain Support (Base, Avalanche, Lisk)",
              "Zero-Trust Escrow Smart Contracts"
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3 text-lg font-medium"
              >
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
                {feature}
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        <img 
          src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/fc1f5627-2238-4cd5-8bc8-698168294c49/auth-background-02568445-1775404615876.webp" 
          alt="Secure Escrow"
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/80 to-transparent" />
      </div>

      <div className="flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="space-y-2 p-0 mb-8">
              <div className="lg:hidden flex items-center gap-2 mb-4">
                <Shield className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold tracking-tight italic">Dala Escrow</span>
              </div>
              <CardTitle className="text-3xl font-extrabold tracking-tight">
                {isLogin ? "Welcome back" : "Create an account"}
              </CardTitle>
              <CardDescription className="text-base">
                {isLogin 
                  ? "Enter your credentials to access your dashboard" 
                  : "Join thousands of merchants securing their transactions"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleAuth} className="space-y-5">
                <AnimatePresence mode="popLayout">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-12 bg-muted/50 border-transparent focus:bg-background"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 pl-10 bg-muted/50 border-transparent focus:bg-background"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {isLogin && (
                      <button type="button" className="text-xs text-primary font-medium hover:underline">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pl-10 bg-muted/50 border-transparent focus:bg-background"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <Button 
                  className="w-full h-12 text-lg shadow-xl shadow-primary/20" 
                  type="submit" 
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? "Sign In" : "Get Started"}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-8 text-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <span className="relative px-4 bg-background text-xs text-muted-foreground uppercase tracking-widest">
                  Or continue with
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Button variant="outline" className="h-12 font-medium" onClick={() => toast.info("Coming soon!")}>
                  <Github className="mr-2 h-5 w-5" />
                  GitHub
                </Button>
              </div>
            </CardContent>
            <CardFooter className="p-0 mt-8 flex justify-center">
              <p className="text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary font-bold hover:underline"
                >
                  {isLogin ? "Create account" : "Sign in"}
                </button>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}