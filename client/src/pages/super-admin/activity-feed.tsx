import { useState, useEffect, useCallback } from "react";
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
import { queryClient } from "@/lib/queryClient";
import { 
  Activity,
  RefreshCw,
  School,
  User,
  CreditCard,
  Shield,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Info,
  AlertCircle,
  UserPlus,
  LogIn,
  GraduationCap,
  ClipboardList,
  FileText,
  Calendar,
  Clock,
  Search,
  Filter,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface PlatformActivity {
  id: string;
  activityType: string;
  platform: string;
  entityType: string | null;
  entityId: string | null;
  entityName: string | null;
  actorId: string | null;
  actorType: string | null;
  actorName: string | null;
  actorEmail: string | null;
  schoolId: string | null;
  schoolName: string | null;
  description: string;
  metadata: Record<string, any> | null;
  severity: string;
  ipAddress: string | null;
  createdAt: string;
}

interface ActivityFeedResponse {
  activities: PlatformActivity[];
  total: number;
  limit: number;
  offset: number;
}

interface ActivityStats {
  lmsActivities: number;
  smsActivities: number;
  totalActivities: number;
  byType: { activityType: string; count: number }[];
}

const activityTypeConfig: Record<string, { icon: any; color: string; label: string }> = {
  user_registered: { icon: UserPlus, color: "text-green-500", label: "User Registered" },
  user_login: { icon: LogIn, color: "text-blue-500", label: "User Login" },
  user_logout: { icon: LogIn, color: "text-gray-500", label: "User Logout" },
  user_updated: { icon: User, color: "text-blue-500", label: "User Updated" },
  school_registered: { icon: School, color: "text-green-500", label: "School Registered" },
  school_activated: { icon: CheckCircle, color: "text-green-600", label: "School Activated" },
  school_deactivated: { icon: XCircle, color: "text-red-500", label: "School Deactivated" },
  school_verified: { icon: Shield, color: "text-blue-600", label: "School Verified" },
  school_user_created: { icon: UserPlus, color: "text-green-500", label: "School User Created" },
  school_user_login: { icon: LogIn, color: "text-blue-500", label: "School User Login" },
  school_user_updated: { icon: User, color: "text-blue-500", label: "School User Updated" },
  subscription_created: { icon: CreditCard, color: "text-green-500", label: "Subscription Created" },
  subscription_renewed: { icon: CreditCard, color: "text-green-600", label: "Subscription Renewed" },
  subscription_expired: { icon: AlertTriangle, color: "text-amber-500", label: "Subscription Expired" },
  subscription_cancelled: { icon: XCircle, color: "text-red-500", label: "Subscription Cancelled" },
  payment_received: { icon: CreditCard, color: "text-green-600", label: "Payment Received" },
  payment_failed: { icon: AlertTriangle, color: "text-red-500", label: "Payment Failed" },
  material_uploaded: { icon: FileText, color: "text-blue-500", label: "Material Uploaded" },
  quiz_created: { icon: ClipboardList, color: "text-purple-500", label: "Quiz Created" },
  grade_entered: { icon: GraduationCap, color: "text-blue-500", label: "Grade Entered" },
  attendance_marked: { icon: Calendar, color: "text-green-500", label: "Attendance Marked" },
  impersonation_started: { icon: Shield, color: "text-amber-500", label: "Impersonation Started" },
  impersonation_ended: { icon: Shield, color: "text-blue-500", label: "Impersonation Ended" },
  admin_action: { icon: Shield, color: "text-blue-500", label: "Admin Action" },
  system_event: { icon: Activity, color: "text-gray-500", label: "System Event" },
};

const severityConfig: Record<string, { color: string; bgColor: string }> = {
  info: { color: "text-blue-500", bgColor: "bg-blue-500/10" },
  success: { color: "text-green-500", bgColor: "bg-green-500/10" },
  warning: { color: "text-amber-500", bgColor: "bg-amber-500/10" },
  error: { color: "text-red-500", bgColor: "bg-red-500/10" },
};

function ActivityItem({ activity }: { activity: PlatformActivity }) {
  const config = activityTypeConfig[activity.activityType] || { 
    icon: Activity, 
    color: "text-muted-foreground", 
    label: activity.activityType 
  };
  const Icon = config.icon;
  const severity = severityConfig[activity.severity] || severityConfig.info;

  return (
    <div className="flex items-start gap-3 p-3 rounded-md hover-elevate border border-transparent hover:border-border/50 transition-colors">
      <div className={`p-2 rounded-full ${severity.bgColor}`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-none">{activity.description}</p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">
            {activity.platform.toUpperCase()}
          </Badge>
          <Badge variant="secondary">
            {config.label}
          </Badge>
          {activity.schoolName && (
            <Badge variant="outline" className="text-xs">
              <School className="h-3 w-3 mr-1" />
              {activity.schoolName}
            </Badge>
          )}
          {activity.actorEmail && (
            <span className="text-xs text-muted-foreground">
              by {activity.actorEmail}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon,
  className = "",
}: { 
  title: string; 
  value: number; 
  icon: any;
  className?: string;
}) {
  return (
    <Card className={className}>
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

export default function ActivityFeedPage() {
  const [platform, setPlatform] = useState<string>("all");
  const [activityType, setActivityType] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000);

  const { data: feedData, isLoading, refetch } = useQuery<ActivityFeedResponse>({
    queryKey: ["/api/super-admin/activity-feed", { platform, activityType }],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ActivityStats>({
    queryKey: ["/api/super-admin/activity-feed/stats"],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/super-admin/activity-feed"] });
    queryClient.invalidateQueries({ queryKey: ["/api/super-admin/activity-feed/stats"] });
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-section font-heading text-foreground">
            Live Activity Feed
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring of platform activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            data-testid="button-toggle-auto-refresh"
          >
            {autoRefresh ? (
              <>
                <Activity className="h-4 w-4 mr-2 text-green-500" />
                Auto-refresh ON
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                Auto-refresh OFF
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            data-testid="button-refresh-feed"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsLoading ? (
          <>
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </>
        ) : (
          <>
            <StatCard 
              title="Today's Activities" 
              value={stats?.totalActivities || 0} 
              icon={Activity} 
            />
            <StatCard 
              title="LMS Activities" 
              value={stats?.lmsActivities || 0} 
              icon={BookOpen} 
            />
            <StatCard 
              title="SMS Activities" 
              value={stats?.smsActivities || 0} 
              icon={School} 
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activities
              </CardTitle>
              <CardDescription>
                {feedData?.total || 0} activities tracked
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="w-[120px]" data-testid="select-platform">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="lms">LMS</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activityType || "all_types"} onValueChange={(v) => setActivityType(v === "all_types" ? "" : v)}>
                <SelectTrigger className="w-[160px]" data-testid="select-activity-type">
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_types">All Types</SelectItem>
                  <SelectItem value="user_registered">User Registered</SelectItem>
                  <SelectItem value="user_login">User Login</SelectItem>
                  <SelectItem value="school_registered">School Registered</SelectItem>
                  <SelectItem value="school_user_created">School User Created</SelectItem>
                  <SelectItem value="subscription_created">Subscription Created</SelectItem>
                  <SelectItem value="payment_received">Payment Received</SelectItem>
                  <SelectItem value="impersonation_started">Impersonation Started</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <ActivityItemSkeleton key={i} />
                ))}
              </div>
            ) : feedData?.activities && feedData.activities.length > 0 ? (
              <div className="space-y-1">
                {feedData.activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No activities yet</h3>
                <p className="text-sm text-muted-foreground">
                  Platform activities will appear here as they happen
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {stats?.byType && stats.byType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity Breakdown
            </CardTitle>
            <CardDescription>
              Activities by type for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.byType.slice(0, 8).map((item) => {
                const config = activityTypeConfig[item.activityType] || { 
                  icon: Activity, 
                  color: "text-muted-foreground", 
                  label: item.activityType 
                };
                const Icon = config.icon;
                return (
                  <div 
                    key={item.activityType} 
                    className="flex items-center gap-2 p-3 rounded-md bg-muted/50"
                  >
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{config.label}</p>
                      <p className="text-lg font-bold">{item.count}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
