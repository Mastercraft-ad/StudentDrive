import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { UserCheck, UserX, Clock, Calendar, Save, Users, BookOpen, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import type { SchoolClass, SchoolUser, AttendanceRecord, AcademicTerm, SchoolSubject } from "@shared/schema";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface StudentAttendance {
  studentId: string;
  status: AttendanceStatus;
}

interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  subject?: SchoolSubject;
}

export default function AttendancePage() {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [isSubjectAttendance, setIsSubjectAttendance] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});

  const { data: classes } = useQuery<SchoolClass[]>({
    queryKey: ["/api/school/classes"],
  });

  const { data: terms } = useQuery<AcademicTerm[]>({
    queryKey: ["/api/school/terms"],
  });

  const { data: classSubjects } = useQuery<ClassSubject[]>({
    queryKey: ['/api/school/classes', selectedClass, 'subjects'],
    queryFn: async () => {
      const response = await fetch(`/api/school/classes/${selectedClass}/subjects`);
      if (!response.ok) throw new Error('Failed to fetch subjects');
      return response.json();
    },
    enabled: !!selectedClass && isSubjectAttendance,
  });

  const { data: students, isLoading: studentsLoading } = useQuery<SchoolUser[]>({
    queryKey: [`/api/school/classes/${selectedClass}/students`],
    enabled: !!selectedClass,
  });

  const attendanceQueryKey = isSubjectAttendance && selectedSubject 
    ? ['/api/school/attendance', { classId: selectedClass, date: selectedDate, subjectId: selectedSubject }]
    : ['/api/school/attendance', { classId: selectedClass, date: selectedDate }];

  const { data: existingAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: attendanceQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        classId: selectedClass,
        date: selectedDate,
      });
      if (isSubjectAttendance && selectedSubject) {
        params.set('subjectId', selectedSubject);
      }
      const response = await fetch(`/api/school/attendance?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
    enabled: !!selectedClass && !!selectedDate && (!isSubjectAttendance || !!selectedSubject),
  });

  useEffect(() => {
    if (existingAttendance && existingAttendance.length > 0) {
      const existingData: Record<string, AttendanceStatus> = {};
      existingAttendance.forEach(record => {
        existingData[record.studentId] = record.status as AttendanceStatus;
      });
      setAttendanceData(existingData);
    } else {
      setAttendanceData({});
    }
  }, [existingAttendance]);

  useEffect(() => {
    setSelectedSubject("");
  }, [selectedClass]);

  useEffect(() => {
    if (!isSubjectAttendance) {
      setSelectedSubject("");
    } else if (isSubjectAttendance && classSubjects && classSubjects.length > 0 && !selectedSubject) {
      setSelectedSubject(classSubjects[0].subjectId);
    }
  }, [isSubjectAttendance, classSubjects, selectedSubject]);

  const saveMutation = useMutation({
    mutationFn: async (records: StudentAttendance[]) => {
      return apiRequest("POST", "/api/school/attendance/bulk", {
        classId: selectedClass,
        termId: selectedTerm,
        subjectId: isSubjectAttendance ? selectedSubject : null,
        date: selectedDate,
        records,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && (
            (typeof key[0] === 'string' && key[0].includes('/api/school/attendance')) ||
            (typeof key[0] === 'string' && key[0].includes('/api/school/classes'))
          );
        }
      });
      toast({ title: "Attendance saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save attendance", description: error.message, variant: "destructive" });
    },
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSave = () => {
    if (!selectedTerm) {
      toast({ title: "Please select a term", variant: "destructive" });
      return;
    }
    if (isSubjectAttendance && !selectedSubject) {
      toast({ title: "Please select a subject for subject-wise attendance", variant: "destructive" });
      return;
    }
    const records = Object.entries(attendanceData).map(([studentId, status]) => ({
      studentId,
      status,
    }));
    if (records.length === 0) {
      toast({ title: "No attendance data to save", variant: "destructive" });
      return;
    }
    saveMutation.mutate(records);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!students) return;
    const newData: Record<string, AttendanceStatus> = {};
    students.forEach((student) => {
      newData[student.id] = status;
    });
    setAttendanceData(newData);
  };

  const getStatusBadge = (status: AttendanceStatus | "unmarked") => {
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
        return <Badge variant="secondary">Not Marked</Badge>;
    }
  };

  const getAttendanceStats = () => {
    if (!students) return { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
    const stats = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
    students.forEach((student) => {
      const status = attendanceData[student.id];
      if (status) {
        stats[status]++;
      } else {
        stats.unmarked++;
      }
    });
    return stats;
  };

  const stats = getAttendanceStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Attendance</h1>
          <p className="text-muted-foreground">Mark and manage student attendance</p>
        </div>
        <Button variant="outline" asChild data-testid="button-view-reports">
          <Link href="/school/attendance/reports">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Reports
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-2 min-w-[200px]">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="select-attendance-class">
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

            <div className="space-y-2 min-w-[200px]">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger data-testid="select-attendance-term">
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
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                data-testid="input-attendance-date"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Switch
                id="subject-attendance"
                checked={isSubjectAttendance}
                onCheckedChange={setIsSubjectAttendance}
                data-testid="switch-subject-attendance"
              />
              <Label htmlFor="subject-attendance" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Subject-wise Attendance
              </Label>
            </div>

            {isSubjectAttendance && selectedClass && (
              <div className="space-y-2 min-w-[200px]">
                <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!classSubjects || classSubjects.length === 0}>
                  <SelectTrigger data-testid="select-attendance-subject">
                    <SelectValue placeholder={classSubjects?.length === 0 ? "No subjects assigned" : "Select a subject"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classSubjects && classSubjects.length > 0 ? (
                      classSubjects.map((cs) => (
                        <SelectItem key={cs.id} value={cs.subjectId}>
                          {cs.subject?.name || cs.subjectId}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No subjects assigned to this class</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {selectedClass && selectedTerm && (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => handleMarkAll("present")} data-testid="button-mark-all-present">
                <UserCheck className="h-4 w-4 mr-1" />
                All Present
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleMarkAll("absent")} data-testid="button-mark-all-absent">
                <UserX className="h-4 w-4 mr-1" />
                All Absent
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClass && selectedTerm && (!isSubjectAttendance || selectedSubject) && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Present</p>
                    <p className="text-2xl font-bold text-green-600">{stats.present}</p>
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
                    <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
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
                    <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Excused</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unmarked</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.unmarked}</p>
                  </div>
                  <Users className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students ({students?.length || 0})
                {isSubjectAttendance && selectedSubject && (
                  <Badge variant="outline" className="ml-2">
                    <BookOpen className="h-3 w-3 mr-1" />
                    Subject Attendance
                  </Badge>
                )}
              </CardTitle>
              <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-attendance">
                <Save className="h-4 w-4 mr-2" />
                Save Attendance
              </Button>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : students && students.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.admissionNumber || "-"}</TableCell>
                        <TableCell>
                          {getStatusBadge(attendanceData[student.id] || "unmarked")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant={attendanceData[student.id] === "present" ? "default" : "outline"}
                              className={attendanceData[student.id] === "present" ? "bg-green-600" : ""}
                              onClick={() => handleStatusChange(student.id, "present")}
                              data-testid={`button-present-${student.id}`}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={attendanceData[student.id] === "absent" ? "destructive" : "outline"}
                              onClick={() => handleStatusChange(student.id, "absent")}
                              data-testid={`button-absent-${student.id}`}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={attendanceData[student.id] === "late" ? "default" : "outline"}
                              className={attendanceData[student.id] === "late" ? "bg-yellow-600" : ""}
                              onClick={() => handleStatusChange(student.id, "late")}
                              data-testid={`button-late-${student.id}`}
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No students in this class</h3>
                  <p className="text-muted-foreground">Add students to this class to mark attendance.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {selectedClass && !selectedTerm && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Select a Term</h3>
              <p className="text-muted-foreground">Please select a term to mark attendance.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isSubjectAttendance && selectedClass && selectedTerm && !selectedSubject && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Select a Subject</h3>
              <p className="text-muted-foreground">Please select a subject to mark subject-wise attendance.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
