import { useEffect } from "react";
import { useLocation } from "wouter";
import { setAuthToken } from "@/lib/auth";
import { Loader2, Shield } from "lucide-react";

export default function AuthHandler() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setAuthToken(token);
      // Small delay for better UX
      setTimeout(() => {
        setLocation('/dashboard');
      }, 1500);
    } else {
      // No token found, redirect to landing
      setLocation('/');
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">Authenticating securely...</h2>
          <p className="text-muted-foreground">Finalizing connection and loading your dashboard</p>
        </div>
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-accent" />
          <span>Encrypted connection established</span>
        </div>
      </div>
    </div>
  );
}
