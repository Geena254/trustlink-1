import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Package, Lock, CheckCircle2, Wallet, AlertCircle, Loader2, Sparkles, Smartphone, ChevronRight, Landmark, CreditCard } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Escrow } from "@/types/escrow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function PayEscrow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [buyerPhone, setBuyerPhone] = useState("");

  useEffect(() => {
    async function fetchEscrow() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from("escrows")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setEscrow(data);
      } catch (error) {
        console.error("Error fetching escrow:", error);
        toast.error("Escrow not found");
      } finally {
        setLoading(false);
      }
    }

    fetchEscrow();

    const channel = supabase
      .channel(`escrow-${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'escrows', 
        filter: `id=eq.${id}` 
      }, (payload) => {
        setEscrow(payload.new as Escrow);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handlePayment = async () => {
    if (!buyerPhone) {
      toast.error("Please enter your M-Pesa number for the payment prompt");
      return;
    }

    setProcessing(true);
    // Simulate STK Push and blockchain deposit
    setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("escrows")
          .update({ 
            status: "deposited", 
            buyer_wallet: "0x821...3d9a" 
          })
          .eq("id", id);

        if (error) throw error;
        
        toast.success("Payment successful! Funds are now in escrow.");
      } catch (error) {
        toast.error("Payment failed. Please try again.");
      } finally {
        setProcessing(false);
      }
    }, 2000);
  };

  const confirmDelivery = async () => {
    setProcessing(true);
    setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("escrows")
          .update({ status: "completed" })
          .eq("id", id);

        if (error) throw error;
        
        toast.success("Delivery confirmed! Funds released to merchant.");
      } catch (error) {
        toast.error("Confirmation failed.");
      } finally {
        setProcessing(false);
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="container max-w-xl mx-auto px-4 pt-24 pb-32">
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full rounded-3xl" />
          <Skeleton className="h-[400px] w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="container max-w-xl mx-auto px-4 pt-32 pb-32 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-black">Link Expired</h2>
        <p className="text-muted-foreground mt-4 text-lg">This payment link might be invalid or has already been fulfilled.</p>
        <Button className="mt-8 h-12 px-8 rounded-xl" onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const isPending = escrow.status === 'pending';
  const isDeposited = escrow.status === 'deposited';
  const isCompleted = ['completed', 'offramp_initiated', 'offramp_completed'].includes(escrow.status);

  return (
    <div className="container max-w-xl mx-auto px-4 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-none shadow-2xl overflow-hidden bg-background">
          <div className="bg-primary p-12 text-primary-foreground flex flex-col items-center text-center relative">
            <div className="absolute top-4 left-4">
              <Badge variant="outline" className="border-white/20 text-white bg-white/5 backdrop-blur-sm font-bold">
                Verified Escrow
              </Badge>
            </div>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-md"
            >
              <Shield className="w-10 h-10" />
            </motion.div>
            <h2 className="text-4xl font-black">{escrow.amount} {escrow.currency}</h2>
            <p className="opacity-70 text-sm mt-2 uppercase tracking-widest font-bold">Payment Request</p>
          </div>

          <CardContent className="pt-10 space-y-8 px-8">
            {isPending && (
              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
                <Label htmlFor="buyer_phone" className="text-sm font-bold uppercase tracking-widest">Your M-Pesa Number</Label>
                <div className="relative">
                  <Input 
                    id="buyer_phone" 
                    placeholder="2547XXXXXXXX" 
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">We will send an STK prompt to this number for payment.</p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Merchant Details
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between items-center p-4 bg-muted/30 rounded-xl">
                  <span className="text-muted-foreground">Payout via</span>
                  <span className="font-bold flex items-center gap-2 capitalize">
                    {escrow.payout_method === 'phone' && <Smartphone className="w-4 h-4" />}
                    {escrow.payout_method === 'paybill' && <Landmark className="w-4 h-4" />}
                    {escrow.payout_method === 'till' && <CreditCard className="w-4 h-4" />}
                    {escrow.payout_method}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/30 rounded-xl">
                  <span className="text-muted-foreground">Merchant Identity</span>
                  <span className="font-mono opacity-60">{escrow.seller_wallet.slice(0, 10)}...</span>
                </div>
              </div>
            </div>

            <div className="relative space-y-8">
              <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-muted-foreground/10" />
              
              <div className="flex gap-6 items-start relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center z-10 shrink-0 transition-all duration-500 ${!isPending ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {!isPending ? <CheckCircle2 className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                </div>
                <div className={!isPending ? 'opacity-50' : ''}>
                  <h4 className="font-bold">1. Secure Deposit</h4>
                  <p className="text-xs text-muted-foreground">Funds are locked in a smart contract.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center z-10 shrink-0 transition-all duration-500 ${isCompleted ? 'bg-primary text-primary-foreground' : (isDeposited ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-muted text-muted-foreground')}`}>
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                </div>
                <div className={isCompleted ? 'opacity-50' : (!isDeposited ? 'opacity-30' : '')}>
                  <h4 className="font-bold">2. Delivery & Release</h4>
                  <p className="text-xs text-muted-foreground">Release funds only after receiving goods.</p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-8 flex flex-col gap-4">
            {isPending && (
              <Button 
                className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 rounded-2xl"
                onClick={handlePayment}
                disabled={processing}
              >
                {processing ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "Pay & Secure Funds"}
                {!processing && <ChevronRight className="ml-2 w-5 h-5" />}
              </Button>
            )}
            {isDeposited && (
              <Button 
                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-2xl"
                onClick={confirmDelivery}
                disabled={processing}
              >
                {processing ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "Confirm Receipt"}
                {!processing && <CheckCircle2 className="ml-2 w-5 h-5" />}
              </Button>
            )}
            {isCompleted && (
              <div className="w-full text-center py-4 bg-green-50 rounded-2xl border border-green-200">
                <p className="text-green-700 font-bold flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Transaction Completed
                </p>
              </div>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}