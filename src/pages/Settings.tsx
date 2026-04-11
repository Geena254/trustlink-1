import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Smartphone, Mail, Shield, Save, Loader2, Camera, Star, CreditCard, Landmark } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/escrow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    mpesa_phone: "",
    paybill: "",
    till_number: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        
        if (data) {
          setProfile(data);
          setFormData({
            full_name: data.full_name || "",
            mpesa_phone: data.mpesa_phone || "",
            paybill: data.paybill || "",
            till_number: data.till_number || "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          mpesa_phone: formData.mpesa_phone,
          paybill: formData.paybill,
          till_number: formData.till_number,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 pt-32 pb-32">
        <div className="space-y-6">
          <div className="w-24 h-24 rounded-full bg-muted animate-pulse mx-auto" />
          <div className="h-8 w-48 bg-muted animate-pulse mx-auto" />
          <div className="h-64 w-full bg-muted animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 pt-32 pb-32">
      <header className="mb-10 text-center">
        <div className="relative inline-block group mb-6">
          <div className="w-28 h-28 rounded-full bg-primary/10 border-4 border-background shadow-xl flex items-center justify-center overflow-hidden">
            <User className="w-14 h-14 text-primary" />
            <img 
              src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/fc1f5627-2238-4cd5-8bc8-698168294c49/settings-icon-cc4400d8-1775404615708.webp" 
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
              alt="Avatar"
            />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Merchant Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your identity and payout destinations.</p>
        
        <div className="mt-6 flex justify-center">
          {profile?.is_subscriber ? (
            <Badge className="bg-primary h-8 px-4 text-sm font-bold gap-2">
              <Star className="w-4 h-4 fill-current" />
              Pro Merchant
            </Badge>
          ) : (
            <Link to="/subscribe">
              <Badge variant="outline" className="h-8 px-4 text-sm font-bold gap-2 hover:bg-primary/5 transition-colors cursor-pointer">
                <Star className="w-4 h-4" />
                Upgrade to Pro
              </Badge>
            </Link>
          )}
        </div>
      </header>

      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-none shadow-xl bg-card">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>Your business profile and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Business/Full Name</Label>
                <div className="relative">
                  <Input 
                    id="full_name" 
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="pl-10 h-12"
                    placeholder="Acme Corp or John Doe"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email (Private)</Label>
                <div className="relative">
                  <Input 
                    disabled 
                    value="Authenticated"
                    className="pl-10 h-12 bg-muted/50 border-dashed opacity-70"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-xl bg-card">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                Payout Configuration
              </CardTitle>
              <CardDescription>Configure how you receive your M-Pesa payouts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="mpesa_phone">Default M-Pesa Phone Number</Label>
                <div className="relative">
                  <Input 
                    id="mpesa_phone" 
                    placeholder="2547XXXXXXXX"
                    value={formData.mpesa_phone}
                    onChange={(e) => setFormData({ ...formData, mpesa_phone: e.target.value })}
                    className="pl-10 h-12"
                  />
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paybill">M-Pesa Paybill</Label>
                  <div className="relative">
                    <Input 
                      id="paybill" 
                      placeholder="888888"
                      value={formData.paybill}
                      onChange={(e) => setFormData({ ...formData, paybill: e.target.value })}
                      className="pl-10 h-12"
                    />
                    <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="till">M-Pesa Till Number</Label>
                  <div className="relative">
                    <Input 
                      id="till" 
                      placeholder="123456"
                      value={formData.till_number}
                      onChange={(e) => setFormData({ ...formData, till_number: e.target.value })}
                      className="pl-10 h-12"
                    />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <Button 
                className="w-full h-12 text-lg shadow-lg shadow-primary/20" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Save Payout Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}