import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  BarChart3,
  Download,
  FileText
} from "lucide-react";
import type { SchoolClass, AcademicTerm, AttendanceRecord, SchoolUser } from "@shared/schema";

type ReportType = "daily" | "weekly" | "monthly" | "term";

interface AttendanceSummary {
  studentId: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export default function AttendanceReportsPage() {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [reportType, setReportType] = useState<ReportType>("weekly");
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const { data: classes } = useQuery<SchoolClass[]>({
    queryKey: ["/api/school/classes"],
  });

  const { data: terms } = useQuery<AcademicTerm[]>({
    queryKey: ["/api/school/terms"],
  });

  const { data: students } = useQuery<SchoolUser[]>({
    queryKey: [`/api/school/classes/${selectedClass}/students`],
    enabled: !!selectedClass,
  });

  const { data: attendanceRecords, isLoading: recordsLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/school/attendance/report', { classId: selectedClass, termId: selectedTerm, startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams({
        classId: selectedClass,
        termId: selectedTerm,
        startDate,
        endDate,
      });
      const response = await fetch(`/api/school/attendance/report?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch attendance report');
      return response.json();
    },
    enabled: !!selectedClass && !!selectedTerm && !!startDate && !!endDate,
  });

  const { data: attendanceSummary } = useQuery<AttendanceSummary[]>({
    queryKey: ['/api/school/classes', selectedClass, 'attendance-summary', { termId: selectedTerm }],
    queryFn: async () => {
      const params = new URLSearchParams({ termId: selectedTerm });
      const response = await fetch(`/api/school/classes/${selectedClass}/attendance-summary?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch attendance summary');
      return response.json();
    },
    enabled: !!selectedClass && !!selectedTerm,
  });

  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type);
    const today = new Date();
    let start: Date;
    
    switch (type) {
      case "daily":
        start = new Date(today);
        break;
      case "weekly":
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        break;
      case "monthly":
        start = new Date(today);
        start.setMonth(start.getMonth() - 1);
        break;
      case "term":
        const currentTerm = terms?.find(t => t.id === selectedTerm);
        if (currentTerm?.startDate) {
          start = new Date(currentTerm.startDate);
        } else {
          start = new Date(today);
          start.setMonth(start.getMonth() - 3);
        }
        break;
      default:
        start = new Date(today);
        start.setDate(start.getDate() - 7);
    }
    
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  };

  const overallStats = useMemo(() => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return { present: 0, absent: 0, late: 0, excused: 0, total: 0, rate: 0 };
    }

    const stats = { present: 0, absent: 0, late: 0, excused: 0 };
    attendanceRecords.forEach(record => {
      if (record.status === "present") stats.present++;
      else if (record.status === "absent") stats.absent++;
      else if (record.status === "late") stats.late++;
      else if (record.status === "excused") stats.excused++;
    });

    const total = stats.present + stats.absent + stats.late + stats.excused;
    const rate = total > 0 ? Math.round(((stats.present + stats.late) / total) * 100) : 0;

    return { ...stats, total, rate };
  }, [attendanceRecords]);

  const dailyBreakdown = useMemo(() => {
    if (!attendanceRecords) return [];

    const dateMap: { [date: string]: { present: number; absent: number; late: number; excused: number } } = {};
    
    attendanceRecords.forEach(record => {
      const dateStr = new Date(record.date).toISOString().split("T")[0];
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { present: 0, absent: 0, late: 0, excused: 0 };
      }
      if (record.status === "present") dateMap[dateStr].present++;
      else if (record.status === "absent") dateMap[dateStr].absent++;
      else if (record.status === "late") dateMap[dateStr].late++;
      else if (record.status === "excused") dateMap[dateStr].excused++;
    });

    return Object.entries(dateMap)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, stats]) => ({
        date,
        ...stats,
        total: stats.present + stats.absent + stats.late + stats.excused,
        rate: Math.round(((stats.present + stats.late) / (stats.present + stats.absent + stats.late + stats.excused)) * 100),
      }));
  }, [attendanceRecords]);

  const studentBreakdown = useMemo(() => {
    if (!attendanceSummary || !students) return [];

    return students.map(student => {
      const summary = attendanceSummary.find(s => s.studentId === student.id);
      const total = (summary?.present || 0) + (summary?.absent || 0) + (summary?.late || 0) + (summary?.excused || 0);
      const rate = total > 0 ? Math.round((((summary?.present || 0) + (summary?.late || 0)) / total) * 100) : 0;
      
      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber || "-",
        present: summary?.present || 0,
        absent: summary?.absent || 0,
        late: summary?.late || 0,
        excused: summary?.excused || 0,
        total,
        rate,
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [attendanceSummary, students]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-600">Present</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "late":
        return <Badge className="bg-yellow-600">Late</Badge>;
      case "excused":
        return <Badge variant="outline">Excused</Badge>;
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  const getRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Attendance Reports</h1>
          <p className="text-muted-foreground">View and analyze attendance data</p>
        </div>
        <Button variant="outline" data-testid="button-export-report">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Report Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="select-report-class">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name} {classItem.section ? `(${classItem.section})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger data-testid="select-report-term">
                  <SelectValue placeholder="Select a term" />
                </SelectTrigger>
                <SelectContent>
                  {terms?.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                data-testid="input-start-date"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                data-testid="input-end-date"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            <Button
              variant={reportType === "daily" ? "default" : "outline"}
              size="sm"
              onClick={() => handleReportTypeChange("daily")}
              data-testid="button-daily-report"
            >
              Daily
            </Button>
            <Button
              variant={reportType === "weekly" ? "default" : "outline"}
              size="sm"
              onClick={() => handleReportTypeChange("weekly")}
              data-testid="button-weekly-report"
            >
              Weekly
            </Button>
            <Button
              variant={reportType === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => handleReportTypeChange("monthly")}
              data-testid="button-monthly-report"
            >
              Monthly
            </Button>
            <Button
              variant={reportType === "term" ? "default" : "outline"}
              size="sm"
              onClick={() => handleReportTypeChange("term")}
              data-testid="button-term-report"
            >
              Full Term
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedClass && selectedTerm && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                    <p className={`text-2xl font-bold ${getRateColor(overallStats.rate)}`}>
                      {overallStats.rate}%
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <Progress value={overallStats.rate} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Present</p>
                    <p className="text-2xl font-bold text-green-600">{overallStats.present}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold text-red-600">{overallStats.absent}</p>
                  </div>
                  <UserX className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Late</p>
                    <p className="text-2xl font-bold text-yellow-600">{overallStats.late}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                    <p className="text-2xl font-bold">{overallStats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="daily" className="space-y-4">
            <TabsList>
              <TabsTrigger value="daily" data-testid="tab-daily-breakdown">Daily Breakdown</TabsTrigger>
              <TabsTrigger value="student" data-testid="tab-student-breakdown">By Student</TabsTrigger>
            </TabsList>

            <TabsContent value="daily">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Daily Attendance Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recordsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12" />
                      ))}
                    </div>
                  ) : dailyBreakdown.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-center">Present</TableHead>
                          <TableHead className="text-center">Absent</TableHead>
                          <TableHead className="text-center">Late</TableHead>
                          <TableHead className="text-center">Excused</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-center">Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyBreakdown.map((day) => (
                          <TableRow key={day.date} data-testid={`row-day-${day.date}`}>
                            <TableCell className="font-medium">
                              {new Date(day.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </TableCell>
                            <TableCell className="text-center text-green-600 font-medium">{day.present}</TableCell>
                            <TableCell className="text-center text-red-600 font-medium">{day.absent}</TableCell>
                            <TableCell className="text-center text-yellow-600 font-medium">{day.late}</TableCell>
                            <TableCell className="text-center text-blue-600 font-medium">{day.excused}</TableCell>
                            <TableCell className="text-center">{day.total}</TableCell>
                            <TableCell className="text-center">
                              <span className={getRateColor(day.rate)}>{day.rate}%</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No attendance records</h3>
                      <p className="text-muted-foreground">No attendance data found for the selected period.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="student">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Student Attendance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {studentBreakdown.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Admission No.</TableHead>
                          <TableHead className="text-center">Present</TableHead>
                          <TableHead className="text-center">Absent</TableHead>
                          <TableHead className="text-center">Late</TableHead>
                          <TableHead className="text-center">Excused</TableHead>
                          <TableHead className="text-center">Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentBreakdown.map((student) => (
                          <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.admissionNumber}</TableCell>
                            <TableCell className="text-center text-green-600 font-medium">{student.present}</TableCell>
                            <TableCell className="text-center text-red-600 font-medium">{student.absent}</TableCell>
                            <TableCell className="text-center text-yellow-600 font-medium">{student.late}</TableCell>
                            <TableCell className="text-center text-blue-600 font-medium">{student.excused}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className={getRateColor(student.rate)}>{student.rate}%</span>
                                <Progress value={student.rate} className="w-16 h-2" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No student data</h3>
                      <p className="text-muted-foreground">Select a class and term to view student attendance.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!selectedClass && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Select Class and Term</h3>
              <p className="text-muted-foreground">Choose a class and term above to view attendance reports.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
