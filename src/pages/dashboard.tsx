import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { removeAuthToken, getAuthToken } from "@/lib/auth";
import {
  Calendar,
  Plus,
  LogOut,
  User,
  Clock,
  Stethoscope,
  FolderSync,
  CalendarCheck,
  X, 
  Info,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AppointmentResponse } from "@shared/schema";

export default function Dashboard() {
  const { doctor, isLoading: authLoading, isAuthenticated, error: authError } = useAuth();
  const [, setLocation] = useLocation();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/");
      }, 500);
    }
  }, [authLoading, isAuthenticated, setLocation, toast]);

  // Show backend connection error
  useEffect(() => {
    if (authError && authError.message.includes("Backend server not available")) {
      toast({
        title: "Backend Not Connected",
        description: "Please start your Spring Boot server on port 8080 to use the app.",
        variant: "destructive",
      });
    }
  }, [authError, toast]);

  

  // check profile completeness
  const isProfileComplete = !!doctor?.specialization;

  // redirect to settings if profile incomplete
  /*useEffect(() => {
      if (!authLoading && isAuthenticated && doctor && !isProfileComplete) {
          setLocation("/settings");
      }
  }, [authLoading, isAuthenticated, doctor, isProfileComplete, setLocation]);
*/


  // redirect to settings if profile incomplete
    useEffect(() => {
      if (!authLoading && isAuthenticated && doctor && !isProfileComplete) {
        toast({
            title: "Profile Incomplete",
            description: "Please complete your profile before accessing the dashboard.",
        });
        setLocation("/settings");
      }
    }, [authLoading, isAuthenticated, doctor, isProfileComplete, setLocation]);
   
  // show loading overlay during redirect
    if (!authLoading && isAuthenticated && doctor && !isProfileComplete) {
      return (
          <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
             <p className="text-muted-foreground">Redirecting to settings...</p>
          </div>
          </div>
      );
    }

  // Fetch appointments
  const {
    data: appointments = [],
    isLoading: appointmentsLoading,
  } = useQuery<AppointmentResponse[]>({
    queryKey: ["appointments"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error("No authentication token");
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://production.up.railway.app";
      //const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
      const response = await fetch(`${backendUrl}/api/v1/doctors/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const token = getAuthToken();
      if (!token) throw new Error("No authentication token");

      const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://production.up.railway.app";
      //const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
      
      
      const response = await fetch(`${backendUrl}/api/v1/doctors/appointments/${appointmentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: "Success",
        description: "Appointment cancelled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to cancel appointment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    removeAuthToken();
    setLocation("/");
  };

  const handleCancelAppointment = (appointmentId: string) => {
    setAppointmentToCancel(appointmentId);
    setConfirmDialogOpen(true);
  };

  const confirmCancelAppointment = () => {
    if (appointmentToCancel) {
      cancelAppointmentMutation.mutate(appointmentToCancel);
    }
    setConfirmDialogOpen(false);
    setAppointmentToCancel(null);
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !doctor) {
    return null; // Redirect happens via useEffect
  }

  const todayAppointments = appointments.filter((apt) => {
    const today = new Date();
    const aptDate = new Date(apt.dateTime);
    return aptDate.toDateString() === today.toDateString();
  }).length;

  const thisWeekAppointments = appointments.filter((apt) => {
    const today = new Date();
    const aptDate = new Date(apt.dateTime);
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    return aptDate >= weekStart && aptDate <= weekEnd;
  }).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
                <div className="relative">
                  <Calendar className="h-4 w-4 text-primary-foreground" />
                  <Plus className="h-2 w-2 text-primary-foreground absolute -top-0.5 -right-0.5" />
                </div>
              </div>
              <span className="text-xl font-bold text-foreground">ClinicSync</span>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-7xl">

         {/* Onboarding alert if profile incomplete */}
        {!isProfileComplete && (
            <Alert className="mb-8 bg-blue-50 border-blue-200 text-blue-800">
                <Info className="h-4 w-4 !text-blue-600" />
                <AlertTitle className="font-bold">Finish setting up your profile!</AlertTitle>
                <AlertDescription>
                    To start accepting appointments, you need to set your specialization and connect your calendar.
                    <Link href="/settings">
                        <a className="font-semibold underline ml-2 hover:text-blue-900">Go to Settings</a>
                    </Link>
                </AlertDescription>
            </Alert>
        )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Doctor Profile Card */}
            <div className="lg:col-span-1">
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-foreground">
                        Welcome, {doctor.name}
                      </h2>
                      <p className="text-muted-foreground">{doctor.email}</p>
                      {doctor.specialization && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent/10 text-accent">
                          <Stethoscope className="h-3 w-3 mr-2" />
                          <span>{doctor.specialization}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-accent">{thisWeekAppointments}</div>
                        <div className="text-xs text-muted-foreground">This Week</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-primary">{todayAppointments}</div>
                        <div className="text-xs text-muted-foreground">Today</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Appointments Panel */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-foreground">Upcoming Appointments</h3>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <FolderSync className="h-4 w-4" />
                      <span>Synced with Google Calendar</span>
                    </div>
                  </div>

                  {appointmentsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading appointments...</p>
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                        <CalendarCheck className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h4 className="text-lg font-medium text-foreground mb-2">
                        You have no upcoming appointments
                      </h4>
                      <p className="text-muted-foreground">
                        Your schedule is clear. Enjoy your free time!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="border border-border rounded-lg p-4 hover:border-primary/20 hover:bg-secondary/20 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-accent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-lg font-medium text-foreground truncate">
                                    {appointment.patientName}
                                  </h4>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <span className="flex items-center space-x-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>{formatDateTime(appointment.dateTime)}</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>30 minutes</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-13">
                                <p className="text-sm text-muted-foreground">
                                  <strong>Reason:</strong> {appointment.reason}
                                </p>
                              </div>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelAppointment(appointment.id)}
                                disabled={cancelAppointmentMutation.isPending}
                              >
                                <X className="h-3 w-3 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={confirmCancelAppointment}
      />
    </div>
  );
}
