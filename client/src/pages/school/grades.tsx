import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/loading-skeleton";
import { TrendingUp, Save, Users, BookOpen, FileText, Calculator } from "lucide-react";
import type { SchoolClass, SchoolSubject, SchoolUser, AssessmentType, StudentGrade, AcademicTerm } from "@shared/schema";

interface GradeEntry {
  studentId: string;
  score: number;
}

export default function GradesPage() {
  const { toast } = useToast();
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [gradesData, setGradesData] = useState<Record<string, number>>({});

  const { data: terms } = useQuery<AcademicTerm[]>({
    queryKey: ["/api/school/terms"],
  });

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

  const { data: existingGrades, refetch: refetchGrades } = useQuery<StudentGrade[]>({
    queryKey: ["/api/school/grades", { classId: selectedClass, subjectId: selectedSubject, termId: selectedTerm }],
    enabled: !!selectedClass && !!selectedSubject && !!selectedTerm,
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
    if (existingGrades && existingGrades.length > 0 && selectedAssessment) {
      const initialGrades: Record<string, number> = {};
      existingGrades
        .filter(g => g.assessmentTypeId === selectedAssessment)
        .forEach(g => {
          initialGrades[g.studentId] = g.score;
        });
      setGradesData(initialGrades);
    } else {
      setGradesData({});
    }
  }, [existingGrades, selectedAssessment]);

  const saveMutation = useMutation({
    mutationFn: async (entries: GradeEntry[]) => {
      return apiRequest("POST", "/api/school/grades/bulk", {
        classId: selectedClass,
        subjectId: selectedSubject,
        termId: selectedTerm,
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

  const calculateResultsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/school/results/calculate", {
        classId: selectedClass,
        termId: selectedTerm,
      });
    },
    onSuccess: () => {
      toast({ title: "Term results calculated successfully", description: "Student positions and averages have been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to calculate results", description: error.message, variant: "destructive" });
    },
  });

  const handleScoreChange = (studentId: string, score: string) => {
    const numScore = parseInt(score) || 0;
    setGradesData((prev) => ({ ...prev, [studentId]: numScore }));
  };

  const handleSave = () => {
    const entries = Object.entries(gradesData)
      .filter(([_, score]) => score > 0)
      .map(([studentId, score]) => ({
        studentId,
        score,
      }));
    if (entries.length === 0) {
      toast({ title: "No grades to save", variant: "destructive" });
      return;
    }
    saveMutation.mutate(entries);
  };

  const handleCalculateResults = () => {
    if (!selectedClass || !selectedTerm) {
      toast({ title: "Please select a class and term", variant: "destructive" });
      return;
    }
    calculateResultsMutation.mutate();
  };

  const selectedAssessmentType = assessmentTypes?.find((a) => a.id === selectedAssessment);
  const selectedTermData = terms?.find(t => t.id === selectedTerm);

  const getGradeColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 70) return "text-green-600 dark:text-green-400";
    if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
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
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Grades"
        description="Enter and manage student grades"
        breadcrumbs={[
          { label: "Dashboard", href: "/school/dashboard" },
          { label: "Academics", href: "/school/grades" },
          { label: "Grades" }
        ]}
        actions={
          selectedClass && selectedTerm ? (
            <Button 
              onClick={handleCalculateResults} 
              disabled={calculateResultsMutation.isPending}
              variant="outline"
              data-testid="button-calculate-results"
            >
              <Calculator className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Calculate Term Results</span>
              <span className="sm:hidden">Calculate</span>
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Term, Class, Subject & Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger data-testid="select-grade-term">
                  <SelectValue placeholder="Select a term" />
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

      {selectedTerm && selectedClass && selectedSubject && selectedAssessment && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Enter Grades
              </CardTitle>
              <div className="text-sm text-muted-foreground mt-1 space-y-1">
                {selectedTermData && (
                  <p>Term: {selectedTermData.name}</p>
                )}
                {selectedAssessmentType && (
                  <p>Max Score: {selectedAssessmentType.maxScore} | Weight: {selectedAssessmentType.weight}%</p>
                )}
              </div>
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
                              value={gradesData[student.id] ?? ""}
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

      {(!selectedTerm || !selectedClass || !selectedSubject || !selectedAssessment) && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Select Term, Class, Subject & Assessment</h3>
              <p className="text-muted-foreground">Choose all filters above to start entering grades.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
