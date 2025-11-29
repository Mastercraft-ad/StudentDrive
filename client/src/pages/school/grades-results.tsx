import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Calculator, TrendingUp, Users, Trophy, Medal, Award } from "lucide-react";
import type { SchoolClass, AcademicTerm, TermResult, SchoolSubject } from "@shared/schema";

interface EnrichedTermResult extends TermResult {
  studentName?: string;
  subjectName?: string;
  admissionNumber?: string;
}

interface StudentResultSummary {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  totalScore: number;
  averageScore: number;
  subjectCount: number;
  overallGrade: string;
  position: number;
}

export default function GradesResultsPage() {
  const { toast } = useToast();
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");

  const { data: terms } = useQuery<AcademicTerm[]>({
    queryKey: ["/api/school/terms"],
  });

  const { data: classes } = useQuery<SchoolClass[]>({
    queryKey: ["/api/school/classes"],
  });

  const { data: subjects } = useQuery<SchoolSubject[]>({
    queryKey: ["/api/school/subjects"],
  });

  const { data: classResults, isLoading: resultsLoading, refetch: refetchResults } = useQuery<TermResult[]>({
    queryKey: [`/api/school/classes/${selectedClass}/results`, { termId: selectedTerm }],
    enabled: !!selectedClass && !!selectedTerm,
  });

  const { data: students } = useQuery<any[]>({
    queryKey: [`/api/school/classes/${selectedClass}/students`],
    enabled: !!selectedClass,
  });

  useEffect(() => {
    if (terms && terms.length > 0 && !selectedTerm) {
      const currentTerm = terms.find(t => t.isCurrent);
      if (currentTerm) {
        setSelectedTerm(currentTerm.id);
      }
    }
  }, [terms, selectedTerm]);

  const calculateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/school/results/calculate", {
        classId: selectedClass,
        termId: selectedTerm,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/school/classes/${selectedClass}/results`] });
      refetchResults();
      toast({ title: "Term results calculated successfully", description: "Student positions and averages have been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to calculate results", description: error.message, variant: "destructive" });
    },
  });

  const getStudentName = (studentId: string) => {
    const student = students?.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : "Unknown";
  };

  const getAdmissionNumber = (studentId: string) => {
    const student = students?.find(s => s.id === studentId);
    return student?.admissionNumber || "-";
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects?.find(s => s.id === subjectId);
    return subject?.name || "Unknown";
  };

  const getStudentSummaries = (): StudentResultSummary[] => {
    if (!classResults || !students) return [];

    const studentScores: Record<string, { total: number; count: number; scores: number[] }> = {};

    classResults.forEach(result => {
      if (!studentScores[result.studentId]) {
        studentScores[result.studentId] = { total: 0, count: 0, scores: [] };
      }
      studentScores[result.studentId].total += result.totalScore;
      studentScores[result.studentId].count += 1;
      studentScores[result.studentId].scores.push(result.totalScore);
    });

    const summaries: StudentResultSummary[] = Object.entries(studentScores).map(([studentId, data]) => {
      const average = Math.round(data.total / data.count);
      let grade = "F";
      if (average >= 70) grade = "A";
      else if (average >= 60) grade = "B";
      else if (average >= 50) grade = "C";
      else if (average >= 40) grade = "D";

      return {
        studentId,
        studentName: getStudentName(studentId),
        admissionNumber: getAdmissionNumber(studentId),
        totalScore: data.total,
        averageScore: average,
        subjectCount: data.count,
        overallGrade: grade,
        position: 0,
      };
    });

    summaries.sort((a, b) => b.averageScore - a.averageScore);
    summaries.forEach((summary, index) => {
      summary.position = index + 1;
    });

    return summaries;
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-green-600 dark:text-green-400";
      case "B": return "text-blue-600 dark:text-blue-400";
      case "C": return "text-yellow-600 dark:text-yellow-400";
      case "D": return "text-orange-600 dark:text-orange-400";
      default: return "text-red-600 dark:text-red-400";
    }
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const studentSummaries = getStudentSummaries();
  const selectedTermData = terms?.find(t => t.id === selectedTerm);
  const selectedClassData = classes?.find(c => c.id === selectedClass);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Term Results</h1>
          <p className="text-muted-foreground">View and calculate student term results and positions</p>
        </div>
        {selectedClass && selectedTerm && (
          <Button 
            onClick={() => calculateMutation.mutate()} 
            disabled={calculateMutation.isPending}
            data-testid="button-calculate-results"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {calculateMutation.isPending ? "Calculating..." : "Calculate Results"}
          </Button>
        )}
      </div>

      <Card data-testid="card-results-filters">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Select Term and Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger data-testid="select-results-term">
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
                <SelectTrigger data-testid="select-results-class">
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
          </div>
        </CardContent>
      </Card>

      {selectedTerm && selectedClass && (
        <>
          {resultsLoading ? (
            <Card data-testid="card-results-loading">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12" data-testid={`skeleton-result-${i}`} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : studentSummaries.length > 0 ? (
            <Card data-testid="card-class-results">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Class Results - {selectedClassData?.name} ({selectedTermData?.name})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table data-testid="table-class-results">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Total Score</TableHead>
                      <TableHead>Average</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentSummaries.map((summary) => (
                      <TableRow key={summary.studentId} data-testid={`row-result-${summary.studentId}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPositionIcon(summary.position)}
                            <span className="font-bold">{summary.position}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{summary.studentName}</TableCell>
                        <TableCell>{summary.admissionNumber}</TableCell>
                        <TableCell>{summary.subjectCount}</TableCell>
                        <TableCell>{summary.totalScore}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{summary.averageScore}%</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${getGradeColor(summary.overallGrade)}`}>
                            {summary.overallGrade}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card data-testid="card-no-results">
              <CardContent className="py-12">
                <div className="text-center">
                  <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium" data-testid="text-no-results-title">No Results Yet</h3>
                  <p className="text-muted-foreground mb-4" data-testid="text-no-results-description">
                    Enter grades for this class and term, then click "Calculate Results" to generate term results.
                  </p>
                  <Button onClick={() => calculateMutation.mutate()} disabled={calculateMutation.isPending} data-testid="button-calculate-results-empty">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Results Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {classResults && classResults.length > 0 && (
            <Card data-testid="card-subject-results">
              <CardHeader>
                <CardTitle>Subject-wise Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Table data-testid="table-subject-results">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Class Average</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classResults.map((result) => (
                      <TableRow key={result.id} data-testid={`row-subject-result-${result.id}`}>
                        <TableCell className="font-medium">{getStudentName(result.studentId)}</TableCell>
                        <TableCell>{getSubjectName(result.subjectId)}</TableCell>
                        <TableCell>{result.totalScore}%</TableCell>
                        <TableCell>
                          <span className={`font-bold ${getGradeColor(result.grade || "F")}`}>
                            {result.grade || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {result.position ? (
                            <div className="flex items-center gap-1">
                              {getPositionIcon(result.position)}
                              <span>{result.position}</span>
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {result.classAverage ? `${Math.round(result.classAverage)}%` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {(!selectedTerm || !selectedClass) && (
        <Card data-testid="card-select-filters">
          <CardContent className="py-12">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium" data-testid="text-select-filters-title">Select Term and Class</h3>
              <p className="text-muted-foreground" data-testid="text-select-filters-description">Choose a term and class above to view term results.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
