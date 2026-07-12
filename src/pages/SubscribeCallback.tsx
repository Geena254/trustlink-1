import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, ArrowRight, LayoutDashboard } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type Status = "verifying" | "success" | "failed" | "error";

export default function SubscribeCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("verifying");
  const [detail, setDetail] = useState<{ amount?: number; currency?: string; paid_at?: string } | null>(null);

  useEffect(() => {
    const reference = searchParams.get("reference") ?? searchParams.get("trxref");

    if (!reference) {
      setStatus("error");
      return;
    }

    async function verify() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth", { state: { from: "/subscribe/callback" } });
          return;
        }

        const { data, error } = await supabase.functions.invoke(
          `paystack-verify?reference=${encodeURIComponent(reference!)}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );

        if (error) throw error;

        if (data?.success) {
          setStatus("success");
          setDetail({ amount: data.amount, currency: data.currency, paid_at: data.paid_at });
        } else {
          setStatus("failed");
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setStatus("error");
      }
    }

    verify();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {status === "verifying" && (
          <div className="text-center py-24">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-black mb-2">Verifying Payment…</h2>
            <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-card rounded-[3rem] p-12 shadow-2xl text-center border border-border">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8"
            >
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </motion.div>
            <h1 className="text-3xl font-black mb-3">You're Pro! 🎉</h1>
            <p className="text-muted-foreground mb-8">
              Your TrustLink Pro subscription is now active for 30 days.
            </p>

            {detail && (
              <div className="bg-muted/40 rounded-2xl p-5 mb-8 text-left space-y-2 text-sm">
                {detail.amount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount paid</span>
                    <span className="font-bold">${detail.amount} {detail.currency}</span>
                  </div>
                )}
                {detail.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-bold">{new Date(detail.paid_at).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-bold">Pro Merchant (30 days)</span>
                </div>
              </div>
            )}

            <Button
              className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20"
              onClick={() => navigate("/dashboard")}
            >
              <LayoutDashboard className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        )}

        {(status === "failed" || status === "error") && (
          <div className="bg-card rounded-[3rem] p-12 shadow-2xl text-center border border-destructive/20">
            <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <h1 className="text-3xl font-black mb-3">Payment {status === "failed" ? "Failed" : "Error"}</h1>
            <p className="text-muted-foreground mb-8">
              {status === "failed"
                ? "Your payment was not completed. No charges have been made."
                : "We couldn't verify your payment. If you were charged, please contact support."}
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl font-bold"
                onClick={() => navigate("/subscribe")}
              >
                Try Again
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl font-bold"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
