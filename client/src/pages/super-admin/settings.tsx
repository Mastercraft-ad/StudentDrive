import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Settings,
  Shield,
  Bell,
  Mail,
  Globe,
  Database,
  Lock,
  Key,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  allowSchoolRegistrations: boolean;
  defaultTrialDays: number;
  paystackEnabled: boolean;
  emailNotificationsEnabled: boolean;
  lastDatabaseBackup: string | null;
}

export default function SuperAdminSettings() {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ["/api/super-admin/settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<SystemSettings>) => {
      return await apiRequest("PATCH", "/api/super-admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/settings"] });
      toast({ title: "Success", description: "Settings updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleToggle = (key: keyof SystemSettings, value: boolean) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const handleSave = (key: keyof SystemSettings, value: string | number) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-section font-heading text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" />
          System Settings
        </h1>
        <p className="text-muted-foreground">
          Configure platform-wide settings for StudentDrive
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Site Configuration
          </CardTitle>
          <CardDescription>Basic platform settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input 
              id="siteName"
              defaultValue={settings?.siteName || "StudentDrive"}
              onBlur={(e) => handleSave("siteName", e.target.value)}
              data-testid="input-site-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteDescription">Site Description</Label>
            <Textarea 
              id="siteDescription"
              defaultValue={settings?.siteDescription || ""}
              onBlur={(e) => handleSave("siteDescription", e.target.value)}
              data-testid="input-site-description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input 
              id="supportEmail"
              type="email"
              defaultValue={settings?.supportEmail || ""}
              onBlur={(e) => handleSave("supportEmail", e.target.value)}
              data-testid="input-support-email"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Access Control
          </CardTitle>
          <CardDescription>Control user and school registrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow New User Registrations</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable new user registrations on the LMS platform
              </p>
            </div>
            <Switch 
              checked={settings?.allowNewRegistrations ?? true}
              onCheckedChange={(checked) => handleToggle("allowNewRegistrations", checked)}
              data-testid="switch-allow-registrations"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow School Registrations</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable new school registrations on the SMS platform
              </p>
            </div>
            <Switch 
              checked={settings?.allowSchoolRegistrations ?? true}
              onCheckedChange={(checked) => handleToggle("allowSchoolRegistrations", checked)}
              data-testid="switch-allow-school-registrations"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-destructive">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Put the entire platform into maintenance mode
              </p>
            </div>
            <Switch 
              checked={settings?.maintenanceMode ?? false}
              onCheckedChange={(checked) => handleToggle("maintenanceMode", checked)}
              data-testid="switch-maintenance-mode"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-600" />
            Subscription Settings
          </CardTitle>
          <CardDescription>Configure subscription defaults</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trialDays">Default Trial Period (days)</Label>
            <Input 
              id="trialDays"
              type="number"
              defaultValue={settings?.defaultTrialDays || 14}
              onBlur={(e) => handleSave("defaultTrialDays", parseInt(e.target.value))}
              data-testid="input-trial-days"
            />
            <p className="text-sm text-muted-foreground">
              Number of days for new school trial period
            </p>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Paystack Payment Integration</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable Paystack for payment processing
              </p>
            </div>
            <div className="flex items-center gap-2">
              {settings?.paystackEnabled ? (
                <Badge variant="default" className="bg-green-600 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="secondary">Disabled</Badge>
              )}
              <Switch 
                checked={settings?.paystackEnabled ?? true}
                onCheckedChange={(checked) => handleToggle("paystackEnabled", checked)}
                data-testid="switch-paystack-enabled"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-600" />
            Notifications
          </CardTitle>
          <CardDescription>Configure notification settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send email notifications for important events
              </p>
            </div>
            <Switch 
              checked={settings?.emailNotificationsEnabled ?? true}
              onCheckedChange={(checked) => handleToggle("emailNotificationsEnabled", checked)}
              data-testid="switch-email-notifications"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-red-600" />
            Database
          </CardTitle>
          <CardDescription>Database management and maintenance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Last Backup</p>
              <p className="text-sm text-muted-foreground">
                {settings?.lastDatabaseBackup 
                  ? new Date(settings.lastDatabaseBackup).toLocaleString()
                  : "Never"}
              </p>
            </div>
            <Button variant="outline" size="sm" data-testid="button-backup-database">
              <RefreshCw className="h-4 w-4 mr-2" />
              Backup Now
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="destructive" 
            onClick={() => setShowResetDialog(true)}
            data-testid="button-reset-settings"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Reset All Settings
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all system settings to their default values. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                toast({ 
                  title: "Settings Reset", 
                  description: "All settings have been reset to defaults" 
                });
                setShowResetDialog(false);
              }}
            >
              Reset Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
