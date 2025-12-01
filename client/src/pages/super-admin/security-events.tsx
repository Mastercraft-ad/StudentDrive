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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  RefreshCw,
  Clock,
  MapPin,
  User,
  Lock,
  X,
  Eye,
  Filter,
} from "lucide-react";

interface SecurityEvent {
  id: string;
  eventType: string;
  severity: string;
  platform: string;
  schoolId: string | null;
  schoolName: string | null;
  targetUserId: string | null;
  targetUserEmail: string | null;
  targetUserRole: string | null;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  description: string;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestPath: string | null;
  requestMethod: string | null;
  isResolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  createdAt: string;
}

interface SecurityEventStats {
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  unresolved: number;
  recentCritical: SecurityEvent[];
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical":
      return "destructive";
    case "error":
      return "destructive";
    case "warning":
      return "secondary";
    default:
      return "outline";
  }
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "critical":
      return AlertTriangle;
    case "error":
      return AlertCircle;
    case "warning":
      return AlertTriangle;
    default:
      return Info;
  }
}

function formatEventType(eventType: string) {
  return eventType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SecurityEventsPage() {
  const { toast } = useToast();
  const [platform, setPlatform] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");
  const [eventType, setEventType] = useState<string>("all");
  const [showResolved, setShowResolved] = useState<string>("unresolved");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [showResolveDialog, setShowResolveDialog] = useState(false);

  const buildQueryParams = () => {
    const params: Record<string, string> = { limit: "100" };
    if (platform !== "all") params.platform = platform;
    if (severity !== "all") params.severity = severity;
    if (eventType !== "all") params.eventType = eventType;
    if (showResolved !== "all") params.isResolved = showResolved === "resolved" ? "true" : "false";
    return params;
  };

  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = useQuery<{
    events: SecurityEvent[];
    total: number;
  }>({
    queryKey: ["/api/super-admin/security-events", buildQueryParams()],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<SecurityEventStats>({
    queryKey: ["/api/super-admin/security-events/stats"],
  });

  const resolveEventMutation = useMutation({
    mutationFn: async ({ eventId, notes }: { eventId: string; notes?: string }) => {
      return apiRequest("POST", `/api/super-admin/security-events/${eventId}/resolve`, { notes });
    },
    onSuccess: () => {
      toast({ title: "Event resolved", description: "The security event has been marked as resolved." });
      setShowResolveDialog(false);
      setSelectedEvent(null);
      setResolveNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/security-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/security-events/stats"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to resolve event.", variant: "destructive" });
    },
  });

  const events = eventsData?.events || [];
  const filteredEvents = events.filter((event) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      event.description?.toLowerCase().includes(search) ||
      event.targetUserEmail?.toLowerCase().includes(search) ||
      event.ipAddress?.includes(search) ||
      event.schoolName?.toLowerCase().includes(search)
    );
  });

  const eventTypes = stats?.byType ? Object.keys(stats.byType) : [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-section font-heading text-foreground">Security Events</h1>
          </div>
          <p className="text-muted-foreground">
            Monitor security-related events and incidents across the platform
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetchEvents()}
          data-testid="button-refresh-events"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-amber-500" data-testid="stat-unresolved">
                {stats?.unresolved || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-destructive" data-testid="stat-critical">
                {stats?.bySeverity?.critical || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-warnings">
                {stats?.bySeverity?.warning || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-failed-logins">
                {stats?.byType?.login_failed || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {stats?.recentCritical && stats.recentCritical.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Recent Critical Events
            </CardTitle>
            <CardDescription>Events requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentCritical.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-md bg-destructive/5 border border-destructive/20"
                  data-testid={`critical-event-${event.id}`}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{event.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(event.createdAt)}
                        {event.ipAddress && ` - ${event.ipAddress}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEvent(event)}
                    data-testid={`button-view-critical-${event.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Event Log</CardTitle>
          <CardDescription>Complete security event history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:w-64"
              data-testid="input-search-events"
            />
            <div className="flex flex-wrap gap-2">
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="w-32" data-testid="select-platform">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="lms">LMS</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="w-32" data-testid="select-severity">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>

              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="w-40" data-testid="select-event-type">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatEventType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={showResolved} onValueChange={setShowResolved}>
                <SelectTrigger className="w-36" data-testid="select-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {eventsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No security events found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => {
                    const SeverityIcon = getSeverityIcon(event.severity);
                    return (
                      <TableRow key={event.id} data-testid={`row-event-${event.id}`}>
                        <TableCell>
                          <Badge variant={getSeverityColor(event.severity) as any}>
                            <SeverityIcon className="h-3 w-3 mr-1" />
                            {event.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {formatEventType(event.eventType)}
                            </span>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {event.description}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            {event.targetUserEmail ? (
                              <>
                                <span className="text-sm">{event.targetUserEmail}</span>
                                {event.targetUserRole && (
                                  <Badge variant="outline" className="w-fit text-xs mt-1">
                                    {event.targetUserRole}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{event.ipAddress || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatDateTime(event.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {event.isResolved ? (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Open
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedEvent(event)}
                              title="View details"
                              data-testid={`button-view-event-${event.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!event.isResolved && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowResolveDialog(true);
                                }}
                                title="Resolve"
                                data-testid={`button-resolve-event-${event.id}`}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                          </div>
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

      <Dialog open={!!selectedEvent && !showResolveDialog} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Event Details
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Event Type</label>
                    <p className="font-medium">{formatEventType(selectedEvent.eventType)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Severity</label>
                    <div className="mt-1">
                      <Badge variant={getSeverityColor(selectedEvent.severity) as any}>
                        {selectedEvent.severity}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Platform</label>
                    <p className="font-medium">{selectedEvent.platform.toUpperCase()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Time</label>
                    <p className="font-medium">{new Date(selectedEvent.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1">{selectedEvent.description}</p>
                </div>

                {selectedEvent.targetUserEmail && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Target User</label>
                    <p className="mt-1">
                      {selectedEvent.targetUserEmail}
                      {selectedEvent.targetUserRole && (
                        <Badge variant="outline" className="ml-2">{selectedEvent.targetUserRole}</Badge>
                      )}
                    </p>
                  </div>
                )}

                {selectedEvent.actorEmail && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Actor</label>
                    <p className="mt-1">
                      {selectedEvent.actorEmail}
                      {selectedEvent.actorRole && (
                        <Badge variant="outline" className="ml-2">{selectedEvent.actorRole}</Badge>
                      )}
                    </p>
                  </div>
                )}

                {selectedEvent.schoolName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">School</label>
                    <p className="mt-1">{selectedEvent.schoolName}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                    <p className="mt-1">{selectedEvent.ipAddress || "Unknown"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Request</label>
                    <p className="mt-1">
                      {selectedEvent.requestMethod} {selectedEvent.requestPath || "-"}
                    </p>
                  </div>
                </div>

                {selectedEvent.userAgent && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User Agent</label>
                    <p className="mt-1 text-xs text-muted-foreground break-all">
                      {selectedEvent.userAgent}
                    </p>
                  </div>
                )}

                {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Additional Data</label>
                    <pre className="mt-1 text-xs bg-muted p-2 rounded-md overflow-x-auto">
                      {JSON.stringify(selectedEvent.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedEvent.isResolved && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-green-600">Resolution</label>
                    <p className="mt-1 text-sm">
                      Resolved on {selectedEvent.resolvedAt ? new Date(selectedEvent.resolvedAt).toLocaleString() : "-"}
                    </p>
                    {selectedEvent.resolutionNotes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {selectedEvent.resolutionNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              Close
            </Button>
            {selectedEvent && !selectedEvent.isResolved && (
              <Button
                onClick={() => setShowResolveDialog(true)}
                data-testid="button-resolve-from-details"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve Event
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResolveDialog} onOpenChange={(open) => {
        setShowResolveDialog(open);
        if (!open) setResolveNotes("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Security Event</DialogTitle>
            <DialogDescription>
              Mark this security event as resolved and add any notes about the resolution.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Resolution Notes (optional)</label>
            <Textarea
              placeholder="Describe how this event was resolved..."
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              className="mt-2"
              data-testid="input-resolve-notes"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowResolveDialog(false);
                setResolveNotes("");
              }}
              data-testid="button-cancel-resolve"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedEvent) {
                  resolveEventMutation.mutate({
                    eventId: selectedEvent.id,
                    notes: resolveNotes || undefined,
                  });
                }
              }}
              disabled={resolveEventMutation.isPending}
              data-testid="button-confirm-resolve"
            >
              {resolveEventMutation.isPending ? "Resolving..." : "Mark as Resolved"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
