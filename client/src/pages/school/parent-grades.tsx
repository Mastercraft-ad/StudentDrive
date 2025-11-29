import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
import {
  GraduationCap,
  TrendingUp,
  Calendar,
  BookOpen,
  Award,
  Trophy,
} from "lucide-react";
import type { AcademicTerm, TermResult } from "@shared/schema";

interface ChildInfo {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  classId: string;
  className: string;
}

interface GradeSummary {
  subjectId: string;
  subjectName: string;
  averageScore: number;
  grade: string;
}

export default function ParentGradesPage() {
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");

  const { data: children, isLoading: childrenLoading } = useQuery<ChildInfo[]>({
    queryKey: ["/api/school/parent/children"],
  });

  const { data: terms } = useQuery<AcademicTerm[]>({
    queryKey: ["/api/school/terms"],
  });

  const { data: gradesSummary, isLoading: gradesLoading } = useQuery<GradeSummary[]>({
    queryKey: [`/api/school/parent/children/${selectedChild}/grades`, { termId: selectedTerm }],
    enabled: !!selectedChild && !!selectedTerm,
  });

  const { data: termResults } = useQuery<TermResult[]>({
    queryKey: [`/api/school/students/${selectedChild}/results`, { termId: selectedTerm }],
    enabled: !!selectedChild && !!selectedTerm,
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

  const selectedChildInfo = children?.find((c) => c.id === selectedChild);
  const selectedTermData = terms?.find(t => t.id === selectedTerm);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-green-600 dark:text-green-400";
      case "B": return "text-blue-600 dark:text-blue-400";
      case "C": return "text-yellow-600 dark:text-yellow-400";
      case "D": return "text-orange-600 dark:text-orange-400";
      default: return "text-red-600 dark:text-red-400";
    }
  };

  const getGradeRemark = (grade: string) => {
    switch (grade) {
      case "A": return "Excellent";
      case "B": return "Very Good";
      case "C": return "Good";
      case "D": return "Fair";
      default: return "Needs Improvement";
    }
  };

  const calculateOverallStats = () => {
    if (!gradesSummary || gradesSummary.length === 0) return null;

    const totalScore = gradesSummary.reduce((sum, g) => sum + g.averageScore, 0);
    const averageScore = Math.round(totalScore / gradesSummary.length);
    
    let overallGrade = "F";
    if (averageScore >= 70) overallGrade = "A";
    else if (averageScore >= 60) overallGrade = "B";
    else if (averageScore >= 50) overallGrade = "C";
    else if (averageScore >= 40) overallGrade = "D";

    return {
      totalSubjects: gradesSummary.length,
      averageScore,
      overallGrade,
    };
  };

  const overallStats = calculateOverallStats();

  if (childrenLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Academic Performance</h1>
          <p className="text-muted-foreground">View your child's grades and term results</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {children && children.length > 0 && (
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger className="w-56" data-testid="select-parent-child">
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
            <SelectTrigger className="w-48" data-testid="select-parent-term">
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
                Choose your child from the dropdown above to view their grades.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {selectedChildInfo && (
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedChildInfo.firstName} {selectedChildInfo.lastName}
                    </h2>
                    <p className="opacity-90">
                      Class: {selectedChildInfo.className} | Admission No: {selectedChildInfo.admissionNumber}
                    </p>
                    <p className="opacity-80 text-sm mt-1">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {selectedTermData?.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {overallStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Subjects Taken</p>
                      <p className="text-2xl font-bold">{overallStats.totalSubjects}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Overall Average</p>
                      <p className="text-2xl font-bold text-purple-600">{overallStats.averageScore}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <Progress value={overallStats.averageScore} className="mt-3" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Overall Grade</p>
                      <p className={`text-2xl font-bold ${getGradeColor(overallStats.overallGrade)}`}>
                        {overallStats.overallGrade}
                      </p>
                    </div>
                    <Award className="h-8 w-8 text-yellow-500" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {getGradeRemark(overallStats.overallGrade)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {gradesLoading ? (
            <Card data-testid="card-grades-loading">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12" data-testid={`skeleton-grade-${i}`} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : gradesSummary && gradesSummary.length > 0 ? (
            <Card data-testid="card-subject-performance">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Subject Performance - {selectedTermData?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table data-testid="table-grades-summary">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Remark</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradesSummary.map((grade) => (
                      <TableRow key={grade.subjectId} data-testid={`row-grade-${grade.subjectId}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            {grade.subjectName}
                          </div>
                        </TableCell>
                        <TableCell>{grade.averageScore}%</TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(grade.grade)}>
                            {grade.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Progress value={grade.averageScore} className="w-24" />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getGradeRemark(grade.grade)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card data-testid="card-no-grades">
              <CardContent className="py-12">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium" data-testid="text-no-grades-title">No Grades Available</h3>
                  <p className="text-muted-foreground" data-testid="text-no-grades-description">
                    No grades have been recorded for this term yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {termResults && termResults.length > 0 && (
            <Card data-testid="card-term-results">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Term Results & Positions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table data-testid="table-term-results">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Total Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Class Average</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {termResults.map((result) => {
                      const subjectGrade = gradesSummary?.find(g => g.subjectId === result.subjectId);
                      return (
                        <TableRow key={result.id} data-testid={`row-result-${result.id}`}>
                          <TableCell className="font-medium">
                            {subjectGrade?.subjectName || "Subject"}
                          </TableCell>
                          <TableCell>{result.totalScore}%</TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(result.grade || "F")}>
                              {result.grade || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {result.position ? (
                              <div className="flex items-center gap-1">
                                {result.position <= 3 && (
                                  <Trophy className={`h-4 w-4 ${
                                    result.position === 1 ? "text-yellow-500" :
                                    result.position === 2 ? "text-gray-400" :
                                    "text-amber-600"
                                  }`} />
                                )}
                                <span className="font-medium">{result.position}</span>
                              </div>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            {result.classAverage ? `${Math.round(result.classAverage)}%` : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-3">Grading Scale</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-green-600 font-bold">A</span>
                  <span>70-100% (Excellent)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-blue-600 font-bold">B</span>
                  <span>60-69% (Very Good)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <span className="text-yellow-600 font-bold">C</span>
                  <span>50-59% (Good)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <span className="text-orange-600 font-bold">D</span>
                  <span>40-49% (Fair)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <span className="text-red-600 font-bold">F</span>
                  <span>0-39% (Fail)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
