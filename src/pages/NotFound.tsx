import { motion } from "framer-motion";
import { Search, Home, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-7xl font-black mb-4">404</h1>
          <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            The link you followed may be broken, or the page may have been removed. 
            Check the URL or return to safety.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/" className="flex-1">
            <Button className="w-full h-12 rounded-xl gap-2">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
          <Button variant="outline" className="flex-1 h-12 rounded-xl gap-2" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}