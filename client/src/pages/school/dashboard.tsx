import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  DollarSign,
  Bell,
  Clock,
  TrendingUp,
  UserCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
  Megaphone,
  PlusCircle,
  ArrowRight,
  CalendarDays,
  Pin,
} from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClasses: number;
  totalSubjects: number;
  currentTerm: {
    id: string;
    name: string;
    sessionYear: string;
    startDate: string;
    endDate: string;
  } | null;
  attendance: {
    rate: number;
    today: {
      present: number;
      absent: number;
      late: number;
      total: number;
    };
  };
  fees: {
    collected: number;
    pending: number;
    collectionRate: number;
    overdueCount: number;
  };
  recentAnnouncements: Array<{
    id: string;
    title: string;
    type: string;
    createdAt: string;
    isPinned: boolean;
  }>;
}

export default function SchoolDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/school/dashboard/stats"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return formatDate(dateStr);
  };

  const getDaysRemaining = () => {
    if (!stats?.currentTerm?.endDate) return null;
    const end = new Date(stats.currentTerm.endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getAnnouncementBadgeVariant = (type: string) => {
    switch (type) {
      case "urgent":
        return "destructive";
      case "event":
        return "default";
      case "academic":
        return "secondary";
      default:
        return "outline";
    }
  };

  const statCards = [
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      link: "/school/students",
    },
    {
      title: "Total Teachers",
      value: stats?.totalTeachers || 0,
      icon: Users,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      link: "/school/teachers",
    },
    {
      title: "Classes",
      value: stats?.totalClasses || 0,
      icon: BookOpen,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      link: "/school/classes",
    },
    {
      title: "Subjects",
      value: stats?.totalSubjects || 0,
      icon: FileText,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      link: "/school/subjects",
    },
  ];

  const quickActions = [
    { label: "Mark Attendance", icon: UserCheck, link: "/school/attendance", color: "bg-blue-600 dark:bg-blue-700" },
    { label: "Enter Grades", icon: TrendingUp, link: "/school/grades", color: "bg-green-600 dark:bg-green-700" },
    { label: "Record Payment", icon: DollarSign, link: "/school/fees", color: "bg-purple-600 dark:bg-purple-700" },
    { label: "New Announcement", icon: Megaphone, link: "/school/announcements", color: "bg-orange-600 dark:bg-orange-700" },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">School Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your school.</p>
        </div>
        {stats?.currentTerm && (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{stats.currentTerm.name} {stats.currentTerm.sessionYear}</span>
            </Badge>
            {daysRemaining !== null && (
              <Badge variant={daysRemaining < 14 ? "destructive" : "secondary"} className="flex items-center gap-1 px-3 py-1.5">
                <Timer className="h-3.5 w-3.5" />
                <span>{daysRemaining} days remaining</span>
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.link}>
            <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickActions.map((action) => (
                  <Link key={action.label} href={action.link}>
                    <Button
                      variant="outline"
                      className="w-full h-20 flex flex-col items-center justify-center gap-2"
                      data-testid={`button-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className={`p-2 rounded-full ${action.color}`}>
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCheck className="h-5 w-5" />
                  Today's Attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{stats?.attendance?.rate || 0}%</span>
                  <Badge variant={stats?.attendance?.rate && stats.attendance.rate >= 80 ? "default" : "destructive"}>
                    {stats?.attendance?.rate && stats.attendance.rate >= 80 ? "Good" : "Needs Attention"}
                  </Badge>
                </div>
                <Progress value={stats?.attendance?.rate || 0} className="h-2" />
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 mx-auto text-green-600 dark:text-green-400 mb-1" />
                    <p className="text-lg font-semibold">{stats?.attendance?.today?.present || 0}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <XCircle className="h-4 w-4 mx-auto text-red-600 dark:text-red-400 mb-1" />
                    <p className="text-lg font-semibold">{stats?.attendance?.today?.absent || 0}</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <Clock className="h-4 w-4 mx-auto text-yellow-600 dark:text-yellow-400 mb-1" />
                    <p className="text-lg font-semibold">{stats?.attendance?.today?.late || 0}</p>
                    <p className="text-xs text-muted-foreground">Late</p>
                  </div>
                </div>
                <Link href="/school/attendance">
                  <Button variant="ghost" size="sm" className="w-full mt-2" data-testid="button-view-attendance">
                    View Attendance <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Fee Collection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{stats?.fees?.collectionRate || 0}%</span>
                  <Badge variant={stats?.fees?.collectionRate && stats.fees.collectionRate >= 70 ? "default" : "secondary"}>
                    {formatCurrency(stats?.fees?.collected || 0)}
                  </Badge>
                </div>
                <Progress value={stats?.fees?.collectionRate || 0} className="h-2" />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Collected</p>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      {formatCurrency(stats?.fees?.collected || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Pending</p>
                    <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                      {formatCurrency(stats?.fees?.pending || 0)}
                    </p>
                  </div>
                </div>
                {stats?.fees?.overdueCount && stats.fees.overdueCount > 0 ? (
                  <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-700 dark:text-red-400">
                      {stats.fees.overdueCount} overdue payment{stats.fees.overdueCount > 1 ? "s" : ""}
                    </span>
                  </div>
                ) : null}
                <Link href="/school/fees">
                  <Button variant="ghost" size="sm" className="w-full mt-2" data-testid="button-view-fees">
                    Manage Fees <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5" />
                Recent Announcements
              </CardTitle>
              <Link href="/school/announcements">
                <Button variant="ghost" size="sm" data-testid="button-view-all-announcements">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.recentAnnouncements && stats.recentAnnouncements.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {announcement.isPinned && (
                            <Pin className="h-3 w-3 text-primary flex-shrink-0" />
                          )}
                          <h4 className="font-medium text-sm truncate">{announcement.title}</h4>
                        </div>
                        <Badge variant={getAnnouncementBadgeVariant(announcement.type)} className="text-xs flex-shrink-0">
                          {announcement.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getTimeAgo(announcement.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No announcements yet</p>
                  <Link href="/school/announcements">
                    <Button variant="ghost" size="sm" className="mt-2">
                      Create First Announcement
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Term Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.currentTerm ? (
                <>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Current Term</p>
                    <p className="font-medium">{stats.currentTerm.name}</p>
                    <p className="text-sm text-muted-foreground">{stats.currentTerm.sessionYear}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                      <p className="text-sm font-medium">{formatDate(stats.currentTerm.startDate)}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">End Date</p>
                      <p className="text-sm font-medium">{formatDate(stats.currentTerm.endDate)}</p>
                    </div>
                  </div>
                  <Link href="/school/terms">
                    <Button variant="ghost" size="sm" className="w-full" data-testid="button-manage-terms">
                      Manage Terms <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No current term set</p>
                  <Link href="/school/terms">
                    <Button variant="ghost" size="sm" className="mt-2">
                      Set Up Term
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
