import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightLeft, Smartphone, ShieldCheck, CheckCircle2, History, Wallet, ArrowUpRight, Loader2, Info, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Escrow, Profile } from "@/types/escrow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export default function Withdraw() {
  const [completedEscrows, setCompletedEscrows] = useState<Escrow[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile to check M-Pesa setup
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profileData) setProfile(profileData);

        const { data, error } = await supabase
          .from("escrows")
          .select("*")
          .eq("status", "completed")
          .order("updated_at", { ascending: false });

        if (error) throw error;
        setCompletedEscrows(data || []);
      } catch (error) {
        toast.error("Failed to load completed transactions");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleWithdraw = async (escrow: Escrow) => {
    if (!profile?.mpesa_phone && !escrow.mpesa_phone) {
      toast.error("M-Pesa phone number not configured");
      return;
    }

    setProcessing(escrow.id);
    try {
      // In a real app, this would call the Edge Function for MPesa payment
      const { error } = await supabase
        .from("escrows")
        .update({ status: "offramp_initiated" })
        .eq("id", escrow.id);

      if (error) throw error;

      toast.success(`Withdrawal to ${escrow.mpesa_phone} initiated!`);
      setCompletedEscrows(prev => prev.filter(e => e.id !== escrow.id));
      
      // Simulate backend processing and callback
      setTimeout(async () => {
        await supabase
          .from("escrows")
          .update({ status: "offramp_completed" })
          .eq("id", escrow.id);
        toast.success(`M-Pesa payout for ${escrow.amount} USDC confirmed!`);
      }, 5000);

    } catch (error) {
      toast.error("Withdrawal failed. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  const totalAvailable = completedEscrows.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="container max-w-6xl mx-auto px-4 pt-24 pb-32">
      <header className="mb-12">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Instant Liquidity</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">M-Pesa Off-ramp</h1>
          <p className="text-muted-foreground mt-2 text-lg max-w-2xl">Convert your digital USDC into local currency instantly. Funds are sent directly to your registered phone number.</p>
        </motion.div>
      </header>

      {!loading && !profile?.mpesa_phone && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 p-6 bg-yellow-500/10 border-2 border-dashed border-yellow-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="font-bold text-yellow-800">M-Pesa Number Not Set</p>
              <p className="text-sm text-yellow-700/70">Configure your default payout number in settings for faster withdrawals.</p>
            </div>
          </div>
          <Link to="/settings">
            <Button variant="outline" className="border-yellow-500/20 bg-yellow-500/5 text-yellow-800 hover:bg-yellow-500/10 h-12 px-8 rounded-xl">Setup Now</Button>
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <Card className="bg-primary border-none shadow-2xl shadow-primary/20 text-primary-foreground rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">Available for Payout</CardTitle>
              <div className="text-5xl font-black pt-4 flex items-baseline gap-2">
                {totalAvailable.toFixed(2)}
                <span className="text-xl font-medium opacity-60">USDC</span>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="flex items-center gap-3 text-sm bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                <ShieldCheck className="w-5 h-5 text-white" />
                <span className="font-bold">Verified & Ready to Withdraw</span>
              </div>
            </CardContent>
          </Card>

          <div className="p-8 bg-muted/50 rounded-[2.5rem] border border-border/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <Info className="w-24 h-24" />
            </div>
            <h4 className="font-black text-xl mb-6 flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-primary" />
              Process Workflow
            </h4>
            <ul className="space-y-6 text-sm text-muted-foreground font-medium">
              <li className="flex gap-4">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold italic">01</span>
                <span>Select a completed transaction from the list on the right.</span>
              </li>
              <li className="flex gap-4">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold italic">02</span>
                <span>The TrustLink Protocol exchanges USDC for KES at real-time rates.</span>
              </li>
              <li className="flex gap-4">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold italic">03</span>
                <span>Funds arrive in your M-Pesa wallet in under 5 minutes.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-none shadow-xl bg-card rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black">Ready Transactions</CardTitle>
                <CardDescription className="text-base">Escrows where delivery has been confirmed by the buyer.</CardDescription>
              </div>
              <History className="w-6 h-6 text-muted-foreground opacity-30" />
            </CardHeader>
            <CardContent className="p-8">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-[2rem]" />)}
                </div>
              ) : completedEscrows.length > 0 ? (
                <div className="space-y-4">
                  <AnimatePresence>
                    {completedEscrows.map((escrow) => (
                      <motion.div 
                        key={escrow.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-muted/30 hover:bg-muted/50 rounded-[2rem] border border-border/50 transition-all group gap-6"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Wallet className="w-8 h-8 text-primary" />
                          </div>
                          <div>
                            <div className="text-2xl font-black">{escrow.amount} {escrow.currency}</div>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2 font-bold uppercase tracking-widest">
                              <Smartphone className="w-3 h-3" />
                              To: {escrow.mpesa_phone}
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="lg" 
                          onClick={() => handleWithdraw(escrow)}
                          disabled={!!processing}
                          className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/10 text-lg font-bold group"
                        >
                          {processing === escrow.id ? (
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                          ) : (
                            <>
                              Withdraw
                              <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/50">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <p className="text-muted-foreground font-bold text-lg">No transactions ready for withdrawal.</p>
                  <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto mt-2">When buyers confirm delivery, their payments will appear here automatically.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-24 relative rounded-[3rem] overflow-hidden h-64 border border-border group">
        <img 
          src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/fc1f5627-2238-4cd5-8bc8-698168294c49/payment-success-6aeaa050-1775403907114.webp" 
          alt="Payment Success"
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute bottom-10 left-10">
          <h3 className="text-3xl font-black mb-1">Global Trade, Local Payouts</h3>
          <p className="text-muted-foreground font-medium">Powering the next generation of commerce in Africa.</p>
        </div>
      </div>
    </div>
  );
}