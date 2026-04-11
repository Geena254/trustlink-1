import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/Navbar";
import Dashboard from "@/pages/Dashboard";
import CreateEscrow from "@/pages/CreateEscrow";
import PayEscrow from "@/pages/PayEscrow";
import Withdraw from "@/pages/Withdraw";
import Auth from "@/pages/Auth";
import Settings from "@/pages/Settings";
import Subscribe from "@/pages/Subscribe";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AnimatePresence, motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect } from "react";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/NotFound";

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={
          <PageWrapper>
            <Landing />
          </PageWrapper>
        } />
        <Route path="/auth" element={
          <PageWrapper>
            <Auth />
          </PageWrapper>
        } />
        <Route path="/pay/:id" element={
          <PageWrapper>
            <PayEscrow />
          </PageWrapper>
        } />
        <Route path="/create" element={
          <PageWrapper>
            <CreateEscrow />
          </PageWrapper>
        } />

        {/* Auth-only Routes (no subscription required to manage settings) */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <PageWrapper>
              <Settings />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/subscribe" element={
          <ProtectedRoute>
            <PageWrapper>
              <Subscribe />
            </PageWrapper>
          </ProtectedRoute>
        } />

        {/* Protected Merchant Routes (Subscription Required) */}
        <Route path="/dashboard" element={
          <ProtectedRoute requireSubscription>
            <PageWrapper>
              <Dashboard />
            </PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/withdraw" element={
          <ProtectedRoute requireSubscription>
            <PageWrapper>
              <Withdraw />
            </PageWrapper>
          </ProtectedRoute>
        } />
        
        {/* Catch-all Route */}
        <Route path="*" element={
          <PageWrapper>
            <NotFound />
          </PageWrapper>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function App() {
  useEffect(() => {
    document.title = "TrustLink | Secure Escrow Protocol";
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans antialiased">
          <Navbar />
          <main className="pb-20 md:pb-0">
            <AnimatedRoutes />
          </main>
          <Toaster position="top-center" richColors closeButton />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;