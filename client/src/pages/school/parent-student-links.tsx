import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/loading-skeleton";
import { 
  Users, 
  Link as LinkIcon, 
  Unlink, 
  Search, 
  GraduationCap, 
  UserPlus,
  ArrowRightLeft,
  Filter
} from "lucide-react";
import type { SchoolUser, ParentStudentLink } from "@shared/schema";

interface ParentWithStudents extends SchoolUser {
  linkedStudents?: Array<SchoolUser & { relationship: string; linkId: string }>;
}

interface StudentWithParents extends SchoolUser {
  linkedParents?: Array<SchoolUser & { relationship: string; linkId: string }>;
}

interface LinkData {
  id: string;
  parentId: string;
  studentId: string;
  relationship: string;
  isPrimary: boolean;
  createdAt: string;
  parent?: SchoolUser;
  student?: SchoolUser;
}

export default function ParentStudentLinksPage() {
  const { toast } = useToast();
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<{ parentId: string; studentId: string; parentName: string; studentName: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"parents" | "students">("parents");
  const [relationshipFilter, setRelationshipFilter] = useState<string>("all");

  const [linkFormData, setLinkFormData] = useState({
    parentId: "",
    studentId: "",
    relationship: "parent",
    isPrimary: false,
  });

  const { data: parents, isLoading: parentsLoading } = useQuery<SchoolUser[]>({
    queryKey: ["/api/school/users", { role: "parent" }],
  });

  const { data: students, isLoading: studentsLoading } = useQuery<SchoolUser[]>({
    queryKey: ["/api/school/users", { role: "student" }],
  });

  const { data: parentsWithLinks, isLoading: linksLoading, error } = useQuery<ParentWithStudents[]>({
    queryKey: ["/api/school/parents-with-students"],
  });

  const createLinkMutation = useMutation({
    mutationFn: async (data: typeof linkFormData) => {
      return apiRequest("POST", "/api/school/parent-student-link", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/parents-with-students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/school/users"] });
      toast({ title: "Link created successfully", description: "Parent and student are now connected." });
      resetLinkForm();
      setIsLinkDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create link", description: error.message, variant: "destructive" });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (data: { parentId: string; studentId: string }) => {
      return apiRequest("DELETE", `/api/school/parent-student-link/${data.parentId}/${data.studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/parents-with-students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/school/users"] });
      toast({ title: "Link removed successfully", description: "Parent and student are no longer connected." });
      setUnlinkConfirm(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove link", description: error.message, variant: "destructive" });
    },
  });

  const resetLinkForm = () => {
    setLinkFormData({
      parentId: "",
      studentId: "",
      relationship: "parent",
      isPrimary: false,
    });
  };

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkFormData.parentId || !linkFormData.studentId) {
      toast({ title: "Please select both parent and student", variant: "destructive" });
      return;
    }
    createLinkMutation.mutate(linkFormData);
  };

  const isLoading = parentsLoading || studentsLoading || linksLoading;

  const getAllLinks = (): LinkData[] => {
    if (!parentsWithLinks) return [];
    
    const links: LinkData[] = [];
    parentsWithLinks.forEach(parent => {
      if (parent.linkedStudents) {
        parent.linkedStudents.forEach(student => {
          links.push({
            id: student.linkId,
            parentId: parent.id,
            studentId: student.id,
            relationship: student.relationship,
            isPrimary: false,
            createdAt: "",
            parent: parent,
            student: student,
          });
        });
      }
    });
    return links;
  };

  const allLinks = getAllLinks();

  const getStudentsWithParents = (): StudentWithParents[] => {
    if (!students || !parentsWithLinks) return [];
    
    return students.map(student => {
      const linkedParents: Array<SchoolUser & { relationship: string; linkId: string }> = [];
      
      parentsWithLinks.forEach(parent => {
        const link = parent.linkedStudents?.find(s => s.id === student.id);
        if (link) {
          linkedParents.push({
            ...parent,
            relationship: link.relationship,
            linkId: link.linkId || `${parent.id}-${student.id}`,
          });
        }
      });
      
      return {
        ...student,
        linkedParents,
      };
    });
  };

  const studentsWithParents = getStudentsWithParents();

  const filteredParentsWithLinks = parentsWithLinks?.filter(parent => {
    const matchesSearch = 
      `${parent.firstName} ${parent.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parent.linkedStudents?.some(s => 
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    if (relationshipFilter === "all") return matchesSearch;
    
    return matchesSearch && parent.linkedStudents?.some(s => s.relationship === relationshipFilter);
  }) || [];

  const filteredStudentsWithParents = studentsWithParents.filter(student => {
    const matchesSearch = 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.linkedParents?.some(p => 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    if (relationshipFilter === "all") return matchesSearch;
    
    return matchesSearch && student.linkedParents?.some(p => p.relationship === relationshipFilter);
  });

  const getUnlinkedStudents = (parentId: string) => {
    if (!students || !parentsWithLinks) return students || [];
    
    const parent = parentsWithLinks.find(p => p.id === parentId);
    const linkedStudentIds = parent?.linkedStudents?.map(s => s.id) || [];
    
    return students.filter(s => !linkedStudentIds.includes(s.id));
  };

  const stats = {
    totalLinks: allLinks.length,
    totalParents: parentsWithLinks?.filter(p => (p.linkedStudents?.length || 0) > 0).length || 0,
    totalStudents: studentsWithParents.filter(s => (s.linkedParents?.length || 0) > 0).length || 0,
    unlinkedParents: (parents?.length || 0) - (parentsWithLinks?.filter(p => (p.linkedStudents?.length || 0) > 0).length || 0),
    unlinkedStudents: studentsWithParents.filter(s => (s.linkedParents?.length || 0) === 0).length,
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorState 
          message="Failed to load parent-student links" 
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["/api/school/parents-with-students"] })}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Parent-Student Links"
        description="Manage connections between parents and their children"
        actions={
          <Button onClick={() => setIsLinkDialogOpen(true)} data-testid="button-create-link">
            <LinkIcon className="h-4 w-4 mr-2" />
            Create Link
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalLinks}</div>
            <p className="text-sm text-muted-foreground">Total Links</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalParents}</div>
            <p className="text-sm text-muted-foreground">Linked Parents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-sm text-muted-foreground">Linked Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{stats.unlinkedParents}</div>
            <p className="text-sm text-muted-foreground">Unlinked Parents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{stats.unlinkedStudents}</div>
            <p className="text-sm text-muted-foreground">Unlinked Students</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Parent-Student Link</DialogTitle>
            <DialogDescription>
              Connect a parent account to a student account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLink} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Parent</Label>
              <Select
                value={linkFormData.parentId}
                onValueChange={(value) => setLinkFormData({ ...linkFormData, parentId: value })}
              >
                <SelectTrigger data-testid="select-parent">
                  <SelectValue placeholder="Choose a parent" />
                </SelectTrigger>
                <SelectContent>
                  {parents?.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.firstName} {parent.lastName} ({parent.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select
                value={linkFormData.studentId}
                onValueChange={(value) => setLinkFormData({ ...linkFormData, studentId: value })}
              >
                <SelectTrigger data-testid="select-student">
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {(linkFormData.parentId ? getUnlinkedStudents(linkFormData.parentId) : students)?.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} {student.admissionNumber ? `(${student.admissionNumber})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select
                value={linkFormData.relationship}
                onValueChange={(value) => setLinkFormData({ ...linkFormData, relationship: value })}
              >
                <SelectTrigger data-testid="select-relationship">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsLinkDialogOpen(false); resetLinkForm(); }}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!linkFormData.parentId || !linkFormData.studentId || createLinkMutation.isPending}
                data-testid="button-confirm-create-link"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                {createLinkMutation.isPending ? "Creating..." : "Create Link"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!unlinkConfirm} onOpenChange={() => setUnlinkConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Link?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the link between{" "}
              <strong>{unlinkConfirm?.parentName}</strong> and{" "}
              <strong>{unlinkConfirm?.studentName}</strong>? This action can be undone by creating a new link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (unlinkConfirm) {
                  unlinkMutation.mutate({
                    parentId: unlinkConfirm.parentId,
                    studentId: unlinkConfirm.studentId,
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Links
            </CardTitle>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search-links"
                />
              </div>
              <Select value={relationshipFilter} onValueChange={setRelationshipFilter}>
                <SelectTrigger className="w-40" data-testid="select-filter-relationship">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Relationships</SelectItem>
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "parents" | "students")}>
            <TabsList className="mb-4">
              <TabsTrigger value="parents" data-testid="tab-view-parents">
                <Users className="h-4 w-4 mr-2" />
                View by Parent
              </TabsTrigger>
              <TabsTrigger value="students" data-testid="tab-view-students">
                <GraduationCap className="h-4 w-4 mr-2" />
                View by Student
              </TabsTrigger>
            </TabsList>

            <TabsContent value="parents">
              {isLoading ? (
                <TableSkeleton rows={5} />
              ) : filteredParentsWithLinks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parent</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Linked Students</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParentsWithLinks.map((parent) => (
                      <TableRow key={parent.id} data-testid={`row-parent-link-${parent.id}`}>
                        <TableCell className="font-medium">
                          {parent.firstName} {parent.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {parent.email}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {parent.linkedStudents && parent.linkedStudents.length > 0 ? (
                              parent.linkedStudents.map((student) => (
                                <div key={student.id} className="flex items-center gap-1">
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <span>{student.firstName} {student.lastName}</span>
                                    <span className="text-xs opacity-70">({student.relationship})</span>
                                  </Badge>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => setUnlinkConfirm({
                                      parentId: parent.id,
                                      studentId: student.id,
                                      parentName: `${parent.firstName} ${parent.lastName}`,
                                      studentName: `${student.firstName} ${student.lastName}`,
                                    })}
                                    data-testid={`button-unlink-${parent.id}-${student.id}`}
                                  >
                                    <Unlink className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No students linked</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setLinkFormData({ ...linkFormData, parentId: parent.id });
                              setIsLinkDialogOpen(true);
                            }}
                            data-testid={`button-add-link-${parent.id}`}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Child
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No parents found"
                  description={searchQuery ? "No parents match your search." : "Add parents to start linking them to students."}
                />
              )}
            </TabsContent>

            <TabsContent value="students">
              {isLoading ? (
                <TableSkeleton rows={5} />
              ) : filteredStudentsWithParents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Linked Parents</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudentsWithParents.map((student) => (
                      <TableRow key={student.id} data-testid={`row-student-link-${student.id}`}>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {student.admissionNumber || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {student.linkedParents && student.linkedParents.length > 0 ? (
                              student.linkedParents.map((parent) => (
                                <div key={parent.id} className="flex items-center gap-1">
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <span>{parent.firstName} {parent.lastName}</span>
                                    <span className="text-xs opacity-70">({parent.relationship})</span>
                                  </Badge>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => setUnlinkConfirm({
                                      parentId: parent.id,
                                      studentId: student.id,
                                      parentName: `${parent.firstName} ${parent.lastName}`,
                                      studentName: `${student.firstName} ${student.lastName}`,
                                    })}
                                    data-testid={`button-unlink-${parent.id}-${student.id}`}
                                  >
                                    <Unlink className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No parents linked</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setLinkFormData({ ...linkFormData, studentId: student.id });
                              setIsLinkDialogOpen(true);
                            }}
                            data-testid={`button-add-parent-${student.id}`}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Parent
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={GraduationCap}
                  title="No students found"
                  description={searchQuery ? "No students match your search." : "Add students to start linking them to parents."}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
