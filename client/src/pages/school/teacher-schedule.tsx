import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Clock, Calendar, MapPin, BookOpen, Users } from "lucide-react";
import type { TimetablePeriod, TimetableEntry, AcademicTerm, SchoolClass, SchoolSubject } from "@shared/schema";

interface CurrentUser {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  school: {
    id: string;
    name: string;
  };
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

export default function TeacherSchedulePage() {
  const [selectedTerm, setSelectedTerm] = useState<string>("");

  const { data: currentUser, isLoading: userLoading } = useQuery<CurrentUser>({
    queryKey: ["/api/school/auth/me"],
  });

  const { data: terms } = useQuery<AcademicTerm[]>({
    queryKey: ["/api/school/terms"],
  });

  const { data: periods } = useQuery<TimetablePeriod[]>({
    queryKey: ["/api/school/timetable-periods"],
  });

  const { data: classes } = useQuery<SchoolClass[]>({
    queryKey: ["/api/school/classes"],
  });

  const { data: subjects } = useQuery<SchoolSubject[]>({
    queryKey: ["/api/school/subjects"],
  });

  const teacherId = currentUser?.user?.id;

  const { data: entries, isLoading: entriesLoading } = useQuery<TimetableEntry[]>({
    queryKey: [`/api/school/teachers/${teacherId}/timetable`, { termId: selectedTerm }],
    enabled: !!teacherId,
  });

  useEffect(() => {
    if (terms && terms.length > 0 && !selectedTerm) {
      const currentTerm = terms.find(t => t.isCurrent);
      if (currentTerm) {
        setSelectedTerm(currentTerm.id);
      } else if (terms[0]) {
        setSelectedTerm(terms[0].id);
      }
    }
  }, [terms, selectedTerm]);

  const getEntriesForDayAndPeriod = (day: number, periodId: string) => {
    return entries?.find((e) => e.dayOfWeek === day && e.periodId === periodId);
  };

  const getClassName = (classId: string) => {
    const cls = classes?.find((c) => c.id === classId);
    return cls ? `${cls.name}${cls.section ? ` (${cls.section})` : ""}` : "";
  };

  const getSubjectName = (id: string) => subjects?.find((s) => s.id === id)?.name || "";

  const sortedPeriods = periods?.slice().sort((a, b) => a.orderIndex - b.orderIndex);

  const selectedTermData = terms?.find(t => t.id === selectedTerm);

  const totalClasses = entries?.length || 0;
  const uniqueClasses = new Set(entries?.map(e => e.classId)).size;
  const uniqueSubjects = new Set(entries?.map(e => e.subjectId)).size;

  if (userLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (currentUser?.user?.role !== "teacher") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Access Denied</h3>
              <p className="text-muted-foreground">This page is only available for teachers.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">My Schedule</h1>
          <p className="text-muted-foreground">
            View your teaching schedule for {currentUser?.user?.firstName} {currentUser?.user?.lastName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-48" data-testid="select-schedule-term">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Periods</p>
                <p className="text-2xl font-bold" data-testid="text-total-periods">{totalClasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classes Teaching</p>
                <p className="text-2xl font-bold" data-testid="text-unique-classes">{uniqueClasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subjects Teaching</p>
                <p className="text-2xl font-bold" data-testid="text-unique-subjects">{uniqueSubjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Schedule
            {selectedTermData && (
              <Badge variant="outline" className="ml-2">
                {selectedTermData.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entriesLoading ? (
            <Skeleton className="h-96" />
          ) : !periods || periods.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Periods Configured</h3>
              <p className="text-muted-foreground">
                Please ask the administrator to set up timetable periods first.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-muted text-left min-w-[100px]">Period</th>
                    {DAYS_OF_WEEK.map((day) => (
                      <th key={day.value} className="border p-2 bg-muted text-center min-w-[150px]">
                        {day.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedPeriods?.map((period) => (
                    <tr key={period.id}>
                      <td className="border p-2 bg-muted/50">
                        <div className="font-medium">{period.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {period.startTime} - {period.endTime}
                        </div>
                        {period.isBreak && (
                          <Badge variant="secondary" className="mt-1 text-xs">Break</Badge>
                        )}
                      </td>
                      {DAYS_OF_WEEK.map((day) => {
                        const entry = getEntriesForDayAndPeriod(day.value, period.id);
                        return (
                          <td key={day.value} className="border p-2" data-testid={`cell-${day.value}-${period.id}`}>
                            {period.isBreak ? (
                              <div className="text-center text-muted-foreground italic">
                                Break
                              </div>
                            ) : entry ? (
                              <div className="space-y-1">
                                <div className="font-medium text-sm text-primary">
                                  {getSubjectName(entry.subjectId || "")}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {getClassName(entry.classId)}
                                </div>
                                {entry.room && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {entry.room}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground text-sm">
                                -
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {entries && entries.length === 0 && !entriesLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Classes Assigned</h3>
              <p className="text-muted-foreground">
                You don't have any classes assigned for this term yet.
                Please contact the administrator to assign your timetable.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
