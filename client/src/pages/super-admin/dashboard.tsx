import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { 
  Users, 
  School, 
  BookOpen, 
  FileText, 
  ClipboardList,
  TrendingUp,
  DollarSign,
  Activity,
  Building2,
  GraduationCap,
  CreditCard,
  ArrowUpRight,
  Crown,
} from "lucide-react";

interface PlatformStats {
  lms: {
    totalUsers: number;
    activeUsers: number;
    totalInstitutions: number;
    totalCourses: number;
    totalMaterials: number;
    totalQuizzes: number;
    newUsersToday: number;
    newUsersThisWeek: number;
  };
  sms: {
    totalSchools: number;
    activeSchools: number;
    trialSchools: number;
    paidSchools: number;
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
  recentActivity: {
    type: string;
    message: string;
    timestamp: string;
  }[];
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  href,
}: { 
  title: string; 
  value: string | number; 
  icon: any;
  description?: string;
  trend?: { value: number; positive: boolean };
  href?: string;
}) {
  const content = (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className={`h-3 w-3 ${trend.positive ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-xs ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.positive ? '+' : ''}{trend.value}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery<PlatformStats>({
    queryKey: ["/api/super-admin/stats"],
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-6 w-6 text-amber-500" />
            <h1 className="text-section font-heading text-foreground">
              Super Admin Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground">
            Complete platform overview and control center for LMS and SMS
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/super-admin/analytics">
            <Button variant="outline" data-testid="button-view-analytics">
              <Activity className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle>Learning Management System (LMS)</CardTitle>
              </div>
              <Link href="/super-admin/users">
                <Button variant="ghost" size="sm" data-testid="button-lms-manage">
                  Manage <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <CardDescription>Public learning platform statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <StatCard 
                    title="Total Users" 
                    value={stats?.lms.totalUsers || 0} 
                    icon={Users}
                    description={`${stats?.lms.newUsersToday || 0} new today`}
                    href="/super-admin/users"
                  />
                  <StatCard 
                    title="Active Users" 
                    value={stats?.lms.activeUsers || 0} 
                    icon={Activity}
                    description="Last 30 days"
                  />
                  <StatCard 
                    title="Institutions" 
                    value={stats?.lms.totalInstitutions || 0} 
                    icon={Building2}
                    href="/super-admin/institutions"
                  />
                  <StatCard 
                    title="Courses" 
                    value={stats?.lms.totalCourses || 0} 
                    icon={BookOpen}
                    href="/super-admin/courses"
                  />
                  <StatCard 
                    title="Materials" 
                    value={stats?.lms.totalMaterials || 0} 
                    icon={FileText}
                    href="/super-admin/materials"
                  />
                  <StatCard 
                    title="Quizzes" 
                    value={stats?.lms.totalQuizzes || 0} 
                    icon={ClipboardList}
                    href="/super-admin/quizzes"
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-600/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <School className="h-5 w-5 text-green-600" />
                <CardTitle>School Management System (SMS)</CardTitle>
              </div>
              <Link href="/super-admin/schools">
                <Button variant="ghost" size="sm" data-testid="button-sms-manage">
                  Manage <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <CardDescription>Multi-tenant school platform statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <StatCard 
                    title="Total Schools" 
                    value={stats?.sms.totalSchools || 0} 
                    icon={School}
                    href="/super-admin/schools"
                  />
                  <StatCard 
                    title="Active Schools" 
                    value={stats?.sms.activeSchools || 0} 
                    icon={Activity}
                  />
                  <StatCard 
                    title="Trial Schools" 
                    value={stats?.sms.trialSchools || 0} 
                    icon={School}
                    description="In trial period"
                  />
                  <StatCard 
                    title="Paid Subscriptions" 
                    value={stats?.sms.paidSchools || 0} 
                    icon={CreditCard}
                    href="/super-admin/subscriptions"
                  />
                  <StatCard 
                    title="Students" 
                    value={stats?.sms.totalStudents || 0} 
                    icon={GraduationCap}
                  />
                  <StatCard 
                    title="Teachers" 
                    value={stats?.sms.totalTeachers || 0} 
                    icon={Users}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Revenue Overview
            </CardTitle>
            <CardDescription>Subscription revenue from schools</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold" data-testid="stat-total-revenue">
                      ₦{(stats?.sms.totalRevenue || 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600/50" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                    <p className="text-2xl font-bold" data-testid="stat-monthly-revenue">
                      ₦{(stats?.sms.monthlyRevenue || 0).toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600/50" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.recentActivity?.length ? (
                  stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`h-2 w-2 rounded-full mt-2 ${
                        activity.type === 'user' ? 'bg-blue-500' :
                        activity.type === 'school' ? 'bg-green-500' :
                        activity.type === 'payment' ? 'bg-amber-500' :
                        'bg-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/super-admin/users">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Manage Users</p>
                <p className="text-xs text-muted-foreground">View all platform users</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/super-admin/schools">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <School className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Manage Schools</p>
                <p className="text-xs text-muted-foreground">View all registered schools</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/super-admin/subscriptions">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <CreditCard className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Subscriptions</p>
                <p className="text-xs text-muted-foreground">Manage billing & plans</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/super-admin/settings">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">System Settings</p>
                <p className="text-xs text-muted-foreground">Configure platform</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
