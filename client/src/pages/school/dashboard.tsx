import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertCircle,
} from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  attendanceRate: number;
  feeCollectionRate: number;
  pendingFees: number;
  recentAnnouncements: number;
}

export default function SchoolDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/school/dashboard/stats"],
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["/api/school/dashboard/activity"],
  });

  const statCards = [
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      link: "/school/students",
    },
    {
      title: "Total Teachers",
      value: stats?.totalTeachers || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      link: "/school/teachers",
    },
    {
      title: "Classes",
      value: stats?.totalClasses || 0,
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      link: "/school/classes",
    },
    {
      title: "Subjects",
      value: stats?.totalSubjects || 0,
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      link: "/school/subjects",
    },
  ];

  const quickActions = [
    { label: "Mark Attendance", icon: UserCheck, link: "/school/attendance", color: "bg-blue-600" },
    { label: "Enter Grades", icon: TrendingUp, link: "/school/grades", color: "bg-green-600" },
    { label: "Record Payment", icon: DollarSign, link: "/school/fees", color: "bg-purple-600" },
    { label: "New Announcement", icon: Bell, link: "/school/announcements/new", color: "bg-orange-600" },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">School Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your school.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Current Term: First Term 2024/2025
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.link}>
            <Card className="hover-elevate cursor-pointer" data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.link}>
                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col items-center justify-center gap-2"
                    data-testid={`button-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className={`p-2 rounded-full ${action.color}`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alerts & Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.pendingFees && stats.pendingFees > 0 ? (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Pending Fee Payments</p>
                  <p className="text-xs text-muted-foreground">{stats.pendingFees} students have outstanding fees</p>
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Term End Date</p>
                <p className="text-xs text-muted-foreground">December 15, 2024</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Today's Attendance</p>
                <p className="text-xs text-muted-foreground">{stats?.attendanceRate || 0}% attendance rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Announcements
            </CardTitle>
            <Link href="/school/announcements">
              <Button variant="ghost" size="sm" data-testid="button-view-all-announcements">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-medium text-sm">Upcoming Parent-Teacher Meeting</h4>
                  <Badge variant="secondary" className="text-xs">General</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Posted 2 hours ago</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-medium text-sm">Mid-Term Exam Schedule Released</h4>
                  <Badge variant="destructive" className="text-xs">Urgent</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Posted 1 day ago</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-medium text-sm">Fee Payment Deadline Reminder</h4>
                  <Badge variant="outline" className="text-xs">Fee</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Posted 3 days ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
            <Link href="/school/timetable">
              <Button variant="ghost" size="sm" data-testid="button-view-timetable">View Timetable</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="text-center min-w-[60px]">
                  <p className="text-xs text-muted-foreground">08:00</p>
                  <p className="text-xs text-muted-foreground">09:00</p>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Mathematics</p>
                  <p className="text-xs text-muted-foreground">JSS 1A - Mr. Johnson</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="text-center min-w-[60px]">
                  <p className="text-xs text-muted-foreground">09:00</p>
                  <p className="text-xs text-muted-foreground">10:00</p>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">English Language</p>
                  <p className="text-xs text-muted-foreground">JSS 1A - Mrs. Smith</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                <div className="text-center min-w-[60px]">
                  <p className="text-xs text-muted-foreground">10:00</p>
                  <p className="text-xs text-muted-foreground">10:30</p>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Break Time</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
