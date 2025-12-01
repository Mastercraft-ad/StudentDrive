import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { EmptyState, ErrorState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/loading-skeleton";
import { Plus, FileText, Edit, Trash2, Search, BookOpen } from "lucide-react";
import type { SchoolSubject } from "@shared/schema";

export default function SubjectsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SchoolSubject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    creditUnits: "1",
    isCompulsory: true,
  });

  const { data: subjects, isLoading, error, refetch } = useQuery<SchoolSubject[]>({
    queryKey: ["/api/school/subjects"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/school/subjects", {
        ...data,
        creditUnits: parseInt(data.creditUnits),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/subjects"] });
      toast({ title: "Subject created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create subject", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return apiRequest("PATCH", `/api/school/subjects/${id}`, {
        ...data,
        creditUnits: parseInt(data.creditUnits),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/subjects"] });
      toast({ title: "Subject updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update subject", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/school/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/subjects"] });
      toast({ title: "Subject deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete subject", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", code: "", description: "", creditUnits: "1", isCompulsory: true });
    setEditingSubject(null);
  };

  const handleEdit = (subject: SchoolSubject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code || "",
      description: subject.description || "",
      creditUnits: subject.creditUnits?.toString() || "1",
      isCompulsory: subject.isCompulsory,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredSubjects = subjects?.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Subjects"
          description="Manage school subjects and their details"
          breadcrumbs={[
            { label: "Dashboard", href: "/school/dashboard" },
            { label: "Academic", href: "/school/subjects" },
            { label: "Subjects" }
          ]}
        />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Subjects"
          description="Manage school subjects and their details"
          breadcrumbs={[
            { label: "Dashboard", href: "/school/dashboard" },
            { label: "Academic", href: "/school/subjects" },
            { label: "Subjects" }
          ]}
        />
        <ErrorState 
          message="Failed to load subjects. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Subjects"
        description="Manage school subjects and their details"
        breadcrumbs={[
          { label: "Dashboard", href: "/school/dashboard" },
          { label: "Academic", href: "/school/subjects" },
          { label: "Subjects" }
        ]}
        actions={
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-subject">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Subject</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Mathematics"
                    required
                    data-testid="input-subject-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Subject Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., MTH"
                    data-testid="input-subject-code"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the subject"
                  data-testid="input-subject-description"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creditUnits">Credit Units</Label>
                  <Input
                    id="creditUnits"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.creditUnits}
                    onChange={(e) => setFormData({ ...formData, creditUnits: e.target.value })}
                    data-testid="input-subject-credits"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isCompulsory">Compulsory Subject</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="isCompulsory"
                      checked={formData.isCompulsory}
                      onCheckedChange={(checked) => setFormData({ ...formData, isCompulsory: checked })}
                      data-testid="switch-subject-compulsory"
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.isCompulsory ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-subject">
                  {editingSubject ? "Update" : "Create"} Subject
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Subjects ({subjects?.length || 0})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-subjects"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubjects && filteredSubjects.length > 0 ? (
            <ScrollArea className="w-full">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Code</TableHead>
                      <TableHead className="hidden md:table-cell">Credit Units</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubjects.map((subject) => (
                      <TableRow key={subject.id} data-testid={`row-subject-${subject.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <div>
                              {subject.name}
                              <span className="sm:hidden text-xs text-muted-foreground ml-1">
                                ({subject.code || "-"})
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">{subject.code || "-"}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{subject.creditUnits || 1}</TableCell>
                        <TableCell>
                          <Badge variant={subject.isCompulsory ? "default" : "secondary"}>
                            {subject.isCompulsory ? "Compulsory" : "Elective"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={subject.isActive ? "default" : "outline"}>
                            {subject.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(subject)}
                              data-testid={`button-edit-subject-${subject.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(subject.id)}
                              data-testid={`button-delete-subject-${subject.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <EmptyState
              icon={FileText}
              title="No subjects found"
              description={searchQuery ? "No subjects match your search. Try a different search term." : "Create your first subject to build your curriculum."}
              action={searchQuery ? undefined : { label: "Add Subject", onClick: () => setIsDialogOpen(true) }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
