import { Button } from "@/components/ui/button";
import { Calendar, Plus, Shield, Lock, Award } from "lucide-react";

export default function Landing() {
  const handleGoogleSignIn = () => {
    // Redirect to your Spring Boot OAuth endpoint
    //window.location.href = "http://localhost:8080/api/v1/login";
    window.location.href = "https://doctorbooking-production.up.railway.app/api/v1/login";

  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="px-6 lg:px-8 py-6">
        <div className="mx-auto max-w-7xl flex items-center">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <div className="relative">
                <Calendar className="h-5 w-5 text-primary-foreground" />
                <Plus className="h-3 w-3 text-primary-foreground absolute -top-1 -right-1" />
              </div>
            </div>
            <span className="text-2xl font-bold text-foreground">ClinicSync</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center animate-in fade-in duration-500">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                Your Calendar,{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Synchronized
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Effortlessly manage your patient appointments by connecting your Google Calendar. 
                Secure, simple, and built for the modern practitioner.
              </p>
            </div>

            {/* Call-to-Action Buttons */}
            <div className="pt-4 space-y-4">
              <Button 
                size="lg"
                onClick={handleGoogleSignIn}
                className="px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 space-x-3"
                data-testid="button-google-signin"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path 
                    fill="currentColor" 
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path 
                    fill="currentColor" 
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path 
                    fill="currentColor" 
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path 
                    fill="currentColor" 
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Get Started with Google
              </Button>
              <p className="text-sm text-muted-foreground">
                New to ClinicSync? Your account will be created automatically when you sign in.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-accent" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-accent" />
                <span>End-to-End Encrypted</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-accent" />
                <span>SOC 2 Certified</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 lg:px-8 py-6">
        <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          <p>&copy; 2024 ClinicSync. Built for healthcare professionals.</p>
        </div>
      </footer>
    </div>
  );
}
