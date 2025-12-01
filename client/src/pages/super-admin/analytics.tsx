import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Activity,
  Users,
  School,
  TrendingUp,
  TrendingDown,
  FileText,
  ClipboardList,
  DollarSign,
  Calendar,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalSchools: number;
    activeSchools: number;
    totalMaterials: number;
    totalQuizzes: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
  userGrowth: {
    date: string;
    users: number;
  }[];
  schoolGrowth: {
    date: string;
    schools: number;
  }[];
  revenueGrowth: {
    date: string;
    revenue: number;
  }[];
  usersByRole: {
    role: string;
    count: number;
  }[];
  schoolsBySubscription: {
    status: string;
    count: number;
  }[];
  topInstitutions: {
    id: string;
    name: string;
    studentsCount: number;
    materialsCount: number;
  }[];
  topSchools: {
    id: string;
    name: string;
    studentsCount: number;
    teachersCount: number;
    subscriptionStatus: string;
  }[];
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
  color = "blue",
}: { 
  title: string; 
  value: string | number; 
  icon: any;
  description?: string;
  trend?: { value: number; positive: boolean };
  color?: string;
}) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-500/10",
    green: "text-green-600 bg-green-500/10",
    amber: "text-amber-600 bg-amber-500/10",
    purple: "text-purple-600 bg-purple-500/10",
    red: "text-red-600 bg-red-500/10",
  };

  return (
    <Card className="hover-elevate">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                {trend.positive ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={`text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.positive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuperAdminAnalytics() {
  const [timeRange, setTimeRange] = useState("30d");

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/super-admin/analytics", { range: timeRange }],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-section font-heading text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Platform Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive overview of LMS and SMS performance
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]" data-testid="select-time-range">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="365d">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Total Users" 
              value={analytics?.overview.totalUsers?.toLocaleString() || 0} 
              icon={Users}
              description={`${analytics?.overview.activeUsers || 0} active`}
              color="blue"
            />
            <StatCard 
              title="Total Schools" 
              value={analytics?.overview.totalSchools || 0} 
              icon={School}
              description={`${analytics?.overview.activeSchools || 0} active`}
              color="green"
            />
            <StatCard 
              title="Materials" 
              value={analytics?.overview.totalMaterials || 0} 
              icon={FileText}
              color="purple"
            />
            <StatCard 
              title="Quizzes" 
              value={analytics?.overview.totalQuizzes || 0} 
              icon={ClipboardList}
              color="amber"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Revenue Overview
                </CardTitle>
                <CardDescription>Subscription revenue metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(analytics?.overview.totalRevenue || 0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(analytics?.overview.monthlyRevenue || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Users by Role
                </CardTitle>
                <CardDescription>Distribution of platform users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.usersByRole?.map((item) => (
                    <div key={item.role} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {item.role || "No role"}
                        </Badge>
                      </div>
                      <span className="font-medium">{item.count.toLocaleString()}</span>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5 text-green-600" />
                  Schools by Subscription
                </CardTitle>
                <CardDescription>Subscription status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.schoolsBySubscription?.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <Badge 
                        variant={
                          item.status === "active" ? "default" :
                          item.status === "trial" ? "secondary" :
                          item.status === "expired" ? "destructive" :
                          "outline"
                        }
                        className={item.status === "active" ? "bg-green-600" : ""}
                      >
                        {item.status}
                      </Badge>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Top Institutions (LMS)
                </CardTitle>
                <CardDescription>Most active institutions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.topInstitutions?.length ? (
                    analytics.topInstitutions.slice(0, 5).map((institution, index) => (
                      <div key={institution.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{index + 1}.</span>
                          <span className="font-medium truncate max-w-[200px]">{institution.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{institution.studentsCount} students</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Top Schools (SMS)
              </CardTitle>
              <CardDescription>Schools with most users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {analytics?.topSchools?.length ? (
                  analytics.topSchools.slice(0, 6).map((school) => (
                    <div key={school.id} className="p-4 rounded-lg border bg-card">
                      <h4 className="font-medium truncate">{school.name}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{school.studentsCount} students</span>
                        <span>{school.teachersCount} teachers</span>
                      </div>
                      <Badge 
                        variant={school.subscriptionStatus === "active" ? "default" : "secondary"}
                        className={`mt-2 ${school.subscriptionStatus === "active" ? "bg-green-600" : ""}`}
                      >
                        {school.subscriptionStatus}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground col-span-full text-center py-8">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
