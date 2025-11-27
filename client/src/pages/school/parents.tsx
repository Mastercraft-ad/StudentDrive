import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Users, Edit, Trash2, Search, UserPlus, Link, Unlink, GraduationCap } from "lucide-react";
import type { SchoolUser, ParentStudentLink } from "@shared/schema";

interface ParentWithStudents extends SchoolUser {
  linkedStudents?: Array<SchoolUser & { relationship: string }>;
}

export default function ParentsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<SchoolUser | null>(null);
  const [linkingParent, setLinkingParent] = useState<SchoolUser | null>(null);
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
    occupation: "",
    relationship: "",
  });

  const [linkFormData, setLinkFormData] = useState({
    studentId: "",
    relationship: "parent",
  });

  const { data: parents, isLoading } = useQuery<SchoolUser[]>({
    queryKey: ["/api/school/users", { role: "parent" }],
  });

  const { data: students } = useQuery<SchoolUser[]>({
    queryKey: ["/api/school/users", { role: "student" }],
  });

  const { data: parentsWithLinks } = useQuery<ParentWithStudents[]>({
    queryKey: ["/api/school/parents-with-students"],
    enabled: !!parents && parents.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/school/users", {
        ...data,
        role: "parent",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/school/parents-with-students"] });
      toast({ title: "Parent added successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add parent", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return apiRequest("PATCH", `/api/school/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/school/parents-with-students"] });
      toast({ title: "Parent updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update parent", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/school/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/school/parents-with-students"] });
      toast({ title: "Parent removed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove parent", description: error.message, variant: "destructive" });
    },
  });

  const linkStudentMutation = useMutation({
    mutationFn: async (data: { parentId: string; studentId: string; relationship: string }) => {
      return apiRequest("POST", "/api/school/parent-student-link", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/parents-with-students"] });
      toast({ title: "Student linked successfully" });
      setLinkFormData({ studentId: "", relationship: "parent" });
      setIsLinkDialogOpen(false);
      setLinkingParent(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to link student", description: error.message, variant: "destructive" });
    },
  });

  const unlinkStudentMutation = useMutation({
    mutationFn: async (data: { parentId: string; studentId: string }) => {
      return apiRequest("DELETE", `/api/school/parent-student-link/${data.parentId}/${data.studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/parents-with-students"] });
      toast({ title: "Student unlinked successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to unlink student", description: error.message, variant: "destructive" });
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
      occupation: "",
      relationship: "",
    });
    setEditingParent(null);
  };

  const handleEdit = (parent: SchoolUser) => {
    setEditingParent(parent);
    setFormData({
      email: parent.email,
      password: "",
      firstName: parent.firstName,
      lastName: parent.lastName,
      middleName: parent.middleName || "",
      gender: parent.gender || "",
      phone: parent.phone || "",
      address: parent.address || "",
      occupation: parent.occupation || "",
      relationship: parent.relationship || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingParent) {
      const { password, ...updateData } = formData;
      updateMutation.mutate({ id: editingParent.id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleLinkStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkingParent && linkFormData.studentId) {
      linkStudentMutation.mutate({
        parentId: linkingParent.id,
        studentId: linkFormData.studentId,
        relationship: linkFormData.relationship,
      });
    }
  };

  const openLinkDialog = (parent: SchoolUser) => {
    setLinkingParent(parent);
    setLinkFormData({ studentId: "", relationship: "parent" });
    setIsLinkDialogOpen(true);
  };

  const getLinkedStudents = (parentId: string) => {
    const parent = parentsWithLinks?.find(p => p.id === parentId);
    return parent?.linkedStudents || [];
  };

  const getAvailableStudents = (parentId: string) => {
    const linkedStudentIds = getLinkedStudents(parentId).map(s => s.id);
    return students?.filter(s => !linkedStudentIds.includes(s.id)) || [];
  };

  const filteredParents = parents?.filter((p) =>
    p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Parents / Guardians</h1>
          <p className="text-muted-foreground">Manage parent accounts and link them to students</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-parent">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Parent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingParent ? "Edit Parent" : "Add New Parent"}</DialogTitle>
              <DialogDescription>
                {editingParent ? "Update parent information" : "Create a new parent account"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    data-testid="input-parent-firstname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    data-testid="input-parent-middlename"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    data-testid="input-parent-lastname"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="input-parent-email"
                  />
                </div>
                {!editingParent && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingParent}
                      data-testid="input-parent-password"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger data-testid="select-parent-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Select
                    value={formData.relationship}
                    onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                  >
                    <SelectTrigger data-testid="select-parent-relationship">
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
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    data-testid="input-parent-occupation"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="input-parent-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    data-testid="input-parent-address"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-parent">
                  {editingParent ? "Update" : "Add"} Parent
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isLinkDialogOpen} onOpenChange={(open) => { setIsLinkDialogOpen(open); if (!open) setLinkingParent(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Student to {linkingParent?.firstName} {linkingParent?.lastName}</DialogTitle>
            <DialogDescription>
              Select a student to link to this parent account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLinkStudent} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select
                value={linkFormData.studentId}
                onValueChange={(value) => setLinkFormData({ ...linkFormData, studentId: value })}
              >
                <SelectTrigger data-testid="select-link-student">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {linkingParent && getAvailableStudents(linkingParent.id).map((student) => (
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
                <SelectTrigger data-testid="select-link-relationship">
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!linkFormData.studentId} data-testid="button-confirm-link">
                <Link className="h-4 w-4 mr-2" />
                Link Student
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
              All Parents ({parents?.length || 0})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-parents"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredParents && filteredParents.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-2">
              {filteredParents.map((parent) => {
                const linkedStudents = getLinkedStudents(parent.id);
                return (
                  <AccordionItem key={parent.id} value={parent.id} className="border rounded-lg px-4" data-testid={`row-parent-${parent.id}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="font-medium">
                              {parent.firstName} {parent.middleName ? `${parent.middleName} ` : ""}{parent.lastName}
                            </span>
                            <p className="text-sm text-muted-foreground">{parent.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="capitalize">
                            {parent.relationship || "Parent"}
                          </Badge>
                          <Badge variant={linkedStudents.length > 0 ? "default" : "secondary"}>
                            {linkedStudents.length} {linkedStudents.length === 1 ? "child" : "children"}
                          </Badge>
                          <Badge variant={parent.isActive ? "default" : "secondary"}>
                            {parent.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-2">
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Phone:</span>
                            <p className="font-medium">{parent.phone || "-"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Occupation:</span>
                            <p className="font-medium">{parent.occupation || "-"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Address:</span>
                            <p className="font-medium">{parent.address || "-"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Gender:</span>
                            <p className="font-medium capitalize">{parent.gender || "-"}</p>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              Linked Students
                            </h4>
                            <Button size="sm" variant="outline" onClick={() => openLinkDialog(parent)} data-testid={`button-link-student-${parent.id}`}>
                              <Link className="h-4 w-4 mr-2" />
                              Link Student
                            </Button>
                          </div>
                          {linkedStudents.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Admission No.</TableHead>
                                  <TableHead>Relationship</TableHead>
                                  <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {linkedStudents.map((student) => (
                                  <TableRow key={student.id}>
                                    <TableCell>{student.firstName} {student.lastName}</TableCell>
                                    <TableCell>{student.admissionNumber || "-"}</TableCell>
                                    <TableCell className="capitalize">{student.relationship}</TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => unlinkStudentMutation.mutate({ parentId: parent.id, studentId: student.id })}
                                        data-testid={`button-unlink-${student.id}`}
                                      >
                                        <Unlink className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No students linked yet. Click "Link Student" to connect this parent to their children.
                            </p>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(parent)} data-testid={`button-edit-parent-${parent.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(parent.id)} data-testid={`button-delete-parent-${parent.id}`}>
                            <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No parents found</h3>
              <p className="text-muted-foreground">Add your first parent to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
