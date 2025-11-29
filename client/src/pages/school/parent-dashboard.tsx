import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  UserCheck,
  TrendingUp,
  DollarSign,
  Bell,
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import type { SchoolUser, AttendanceRecord, StudentGrade, FeePayment, SchoolAnnouncement, AcademicTerm } from "@shared/schema";

interface ChildInfo {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  classId: string;
  className: string;
}

interface AttendanceSummary {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  rate: number;
}

interface GradeSummary {
  subjectId: string;
  subjectName: string;
  averageScore: number;
  grade: string;
}

interface FeeSummary {
  totalDue: number;
  totalPaid: number;
  balance: number;
}

export default function ParentDashboard() {
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");

  const { data: children, isLoading: childrenLoading } = useQuery<ChildInfo[]>({
    queryKey: ["/api/school/parent/children"],
  });

  const { data: terms } = useQuery<AcademicTerm[]>({
    queryKey: ["/api/school/terms"],
  });

  useEffect(() => {
    if (terms && terms.length > 0 && !selectedTerm) {
      const currentTerm = terms.find(t => t.isCurrent);
      if (currentTerm) {
        setSelectedTerm(currentTerm.id);
      }
    }
  }, [terms, selectedTerm]);

  useEffect(() => {
    if (children && children.length > 0 && !selectedChild) {
      setSelectedChild(children[0].id);
    }
  }, [children, selectedChild]);

  const { data: attendanceSummary } = useQuery<AttendanceSummary>({
    queryKey: [`/api/school/parent/children/${selectedChild}/attendance`, { termId: selectedTerm }],
    enabled: !!selectedChild && !!selectedTerm,
  });

  const { data: gradesSummary } = useQuery<GradeSummary[]>({
    queryKey: [`/api/school/parent/children/${selectedChild}/grades`, { termId: selectedTerm }],
    enabled: !!selectedChild && !!selectedTerm,
  });

  const { data: feeSummary } = useQuery<FeeSummary>({
    queryKey: [`/api/school/parent/children/${selectedChild}/fees`],
    enabled: !!selectedChild,
  });

  const { data: announcements } = useQuery<SchoolAnnouncement[]>({
    queryKey: ["/api/school/announcements", { targetAudience: "parents" }],
  });

  const selectedChildInfo = children?.find((c) => c.id === selectedChild);
  const selectedTermData = terms?.find(t => t.id === selectedTerm);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "text-green-600";
      case "B":
        return "text-blue-600";
      case "C":
        return "text-yellow-600";
      case "D":
        return "text-orange-600";
      default:
        return "text-red-600";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount / 100);
  };

  if (childrenLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Parent Dashboard</h1>
          <p className="text-muted-foreground">Monitor your child's academic progress</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {children && children.length > 0 && (
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger className="w-56" data-testid="select-child">
                <SelectValue placeholder="Select your child" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.firstName} {child.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-48" data-testid="select-term">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {terms?.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name} {term.isCurrent && "(Current)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!children || children.length === 0 ? (
        <Card data-testid="card-no-children">
          <CardContent className="py-12">
            <div className="text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium" data-testid="text-no-children-title">No Children Linked</h3>
              <p className="text-muted-foreground" data-testid="text-no-children-description">
                Contact the school administration to link your child's account.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : !selectedChild ? (
        <Card data-testid="card-select-child">
          <CardContent className="py-12">
            <div className="text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium" data-testid="text-select-child-title">Select a Child</h3>
              <p className="text-muted-foreground" data-testid="text-select-child-description">
                Choose your child from the dropdown above to view their progress.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {selectedChildInfo && (
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white" data-testid="card-student-info">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" data-testid="text-student-name">
                      {selectedChildInfo.firstName} {selectedChildInfo.lastName}
                    </h2>
                    <p className="opacity-90" data-testid="text-student-details">
                      Class: {selectedChildInfo.className} | Admission No: {selectedChildInfo.admissionNumber}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="div-summary-cards">
            <Card data-testid="card-attendance-rate">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-attendance-rate">
                      {attendanceSummary?.rate || 0}%
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
                <Progress value={attendanceSummary?.rate || 0} className="mt-3" />
              </CardContent>
            </Card>

            <Card data-testid="card-days-present">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Days Present</p>
                    <p className="text-2xl font-bold" data-testid="text-days-present">{attendanceSummary?.present || 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-xs text-muted-foreground mt-2" data-testid="text-total-days">
                  Out of {attendanceSummary?.totalDays || 0} school days
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-average-grade">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Grade</p>
                    <p className="text-2xl font-bold text-purple-600" data-testid="text-average-grade">
                      {gradesSummary && gradesSummary.length > 0
                        ? Math.round(
                            gradesSummary.reduce((sum, g) => sum + g.averageScore, 0) /
                              gradesSummary.length
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-fee-balance">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Fee Balance</p>
                    <p className="text-2xl font-bold text-orange-600" data-testid="text-fee-balance">
                      {formatCurrency(feeSummary?.balance || 0)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="div-detail-cards">
            <Card data-testid="card-academic-performance">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Academic Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gradesSummary && gradesSummary.length > 0 ? (
                  <div className="space-y-4" data-testid="div-grades-list">
                    {gradesSummary.map((grade) => (
                      <div key={grade.subjectId} className="flex items-center justify-between" data-testid={`row-grade-${grade.subjectId}`}>
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{grade.subjectName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={grade.averageScore} className="w-24" />
                          <span className="text-sm">{grade.averageScore}%</span>
                          <Badge className={getGradeColor(grade.grade)}>{grade.grade}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6" data-testid="div-no-grades">
                    <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No grades recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-attendance-summary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Attendance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceSummary ? (
                  <div className="space-y-4" data-testid="div-attendance-list">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="font-medium">Present</span>
                      <span className="text-green-600 font-bold">{attendanceSummary.present} days</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <span className="font-medium">Absent</span>
                      <span className="text-red-600 font-bold">{attendanceSummary.absent} days</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <span className="font-medium">Late</span>
                      <span className="text-yellow-600 font-bold">{attendanceSummary.late} days</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6" data-testid="div-no-attendance">
                    <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No attendance records</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-fee-status">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Fee Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {feeSummary ? (
                  <div className="space-y-4" data-testid="div-fee-summary">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Due</span>
                      <span className="font-medium">{formatCurrency(feeSummary.totalDue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Paid</span>
                      <span className="font-medium text-green-600">{formatCurrency(feeSummary.totalPaid)}</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Outstanding Balance</span>
                        <span className={`font-bold ${feeSummary.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                          {formatCurrency(feeSummary.balance)}
                        </span>
                      </div>
                    </div>
                    {feeSummary.balance > 0 && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-700 dark:text-yellow-400">
                          Please complete payment before the due date
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6" data-testid="div-no-fees">
                    <DollarSign className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No fee records</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-announcements">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {announcements && announcements.length > 0 ? (
                  <div className="space-y-3" data-testid="div-announcements-list">
                    {announcements.slice(0, 5).map((announcement) => (
                      <div key={announcement.id} className="p-3 border rounded-lg" data-testid={`row-announcement-${announcement.id}`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-medium text-sm">{announcement.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {announcement.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {announcement.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(announcement.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6" data-testid="div-no-announcements">
                    <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No announcements</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
