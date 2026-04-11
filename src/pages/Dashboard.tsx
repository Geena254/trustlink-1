import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Wallet, TrendingUp, History, Sparkles, LayoutGrid, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Escrow, Profile } from "@/types/escrow";
import { EscrowCard } from "@/components/EscrowCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profileData) setProfile(profileData as Profile);

        // Fetch Escrows
        const { data, error } = await supabase
          .from("escrows")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setEscrows(data || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load your transactions");
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    const subscription = supabase
      .channel('escrow_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escrows' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setEscrows(prev => [payload.new as Escrow, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setEscrows(prev => prev.map(e => e.id === payload.new.id ? payload.new as Escrow : e));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const totalVolume = escrows.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const activeEscrows = escrows.filter(e => ['pending', 'deposited'].includes(e.status)).length;
  
  const filteredEscrows = escrows.filter(e => {
    const amountStr = (e.amount || "").toString();
    const statusStr = (e.status || "").toLowerCase();
    const chainStr = (e.chain || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return amountStr.includes(query) || statusStr.includes(query) || chainStr.includes(query);
  });

  return (
    <div className="container max-w-7xl mx-auto px-4 pt-24 pb-32">
      <header className="mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Welcome Back</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              {profile?.full_name ? profile.full_name : "Merchant"} Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Manage your secure escrow links and payouts.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/create">
              <Button size="lg" className="h-14 rounded-2xl px-8 shadow-xl shadow-primary/20 text-lg font-bold">
                <Plus className="w-6 h-6 mr-2" />
                New Escrow Link
              </Button>
            </Link>
          </div>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card className="bg-primary/5 border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Total Volume</CardTitle>
              <TrendingUp className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{totalVolume.toFixed(2)} USDC</div>
              <p className="text-xs text-muted-foreground mt-1">Lifetime transactions processed</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="bg-secondary/10 border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-secondary-foreground">Active Links</CardTitle>
              <History className="w-5 h-5 text-secondary-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{activeEscrows}</div>
              <p className="text-xs text-muted-foreground mt-1">Waiting for payment or release</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card className="bg-green-500/5 border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-green-600">Off-ramp Status</CardTitle>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-green-600">Active</div>
              <p className="text-xs text-muted-foreground mt-1">M-Pesa integration ready</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-black flex items-center gap-3">
          <LayoutGrid className="w-6 h-6 text-primary" />
          Recent Transactions
        </h2>
        <div className="relative w-full md:w-80">
          <Input 
            placeholder="Search by amount, status..." 
            className="pl-10 h-12 bg-muted/50 border-none rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-3xl" />
          ))}
        </div>
      ) : filteredEscrows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEscrows.map((escrow, index) => (
            <EscrowCard key={escrow.id} escrow={escrow} index={index} />
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border/50"
        >
          <div className="max-w-sm mx-auto p-8">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-black mb-2">No transactions found</h3>
            <p className="text-muted-foreground mb-8">
              {searchQuery ? "Try adjusting your search filters." : "Create your first escrow link to start receiving payments safely."}
            </p>
            {!searchQuery && (
              <Link to="/create">
                <Button variant="outline" size="lg" className="rounded-2xl h-14 px-10">Start Selling</Button>
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}