import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full space-y-8 text-center bg-card p-12 rounded-[2rem] shadow-2xl border border-border">
            <div className="w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight">Something went wrong</h1>
              <p className="text-muted-foreground">
                The application encountered an unexpected error. This might be due to missing configuration or a temporary connection issue.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-muted/50 p-4 rounded-xl text-xs font-mono text-left overflow-auto max-h-32 opacity-70">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={() => window.location.reload()} 
                className="h-12 text-lg font-bold w-full rounded-xl"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Reload Application
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = "/"} 
                className="h-12 text-lg font-bold w-full rounded-xl"
              >
                <Home className="mr-2 h-5 w-5" />
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}