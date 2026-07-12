import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Webhook, Plus, Trash2, CheckCircle2, XCircle, Loader2, AlertTriangle, Globe, Copy, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

const ALL_EVENTS = [
  { id: "escrow.created", label: "Escrow Created", desc: "A new escrow link is created" },
  { id: "escrow.deposited", label: "Escrow Deposited", desc: "Buyer sends funds to escrow" },
  { id: "escrow.completed", label: "Escrow Completed", desc: "Buyer confirms delivery" },
  { id: "offramp.initiated", label: "Offramp Initiated", desc: "M-Pesa payout is triggered" },
  { id: "offramp.completed", label: "Offramp Completed", desc: "M-Pesa payout is confirmed" },
];

interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  last_triggered_at: string | null;
  failure_count: number;
}

function generateSecret(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function Webhooks() {
  const [hooks, setHooks] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    url: "",
    secret: generateSecret(),
    events: ALL_EVENTS.map(e => e.id),
  });

  useEffect(() => { fetchHooks(); }, []);

  async function fetchHooks() {
    try {
      const { data, error } = await supabase
        .from("webhooks")
        .select("id, url, events, is_active, created_at, last_triggered_at, failure_count")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHooks(data || []);
    } catch {
      toast.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }

  function toggleEvent(eventId: string) {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId],
    }));
  }

  async function handleCreate() {
    if (!form.url.trim()) { toast.error("URL is required"); return; }
    if (form.events.length === 0) { toast.error("Select at least one event"); return; }
    try { new URL(form.url); } catch { toast.error("Invalid URL"); return; }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.from("webhooks").insert({
        user_id: user.id,
        url: form.url.trim(),
        events: form.events,
        secret: form.secret,
        is_active: true,
      }).select("id, url, events, is_active, created_at, last_triggered_at, failure_count").single();

      if (error) throw error;

      setHooks(prev => [data, ...prev]);
      setShowCreate(false);
      setForm({ url: "", secret: generateSecret(), events: ALL_EVENTS.map(e => e.id) });
      toast.success("Webhook registered!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create webhook");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from("webhooks").delete().eq("id", id);
      if (error) throw error;
      setHooks(prev => prev.filter(h => h.id !== id));
      toast.success("Webhook deleted");
    } catch {
      toast.error("Failed to delete webhook");
    }
  }

  async function handleToggle(hook: WebhookRow) {
    try {
      const { error } = await supabase.from("webhooks").update({ is_active: !hook.is_active }).eq("id", hook.id);
      if (error) throw error;
      setHooks(prev => prev.map(h => h.id === hook.id ? { ...h, is_active: !h.is_active } : h));
      toast.success(hook.is_active ? "Webhook disabled" : "Webhook enabled");
    } catch {
      toast.error("Failed to update webhook");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Webhook className="w-6 h-6 text-primary" />
            Webhooks
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Receive real-time POST requests to your server when escrow events occur.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="h-10 px-6 rounded-xl font-bold gap-2">
          <Plus className="w-4 h-4" />
          Add Endpoint
        </Button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-none shadow-lg">
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Endpoint URL</Label>
                  <Input
                    placeholder="https://yourapp.com/webhooks/trustlink"
                    value={form.url}
                    onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                    className="h-11 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Signing Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      value={form.secret}
                      readOnly
                      className="h-11 font-mono text-sm flex-1"
                    />
                    <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={() => { navigator.clipboard.writeText(form.secret); toast.success("Secret copied!"); }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={() => setForm(p => ({ ...p, secret: generateSecret() }))}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this to verify <code className="bg-muted px-1 rounded">X-TrustLink-Signature</code> on incoming requests.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest">Events to Subscribe</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ALL_EVENTS.map(event => (
                      <label key={event.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.events.includes(event.id) ? "border-primary/30 bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                        <Checkbox
                          checked={form.events.includes(event.id)}
                          onCheckedChange={() => toggleEvent(event.id)}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="font-bold text-sm font-mono">{event.id}</p>
                          <p className="text-xs text-muted-foreground">{event.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleCreate} disabled={creating} className="h-10 px-6 rounded-xl font-bold">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Register Endpoint
                  </Button>
                  <Button variant="ghost" onClick={() => setShowCreate(false)} className="h-10 px-6 rounded-xl">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)}</div>
      ) : hooks.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
          <Globe className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
          <p className="font-bold text-lg">No webhooks yet</p>
          <p className="text-muted-foreground text-sm mt-1">Add an endpoint to receive live event push notifications.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {hooks.map(hook => (
              <motion.div key={hook.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className={`border-none shadow-sm ${!hook.is_active ? "opacity-60" : ""}`}>
                  <CardContent className="py-4 px-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hook.is_active ? "bg-green-500/10" : "bg-muted"}`}>
                        {hook.is_active
                          ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                          : <XCircle className="w-5 h-5 text-muted-foreground" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-bold truncate">{hook.url}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {hook.events.map(e => (
                            <Badge key={e} variant="outline" className="text-xs font-mono px-2 py-0">
                              {e}
                            </Badge>
                          ))}
                        </div>
                        {hook.failure_count > 0 && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {hook.failure_count} consecutive failure(s)
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={() => handleToggle(hook)}>
                        {hook.is_active ? "Disable" : "Enable"}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Requests will stop being sent to <strong>{hook.url}</strong>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(hook.id)} className="bg-destructive hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
