import { useState } from "react";
import { motion } from "framer-motion";
import { Star, ShieldCheck, Zap, Globe, Smartphone, Check, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Subscribe() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          is_subscriber: true,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Welcome to TrustLink Pro!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to upgrade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 pt-32 pb-32">
      <div className="text-center mb-16">
        <Badge className="mb-4 h-8 px-4 text-sm font-bold bg-primary/10 text-primary border-primary/20">
          TrustLink Premium
        </Badge>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
          Unlock the Full Power <br />of <span className="text-primary italic">TrustLink Pro.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Join the next generation of merchants across Africa with unlimited escrow links, 
          advanced payout methods, and priority settlements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-8">
          {[
            { icon: Zap, title: "Unlimited Transactions", desc: "Create as many escrow links as you need with zero platform limits." },
            { icon: Globe, title: "Multi-Chain Access", desc: "Full support for Base, Avalanche, and Lisk networks." },
            { icon: Smartphone, title: "Advanced Payouts", desc: "Withdraw directly to Phone, Paybill, or Till numbers." },
            { icon: ShieldCheck, title: "Pro Dashboard", desc: "Advanced analytics and transaction management tools." },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-black text-lg mb-1">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-2 border-primary shadow-2xl shadow-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-bl-2xl">
              Best Value
            </div>
            <CardHeader className="p-10 pb-6">
              <CardTitle className="text-2xl font-black">Professional Merchant</CardTitle>
              <CardDescription>Everything you need to scale your business.</CardDescription>
              <div className="pt-8 flex items-baseline gap-1">
                <span className="text-5xl font-black italic text-primary">$29</span>
                <span className="text-muted-foreground font-bold">/month</span>
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-0">
              <ul className="space-y-4 mb-10">
                {["Unlimited Escrow Links", "Instant M-Pesa Off-ramps", "Custom Paybill/Till Integration", "Priority Support", "Early Access Features"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary stroke-[4]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20"
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "Get Started Pro"}
                {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-6 font-medium uppercase tracking-widest">
                Secure payment via USDC or Card
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="mt-24 text-center">
        <p className="text-muted-foreground">
          Already have a business account? <button onClick={() => navigate("/")} className="text-primary font-bold hover:underline">Go to Dashboard</button>
        </p>
      </div>
    </div>
  );
}