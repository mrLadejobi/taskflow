"use client";

import { useEffect, useState } from "react";
import { Bell, Moon, Palette, Save, Shield, Sun, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/hooks/use-auth";
import { useUpdateUserSettings, useUserSettings } from "@/lib/hooks/use-notifications";
import { formatDate } from "@/lib/format";

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateUserSettings();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [assignmentAlerts, setAssignmentAlerts] = useState(true);
  const [statusAlerts, setStatusAlerts] = useState(true);
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [compactView, setCompactView] = useState(false);

  useEffect(() => {
    if (settings) {
      setEmailAlerts(settings.email_notifications);
      setAssignmentAlerts(settings.task_assigned_alerts);
      setStatusAlerts(settings.status_change_alerts);
      setTheme(settings.theme as "system" | "light" | "dark");
      setCompactView(settings.compact_view);
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      email_notifications: emailAlerts,
      task_assigned_alerts: assignmentAlerts,
      status_change_alerts: statusAlerts,
      theme,
      compact_view: compactView,
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account & Preferences</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal profile, notification delivery rules, and appearance settings.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="h-4 w-4 text-primary" /> Profile Information
            </CardTitle>
            <CardDescription>
              Account credentials and primary identity details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email Address</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Full Name</Label>
                <Input
                  id="name"
                  value={user?.full_name || ""}
                  disabled
                  className="bg-muted text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span>Account active since {user?.created_at ? formatDate(user.created_at) : "recently"}.</span>
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Preferences Form */}
        <form onSubmit={handleSave}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-4 w-4 text-primary" /> Notification Delivery
                </CardTitle>
                <CardDescription>
                  Choose how and when TaskFlow alerts you to workspace activities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-border/40 p-3">
                  <Checkbox
                    id="email_alerts"
                    checked={emailAlerts}
                    onCheckedChange={(c) => setEmailAlerts(Boolean(c))}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="email_alerts" className="text-xs font-semibold cursor-pointer">
                      Email Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receive an email whenever an urgent task is assigned to you or due soon.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-border/40 p-3">
                  <Checkbox
                    id="assignment_alerts"
                    checked={assignmentAlerts}
                    onCheckedChange={(c) => setAssignmentAlerts(Boolean(c))}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="assignment_alerts" className="text-xs font-semibold cursor-pointer">
                      Task Assignment Alerts
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Show in-app alerts whenever a collaborator assigns a new task to you.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-border/40 p-3">
                  <Checkbox
                    id="status_alerts"
                    checked={statusAlerts}
                    onCheckedChange={(c) => setStatusAlerts(Boolean(c))}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="status_alerts" className="text-xs font-semibold cursor-pointer">
                      Status Change Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified when tasks you created are moved to review or completed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4 text-primary" /> Appearance & Display
                </CardTitle>
                <CardDescription>
                  Customize your workspace visual preferences and display density.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="theme" className="text-xs">Theme Preference</Label>
                    <Select
                      value={theme}
                      onValueChange={(val) => setTheme(val as "system" | "light" | "dark")}
                    >
                      <SelectTrigger id="theme" className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System Default</SelectItem>
                        <SelectItem value="light">Light Mode</SelectItem>
                        <SelectItem value="dark">Dark Mode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Table Display Density</Label>
                    <div className="flex items-center gap-3 pt-2">
                      <Checkbox
                        id="compact"
                        checked={compactView}
                        onCheckedChange={(c) => setCompactView(Boolean(c))}
                      />
                      <Label htmlFor="compact" className="text-xs cursor-pointer">
                        Compact table rows (higher information density)
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateSettings.isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {updateSettings.isPending ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
