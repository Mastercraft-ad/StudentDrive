import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Users,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  LogOut,
  Shield,
  Clock,
  MapPin,
  Globe,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface ActiveSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  userRole: string | null;
  platform: string;
  schoolId: string | null;
  schoolName: string | null;
  sessionId: string;
  ipAddress: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  isActive: boolean;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
}

interface SessionStats {
  totalActive: number;
  lmsActive: number;
  smsActive: number;
  byDevice: Record<string, number>;
}

function getDeviceIcon(deviceType: string | null) {
  switch (deviceType) {
    case "mobile":
      return Smartphone;
    case "tablet":
      return Tablet;
    default:
      return Monitor;
  }
}

function formatTimeAgo(date: string) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function ActiveSessionsPage() {
  const { toast } = useToast();
  const [platform, setPlatform] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionToTerminate, setSessionToTerminate] = useState<ActiveSession | null>(null);
  const [terminateReason, setTerminateReason] = useState("");
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);

  const { data: sessionsData, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery<{
    sessions: ActiveSession[];
    total: number;
  }>({
    queryKey: ["/api/super-admin/sessions", { platform }],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<SessionStats>({
    queryKey: ["/api/super-admin/sessions/stats"],
  });

  const terminateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, reason }: { sessionId: string; reason?: string }) => {
      return apiRequest("POST", `/api/super-admin/sessions/${sessionId}/terminate`, { reason });
    },
    onSuccess: () => {
      toast({ title: "Session terminated", description: "The session has been successfully terminated." });
      setSessionToTerminate(null);
      setTerminateReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/sessions/stats"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to terminate session.", variant: "destructive" });
    },
  });

  const terminateUserSessionsMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      return apiRequest("POST", `/api/super-admin/sessions/user/${userId}/terminate-all`, { reason });
    },
    onSuccess: (_, variables) => {
      toast({ title: "Sessions terminated", description: "All sessions for the user have been terminated." });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/sessions/stats"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to terminate sessions.", variant: "destructive" });
    },
  });

  const cleanupSessionsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/super-admin/sessions/cleanup", {});
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "Cleanup complete", 
        description: `${data.count || 0} expired session(s) cleaned up.` 
      });
      setShowCleanupDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/sessions/stats"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to cleanup sessions.", variant: "destructive" });
    },
  });

  const sessions = sessionsData?.sessions || [];
  const filteredSessions = sessions.filter((session) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      session.userEmail?.toLowerCase().includes(search) ||
      session.userName?.toLowerCase().includes(search) ||
      session.schoolName?.toLowerCase().includes(search) ||
      session.ipAddress?.includes(search)
    );
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-section font-heading text-foreground">Active Sessions</h1>
          </div>
          <p className="text-muted-foreground">
            Monitor and manage all active user sessions across platforms
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => refetchSessions()}
            data-testid="button-refresh-sessions"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowCleanupDialog(true)}
            data-testid="button-cleanup-sessions"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup Expired
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-total-active">
                {stats?.totalActive || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LMS Sessions</CardTitle>
            <Globe className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-blue-500" data-testid="stat-lms-active">
                {stats?.lmsActive || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Sessions</CardTitle>
            <Globe className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-500" data-testid="stat-sms-active">
                {stats?.smsActive || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">By Device</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <Monitor className="h-3 w-3 mr-1" />
                  {stats?.byDevice?.desktop || 0}
                </Badge>
                <Badge variant="secondary">
                  <Smartphone className="h-3 w-3 mr-1" />
                  {stats?.byDevice?.mobile || 0}
                </Badge>
                <Badge variant="secondary">
                  <Tablet className="h-3 w-3 mr-1" />
                  {stats?.byDevice?.tablet || 0}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session List</CardTitle>
          <CardDescription>All active sessions across both platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">
            <Input
              placeholder="Search by email, name, school, or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:w-80"
              data-testid="input-search-sessions"
            />
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="md:w-40" data-testid="select-platform-filter">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="lms">LMS Only</SelectItem>
                <SelectItem value="sms">SMS Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sessionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active sessions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => {
                    const DeviceIcon = getDeviceIcon(session.deviceType);
                    return (
                      <TableRow key={session.id} data-testid={`row-session-${session.id}`}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{session.userName || session.userEmail}</span>
                            <span className="text-xs text-muted-foreground">{session.userEmail}</span>
                            {session.userRole && (
                              <Badge variant="outline" className="w-fit mt-1 text-xs">
                                {session.userRole}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <Badge variant={session.platform === "lms" ? "default" : "secondary"}>
                              {session.platform.toUpperCase()}
                            </Badge>
                            {session.schoolName && (
                              <span className="text-xs text-muted-foreground mt-1">
                                {session.schoolName}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="text-sm capitalize">{session.deviceType || "Desktop"}</span>
                              <span className="text-xs text-muted-foreground">
                                {session.browser} / {session.os}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{session.ipAddress || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatTimeAgo(session.lastActivityAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSessionToTerminate(session)}
                            title="Terminate session"
                            data-testid={`button-terminate-session-${session.id}`}
                          >
                            <LogOut className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!sessionToTerminate} onOpenChange={() => setSessionToTerminate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Terminate Session
            </DialogTitle>
            <DialogDescription>
              This will immediately end the session for{" "}
              <span className="font-medium">{sessionToTerminate?.userEmail}</span>.
              The user will be logged out.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Reason (optional)</label>
            <Textarea
              placeholder="Enter reason for termination..."
              value={terminateReason}
              onChange={(e) => setTerminateReason(e.target.value)}
              className="mt-2"
              data-testid="input-terminate-reason"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSessionToTerminate(null)}
              data-testid="button-cancel-terminate"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (sessionToTerminate) {
                  terminateSessionMutation.mutate({
                    sessionId: sessionToTerminate.sessionId,
                    reason: terminateReason || undefined,
                  });
                }
              }}
              disabled={terminateSessionMutation.isPending}
              data-testid="button-confirm-terminate"
            >
              {terminateSessionMutation.isPending ? "Terminating..." : "Terminate Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cleanup Expired Sessions</DialogTitle>
            <DialogDescription>
              This will remove all expired sessions from the database. This action is safe and
              helps maintain database performance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCleanupDialog(false)}
              data-testid="button-cancel-cleanup"
            >
              Cancel
            </Button>
            <Button
              onClick={() => cleanupSessionsMutation.mutate()}
              disabled={cleanupSessionsMutation.isPending}
              data-testid="button-confirm-cleanup"
            >
              {cleanupSessionsMutation.isPending ? "Cleaning up..." : "Run Cleanup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
