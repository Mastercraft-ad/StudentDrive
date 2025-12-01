import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  UserCheck,
  Calendar,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { useState } from "react";

interface AnalyticsData {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    totalClasses: number;
    activeTerms: number;
    totalSubjects: number;
  };
  attendance: {
    averageRate: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    monthlyTrend: Array<{ month: string; rate: number }>;
  };
  grades: {
    averageScore: number;
    passRate: number;
    subjectPerformance: Array<{ subject: string; average: number }>;
    gradeDistribution: Array<{ grade: string; count: number }>;
  };
  fees: {
    totalDue: number;
    totalCollected: number;
    collectionRate: number;
    pendingPayments: number;
    monthlyCollections: Array<{ month: string; amount: number }>;
  };
  enrollment: {
    classSizes: Array<{ class: string; count: number }>;
    genderDistribution: Array<{ gender: string; count: number }>;
  };
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {subtitle && <span>{subtitle}</span>}
          {trend && trendValue && (
            <Badge
              variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {trendValue}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("current_term");

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/school/analytics", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/school/analytics?period=${encodeURIComponent(selectedPeriod)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return response.json();
    },
  });

  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
  };

  const { data: terms } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/school/terms"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <PageHeader
          title="Analytics Dashboard"
          description="School performance metrics and insights"
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalClasses: 0,
    activeTerms: 0,
    totalSubjects: 0,
  };

  const attendance = analytics?.attendance || {
    averageRate: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    monthlyTrend: [],
  };

  const grades = analytics?.grades || {
    averageScore: 0,
    passRate: 0,
    subjectPerformance: [],
    gradeDistribution: [],
  };

  const fees = analytics?.fees || {
    totalDue: 0,
    totalCollected: 0,
    collectionRate: 0,
    pendingPayments: 0,
    monthlyCollections: [],
  };

  const enrollment = analytics?.enrollment || {
    classSizes: [],
    genderDistribution: [],
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Analytics Dashboard"
        description="School performance metrics and insights"
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Tabs defaultValue="overview" className="w-full">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <TabsList data-testid="analytics-tabs">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="attendance" data-testid="tab-attendance">Attendance</TabsTrigger>
                <TabsTrigger value="grades" data-testid="tab-grades">Grades</TabsTrigger>
                <TabsTrigger value="fees" data-testid="tab-fees">Fees</TabsTrigger>
                <TabsTrigger value="enrollment" data-testid="tab-enrollment">Enrollment</TabsTrigger>
              </TabsList>

              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[180px]" data-testid="select-period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_term">Current Term</SelectItem>
                  <SelectItem value="last_term">Last Term</SelectItem>
                  <SelectItem value="current_year">Current Year</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Total Students"
                  value={overview.totalStudents}
                  subtitle="Enrolled students"
                  icon={GraduationCap}
                  trend="up"
                  trendValue="+12%"
                />
                <MetricCard
                  title="Total Teachers"
                  value={overview.totalTeachers}
                  subtitle="Active staff"
                  icon={Users}
                />
                <MetricCard
                  title="Classes"
                  value={overview.totalClasses}
                  subtitle={`${overview.totalSubjects} subjects`}
                  icon={BookOpen}
                />
                <MetricCard
                  title="Fee Collection"
                  value={`${fees.collectionRate}%`}
                  subtitle="Collection rate"
                  icon={DollarSign}
                  trend={fees.collectionRate >= 80 ? 'up' : 'down'}
                  trendValue={`${fees.pendingPayments} pending`}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Attendance Overview
                    </CardTitle>
                    <CardDescription>Today's attendance summary</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{attendance.presentToday}</div>
                        <div className="text-sm text-muted-foreground">Present</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{attendance.absentToday}</div>
                        <div className="text-sm text-muted-foreground">Absent</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{attendance.lateToday}</div>
                        <div className="text-sm text-muted-foreground">Late</div>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-3xl font-bold">{attendance.averageRate}%</div>
                      <div className="text-sm text-muted-foreground">Average Attendance Rate</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Academic Performance
                    </CardTitle>
                    <CardDescription>Grade averages and pass rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{grades.averageScore}%</div>
                        <div className="text-sm text-muted-foreground">Average Score</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{grades.passRate}%</div>
                        <div className="text-sm text-muted-foreground">Pass Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Fee Collection Trend</CardTitle>
                  <CardDescription>Monthly fee collection overview</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {fees.monthlyCollections.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={fees.monthlyCollections}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), "Amount"]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#3b82f6" 
                          fillOpacity={1} 
                          fill="url(#colorAmount)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6 mt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <MetricCard
                  title="Present Today"
                  value={attendance.presentToday}
                  icon={UserCheck}
                />
                <MetricCard
                  title="Absent Today"
                  value={attendance.absentToday}
                  icon={Users}
                />
                <MetricCard
                  title="Late Today"
                  value={attendance.lateToday}
                  icon={Calendar}
                />
                <MetricCard
                  title="Average Rate"
                  value={`${attendance.averageRate}%`}
                  icon={TrendingUp}
                  trend={attendance.averageRate >= 90 ? 'up' : 'down'}
                  trendValue={attendance.averageRate >= 90 ? "Good" : "Needs attention"}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Attendance Trend</CardTitle>
                  <CardDescription>Attendance rate over the past months</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  {attendance.monthlyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={attendance.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis domain={[0, 100]} className="text-xs" />
                        <Tooltip
                          formatter={(value: number) => [`${value}%`, "Attendance Rate"]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rate" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grades" className="space-y-6 mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard
                  title="Average Score"
                  value={`${grades.averageScore}%`}
                  icon={TrendingUp}
                />
                <MetricCard
                  title="Pass Rate"
                  value={`${grades.passRate}%`}
                  subtitle="Students passing"
                  icon={GraduationCap}
                  trend={grades.passRate >= 70 ? 'up' : 'down'}
                  trendValue={grades.passRate >= 70 ? "Good" : "Needs improvement"}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Subject Performance</CardTitle>
                    <CardDescription>Average scores by subject</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {grades.subjectPerformance.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={grades.subjectPerformance} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" domain={[0, 100]} className="text-xs" />
                          <YAxis dataKey="subject" type="category" width={100} className="text-xs" />
                          <Tooltip
                            formatter={(value: number) => [`${value}%`, "Average"]}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar 
                            dataKey="average" 
                            fill="#3b82f6" 
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Grade Distribution</CardTitle>
                    <CardDescription>Students by grade category</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {grades.gradeDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={grades.gradeDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ grade, percent }) => `${grade}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            dataKey="count"
                            nameKey="grade"
                          >
                            {grades.gradeDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="fees" className="space-y-6 mt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <MetricCard
                  title="Total Due"
                  value={formatCurrency(fees.totalDue)}
                  icon={DollarSign}
                />
                <MetricCard
                  title="Total Collected"
                  value={formatCurrency(fees.totalCollected)}
                  icon={DollarSign}
                />
                <MetricCard
                  title="Collection Rate"
                  value={`${fees.collectionRate}%`}
                  icon={TrendingUp}
                  trend={fees.collectionRate >= 80 ? 'up' : 'down'}
                />
                <MetricCard
                  title="Pending Payments"
                  value={fees.pendingPayments}
                  subtitle="Outstanding invoices"
                  icon={Calendar}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Collections</CardTitle>
                  <CardDescription>Fee collection trend over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  {fees.monthlyCollections.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fees.monthlyCollections}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), "Collected"]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar 
                          dataKey="amount" 
                          fill="#22c55e"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="enrollment" className="space-y-6 mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Class Sizes</CardTitle>
                    <CardDescription>Number of students per class</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    {enrollment.classSizes.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={enrollment.classSizes}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="class" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip
                            formatter={(value: number) => [value, "Students"]}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar 
                            dataKey="count" 
                            fill="#8b5cf6"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Gender Distribution</CardTitle>
                    <CardDescription>Student population by gender</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    {enrollment.genderDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={enrollment.genderDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ gender, percent }) => `${gender}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            dataKey="count"
                            nameKey="gender"
                          >
                            {enrollment.genderDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
