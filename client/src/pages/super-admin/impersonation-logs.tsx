import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Shield, 
  Search, 
  Clock, 
  User, 
  School,
  Calendar,
  AlertTriangle,
  Eye,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface ImpersonationLog {
  id: string;
  superAdminId: string;
  superAdminEmail: string;
  targetSchoolId: string;
  targetSchoolName: string;
  targetUserId: string | null;
  targetUserEmail: string | null;
  targetUserRole: string | null;
  action: "start" | "end";
  reason: string | null;
  sessionToken: string | null;
  startedAt: string;
  endedAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface ImpersonationLogsResponse {
  logs: ImpersonationLog[];
}

function LogRow({ 
  log, 
  onViewDetails 
}: { 
  log: ImpersonationLog;
  onViewDetails: (log: ImpersonationLog) => void;
}) {
  const duration = log.endedAt 
    ? formatDistanceToNow(new Date(log.endedAt), { addSuffix: false })
    : null;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge 
            variant={log.action === "start" ? "default" : "secondary"}
            className={log.action === "start" ? "bg-amber-500/20 text-amber-600" : ""}
          >
            {log.action === "start" ? "Started" : "Ended"}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <p className="font-medium text-sm">{log.superAdminEmail}</p>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <School className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{log.targetSchoolName}</span>
        </div>
      </TableCell>
      <TableCell>
        {log.targetUserEmail && (
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{log.targetUserEmail}</span>
          </div>
        )}
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {format(new Date(log.startedAt), "MMM d, yyyy HH:mm")}
        </span>
      </TableCell>
      <TableCell>
        {log.endedAt ? (
          <span className="text-sm text-muted-foreground">
            {format(new Date(log.endedAt), "MMM d, yyyy HH:mm")}
          </span>
        ) : (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            Active
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onViewDetails(log)}
          data-testid={`button-view-log-${log.id}`}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function LogRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  );
}

function LogDetailsDialog({ 
  log, 
  open, 
  onOpenChange 
}: { 
  log: ImpersonationLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            Impersonation Log Details
          </DialogTitle>
          <DialogDescription>
            Complete audit trail for this impersonation session
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Super Admin</p>
              <p className="font-medium text-sm">{log.superAdminEmail}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge 
                variant={log.endedAt ? "secondary" : "default"}
                className={!log.endedAt ? "bg-amber-500/20 text-amber-600" : ""}
              >
                {log.endedAt ? "Completed" : "Active"}
              </Badge>
            </div>
          </div>

          <div className="rounded-md border p-3 bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <School className="h-4 w-4 text-primary" />
              <span className="font-medium">Target School</span>
            </div>
            <p className="text-sm">{log.targetSchoolName}</p>
            {log.targetUserEmail && (
              <p className="text-xs text-muted-foreground mt-1">
                Impersonated as: {log.targetUserEmail} ({log.targetUserRole})
              </p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Reason</p>
            <p className="text-sm bg-muted/50 p-2 rounded-md">{log.reason || "No reason provided"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Started At
              </p>
              <p className="text-sm">{format(new Date(log.startedAt), "PPpp")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Ended At
              </p>
              <p className="text-sm">
                {log.endedAt ? format(new Date(log.endedAt), "PPpp") : "Still active"}
              </p>
            </div>
          </div>

          {(log.ipAddress || log.userAgent) && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground">Technical Details</p>
              {log.ipAddress && (
                <p className="text-xs text-muted-foreground">IP: {log.ipAddress}</p>
              )}
              {log.userAgent && (
                <p className="text-xs text-muted-foreground truncate" title={log.userAgent}>
                  UA: {log.userAgent}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: number; icon: any }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ImpersonationLogsPage() {
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<ImpersonationLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data, isLoading, refetch } = useQuery<ImpersonationLogsResponse>({
    queryKey: ["/api/super-admin/impersonation/logs"],
  });

  const logs = data?.logs || [];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.superAdminEmail.toLowerCase().includes(search.toLowerCase()) ||
      log.targetSchoolName.toLowerCase().includes(search.toLowerCase()) ||
      log.targetUserEmail?.toLowerCase().includes(search.toLowerCase()) ||
      log.reason?.toLowerCase().includes(search.toLowerCase());
    
    const matchesSchool = schoolFilter === "all" || log.targetSchoolId === schoolFilter;
    
    return matchesSearch && matchesSchool;
  });

  const uniqueSchools = [...new Map(logs.map(log => [log.targetSchoolId, log])).values()];
  const activeSessions = logs.filter(log => log.action === "start" && !log.endedAt).length;
  const totalSessions = logs.filter(log => log.action === "start").length;

  const handleViewDetails = (log: ImpersonationLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-section font-heading text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-amber-500" />
            Impersonation Logs
          </h1>
          <p className="text-muted-foreground">
            Complete audit trail of all impersonation sessions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-logs">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Sessions" value={totalSessions} icon={Shield} />
        <StatCard title="Active Now" value={activeSessions} icon={AlertTriangle} />
        <StatCard title="Schools Accessed" value={uniqueSchools.length} icon={School} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Session History
              </CardTitle>
              <CardDescription>
                {filteredLogs.length} log entries found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-[200px]"
                  data-testid="input-search-logs"
                />
              </div>
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-school-filter">
                  <SelectValue placeholder="Filter by school" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {uniqueSchools.map((log) => (
                    <SelectItem key={log.targetSchoolId} value={log.targetSchoolId}>
                      {log.targetSchoolName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Super Admin</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Target User</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Ended</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <LogRowSkeleton key={i} />
                  ))
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <LogRow 
                      key={log.id} 
                      log={log} 
                      onViewDetails={handleViewDetails}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Shield className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No impersonation logs found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <LogDetailsDialog
        log={selectedLog}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </div>
  );
}
