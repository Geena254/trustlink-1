import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Plus, Trash2, Copy, ShieldCheck, Loader2, AlertTriangle, Clock, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ApiKey {
  id: string;
  name: string;
  mode: "live" | "test";
  last_used_at: string | null;
  monthly_request_count: number;
  is_active: boolean;
  created_at: string;
  // key_hash is never returned; raw key only shown once at creation
}

/** Generate a cryptographically random API key string */
function generateRawKey(mode: "live" | "test"): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `tl_${mode}_${hex}`;
}

/** SHA-256 hash using browser's SubtleCrypto */
async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyMode, setNewKeyMode] = useState<"live" | "test">("test");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showRevealModal, setShowRevealModal] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, mode, last_used_at, monthly_request_count, is_active, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setKeys(data || []);
    } catch {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the key");
      return;
    }
    setCreating(true);
    try {
      const rawKey = generateRawKey(newKeyMode);
      const keyHash = await sha256Hex(rawKey);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("api_keys").insert({
        user_id: user.id,
        key_hash: keyHash,
        name: newKeyName.trim(),
        mode: newKeyMode,
      });

      if (error) throw error;

      // Show raw key ONCE — it will never be retrievable again
      setRevealedKey(rawKey);
      setShowRevealModal(true);
      setShowCreate(false);
      setNewKeyName("");
      setNewKeyMode("test");
      await fetchKeys();
    } catch (err: any) {
      toast.error(err.message || "Failed to create API key");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(keyId: string) {
    try {
      const { error } = await supabase
        .from("api_keys")
        .update({ is_active: false })
        .eq("id", keyId);

      if (error) throw error;
      setKeys((prev) => prev.map((k) => k.id === keyId ? { ...k, is_active: false } : k));
      toast.success("API key revoked");
    } catch {
      toast.error("Failed to revoke key");
    }
  }

  async function handleDelete(keyId: string) {
    try {
      const { error } = await supabase.from("api_keys").delete().eq("id", keyId);
      if (error) throw error;
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
      toast.success("API key deleted");
    } catch {
      toast.error("Failed to delete key");
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Key className="w-6 h-6 text-primary" />
            API Keys
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Keys authenticate your app's requests to the TrustLink API. Keep them secret.
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="h-10 px-6 rounded-xl font-bold gap-2"
        >
          <Plus className="w-4 h-4" />
          New Key
        </Button>
      </div>

      {/* Create Key Panel */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-2 border-primary/20 bg-primary/5 border-none shadow-lg">
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="key-name" className="text-xs font-bold uppercase tracking-widest">
                      Key Name
                    </Label>
                    <Input
                      id="key-name"
                      placeholder="e.g. Production App, My Shopify Store"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="h-11"
                      onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest">Mode</Label>
                    <RadioGroup
                      value={newKeyMode}
                      onValueChange={(v) => setNewKeyMode(v as "live" | "test")}
                      className="flex gap-4 pt-1"
                    >
                      {(["test", "live"] as const).map((mode) => (
                        <div key={mode} className="flex items-center gap-2">
                          <RadioGroupItem value={mode} id={`mode-${mode}`} />
                          <Label htmlFor={`mode-${mode}`} className="font-semibold cursor-pointer capitalize">
                            {mode === "test" ? "🧪 Test" : "🚀 Live"}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                      Test keys use M-Pesa sandbox. Live keys hit real Safaricom API.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleCreate} disabled={creating} className="h-10 px-6 rounded-xl font-bold">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Key
                  </Button>
                  <Button variant="ghost" onClick={() => setShowCreate(false)} className="h-10 px-6 rounded-xl">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keys List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
          <Key className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
          <p className="font-bold text-lg">No API keys yet</p>
          <p className="text-muted-foreground text-sm mt-1">
            Create your first key to start using the TrustLink API.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {keys.map((key) => (
              <motion.div
                key={key.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className={`border-none shadow-sm ${!key.is_active ? "opacity-50" : ""}`}>
                  <CardContent className="py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${key.mode === "live" ? "bg-green-500/10" : "bg-blue-500/10"}`}>
                        <Key className={`w-5 h-5 ${key.mode === "live" ? "text-green-600" : "text-blue-600"}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold truncate">{key.name}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs shrink-0 ${key.mode === "live" ? "border-green-500/30 text-green-600 bg-green-500/5" : "border-blue-500/30 text-blue-600 bg-blue-500/5"}`}
                          >
                            {key.mode}
                          </Badge>
                          {!key.is_active && (
                            <Badge variant="outline" className="text-xs shrink-0 border-destructive/30 text-destructive">
                              Revoked
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {key.monthly_request_count} req / month
                          </span>
                          {key.last_used_at ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last used {new Date(key.last_used_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">Never used</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {key.is_active && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 rounded-xl text-amber-600 border-amber-500/20 hover:bg-amber-500/5">
                              Revoke
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                              <AlertDialogDescription>
                                All applications using <strong>"{key.name}"</strong> will immediately stop working. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRevoke(key.id)}
                                className="bg-amber-600 hover:bg-amber-700"
                              >
                                Yes, Revoke
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete <strong>"{key.name}"</strong>. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(key.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Yes, Delete
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

      {/* One-time key reveal modal */}
      <Dialog open={showRevealModal} onOpenChange={(open) => { if (!open) setRevealedKey(null); setShowRevealModal(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Copy Your API Key
            </DialogTitle>
            <DialogDescription>
              This is the <strong>only time</strong> your secret key will be shown. Copy it now and store it securely (e.g. in a password manager or environment variable). It will not be displayed again.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4">
            <div className="flex items-center gap-2 p-4 bg-muted rounded-xl border border-border font-mono text-sm break-all">
              <span className="flex-1 select-all">{revealedKey}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(revealedKey!);
                  toast.success("Copied to clipboard!");
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 font-medium">
              Never expose this key in client-side code, git repositories, or public logs. Treat it like a password.
            </p>
          </div>

          <DialogFooter>
            <Button
              className="w-full rounded-xl font-bold"
              onClick={() => {
                navigator.clipboard.writeText(revealedKey!);
                toast.success("Copied!");
                setShowRevealModal(false);
                setRevealedKey(null);
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
