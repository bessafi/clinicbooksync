import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getAuthToken } from "@/lib/auth";
import { Loader2, ArrowLeft, Calendar as CalendarIcon } from "lucide-react";

// Types
interface WorkingHour {
  day: string; // e.g. "monday"
  available: boolean;
  start: string; // "08:30"
  end: string; // "17:00"
}

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

// helper: generate 15-min interval time options
function generateTimeOptions(intervalMinutes = 15) {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      options.push(`${hh}:${mm}`);
    }
  }
  return options;
}

function timeToMinutes(t: string) {
  const [hh, mm] = t.split(":");
  return parseInt(hh, 10) * 60 + parseInt(mm, 10);
}

export default function SettingsPage() {
  const { doctor, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // specialization
  const [specialization, setSpecialization] = useState<string>(doctor?.specialization || "");

  // weekly schedule
  const defaultSchedule: WorkingHour[] = useMemo(() => {
    return DAYS.map((d) => ({ day: d.key, available: false, start: "09:00", end: "17:00" }));
  }, []);

  const [schedule, setSchedule] = useState<WorkingHour[]>(defaultSchedule);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const timeOptions = useMemo(() => generateTimeOptions(15), []);

  useEffect(() => {
    // if doctor has initial data, merge it. This expects the backend to return workingHours in a compatible format
    if (doctor?.workingHours) {
      try {
        const fromBackend: any[] = doctor.workingHours;
        const merged = DAYS.map((d) => {
          const found = fromBackend.find((w) => w.day?.toLowerCase() === d.key);
          if (found) {
            return {
              day: d.key,
              available: !!found.isAvailable,
              start: found.startTime || "09:00",
              end: found.endTime || "17:00",
            } as WorkingHour;
          }
          return { day: d.key, available: false, start: "09:00", end: "17:00" } as WorkingHour;
        });
        setSchedule(merged);
      } catch (e) {
        // ignore and use default
      }
    }
  }, [doctor]);

  // --- mutations ---
  const updateProfileMutation = useMutation({
    mutationFn: async (newSpecialization: string) => {
      const token = getAuthToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const res = await fetch(`${backendUrl}/api/v1/doctors/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ specialization: newSpecialization }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Specialization updated!" });
      queryClient.invalidateQueries({ queryKey: ["doctor"] });
      checkOnboardingCompletion();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to update", variant: "destructive" });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (payload: WorkingHour[]) => {
      const token = getAuthToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const body = payload.map((p) => ({
        day: p.day,
        isAvailable: p.available,
        startTime: p.start,
        endTime: p.end,
      }));
      const res = await fetch(`${backendUrl}/api/v1/doctors/me/working-hours`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update schedule");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Weekly schedule saved!" });
      queryClient.invalidateQueries({ queryKey: ["doctor"] });
      checkOnboardingCompletion();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to save schedule", variant: "destructive" });
    },
  });

  // central check for onboarding completion
  const checkOnboardingCompletion = () => {
    if (specialization && schedule.some((s) => s.available)) {
        toast({
            title: "Profile Setup Complete",
            description: "🎉 You can now access your dashboard and start accepting appointments!",
        });

        
        // auto-redirect to dashboard after short delay
        setTimeout(() => {
            setLocation("/dashboard");
        }, 1200);
    }
  };



  const handleConnectCalendar = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    window.location.href = `${backendUrl}/api/v1/doctors/me/google-calendar/connect`;
  };

  // handlers for schedule UI
  const setDayAvailable = (day: string, available: boolean) => {
    setSchedule((prev) => prev.map((p) => (p.day === day ? { ...p, available } : p)));
  };

  const setDayStart = (day: string, start: string) => {
    setSchedule((prev) => prev.map((p) => (p.day === day ? { ...p, start } : p)));
  };

  const setDayEnd = (day: string, end: string) => {
    setSchedule((prev) => prev.map((p) => (p.day === day ? { ...p, end } : p)));
  };

  const validateSchedule = (): { ok: boolean; message?: string } => {
    for (const item of schedule) {
      if (item.available) {
        if (timeToMinutes(item.end) <= timeToMinutes(item.start)) {
          return { ok: false, message: `${item.day.charAt(0).toUpperCase() + item.day.slice(1)}: end must be after start` };
        }
      }
    }
    return { ok: true };
  };

  const saveSchedule = async () => {
    const v = validateSchedule();
    if (!v.ok) {
      toast({ title: "Validation Error", description: v.message });
      return;
    }
    setSavingSchedule(true);
    try {
      await updateScheduleMutation.mutateAsync(schedule);
    } catch (e) {
      // handled by mutation onError
    } finally {
      setSavingSchedule(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => setLocation('/dashboard')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-6">Setup Your Profile</h1>

        {/* Professional Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1. Professional Information</CardTitle>
            <CardDescription>Let patients know your area of expertise.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="specialization">Primary Specialization</Label>
              <Input
                id="specialization"
                placeholder="e.g., Dentistry, Cardiology"
                value={specialization}
                onChange={(e: any) => setSpecialization(e.target.value)}
              />
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <Button
                onClick={() => updateProfileMutation.mutate(specialization)}
                disabled={updateProfileMutation.isLoading}
              >
                {updateProfileMutation.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CalendarIcon className="h-4 w-4 mr-2" />
                )}
                Save Specialization
              </Button>
              <div className="text-sm text-muted-foreground">Your specialization appears on your public profile.</div>
            </div>
          </CardContent>
        </Card>

        {/* Google Calendar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2. Connect Your Calendar</CardTitle>
            <CardDescription>Sync your Google Calendar to automatically manage appointments and avoid conflicts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Connect your Google account to sync events and prevent double bookings.</p>
              </div>
              <div className="mt-2 sm:mt-0">
                <Button onClick={handleConnectCalendar}>
                  Connect Google Calendar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>3. Set Your Weekly Hours</CardTitle>
            <CardDescription>Define your standard availability for appointments. Patients can only book within these times.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedule.map((s) => (
                <div key={s.day} className="grid grid-cols-12 gap-3 items-center py-2 border-b border-border last:border-b-0">
                  <div className="col-span-4 sm:col-span-3 flex items-center space-x-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">{s.day.charAt(0).toUpperCase() + s.day.slice(1)}</div>
                      <div className="text-xs text-muted-foreground">{s.available ? "Available" : "Not available"}</div>
                    </div>
                  </div>

                  <div className="col-span-5 sm:col-span-6 flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Switch checked={s.available} onCheckedChange={(val: boolean) => setDayAvailable(s.day, val)} />
                    </div>

                    <div className={`flex items-center space-x-2 ${!s.available ? "opacity-50 pointer-events-none" : ""}`}>
                      <div>
                        <Label className="text-xs">Start</Label>
                        <select
                          value={s.start}
                          onChange={(e) => setDayStart(s.day, e.target.value)}
                          className="block w-28 rounded-md border border-input px-2 py-1 text-sm"
                        >
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs">End</Label>
                        <select
                          value={s.end}
                          onChange={(e) => setDayEnd(s.day, e.target.value)}
                          className="block w-28 rounded-md border border-input px-2 py-1 text-sm"
                        >
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-3 sm:col-span-3 text-right">
                    {/* Quick presets */}
                    <div className="text-sm">
                      <button
                        className="text-xs underline"
                        onClick={() => setSchedule((prev) => prev.map((p) => p.day === s.day ? ({ ...p, available: true, start: '09:00', end: '17:00' }) : p))}
                      >
                        Standard (9–17)
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4 flex items-center space-x-3">
                <Button onClick={saveSchedule} disabled={savingSchedule || updateScheduleMutation.isLoading}>
                  {savingSchedule || updateScheduleMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Weekly Schedule
                </Button>
                <div className="text-sm text-muted-foreground">You can change this anytime from Settings.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
