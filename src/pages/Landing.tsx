import { motion } from "framer-motion";
import { Shield, ArrowRight, ShieldCheck, Globe, Zap, Smartphone, Wallet, Lock, Sparkles, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // If user is already logged in, redirect to dashboard
      // However, for pure landing page, we could stay here, but usually dashboard is better.
      if (session) {
        navigate("/dashboard", { replace: true });
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-40 overflow-hidden">
        <div className="container px-4 mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-widest">Next-Gen Escrow Protocol</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-black tracking-tighter mb-8 leading-[1.1]"
            >
              The Secure Bridge to <br />
              <span className="text-primary italic">Global Trade.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Secure payment links with on-chain escrow protection. 
              Get paid in USDC and withdraw instantly to M-Pesa. 
              Zero trust, full security.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/create">
                <Button size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/20">
                  Try Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold">
                  Get Started
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Hero Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 -z-20 overflow-hidden"
        >
          <img 
            src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/fc1f5627-2238-4cd5-8bc8-698168294c49/landing-hero-dala-039f741f-1775406097150.webp" 
            alt="Hero Background"
            className="w-full h-full object-cover opacity-10"
          />
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30" id="features">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "On-Chain Escrow",
                desc: "Funds are locked in smart contracts until delivery is confirmed by the buyer.",
                color: "blue"
              },
              {
                icon: Smartphone,
                title: "Instant Off-ramp",
                desc: "Automated withdrawal to M-Pesa as soon as funds are released. No manual delays.",
                color: "green"
              },
              {
                icon: Globe,
                title: "Multi-Chain",
                desc: "Support for Base, Avalanche, and Lisk. Secure your payments on the fastest networks.",
                color: "purple"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2.5rem] bg-background border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-6`}>
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container px-4 mx-auto">
          <div className="bg-primary rounded-[3rem] p-12 lg:p-24 text-center text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-600 opacity-90" />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-black tracking-tight mb-8">
                Ready to secure your <br />next transaction?
              </h2>
              <p className="text-xl text-primary-foreground/70 mb-12 max-w-xl mx-auto">
                Join thousands of merchants across Africa using TrustLink to build trust and grow their business.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/create">
                  <Button size="lg" variant="secondary" className="h-16 px-12 rounded-2xl text-lg font-bold">
                    Create Your First Link
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="ghost" className="h-16 px-12 rounded-2xl text-lg font-bold text-white hover:bg-white/10">
                    Sign Up Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border mt-auto">
        <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold tracking-tight italic">TrustLink</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground font-medium">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 TrustLink Protocol. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}