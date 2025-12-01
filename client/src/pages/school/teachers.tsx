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
  DialogTrigger,
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
import { Users, Edit, Trash2, Search, UserPlus } from "lucide-react";
import type { SchoolUser } from "@shared/schema";

export default function TeachersPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<SchoolUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    middleName: "",
    gender: "",
    phone: "",
    address: "",
    employeeId: "",
    qualification: "",
    specialization: "",
    dateOfEmployment: "",
  });

  const { data: teachers, isLoading, error, refetch } = useQuery<SchoolUser[]>({
    queryKey: ["/api/school/users", { role: "teacher" }],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/school/users", {
        ...data,
        role: "teacher",
        dateOfEmployment: data.dateOfEmployment ? new Date(data.dateOfEmployment).toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/users"] });
      toast({ title: "Teacher added successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add teacher", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return apiRequest("PATCH", `/api/school/users/${id}`, {
        ...data,
        dateOfEmployment: data.dateOfEmployment ? new Date(data.dateOfEmployment).toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/users"] });
      toast({ title: "Teacher updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update teacher", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/school/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/users"] });
      toast({ title: "Teacher removed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove teacher", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      middleName: "",
      gender: "",
      phone: "",
      address: "",
      employeeId: "",
      qualification: "",
      specialization: "",
      dateOfEmployment: "",
    });
    setEditingTeacher(null);
  };

  const handleEdit = (teacher: SchoolUser) => {
    setEditingTeacher(teacher);
    setFormData({
      email: teacher.email,
      password: "",
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      middleName: teacher.middleName || "",
      gender: teacher.gender || "",
      phone: teacher.phone || "",
      address: teacher.address || "",
      employeeId: teacher.employeeId || "",
      qualification: teacher.qualification || "",
      specialization: teacher.specialization || "",
      dateOfEmployment: teacher.dateOfEmployment
        ? new Date(teacher.dateOfEmployment).toISOString().split("T")[0]
        : "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      const { password, ...updateData } = formData;
      updateMutation.mutate({ id: editingTeacher.id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredTeachers = teachers?.filter((t) =>
    t.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Teachers"
          description="Manage teaching staff and assignments"
          breadcrumbs={[
            { label: "Dashboard", href: "/school/dashboard" },
            { label: "People", href: "/school/teachers" },
            { label: "Teachers" }
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
          title="Teachers"
          description="Manage teaching staff and assignments"
          breadcrumbs={[
            { label: "Dashboard", href: "/school/dashboard" },
            { label: "People", href: "/school/teachers" },
            { label: "Teachers" }
          ]}
        />
        <ErrorState 
          message="Failed to load teachers. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Teachers"
        description="Manage teaching staff and assignments"
        breadcrumbs={[
          { label: "Dashboard", href: "/school/dashboard" },
          { label: "People", href: "/school/teachers" },
          { label: "Teachers" }
        ]}
        actions={
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-teacher">
            <UserPlus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Teacher</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    data-testid="input-teacher-firstname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    data-testid="input-teacher-middlename"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    data-testid="input-teacher-lastname"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="input-teacher-email"
                  />
                </div>
                {!editingTeacher && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingTeacher}
                      data-testid="input-teacher-password"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    data-testid="input-teacher-employeeid"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger data-testid="select-teacher-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfEmployment">Date of Employment</Label>
                  <Input
                    id="dateOfEmployment"
                    type="date"
                    value={formData.dateOfEmployment}
                    onChange={(e) => setFormData({ ...formData, dateOfEmployment: e.target.value })}
                    data-testid="input-teacher-employment"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g., B.Ed, M.Sc"
                    data-testid="input-teacher-qualification"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g., Mathematics, English"
                    data-testid="input-teacher-specialization"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="input-teacher-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    data-testid="input-teacher-address"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-teacher">
                  {editingTeacher ? "Update" : "Add"} Teacher
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Teachers ({teachers?.length || 0})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-teachers"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTeachers && filteredTeachers.length > 0 ? (
            <ScrollArea className="w-full">
              <div className="min-w-[700px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Employee ID</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden lg:table-cell">Qualification</TableHead>
                      <TableHead className="hidden lg:table-cell">Specialization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id} data-testid={`row-teacher-${teacher.id}`}>
                        <TableCell className="font-medium">
                          <div>
                            {teacher.firstName} {teacher.middleName ? `${teacher.middleName} ` : ""}{teacher.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground md:hidden">{teacher.email}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{teacher.employeeId || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">{teacher.email}</TableCell>
                        <TableCell className="hidden lg:table-cell">{teacher.qualification || "-"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{teacher.specialization || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={teacher.isActive ? "default" : "secondary"}>
                            {teacher.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(teacher)} data-testid={`button-edit-teacher-${teacher.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(teacher.id)} data-testid={`button-delete-teacher-${teacher.id}`}>
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
              icon={Users}
              title="No teachers found"
              description={searchQuery ? "No teachers match your search. Try a different search term." : "Add your first teacher to get started with managing your teaching staff."}
              action={searchQuery ? undefined : { label: "Add Teacher", onClick: () => setIsDialogOpen(true) }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
