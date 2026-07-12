import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, AlertCircle, Share2, Wallet, Smartphone, ExternalLink, X } from "lucide-react";
import { Escrow } from "@/types/escrow";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareEscrow } from "./ShareEscrow";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EscrowCardProps {
  escrow: Escrow;
  index: number;
  onCancelled?: (id: string) => void;
}

export function EscrowCard({ escrow, index, onCancelled }: EscrowCardProps) {
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { error } = await supabase.functions.invoke("api-cancel-escrow", {
        body: { escrow_id: escrow.id },
      });
      if (error) throw error;
      toast.success("Escrow cancelled.");
      onCancelled?.(escrow.id);
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel escrow.");
    } finally {
      setCancelling(false);
    }
  };
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    deposited: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    completed: "bg-green-500/10 text-green-600 border-green-500/20",
    cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
    offramp_initiated: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    offramp_completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };

  const statusIcons: Record<string, any> = {
    pending: Clock,
    deposited: Wallet,
    completed: CheckCircle2,
    cancelled: AlertCircle,
    offramp_initiated: Smartphone,
    offramp_completed: CheckCircle2,
  };

  const Icon = statusIcons[escrow.status] || Clock;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Card className="overflow-hidden border-none shadow-xl bg-card transition-all duration-300 group-hover:shadow-primary/5">
        <div className={`h-1 w-full bg-gradient-to-r ${
          escrow.status === 'pending' ? 'from-yellow-400 to-yellow-600' :
          escrow.status === 'deposited' ? 'from-blue-400 to-blue-600' :
          'from-green-400 to-green-600'
        }`} />
        <CardContent className="pt-6 pb-4">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <div className="text-2xl font-bold">{escrow.amount} {escrow.currency}</div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{escrow.chain} Network</p>
            </div>
            <Badge variant="outline" className={`capitalize ${statusColors[escrow.status]}`}>
              <Icon className="w-3 h-3 mr-1" />
              {escrow.status.replace("_", " ")}
            </Badge>
          </div>

          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="w-4 h-4" />
              <span className="truncate font-mono">
                {escrow.mpesa_phone
                  ? escrow.mpesa_phone.replace(/(\d{3})\d+(\d{2})$/, "$1·····$2")
                  : escrow.paybill
                  ? `Paybill: ${escrow.paybill}`
                  : escrow.till_number
                  ? `Till: ${escrow.till_number}`
                  : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{new Date(escrow.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 gap-2 p-3 flex-wrap">
          <ShareEscrow
            escrowId={escrow.id}
            amount={escrow.amount}
            currency={escrow.currency}
            trigger={
              <Button variant="outline" size="sm" className="flex-1 gap-2 bg-background">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            }
          />
          <Button variant="ghost" size="sm" className="flex-1 gap-2" asChild>
            <a href={`/pay/${escrow.id}`} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4" />
              View
            </a>
          </Button>
          {escrow.status === "pending" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={cancelling}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this escrow?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The escrow for <strong>{escrow.amount} {escrow.currency}</strong> will be cancelled.
                    This can only be done while no buyer has deposited funds.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Yes, Cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}