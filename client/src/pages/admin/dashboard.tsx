import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Shield,
  FileText,
  Activity,
  BookOpen,
  GraduationCap,
  FileCheck,
  FileClock,
  FileX,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";

interface AdminStats {
  totalUsers: number;
  institutionsCount: number;
  contentCount: number;
  activityRate: number;
}

interface ContentStats {
  materials: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  quizzes: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: contentStats, isLoading: contentStatsLoading } = useQuery<ContentStats>({
    queryKey: ["/api/admin/content/stats"],
    queryFn: async () => {
      const [materialsRes, quizzesRes] = await Promise.all([
        fetch("/api/admin/content/materials"),
        fetch("/api/admin/content/quizzes"),
      ]);

      const materials = await materialsRes.json();
      const quizzes = await quizzesRes.json();

      return {
        materials: {
          total: materials.length,
          pending: materials.filter((m: any) => m.moderationStatus === 'pending').length,
          approved: materials.filter((m: any) => m.moderationStatus === 'approved').length,
          rejected: materials.filter((m: any) => m.moderationStatus === 'rejected').length,
        },
        quizzes: {
          total: quizzes.length,
          pending: quizzes.filter((q: any) => q.moderationStatus === 'pending').length,
          approved: quizzes.filter((q: any) => q.moderationStatus === 'approved').length,
          rejected: quizzes.filter((q: any) => q.moderationStatus === 'rejected').length,
        },
      };
    },
  });

  const totalPendingReviews = (contentStats?.materials.pending || 0) + (contentStats?.quizzes.pending || 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-section font-heading text-foreground mb-2">
          Admin Control Panel
        </h1>
        <p className="text-muted-foreground">
          Manage platform-wide users, institutions, and content
        </p>
      </div>

      {totalPendingReviews > 0 && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-700" />
              <CardTitle className="text-yellow-900">Pending Reviews</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800 mb-3">
              You have {totalPendingReviews} items awaiting moderation approval
            </p>
            <Button size="sm" variant="outline" className="border-yellow-700 text-yellow-700 hover:bg-yellow-100" asChild>
              <Link href="/admin/content">Review Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate border-role-admin/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-role-admin" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-total-users">
                {stats?.totalUsers || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">All platform users</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-role-admin/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Institutions</CardTitle>
            <Shield className="h-4 w-4 text-role-admin" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-institutions">
                {stats?.institutionsCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Registered institutions</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-role-admin/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-role-admin" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-content">
                {stats?.contentCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Materials + Quizzes</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-role-admin/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Activity</CardTitle>
            <Activity className="h-4 w-4 text-role-admin" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-activity">
                {stats?.activityRate || 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-heading font-bold mb-4">Content Overview</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                Learning Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contentStatsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <Badge variant="outline">{contentStats?.materials.total || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-1">
                      <FileClock className="h-3 w-3 text-yellow-600" />
                      Pending
                    </span>
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
                      {contentStats?.materials.pending || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-1">
                      <FileCheck className="h-3 w-3 text-green-600" />
                      Approved
                    </span>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                      {contentStats?.materials.approved || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-1">
                      <FileX className="h-3 w-3 text-red-600" />
                      Rejected
                    </span>
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
                      {contentStats?.materials.rejected || 0}
                    </Badge>
                  </div>
                  <Button size="sm" className="w-full mt-2" variant="outline" asChild>
                    <Link href="/admin/content">Manage Materials</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contentStatsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <Badge variant="outline">{contentStats?.quizzes.total || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-1">
                      <FileClock className="h-3 w-3 text-yellow-600" />
                      Pending
                    </span>
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
                      {contentStats?.quizzes.pending || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-1">
                      <FileCheck className="h-3 w-3 text-green-600" />
                      Approved
                    </span>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                      {contentStats?.quizzes.approved || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-1">
                      <FileX className="h-3 w-3 text-red-600" />
                      Rejected
                    </span>
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
                      {contentStats?.quizzes.rejected || 0}
                    </Badge>
                  </div>
                  <Button size="sm" className="w-full mt-2" variant="outline" asChild>
                    <Link href="/admin/content">Manage Quizzes</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      <div>
        <h2 className="text-2xl font-heading font-bold mb-4">Platform Management</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-role-admin" />
                User Management
              </CardTitle>
              <CardDescription>Manage all platform users</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild data-testid="button-manage-users">
                <Link href="/admin/users">Manage Users</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-role-admin" />
                Institutions
              </CardTitle>
              <CardDescription>Manage institutional partners</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild data-testid="button-manage-institutions">
                <Link href="/admin/institutions">Manage Institutions</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-role-admin" />
                Courses
              </CardTitle>
              <CardDescription>Manage available courses</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild data-testid="button-manage-courses">
                <Link href="/admin/courses">Manage Courses</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-role-admin" />
                Content Moderation
              </CardTitle>
              <CardDescription>Review and moderate content</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild data-testid="button-moderate-content">
                <Link href="/admin/content">Moderate Content</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
