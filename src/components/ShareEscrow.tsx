import { useState } from "react";
import { Copy, Check, Share2, Twitter, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface ShareEscrowProps {
  escrowId: string;
  amount: number;
  currency: string;
  trigger?: React.ReactNode;
}

export function ShareEscrow({ escrowId, amount, currency, trigger }: ShareEscrowProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/pay/${escrowId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const shareText = `Secure escrow payment for ${amount} ${currency}. Pay safely via Dala.`;

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share Link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Share Payment Link</DialogTitle>
          <DialogDescription className="text-base">
            Send this link to the buyer to receive your {amount} {currency} securely.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4">
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">Link</Label>
              <Input
                id="link"
                defaultValue={shareUrl}
                readOnly
                className="h-12 bg-muted/50 font-mono text-xs"
              />
            </div>
            <Button size="icon" onClick={copyToClipboard} className="h-12 w-12 shrink-0">
              {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-12 border-sky-100 hover:bg-sky-50 hover:text-sky-600 gap-2" onClick={shareToTwitter}>
              <Twitter className="w-5 h-5" />
              Twitter
            </Button>
            <Button variant="outline" className="h-12 border-green-100 hover:bg-green-50 hover:text-green-600 gap-2" onClick={shareToWhatsApp}>
              <MessageSquare className="w-5 h-5" />
              WhatsApp
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">Preview Buyer View</p>
                <p className="text-xs text-muted-foreground">See what your customer will see</p>
              </div>
            </div>
            <Button variant="link" onClick={() => window.open(shareUrl, '_blank')} className="text-primary font-bold">
              Open Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children, className, htmlFor }: { children: React.ReactNode; className?: string; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>;
}