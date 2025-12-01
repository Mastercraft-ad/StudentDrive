import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/loading-skeleton";
import { Plus, Users, BookOpen, Edit, Trash2, Search } from "lucide-react";
import type { SchoolClass, SchoolUser } from "@shared/schema";

export default function ClassesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    level: "",
    section: "",
    capacity: "",
    classTeacherId: "",
    description: "",
  });

  const { data: classes, isLoading, error, refetch } = useQuery<SchoolClass[]>({
    queryKey: ["/api/school/classes"],
  });

  const { data: teachers } = useQuery<SchoolUser[]>({
    queryKey: ["/api/school/users", { role: "teacher" }],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/school/classes", {
        ...data,
        level: data.level ? parseInt(data.level) : null,
        capacity: data.capacity ? parseInt(data.capacity) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/classes"] });
      toast({ title: "Class created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create class", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return apiRequest("PATCH", `/api/school/classes/${id}`, {
        ...data,
        level: data.level ? parseInt(data.level) : null,
        capacity: data.capacity ? parseInt(data.capacity) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/classes"] });
      toast({ title: "Class updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update class", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/school/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/classes"] });
      toast({ title: "Class deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete class", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", level: "", section: "", capacity: "", classTeacherId: "", description: "" });
    setEditingClass(null);
  };

  const handleEdit = (classItem: SchoolClass) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      level: classItem.level?.toString() || "",
      section: classItem.section || "",
      capacity: classItem.capacity?.toString() || "",
      classTeacherId: classItem.classTeacherId || "",
      description: classItem.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredClasses = classes?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.section?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Classes"
          description="Manage your school classes and sections"
          breadcrumbs={[
            { label: "Dashboard", href: "/school/dashboard" },
            { label: "Academic", href: "/school/classes" },
            { label: "Classes" }
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
          title="Classes"
          description="Manage your school classes and sections"
          breadcrumbs={[
            { label: "Dashboard", href: "/school/dashboard" },
            { label: "Academic", href: "/school/classes" },
            { label: "Classes" }
          ]}
        />
        <ErrorState 
          message="Failed to load classes. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Classes"
        description="Manage your school classes and sections"
        breadcrumbs={[
          { label: "Dashboard", href: "/school/dashboard" },
          { label: "Academic", href: "/school/classes" },
          { label: "Classes" }
        ]}
        actions={
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-class">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Class</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Class Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., JSS 1, SS 2"
                    required
                    data-testid="input-class-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="e.g., A, B, Science"
                    data-testid="input-class-section"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Level (Numeric)</Label>
                  <Input
                    id="level"
                    type="number"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    placeholder="e.g., 1, 2, 3"
                    data-testid="input-class-level"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Maximum students"
                    data-testid="input-class-capacity"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="classTeacher">Class Teacher</Label>
                <Select
                  value={formData.classTeacherId}
                  onValueChange={(value) => setFormData({ ...formData, classTeacherId: value })}
                >
                  <SelectTrigger data-testid="select-class-teacher">
                    <SelectValue placeholder="Select a teacher" />
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
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  data-testid="input-class-description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-class">
                  {editingClass ? "Update" : "Create"} Class
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              All Classes ({classes?.length || 0})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-classes"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClasses && filteredClasses.length > 0 ? (
            <ScrollArea className="w-full">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Section</TableHead>
                      <TableHead className="hidden md:table-cell">Level</TableHead>
                      <TableHead className="hidden md:table-cell">Capacity</TableHead>
                      <TableHead className="hidden sm:table-cell">Students</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClasses.map((classItem) => (
                      <TableRow key={classItem.id} data-testid={`row-class-${classItem.id}`}>
                        <TableCell className="font-medium">
                          <div>{classItem.name}</div>
                          <div className="text-xs text-muted-foreground sm:hidden">
                            {classItem.section && `Section ${classItem.section}`}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{classItem.section || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">{classItem.level || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">{classItem.capacity || "-"}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>0</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={classItem.isActive ? "default" : "secondary"}>
                            {classItem.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(classItem)}
                              data-testid={`button-edit-class-${classItem.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(classItem.id)}
                              data-testid={`button-delete-class-${classItem.id}`}
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
              icon={BookOpen}
              title="No classes found"
              description={searchQuery ? "No classes match your search. Try a different search term." : "Create your first class to organize your students and curriculum."}
              action={searchQuery ? undefined : { label: "Add Class", onClick: () => setIsDialogOpen(true) }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
