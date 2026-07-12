import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Code2, BookOpen, Key, Webhook, Terminal, ChevronRight, Copy, Check, Shield, Globe, Zap, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import ApiKeys from "@/components/ApiKeys";
import Webhooks from "@/components/Webhooks";

// ─── Code snippet helper ─────────────────────────────────────────────────────
function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <pre className="bg-zinc-950 text-zinc-100 rounded-2xl p-5 text-sm font-mono overflow-x-auto leading-relaxed">
        <code>{code.trim()}</code>
      </pre>
      <button
        className="absolute top-3 right-3 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all"
        onClick={() => {
          navigator.clipboard.writeText(code.trim());
          setCopied(true);
          toast.success("Copied!");
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ─── Method badge ────────────────────────────────────────────────────────────
function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    POST: "bg-green-500/10 text-green-600 border-green-500/20",
    DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
  };
  return (
    <Badge variant="outline" className={`font-mono font-bold text-xs px-2 py-0.5 shrink-0 ${colors[method] ?? ""}`}>
      {method}
    </Badge>
  );
}

// ─── Single endpoint reference card ─────────────────────────────────────────
function EndpointCard({
  method,
  path,
  description,
  params,
  example,
  response,
}: {
  method: string;
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; desc: string }[];
  example: string;
  response: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <MethodBadge method={method} />
        <code className="text-sm font-mono flex-1">{path}</code>
        <span className="text-sm text-muted-foreground hidden md:block flex-1 text-right truncate">{description}</span>
        <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-border px-5 py-5 space-y-5 bg-muted/10">
          <p className="text-sm text-muted-foreground">{description}</p>

          {params && params.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3 text-muted-foreground">Parameters</p>
              <div className="space-y-2">
                {params.map((p) => (
                  <div key={p.name} className="flex items-start gap-3 text-sm">
                    <code className="font-mono bg-muted px-2 py-0.5 rounded text-xs shrink-0">{p.name}</code>
                    <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">{p.type}</Badge>
                    {p.required && <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0 border-orange-500/30 text-orange-600">required</Badge>}
                    <span className="text-muted-foreground">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2 text-muted-foreground">Request</p>
              <CodeBlock code={example} language="bash" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2 text-muted-foreground">Response</p>
              <CodeBlock code={response} language="json" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Auth gate for management tabs ───────────────────────────────────────────
function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-black mb-2">Sign in to manage {children}</h3>
      <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">
        Create a free account to generate API keys and register webhook endpoints.
      </p>
      <div className="flex gap-3 justify-center">
        <Link to="/auth">
          <Button className="rounded-xl px-8 font-bold">Sign In</Button>
        </Link>
        <Link to="/auth">
          <Button variant="outline" className="rounded-xl px-8 font-bold">Create Account</Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Main Developer Portal ───────────────────────────────────────────────────
const BASE_URL = "https://ozvfnaancojxsizqqtnt.supabase.co/functions/v1";

export default function Developers() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="container max-w-6xl mx-auto px-4 pt-24 pb-32">
      {/* Page Header */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16"
      >
        <div className="flex items-center gap-2 mb-3">
          <Code2 className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Developer Portal</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
          TrustLink API
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Embed secure on-chain escrow + instant M-Pesa off-ramp into your own applications.
          Authenticated with API keys, event-driven via webhooks.
        </p>

        <div className="flex flex-wrap gap-3 mt-6">
          {[
            { icon: Shield, label: "API Key Auth" },
            { icon: Globe, label: "REST JSON API" },
            { icon: Zap, label: "Webhook Events" },
          ].map((pill) => (
            <div key={pill.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 text-primary text-sm font-bold">
              <pill.icon className="w-4 h-4" />
              {pill.label}
            </div>
          ))}
        </div>
      </motion.header>

      <Tabs defaultValue="quickstart" className="space-y-8">
        <TabsList className="h-12 bg-muted/50 rounded-2xl p-1 flex flex-wrap gap-1">
          <TabsTrigger value="quickstart" className="rounded-xl font-bold data-[state=active]:shadow-sm">
            <Terminal className="w-4 h-4 mr-2" />
            Quick Start
          </TabsTrigger>
          <TabsTrigger value="reference" className="rounded-xl font-bold data-[state=active]:shadow-sm">
            <BookOpen className="w-4 h-4 mr-2" />
            API Reference
          </TabsTrigger>
          <TabsTrigger value="sdk" className="rounded-xl font-bold data-[state=active]:shadow-sm">
            <Code2 className="w-4 h-4 mr-2" />
            SDK
          </TabsTrigger>
          <TabsTrigger value="keys" className="rounded-xl font-bold data-[state=active]:shadow-sm">
            <Key className="w-4 h-4 mr-2" />
            API Keys
            {!authLoading && !user && <Lock className="w-3 h-3 ml-1.5 opacity-50" />}
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="rounded-xl font-bold data-[state=active]:shadow-sm">
            <Webhook className="w-4 h-4 mr-2" />
            Webhooks
            {!authLoading && !user && <Lock className="w-3 h-3 ml-1.5 opacity-50" />}
          </TabsTrigger>
        </TabsList>

        {/* ── Quick Start ──────────────────────────────────────────────────── */}
        <TabsContent value="quickstart" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { step: "01", title: "Get an API key", desc: "Generate a key from the API Keys tab. Use tl_test_ keys during development." },
              { step: "02", title: "Create an escrow", desc: "POST to /api-escrows with the amount, chain and payout details." },
              { step: "03", title: "Receive webhooks", desc: "Register an endpoint and get pushed events when status changes." },
            ].map((s) => (
              <Card key={s.step} className="border-none shadow-sm bg-muted/30">
                <CardContent className="pt-6">
                  <span className="text-4xl font-black italic text-primary/30">{s.step}</span>
                  <h3 className="font-black text-lg mt-2 mb-1">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-xl">1. Create an escrow link</h3>
            <CodeBlock code={`curl -X POST ${BASE_URL}/api-escrows \\
  -H "Authorization: Bearer tl_test_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50,
    "chain": "base",
    "seller_wallet": "0xYourWalletAddress",
    "payout_method": "phone",
    "mpesa_phone": "254712345678"
  }'`} />
            <CodeBlock code={`{
  "id": "escrow-uuid",
  "amount": 50,
  "currency": "USDC",
  "chain": "base",
  "status": "pending",
  "payment_url": "https://trustlink.app/pay/escrow-uuid",
  "created_at": "2025-01-01T00:00:00Z"
}`} />
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-xl">2. Share the payment URL with your buyer</h3>
            <p className="text-muted-foreground text-sm">The <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">payment_url</code> in the response is a hosted payment page your buyer visits to complete the transaction. No blockchain knowledge required on the buyer's side.</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-xl">3. Listen for status changes via webhooks</h3>
            <CodeBlock code={`// Node.js / Express example
app.post('/webhooks/trustlink', (req, res) => {
  const sig = req.headers['x-trustlink-signature'];
  const event = req.headers['x-trustlink-event'];

  // Verify HMAC-SHA256 signature
  const expected = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (\`sha256=\${expected}\` !== sig) {
    return res.status(401).send('Invalid signature');
  }

  console.log('TrustLink event:', event, req.body);
  res.sendStatus(200);
});`} language="javascript" />
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-xl">4. Trigger M-Pesa payout after delivery is confirmed</h3>
            <CodeBlock code={`curl -X POST "${BASE_URL}/api-escrow-detail/ESCROW_ID?action=withdraw" \\
  -H "Authorization: Bearer tl_test_YOUR_API_KEY"`} />
          </div>
        </TabsContent>

        {/* ── API Reference ─────────────────────────────────────────────────── */}
        <TabsContent value="reference" className="space-y-6">
          <div className="p-5 bg-muted/30 rounded-2xl border border-border text-sm space-y-2">
            <p><strong>Base URL:</strong> <code className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{BASE_URL}</code></p>
            <p><strong>Authentication:</strong> All endpoints require <code className="font-mono bg-muted px-2 py-0.5 rounded text-xs">Authorization: Bearer tl_live_... or tl_test_...</code></p>
            <p><strong>Format:</strong> JSON request/response bodies. All timestamps are ISO 8601.</p>
          </div>

          <h3 className="font-black text-xl">Escrows</h3>
          <div className="space-y-3">
            <EndpointCard
              method="POST"
              path="/api-escrows"
              description="Create a new escrow payment link."
              params={[
                { name: "amount", type: "number", required: true, desc: "Amount in USDC" },
                { name: "chain", type: "string", required: true, desc: "base | avalanche | lisk" },
                { name: "seller_wallet", type: "string", required: true, desc: "On-chain wallet address to receive funds" },
                { name: "payout_method", type: "string", required: true, desc: "phone | paybill | till" },
                { name: "mpesa_phone", type: "string", required: false, desc: "Required when payout_method=phone. Format: 254XXXXXXXXX" },
                { name: "paybill", type: "string", required: false, desc: "Required when payout_method=paybill" },
                { name: "till_number", type: "string", required: false, desc: "Required when payout_method=till" },
              ]}
              example={`curl -X POST ${BASE_URL}/api-escrows \\
  -H "Authorization: Bearer tl_test_..." \\
  -H "Content-Type: application/json" \\
  -d '{"amount":100,"chain":"base","seller_wallet":"0x...","payout_method":"phone","mpesa_phone":"254712345678"}'`}
              response={`{
  "id": "3f8d2c1a-...",
  "amount": 100,
  "currency": "USDC",
  "chain": "base",
  "status": "pending",
  "payment_url": "https://trustlink.app/pay/3f8d2c1a-...",
  "created_at": "2025-01-01T00:00:00Z"
}`}
            />
            <EndpointCard
              method="GET"
              path="/api-escrows"
              description="List all escrows for your account. Supports pagination and status filtering."
              params={[
                { name: "status", type: "string", required: false, desc: "Filter by status: pending | deposited | completed | offramp_initiated | offramp_completed" },
                { name: "limit", type: "number", required: false, desc: "Results per page (max 100, default 50)" },
                { name: "offset", type: "number", required: false, desc: "Pagination offset (default 0)" },
              ]}
              example={`curl "${BASE_URL}/api-escrows?status=completed&limit=10" \\
  -H "Authorization: Bearer tl_test_..."`}
              response={`{
  "data": [{ "id": "...", "amount": 100, "status": "completed", ... }],
  "total": 42,
  "limit": 10,
  "offset": 0
}`}
            />
            <EndpointCard
              method="GET"
              path="/api-escrow-detail/:id"
              description="Get full details for a single escrow by ID."
              params={[
                { name: "id", type: "string (path)", required: true, desc: "Escrow UUID" },
              ]}
              example={`curl "${BASE_URL}/api-escrow-detail/3f8d2c1a-..." \\
  -H "Authorization: Bearer tl_test_..."`}
              response={`{
  "id": "3f8d2c1a-...",
  "amount": 100,
  "status": "deposited",
  "payment_url": "https://trustlink.app/pay/3f8d2c1a-...",
  ...
}`}
            />
            <EndpointCard
              method="POST"
              path="/api-escrow-detail/:id?action=release"
              description="Confirm delivery and release funds to the seller. Escrow must be in 'deposited' state."
              params={[
                { name: "id", type: "string (path)", required: true, desc: "Escrow UUID" },
              ]}
              example={`curl -X POST "${BASE_URL}/api-escrow-detail/3f8d2c1a-...?action=release" \\
  -H "Authorization: Bearer tl_test_..."`}
              response={`{ "id": "3f8d2c1a-...", "status": "completed" }`}
            />
            <EndpointCard
              method="POST"
              path="/api-escrow-detail/:id?action=withdraw"
              description="Trigger the M-Pesa off-ramp payout. Escrow must be in 'completed' state."
              params={[
                { name: "id", type: "string (path)", required: true, desc: "Escrow UUID" },
              ]}
              example={`curl -X POST "${BASE_URL}/api-escrow-detail/3f8d2c1a-...?action=withdraw" \\
  -H "Authorization: Bearer tl_test_..."`}
              response={`{
  "id": "3f8d2c1a-...",
  "status": "offramp_initiated",
  "mpesa": { "ResponseCode": "0", "ResponseDescription": "Accept the service request successfully." }
}`}
            />
          </div>

          <h3 className="font-black text-xl mt-10">Webhooks</h3>
          <div className="space-y-3">
            <EndpointCard
              method="GET"
              path="/api-webhooks"
              description="List all registered webhook endpoints for your account."
              example={`curl "${BASE_URL}/api-webhooks" \\
  -H "Authorization: Bearer tl_test_..."`}
              response={`{
  "data": [{ "id": "...", "url": "https://yourapp.com/webhooks", "events": ["escrow.created"], ... }]
}`}
            />
            <EndpointCard
              method="POST"
              path="/api-webhooks"
              description="Register a new webhook endpoint."
              params={[
                { name: "url", type: "string", required: true, desc: "HTTPS URL that will receive POST requests" },
                { name: "secret", type: "string", required: true, desc: "Signing secret for HMAC-SHA256 verification" },
                { name: "events", type: "string[]", required: false, desc: "Event types to subscribe to. Defaults to all events." },
              ]}
              example={`curl -X POST ${BASE_URL}/api-webhooks \\
  -H "Authorization: Bearer tl_test_..." \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://yourapp.com/webhooks","secret":"your_signing_secret","events":["escrow.completed","offramp.completed"]}'`}
              response={`{ "id": "webhook-uuid", "url": "https://yourapp.com/webhooks", "is_active": true, ... }`}
            />
            <EndpointCard
              method="DELETE"
              path="/api-webhooks?id=:id"
              description="Delete a webhook endpoint."
              params={[
                { name: "id", type: "string (query)", required: true, desc: "Webhook UUID" },
              ]}
              example={`curl -X DELETE "${BASE_URL}/api-webhooks?id=webhook-uuid" \\
  -H "Authorization: Bearer tl_test_..."`}
              response={`{ "deleted": true, "id": "webhook-uuid" }`}
            />
          </div>

          <div className="mt-10 p-6 bg-muted/30 rounded-2xl border border-border space-y-3">
            <h3 className="font-black text-lg">Error Responses</h3>
            <p className="text-sm text-muted-foreground">All errors return a JSON body with an <code className="bg-muted px-1 rounded font-mono text-xs">error</code> field and appropriate HTTP status code.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { code: "400", desc: "Bad request / validation error" },
                { code: "401", desc: "Missing or invalid API key" },
                { code: "403", desc: "Forbidden – you don't own this resource" },
                { code: "404", desc: "Resource not found" },
                { code: "405", desc: "Method not allowed" },
              ].map(e => (
                <div key={e.code} className="flex items-center gap-3 text-sm">
                  <Badge variant="outline" className="font-mono text-xs shrink-0">{e.code}</Badge>
                  <span className="text-muted-foreground">{e.desc}</span>
                </div>
              ))}
            </div>
            <CodeBlock code={`{ "error": "Cannot release escrow with status 'pending'. Status must be 'deposited'." }`} />
          </div>
        </TabsContent>

        {/* ── SDK ───────────────────────────────────────────────────────────── */}
        <TabsContent value="sdk" className="space-y-8">
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl">
            <h3 className="font-black text-xl mb-1">TypeScript / JavaScript SDK</h3>
            <p className="text-muted-foreground text-sm mb-4">A type-safe client that wraps the REST API. Works in Node.js, Deno, and browser environments.</p>
            <div className="flex gap-3">
              <CodeBlock code="npm install @trustlink/sdk" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-lg">Installation & Setup</h3>
            <CodeBlock code={`npm install @trustlink/sdk`} />
            <CodeBlock code={`import { TrustLink } from "@trustlink/sdk";

const tl = new TrustLink({
  apiKey: process.env.TRUSTLINK_API_KEY, // tl_live_... or tl_test_...
});`} language="typescript" />
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-lg">Create an escrow</h3>
            <CodeBlock code={`const escrow = await tl.escrows.create({
  amount: 75,
  chain: "base",
  sellerWallet: "0xYourWalletAddress",
  payoutMethod: "phone",
  mpesaPhone: "254712345678",
});

console.log(escrow.paymentUrl); // Share this with your buyer
console.log(escrow.id);         // Store for status tracking`} language="typescript" />
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-lg">List & filter escrows</h3>
            <CodeBlock code={`// Get all completed escrows ready for withdrawal
const { data, total } = await tl.escrows.list({
  status: "completed",
  limit: 20,
  offset: 0,
});`} language="typescript" />
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-lg">Release funds & trigger M-Pesa payout</h3>
            <CodeBlock code={`// Buyer confirmed delivery — release funds to seller
await tl.escrows.release(escrow.id);

// Trigger M-Pesa off-ramp (USDC → KES)
await tl.escrows.withdraw(escrow.id);`} language="typescript" />
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-lg">Manage webhooks</h3>
            <CodeBlock code={`// Register a webhook endpoint
const hook = await tl.webhooks.create({
  url: "https://yourapp.com/webhooks/trustlink",
  secret: "your_signing_secret",
  events: ["escrow.completed", "offramp.completed"],
});

// List all webhooks
const { data } = await tl.webhooks.list();

// Delete a webhook
await tl.webhooks.delete(hook.id);`} language="typescript" />
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-lg">Verifying webhook signatures</h3>
            <CodeBlock code={`import { TrustLink } from "@trustlink/sdk";

// In your Express / Next.js webhook handler:
app.post("/webhooks/trustlink", (req, res) => {
  const isValid = TrustLink.verifyWebhookSignature({
    payload: JSON.stringify(req.body),
    signature: req.headers["x-trustlink-signature"] as string,
    secret: process.env.WEBHOOK_SECRET!,
  });

  if (!isValid) return res.status(401).send("Invalid signature");

  const { event, data } = req.body;
  // event: "escrow.completed" | "offramp.completed" | ...
  console.log("Received:", event, data);
  res.sendStatus(200);
});`} language="typescript" />
          </div>
        </TabsContent>

        {/* ── API Keys Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="keys">
          {user ? <ApiKeys /> : <AuthGate>API keys</AuthGate>}
        </TabsContent>

        {/* ── Webhooks Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="webhooks">
          {user ? <Webhooks /> : <AuthGate>webhooks</AuthGate>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
