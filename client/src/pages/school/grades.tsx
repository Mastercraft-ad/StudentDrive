import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { TrendingUp, Save, Users, BookOpen, FileText } from "lucide-react";
import type { SchoolClass, SchoolSubject, SchoolUser, AssessmentType, StudentGrade } from "@shared/schema";

interface GradeEntry {
  studentId: string;
  score: number;
}

export default function GradesPage() {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [gradesData, setGradesData] = useState<Record<string, number>>({});

  const { data: classes } = useQuery<SchoolClass[]>({
    queryKey: ["/api/school/classes"],
  });

  const { data: subjects } = useQuery<SchoolSubject[]>({
    queryKey: ["/api/school/subjects"],
  });

  const { data: assessmentTypes } = useQuery<AssessmentType[]>({
    queryKey: ["/api/school/assessment-types"],
  });

  const { data: students, isLoading: studentsLoading } = useQuery<SchoolUser[]>({
    queryKey: [`/api/school/classes/${selectedClass}/students`],
    enabled: !!selectedClass,
  });

  const { data: existingGrades } = useQuery<StudentGrade[]>({
    queryKey: ["/api/school/grades", { classId: selectedClass, subjectId: selectedSubject, assessmentTypeId: selectedAssessment }],
    enabled: !!selectedClass && !!selectedSubject && !!selectedAssessment,
  });

  const saveMutation = useMutation({
    mutationFn: async (entries: GradeEntry[]) => {
      return apiRequest("POST", "/api/school/grades/bulk", {
        classId: selectedClass,
        subjectId: selectedSubject,
        assessmentTypeId: selectedAssessment,
        entries,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/grades"] });
      toast({ title: "Grades saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save grades", description: error.message, variant: "destructive" });
    },
  });

  const handleScoreChange = (studentId: string, score: string) => {
    const numScore = parseInt(score) || 0;
    setGradesData((prev) => ({ ...prev, [studentId]: numScore }));
  };

  const handleSave = () => {
    const entries = Object.entries(gradesData).map(([studentId, score]) => ({
      studentId,
      score,
    }));
    if (entries.length === 0) {
      toast({ title: "No grades to save", variant: "destructive" });
      return;
    }
    saveMutation.mutate(entries);
  };

  const selectedAssessmentType = assessmentTypes?.find((a) => a.id === selectedAssessment);

  const getGradeColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 70) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeLetter = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 70) return "A";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";
    return "F";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Grades</h1>
          <p className="text-muted-foreground">Enter and manage student grades</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Class, Subject & Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="select-grade-class">
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
              <label className="text-sm font-medium">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger data-testid="select-grade-subject">
                  <SelectValue placeholder="Select a subject" />
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
              <label className="text-sm font-medium">Assessment Type</label>
              <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                <SelectTrigger data-testid="select-grade-assessment">
                  <SelectValue placeholder="Select assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessmentTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.weight}% - Max: {type.maxScore})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && selectedSubject && selectedAssessment && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Enter Grades
              </CardTitle>
              {selectedAssessmentType && (
                <p className="text-sm text-muted-foreground mt-1">
                  Max Score: {selectedAssessmentType.maxScore} | Weight: {selectedAssessmentType.weight}%
                </p>
              )}
            </div>
            <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-grades">
              <Save className="h-4 w-4 mr-2" />
              Save Grades
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
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const score = gradesData[student.id] || 0;
                    const maxScore = selectedAssessmentType?.maxScore || 100;
                    return (
                      <TableRow key={student.id} data-testid={`row-grade-${student.id}`}>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.admissionNumber || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max={maxScore}
                              value={gradesData[student.id] || ""}
                              onChange={(e) => handleScoreChange(student.id, e.target.value)}
                              className="w-20"
                              placeholder="0"
                              data-testid={`input-score-${student.id}`}
                            />
                            <span className="text-sm text-muted-foreground">/ {maxScore}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {score > 0 && (
                            <span className={`font-bold ${getGradeColor(score, maxScore)}`}>
                              {getGradeLetter(score, maxScore)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {score > 0 ? (
                            <Badge variant="outline" className={getGradeColor(score, maxScore)}>
                              {Math.round((score / maxScore) * 100)}%
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Not graded</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No students in this class</h3>
                <p className="text-muted-foreground">Add students to this class to enter grades.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(!selectedClass || !selectedSubject || !selectedAssessment) && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Select Class, Subject & Assessment</h3>
              <p className="text-muted-foreground">Choose all filters above to start entering grades.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
