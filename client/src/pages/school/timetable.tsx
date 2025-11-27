import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Clock, Calendar, Edit, Trash2 } from "lucide-react";
import type { SchoolClass, SchoolSubject, SchoolUser, TimetablePeriod, TimetableEntry } from "@shared/schema";

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

export default function TimetablePage() {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  
  const [formData, setFormData] = useState({
    periodId: "",
    subjectId: "",
    teacherId: "",
    dayOfWeek: "1",
    room: "",
  });

  const { data: classes } = useQuery<SchoolClass[]>({
    queryKey: ["/api/school/classes"],
  });

  const { data: subjects } = useQuery<SchoolSubject[]>({
    queryKey: ["/api/school/subjects"],
  });

  const { data: teachers } = useQuery<SchoolUser[]>({
    queryKey: ["/api/school/users", { role: "teacher" }],
  });

  const { data: periods } = useQuery<TimetablePeriod[]>({
    queryKey: ["/api/school/timetable-periods"],
  });

  const { data: entries, isLoading } = useQuery<TimetableEntry[]>({
    queryKey: ["/api/school/timetable", { classId: selectedClass }],
    enabled: !!selectedClass,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/school/timetable", {
        ...data,
        classId: selectedClass,
        dayOfWeek: parseInt(data.dayOfWeek),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/timetable"] });
      toast({ title: "Timetable entry added successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add entry", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return apiRequest("PATCH", `/api/school/timetable/${id}`, {
        ...data,
        dayOfWeek: parseInt(data.dayOfWeek),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/timetable"] });
      toast({ title: "Timetable entry updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update entry", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/school/timetable/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/timetable"] });
      toast({ title: "Timetable entry deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete entry", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ periodId: "", subjectId: "", teacherId: "", dayOfWeek: "1", room: "" });
    setEditingEntry(null);
  };

  const handleEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData({
      periodId: entry.periodId,
      subjectId: entry.subjectId || "",
      teacherId: entry.teacherId || "",
      dayOfWeek: entry.dayOfWeek.toString(),
      room: entry.room || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getEntriesForDayAndPeriod = (day: number, periodId: string) => {
    return entries?.find((e) => e.dayOfWeek === day && e.periodId === periodId);
  };

  const getSubjectName = (id: string) => subjects?.find((s) => s.id === id)?.name || "";
  const getTeacherName = (id: string) => {
    const teacher = teachers?.find((t) => t.id === id);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : "";
  };
  const getPeriodName = (id: string) => periods?.find((p) => p.id === id)?.name || "";

  const sortedPeriods = periods?.slice().sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Timetable</h1>
          <p className="text-muted-foreground">Manage class schedules and timetables</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Class
          </CardTitle>
          {selectedClass && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-timetable-entry">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingEntry ? "Edit Timetable Entry" : "Add Timetable Entry"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Day</Label>
                      <Select
                        value={formData.dayOfWeek}
                        onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
                      >
                        <SelectTrigger data-testid="select-timetable-day">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Period</Label>
                      <Select
                        value={formData.periodId}
                        onValueChange={(value) => setFormData({ ...formData, periodId: value })}
                      >
                        <SelectTrigger data-testid="select-timetable-period">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedPeriods?.map((period) => (
                            <SelectItem key={period.id} value={period.id}>
                              {period.name} ({period.startTime} - {period.endTime})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select
                      value={formData.subjectId}
                      onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                    >
                      <SelectTrigger data-testid="select-timetable-subject">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects?.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Teacher</Label>
                    <Select
                      value={formData.teacherId}
                      onValueChange={(value) => setFormData({ ...formData, teacherId: value })}
                    >
                      <SelectTrigger data-testid="select-timetable-teacher">
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers?.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.firstName} {teacher.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="button-save-timetable-entry">
                      {editingEntry ? "Update" : "Add"} Entry
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-64" data-testid="select-timetable-class">
              <SelectValue placeholder="Select a class to view timetable" />
            </SelectTrigger>
            <SelectContent>
              {classes?.map((classItem) => (
                <SelectItem key={classItem.id} value={classItem.id}>
                  {classItem.name} {classItem.section ? `(${classItem.section})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Weekly Schedule - {classes?.find((c) => c.id === selectedClass)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-96" />
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
                            <td key={day.value} className="border p-2">
                              {period.isBreak ? (
                                <div className="text-center text-muted-foreground italic">
                                  Break
                                </div>
                              ) : entry ? (
                                <div className="space-y-1 group relative">
                                  <div className="font-medium text-sm">
                                    {getSubjectName(entry.subjectId || "")}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {getTeacherName(entry.teacherId || "")}
                                  </div>
                                  {entry.room && (
                                    <Badge variant="outline" className="text-xs">{entry.room}</Badge>
                                  )}
                                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleEdit(entry)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => deleteMutation.mutate(entry.id)}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
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
      )}

      {!selectedClass && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Select a Class</h3>
              <p className="text-muted-foreground">Choose a class above to view or edit its timetable.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
