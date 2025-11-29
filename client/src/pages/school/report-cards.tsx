import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useToast } from "@/hooks/use-toast";
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  GraduationCap, 
  Users,
  Calendar,
  Award,
  TrendingUp
} from "lucide-react";
import type { SchoolClass, AcademicTerm, TermResult, SchoolSubject, SchoolUser } from "@shared/schema";

interface StudentReportData {
  student: SchoolUser;
  results: TermResult[];
  totalScore: number;
  averageScore: number;
  overallGrade: string;
  position: number;
  totalStudents: number;
}

export default function ReportCardsPage() {
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  const { data: terms } = useQuery<AcademicTerm[]>({
    queryKey: ["/api/school/terms"],
  });

  const { data: classes } = useQuery<SchoolClass[]>({
    queryKey: ["/api/school/classes"],
  });

  const { data: subjects } = useQuery<SchoolSubject[]>({
    queryKey: ["/api/school/subjects"],
  });

  const { data: students, isLoading: studentsLoading } = useQuery<SchoolUser[]>({
    queryKey: [`/api/school/classes/${selectedClass}/students`],
    enabled: !!selectedClass,
  });

  const { data: classResults, isLoading: resultsLoading } = useQuery<TermResult[]>({
    queryKey: [`/api/school/classes/${selectedClass}/results`, { termId: selectedTerm }],
    enabled: !!selectedClass && !!selectedTerm,
  });

  const { data: studentResults } = useQuery<TermResult[]>({
    queryKey: [`/api/school/students/${selectedStudent}/results`, { termId: selectedTerm }],
    enabled: !!selectedStudent && !!selectedTerm,
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
    setSelectedStudent("");
  }, [selectedClass]);

  const getSubjectName = (subjectId: string) => {
    const subject = subjects?.find(s => s.id === subjectId);
    return subject?.name || "Unknown";
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

  const getGradeRemark = (grade: string) => {
    switch (grade) {
      case "A": return "Excellent";
      case "B": return "Very Good";
      case "C": return "Good";
      case "D": return "Fair";
      default: return "Needs Improvement";
    }
  };

  const calculateStudentStats = () => {
    if (!studentResults || studentResults.length === 0) return null;

    const totalScore = studentResults.reduce((sum, r) => sum + r.totalScore, 0);
    const averageScore = Math.round(totalScore / studentResults.length);
    
    let overallGrade = "F";
    if (averageScore >= 70) overallGrade = "A";
    else if (averageScore >= 60) overallGrade = "B";
    else if (averageScore >= 50) overallGrade = "C";
    else if (averageScore >= 40) overallGrade = "D";

    const studentPosition = calculatePosition();

    return {
      totalScore,
      averageScore,
      overallGrade,
      position: studentPosition,
      totalStudents: students?.length || 0,
    };
  };

  const calculatePosition = () => {
    if (!classResults || !students || !selectedStudent) return 0;

    const studentAverages: { studentId: string; average: number }[] = [];
    
    students.forEach(student => {
      const studentResults = classResults.filter(r => r.studentId === student.id);
      if (studentResults.length > 0) {
        const total = studentResults.reduce((sum, r) => sum + r.totalScore, 0);
        const average = total / studentResults.length;
        studentAverages.push({ studentId: student.id, average });
      }
    });

    studentAverages.sort((a, b) => b.average - a.average);
    const position = studentAverages.findIndex(s => s.studentId === selectedStudent) + 1;
    return position || 0;
  };

  const handlePrint = () => {
    if (reportRef.current) {
      const printContent = reportRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Report Card - ${selectedStudentData?.firstName} ${selectedStudentData?.lastName}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 12px; 
                text-align: left; 
              }
              th { 
                background-color: #f5f5f5; 
                font-weight: bold;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
              }
              .header h1 { 
                margin: 0 0 10px 0;
                color: #333;
              }
              .student-info { 
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin: 20px 0;
                padding: 15px;
                background: #f9f9f9;
                border-radius: 8px;
              }
              .summary { 
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin: 20px 0;
              }
              .summary-item {
                text-align: center;
                padding: 15px;
                background: #f5f5f5;
                border-radius: 8px;
              }
              .summary-item .label { 
                font-size: 12px; 
                color: #666;
                margin-bottom: 5px;
              }
              .summary-item .value { 
                font-size: 24px; 
                font-weight: bold;
              }
              .grade-a { color: #16a34a; }
              .grade-b { color: #2563eb; }
              .grade-c { color: #ca8a04; }
              .grade-d { color: #ea580c; }
              .grade-f { color: #dc2626; }
              .footer {
                margin-top: 40px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
              }
              .signature-line {
                border-top: 1px solid #333;
                padding-top: 10px;
                text-align: center;
              }
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownloadPDF = () => {
    toast({ 
      title: "Generating PDF...", 
      description: "Your report card PDF will be downloaded shortly." 
    });
    handlePrint();
  };

  const selectedStudentData = students?.find(s => s.id === selectedStudent);
  const selectedTermData = terms?.find(t => t.id === selectedTerm);
  const selectedClassData = classes?.find(c => c.id === selectedClass);
  const studentStats = calculateStudentStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Report Cards</h1>
          <p className="text-muted-foreground">Generate and export student report cards</p>
        </div>
        {selectedStudent && studentResults && studentResults.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} data-testid="button-print-report">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownloadPDF} data-testid="button-download-pdf">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        )}
      </div>

      <Card data-testid="card-report-filters">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Select Term, Class & Student
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger data-testid="select-report-term">
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
              <label className="text-sm font-medium">Student</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={!selectedClass}>
                <SelectTrigger data-testid="select-report-student">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} ({student.admissionNumber || "N/A"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedStudent && selectedTerm && (
        <>
          {resultsLoading ? (
            <Card data-testid="card-report-loading">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16" data-testid={`skeleton-report-${i}`} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : studentResults && studentResults.length > 0 ? (
            <Card data-testid="card-report-content">
              <CardContent className="pt-6">
                <div ref={reportRef} data-testid="div-report-card">
                  <div className="header text-center mb-6 pb-4 border-b-2">
                    <h1 className="text-2xl font-bold mb-2">STUDENT REPORT CARD</h1>
                    <p className="text-lg">{selectedTermData?.name}</p>
                  </div>

                  <div className="student-info grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg mb-6">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Student Name</p>
                        <p className="font-semibold">{selectedStudentData?.firstName} {selectedStudentData?.lastName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Class</p>
                        <p className="font-semibold">{selectedClassData?.name} {selectedClassData?.section && `(${selectedClassData.section})`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Admission No.</p>
                        <p className="font-semibold">{selectedStudentData?.admissionNumber || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Academic Term</p>
                        <p className="font-semibold">{selectedTermData?.name}</p>
                      </div>
                    </div>
                  </div>

                  {studentStats && (
                    <div className="summary grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="summary-item text-center p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Score</p>
                        <p className="text-2xl font-bold">{studentStats.totalScore}</p>
                      </div>
                      <div className="summary-item text-center p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Average</p>
                        <p className="text-2xl font-bold">{studentStats.averageScore}%</p>
                      </div>
                      <div className="summary-item text-center p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Grade</p>
                        <p className={`text-2xl font-bold ${getGradeColor(studentStats.overallGrade)}`}>
                          {studentStats.overallGrade}
                        </p>
                      </div>
                      <div className="summary-item text-center p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Position</p>
                        <div className="flex items-center justify-center gap-1">
                          <Award className="h-5 w-5 text-yellow-500" />
                          <p className="text-2xl font-bold">{studentStats.position}/{studentStats.totalStudents}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Table data-testid="table-report-results">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="text-center">Position</TableHead>
                        <TableHead className="text-center">Class Average</TableHead>
                        <TableHead>Remark</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentResults.map((result) => (
                        <TableRow key={result.id} data-testid={`row-report-${result.id}`}>
                          <TableCell className="font-medium">{getSubjectName(result.subjectId)}</TableCell>
                          <TableCell className="text-center">{result.totalScore}%</TableCell>
                          <TableCell className="text-center">
                            <Badge className={getGradeColor(result.grade || "F")}>
                              {result.grade || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{result.position || "-"}</TableCell>
                          <TableCell className="text-center">
                            {result.classAverage ? `${Math.round(result.classAverage)}%` : "-"}
                          </TableCell>
                          <TableCell>{getGradeRemark(result.grade || "F")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Separator className="my-6" />

                  <div className="footer grid grid-cols-2 gap-8 mt-8">
                    <div>
                      <div className="border-t pt-2 text-center">
                        <p className="text-sm text-muted-foreground">Class Teacher's Signature</p>
                      </div>
                    </div>
                    <div>
                      <div className="border-t pt-2 text-center">
                        <p className="text-sm text-muted-foreground">Principal's Signature</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Grading Scale</h4>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      <div><span className="text-green-600 font-bold">A</span>: 70-100% (Excellent)</div>
                      <div><span className="text-blue-600 font-bold">B</span>: 60-69% (Very Good)</div>
                      <div><span className="text-yellow-600 font-bold">C</span>: 50-59% (Good)</div>
                      <div><span className="text-orange-600 font-bold">D</span>: 40-49% (Fair)</div>
                      <div><span className="text-red-600 font-bold">F</span>: 0-39% (Fail)</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card data-testid="card-no-results">
              <CardContent className="py-12">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium" data-testid="text-no-results-title">No Results Available</h3>
                  <p className="text-muted-foreground" data-testid="text-no-results-description">
                    This student has no term results yet. Please enter grades and calculate term results first.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {(!selectedTerm || !selectedClass || !selectedStudent) && (
        <Card data-testid="card-select-filters">
          <CardContent className="py-12">
            <div className="text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium" data-testid="text-select-filters-title">Select Term, Class & Student</h3>
              <p className="text-muted-foreground" data-testid="text-select-filters-description">Choose all filters above to view and generate report card.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
