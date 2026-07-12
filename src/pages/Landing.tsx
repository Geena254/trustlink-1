import { motion } from "framer-motion";
import { Shield, ArrowRight, ShieldCheck, Globe, Zap, Smartphone, Sparkles, Code2, Key, Webhook, Terminal, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard", { replace: true });
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return null;

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
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
                  Try Now — Create a Link
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

        {/* Hero Background */}
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

      {/* ── Core Features ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-muted/30" id="features">
        <div className="container px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Everything you need to trade safely</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Built for merchants, freelancers, and businesses across Africa.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "On-Chain Escrow",
                desc: "Funds are locked in smart contracts until delivery is confirmed by the buyer. No counterparty risk.",
              },
              {
                icon: Smartphone,
                title: "Instant Off-ramp",
                desc: "Automated withdrawal to M-Pesa as soon as funds are released. Supports phone, Paybill, and Till.",
              },
              {
                icon: Globe,
                title: "Multi-Chain",
                desc: "Support for Base, Avalanche, and Lisk. Secure your payments on the fastest networks.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2.5rem] bg-background border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Public Pages — no sign-in needed ─────────────────────────────── */}
      <section className="py-24" id="try">
        <div className="container px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 mb-5">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-widest">No Sign-up Required</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Try it right now</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              These pages work without an account — share them freely with buyers or embed them in your own apps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Create Escrow */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group p-8 rounded-[2.5rem] bg-background border-2 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl flex flex-col"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-black mb-3">Create Escrow Link</h3>
              <p className="text-muted-foreground leading-relaxed flex-1 mb-6">
                Generate a secure, shareable payment link in seconds. No wallet or account required to get started — you'll be prompted to sign up only when you confirm.
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/50 px-3 py-2 rounded-xl mb-6">
                <span className="text-primary font-bold">GET</span>
                <span>/create</span>
              </div>
              <Link to="/create">
                <Button className="w-full h-12 rounded-2xl font-bold gap-2">
                  Create a Link
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Pay Escrow */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group p-8 rounded-[2.5rem] bg-background border-2 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl flex flex-col"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/5 flex items-center justify-center mb-6 group-hover:bg-blue-500/10 transition-colors">
                <Smartphone className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black mb-3">Pay via Escrow Link</h3>
              <p className="text-muted-foreground leading-relaxed flex-1 mb-6">
                Buyers receive a link and pay via M-Pesa STK push. Funds are locked on-chain until they confirm receipt. No crypto knowledge needed.
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/50 px-3 py-2 rounded-xl mb-6">
                <span className="text-blue-600 font-bold">GET</span>
                <span>/pay/:id</span>
              </div>
              <Button variant="outline" className="w-full h-12 rounded-2xl font-bold gap-2" disabled>
                Shared by merchant
                <ExternalLink className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Developer API Section ─────────────────────────────────────────── */}
      <section className="py-24 bg-muted/30" id="api">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
                <Code2 className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-widest">REST API</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">
                Embed TrustLink<br />in your own app
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                A full REST API lets you create escrows, track status, and trigger M-Pesa payouts from your own backend. No UI required.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  { icon: Key, title: "API Key Auth", desc: "Test and live keys. Never expires until you revoke it." },
                  { icon: Webhook, title: "Webhook Events", desc: "Push notifications to your server on every status change." },
                  { icon: Terminal, title: "TypeScript SDK", desc: "npm install @trustlink/sdk — typed client, zero config." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Link to="/developers">
                  <Button size="lg" className="h-12 px-8 rounded-2xl font-bold gap-2">
                    View API Docs
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="outline" size="lg" className="h-12 px-8 rounded-2xl font-bold">
                    Get API Key
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right: code preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="bg-zinc-900 px-4 py-3 flex items-center gap-2 border-b border-zinc-800">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-zinc-500 text-xs font-mono ml-2">escrow.ts</span>
              </div>
              <pre className="bg-zinc-950 p-6 text-sm font-mono leading-loose overflow-x-auto">
                <code>
                  <span className="text-zinc-500">{"// npm install @trustlink/sdk\n"}</span>
                  <span className="text-blue-400">{"import"}</span>
                  <span className="text-zinc-100">{" { TrustLink } "}</span>
                  <span className="text-blue-400">{"from"}</span>
                  <span className="text-green-400">{' "@trustlink/sdk";\n\n'}</span>
                  <span className="text-blue-400">{"const"}</span>
                  <span className="text-zinc-100">{" tl = "}</span>
                  <span className="text-yellow-400">{"new"}</span>
                  <span className="text-zinc-100">{" TrustLink({\n"}</span>
                  <span className="text-zinc-100">{"  apiKey: "}</span>
                  <span className="text-green-400">{"process.env.TRUSTLINK_KEY\n"}</span>
                  <span className="text-zinc-100">{"});\n\n"}</span>
                  <span className="text-blue-400">{"const"}</span>
                  <span className="text-zinc-100">{" escrow = "}</span>
                  <span className="text-blue-400">{"await"}</span>
                  <span className="text-zinc-100">{" tl.escrows."}</span>
                  <span className="text-yellow-400">{"create"}</span>
                  <span className="text-zinc-100">{"({\n"}</span>
                  <span className="text-zinc-100">{"  amount: "}</span>
                  <span className="text-orange-400">{"50"}</span>
                  <span className="text-zinc-100">{",\n"}</span>
                  <span className="text-zinc-100">{"  chain: "}</span>
                  <span className="text-green-400">{'"base"'}</span>
                  <span className="text-zinc-100">{",\n"}</span>
                  <span className="text-zinc-100">{"  payoutMethod: "}</span>
                  <span className="text-green-400">{'"phone"'}</span>
                  <span className="text-zinc-100">{",\n"}</span>
                  <span className="text-zinc-100">{"  mpesaPhone: "}</span>
                  <span className="text-green-400">{'"254712345678"\n'}</span>
                  <span className="text-zinc-100">{"});\n\n"}</span>
                  <span className="text-zinc-500">{"// Share with buyer:\n"}</span>
                  <span className="text-zinc-100">{"console."}</span>
                  <span className="text-yellow-400">{"log"}</span>
                  <span className="text-zinc-100">{"(escrow."}</span>
                  <span className="text-blue-300">{"paymentUrl"}</span>
                  <span className="text-zinc-100">{");"}</span>
                </code>
              </pre>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container px-4 mx-auto">
          <div className="bg-primary rounded-[3rem] p-12 lg:p-24 text-center text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-600 opacity-90" />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-black tracking-tight mb-8">
                Ready to secure your <br />next transaction?
              </h2>
              <p className="text-xl text-primary-foreground/70 mb-12 max-w-xl mx-auto">
                Join merchants across Africa using TrustLink to build trust and grow their business.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/create">
                  <Button size="lg" variant="secondary" className="h-16 px-12 rounded-2xl text-lg font-bold">
                    Create Your First Link
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/developers">
                  <Button size="lg" variant="ghost" className="h-16 px-12 rounded-2xl text-lg font-bold text-white hover:bg-white/10">
                    View API Docs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-border mt-auto">
        <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold tracking-tight italic">TrustLink</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground font-medium flex-wrap justify-center">
            <Link to="/create" className="hover:text-primary transition-colors">Create Escrow</Link>
            <Link to="/developers" className="hover:text-primary transition-colors">API Docs</Link>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 TrustLink Protocol. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
