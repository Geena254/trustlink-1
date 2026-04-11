import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, Wallet, Check, ChevronLeft, Loader2, Sparkles, Copy, Share2, Smartphone, Landmark, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { BlockchainChain, Profile, PayoutMethod } from "@/types/escrow";
import { ShareEscrow } from "@/components/ShareEscrow";

const networks: { id: BlockchainChain; name: string; icon: string; color: string }[] = [
  { id: "base", name: "Base", icon: "🔵", color: "blue" },
  { id: "avalanche", name: "Avalanche", icon: "🔺", color: "red" },
  { id: "lisk", name: "Lisk", icon: "💎", color: "sky" },
];

const payoutMethods: { id: PayoutMethod; name: string; icon: any; desc: string }[] = [
  { id: "phone", name: "Phone Number", icon: Smartphone, desc: "Direct STK/Payment to your phone" },
  { id: "paybill", name: "Paybill", icon: Landmark, desc: "Business Paybill number" },
  { id: "till", name: "Buy Goods Till", icon: CreditCard, desc: "Merchant Till number" },
];

export default function CreateEscrow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdEscrow, setCreatedEscrow] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    chain: "base" as BlockchainChain,
    payout_method: "phone" as PayoutMethod,
    mpesa_phone: "",
    paybill: "",
    till_number: "",
    seller_wallet: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) {
          setProfile(data);
          setFormData(prev => ({
            ...prev,
            mpesa_phone: data.mpesa_phone || "",
            paybill: data.paybill || "",
            till_number: data.till_number || "",
          }));
        }
      }
    }
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.info("Almost there! Please log in or sign up to finalize your escrow link.");
        navigate("/auth", { state: { from: "/create" } });
        return;
      }

      const payoutValue = 
        formData.payout_method === 'phone' ? formData.mpesa_phone :
        formData.payout_method === 'paybill' ? formData.paybill :
        formData.till_number;

      if (!payoutValue) {
        toast.error(`Please provide your ${formData.payout_method} details`);
        return;
      }

      const { data, error } = await supabase.from("escrows").insert({
        seller_id: user.id,
        amount: parseFloat(formData.amount),
        currency: "USDC",
        chain: formData.chain,
        payout_method: formData.payout_method,
        mpesa_phone: formData.mpesa_phone,
        paybill: formData.paybill,
        till_number: formData.till_number,
        seller_wallet: formData.seller_wallet,
        status: "pending",
      }).select().single();

      if (error) throw error;

      setCreatedEscrow(data);
      setStep(4);
      toast.success("Escrow link created successfully!");
    } catch (error: any) {
      console.error("Error creating escrow:", error);
      toast.error(error.message || "Failed to create escrow link");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  if (step === 4 && createdEscrow) {
    return (
      <div className="container max-w-2xl mx-auto px-4 pt-24 pb-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-none shadow-2xl overflow-hidden text-center bg-card">
            <div className="bg-primary p-12 text-primary-foreground flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-md"
              >
                <Check className="w-10 h-10" />
              </motion.div>
              <h1 className="text-3xl font-extrabold mb-2">Escrow Link Ready!</h1>
              <p className="opacity-80 max-w-xs mx-auto">Your payment link is live. Send it to your buyer to start the secure transaction.</p>
            </div>
            
            <CardContent className="p-8 space-y-8">
              <div className="bg-muted/50 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-4">
                  <span className="text-muted-foreground text-sm uppercase tracking-wider font-bold">Total Amount</span>
                  <span className="text-3xl font-black">{createdEscrow.amount} USDC</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-left">
                  <div>
                    <p className="text-muted-foreground">Network</p>
                    <p className="font-bold capitalize flex items-center gap-2">
                      {networks.find(n => n.id === createdEscrow.chain)?.icon}
                      {createdEscrow.chain}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payout Destination</p>
                    <p className="font-bold capitalize">
                      {createdEscrow.payout_method}: { 
                        createdEscrow.payout_method === 'phone' ? createdEscrow.mpesa_phone :
                        createdEscrow.payout_method === 'paybill' ? createdEscrow.paybill :
                        createdEscrow.till_number
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Share this link with buyer</p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-xl border border-border">
                  <p className="flex-1 text-xs font-mono truncate text-left opacity-70">
                    {window.location.origin}/pay/{createdEscrow.id}
                  </p>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/pay/${createdEscrow.id}`);
                    toast.success("Link copied!");
                  }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex gap-4">
                  <ShareEscrow 
                    escrowId={createdEscrow.id} 
                    amount={createdEscrow.amount} 
                    currency={createdEscrow.currency || "USDC"}
                    trigger={
                      <Button className="flex-1 h-14 text-lg shadow-xl shadow-primary/20 gap-2">
                        <Share2 className="w-5 h-5" />
                        Share Now
                      </Button>
                    }
                  />
                  <Button variant="outline" className="flex-1 h-14 text-lg" onClick={() => navigate("/")}>
                    Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 pt-24 pb-32">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => step > 1 ? prevStep() : navigate("/")} className="rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight">Create Escrow Link</h1>
      </div>

      <div className="flex gap-2 mb-12">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= i ? "bg-primary" : "bg-muted"}`} 
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl bg-card">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  Transaction Details
                </CardTitle>
                <CardDescription>Enter the amount and choosing your preferred network.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <Label htmlFor="amount" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Amount (USDC)</Label>
                  <div className="relative">
                    <Input 
                      id="amount" 
                      name="amount"
                      type="number" 
                      placeholder="0.00" 
                      className="pl-12 h-16 text-3xl font-black bg-muted/30 border-none focus-visible:ring-primary/20" 
                      value={formData.amount}
                      onChange={handleChange}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Select Blockchain Network</Label>
                  <RadioGroup 
                    value={formData.chain} 
                    onValueChange={(val) => setFormData({ ...formData, chain: val as BlockchainChain })}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2"
                  >
                    {networks.map((network) => (
                      <div key={network.id}>
                        <RadioGroupItem 
                          value={network.id} 
                          id={network.id} 
                          className="peer sr-only" 
                        />
                        <Label
                          htmlFor={network.id}
                          className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all duration-200"
                        >
                          <span className="text-4xl mb-3">{network.icon}</span>
                          <span className="text-base font-bold">{network.name}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Button className="w-full h-14 text-lg mt-4 shadow-lg shadow-primary/20" onClick={nextStep} disabled={!formData.amount}>
                  Next Step
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-xl bg-card">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-primary" />
                  Payout Information
                </CardTitle>
                <CardDescription>Choose how and where you want to receive funds.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <Label htmlFor="seller_wallet" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Your Wallet Address (Recipient)</Label>
                  <div className="relative">
                    <Input 
                      id="seller_wallet" 
                      name="seller_wallet"
                      placeholder="0x..." 
                      className="pl-12 h-14 bg-muted/30 border-none font-mono"
                      value={formData.seller_wallet}
                      onChange={handleChange}
                    />
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Payout Method</Label>
                  <RadioGroup 
                    value={formData.payout_method} 
                    onValueChange={(val) => setFormData({ ...formData, payout_method: val as PayoutMethod })}
                    className="grid grid-cols-1 gap-3"
                  >
                    {payoutMethods.map((m) => (
                      <div key={m.id}>
                        <RadioGroupItem 
                          value={m.id} 
                          id={m.id} 
                          className="peer sr-only" 
                        />
                        <Label
                          htmlFor={m.id}
                          className="flex items-center gap-4 rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <m.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.desc}</p>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  {formData.payout_method === 'phone' && (
                    <div className="space-y-2">
                      <Label htmlFor="mpesa_phone" className="text-xs font-bold uppercase tracking-widest">Phone Number</Label>
                      <Input 
                        id="mpesa_phone" 
                        name="mpesa_phone"
                        placeholder="2547XXXXXXXX" 
                        className="h-12 bg-muted/30"
                        value={formData.mpesa_phone}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                  {formData.payout_method === 'paybill' && (
                    <div className="space-y-2">
                      <Label htmlFor="paybill" className="text-xs font-bold uppercase tracking-widest">Paybill Number</Label>
                      <Input 
                        id="paybill" 
                        name="paybill"
                        placeholder="888888" 
                        className="h-12 bg-muted/30"
                        value={formData.paybill}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                  {formData.payout_method === 'till' && (
                    <div className="space-y-2">
                      <Label htmlFor="till_number" className="text-xs font-bold uppercase tracking-widest">Till Number</Label>
                      <Input 
                        id="till_number" 
                        name="till_number"
                        placeholder="123456" 
                        className="h-12 bg-muted/30"
                        value={formData.till_number}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" className="flex-1 h-14 text-lg" onClick={prevStep}>Back</Button>
                  <Button className="flex-[2] h-14 text-lg shadow-lg shadow-primary/20" onClick={nextStep} disabled={!formData.seller_wallet}>
                    Review Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="overflow-hidden border-none shadow-2xl bg-card">
              <div className="bg-primary h-2 w-full" />
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                  Ready to Create
                </CardTitle>
                <CardDescription>Review your secure escrow link details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="bg-muted/50 p-8 rounded-3xl space-y-6">
                  <div className="flex justify-between items-center border-b border-border/50 pb-6">
                    <span className="text-muted-foreground font-medium">Total to Receive</span>
                    <span className="text-4xl font-black">{formData.amount} USDC</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-6 text-sm">
                    <span className="text-muted-foreground">Blockchain Network</span>
                    <span className="text-right font-bold capitalize flex items-center justify-end gap-2">
                      {networks.find(n => n.id === formData.chain)?.icon}
                      {formData.chain}
                    </span>
                    <span className="text-muted-foreground">Payout Destination</span>
                    <span className="text-right font-bold">
                       {formData.payout_method}: { 
                        formData.payout_method === 'phone' ? formData.mpesa_phone :
                        formData.payout_method === 'paybill' ? formData.paybill :
                        formData.till_number
                      }
                    </span>
                    <span className="text-muted-foreground">Recipient Wallet</span>
                    <span className="text-right font-mono truncate ml-12 opacity-70">{formData.seller_wallet}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="ghost" className="flex-1 h-14 text-lg" onClick={prevStep}>Back</Button>
                  <Button 
                    className="flex-[2] h-14 text-lg shadow-xl shadow-primary/20" 
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirm & Create Link"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}