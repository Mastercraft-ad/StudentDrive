import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { CardSkeleton } from "@/components/loading-skeleton";
import {
  Plus,
  FileText,
  Download,
  Search,
  Edit,
  Trash2,
  File,
  Image,
  Video,
  FileSpreadsheet,
  Presentation,
  Upload,
  Link,
  Eye,
  Globe,
  Lock,
} from "lucide-react";
import type { SchoolMaterial, SchoolSubject, SchoolClass } from "@shared/schema";

interface CurrentUser {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    classId?: string;
  };
  school: {
    id: string;
    name: string;
  };
}

export default function ResourcesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [editingMaterial, setEditingMaterial] = useState<SchoolMaterial | null>(null);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fileUrl: "",
    fileType: "pdf",
    subjectId: "",
    classId: "",
    isPublic: true,
  });

  const { data: currentUser } = useQuery<CurrentUser>({
    queryKey: ["/api/school/me"],
  });

  const canManageResources = currentUser?.user?.role === "school_admin" || currentUser?.user?.role === "teacher";
  const isStudent = currentUser?.user?.role === "school_student";
  const userClassId = currentUser?.user?.classId;

  const { data: materials, isLoading, error, refetch } = useQuery<SchoolMaterial[]>({
    queryKey: ["/api/school/materials"],
  });

  const { data: subjects } = useQuery<SchoolSubject[]>({
    queryKey: ["/api/school/subjects"],
  });

  const { data: classes } = useQuery<SchoolClass[]>({
    queryKey: ["/api/school/classes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/school/materials", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/materials"] });
      toast({ title: "Resource added successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add resource", description: error.message, variant: "destructive" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formDataToSend: FormData) => {
      const response = await fetch("/api/school/materials/upload", {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/materials"] });
      toast({ title: "Resource uploaded successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to upload resource", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return apiRequest("PATCH", `/api/school/materials/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/materials"] });
      toast({ title: "Resource updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update resource", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/school/materials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/materials"] });
      toast({ title: "Resource deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete resource", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", fileUrl: "", fileType: "pdf", subjectId: "", classId: "", isPublic: true });
    setEditingMaterial(null);
    setSelectedFile(null);
    setUploadMode("file");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (material: SchoolMaterial) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: material.description || "",
      fileUrl: material.fileUrl,
      fileType: material.fileType || "pdf",
      subjectId: material.subjectId || "",
      classId: material.classId || "",
      isPublic: material.isPublic,
    });
    setUploadMode("url");
    setIsDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      if (editingMaterial) {
        updateMutation.mutate({ id: editingMaterial.id, data: formData });
      } else if (uploadMode === "file" && selectedFile) {
        const formDataToSend = new FormData();
        formDataToSend.append("file", selectedFile);
        formDataToSend.append("title", formData.title);
        formDataToSend.append("description", formData.description);
        if (formData.subjectId) formDataToSend.append("subjectId", formData.subjectId);
        if (formData.classId) formDataToSend.append("classId", formData.classId);
        formDataToSend.append("isPublic", String(formData.isPublic));
        uploadMutation.mutate(formDataToSend);
      } else if (uploadMode === "url" && formData.fileUrl) {
        createMutation.mutate(formData);
      } else {
        toast({ title: "Please select a file or enter a URL", variant: "destructive" });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (material: SchoolMaterial) => {
    try {
      await apiRequest("POST", `/api/school/materials/${material.id}/download`);
    } catch (error) {
      console.error("Failed to track download:", error);
    }
    window.open(material.fileUrl, "_blank");
  };

  const getFileIcon = (fileType: string | null) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="h-8 w-8 text-red-600" />;
      case "doc":
      case "docx":
        return <File className="h-8 w-8 text-blue-600" />;
      case "xls":
      case "xlsx":
        return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
      case "ppt":
      case "pptx":
        return <Presentation className="h-8 w-8 text-orange-600" />;
      case "video":
        return <Video className="h-8 w-8 text-purple-600" />;
      case "image":
        return <Image className="h-8 w-8 text-pink-600" />;
      default:
        return <File className="h-8 w-8 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getSubjectName = (id: string | null) => {
    if (!id) return "General";
    return subjects?.find((s) => s.id === id)?.name || "Unknown";
  };

  const getClassName = (id: string | null) => {
    if (!id) return null;
    return classes?.find((c) => c.id === id)?.name || null;
  };

  const filteredMaterials = materials?.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === "all" || m.subjectId === filterSubject;
    const matchesClass = !isStudent || !m.classId || m.classId === userClassId;
    return matchesSearch && matchesSubject && matchesClass;
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Resources"
          description={canManageResources 
            ? "Manage school learning materials and documents" 
            : "Browse and download school learning materials"}
          breadcrumbs={[
            { label: "Dashboard", href: "/school/dashboard" },
            { label: "Resources" }
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Resources"
          description={canManageResources 
            ? "Manage school learning materials and documents" 
            : "Browse and download school learning materials"}
          breadcrumbs={[
            { label: "Dashboard", href: "/school/dashboard" },
            { label: "Resources" }
          ]}
        />
        <ErrorState 
          message="Failed to load resources. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Resources"
        description={canManageResources 
          ? "Manage school learning materials and documents" 
          : "Browse and download school learning materials"}
        breadcrumbs={[
          { label: "Dashboard", href: "/school/dashboard" },
          { label: "Resources" }
        ]}
        actions={
          canManageResources ? (
            <Button data-testid="button-add-resource" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Resource</span>
              <span className="sm:hidden">Add</span>
            </Button>
          ) : undefined
        }
      />

      {canManageResources && (
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMaterial ? "Edit Resource" : "Add Resource"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingMaterial && (
                <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "file" | "url")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      External URL
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="file" className="mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="file">Select File</Label>
                      <Input
                        id="file"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip"
                        data-testid="input-resource-file"
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </p>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="url" className="mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="fileUrl">File URL</Label>
                      <Input
                        id="fileUrl"
                        value={formData.fileUrl}
                        onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                        placeholder="https://example.com/file.pdf"
                        data-testid="input-resource-url"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {editingMaterial && (
                <div className="space-y-2">
                  <Label htmlFor="fileUrl">File URL</Label>
                  <Input
                    id="fileUrl"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    placeholder="https://example.com/file.pdf"
                    required
                    data-testid="input-resource-url"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Resource title"
                  required
                  data-testid="input-resource-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the resource"
                  rows={3}
                  data-testid="textarea-resource-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select
                    value={formData.subjectId}
                    onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                  >
                    <SelectTrigger data-testid="select-resource-subject">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">General</SelectItem>
                      {subjects?.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  >
                    <SelectTrigger data-testid="select-resource-class">
                      <SelectValue placeholder="All classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {classes?.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {uploadMode === "url" && !editingMaterial && (
                <div className="space-y-2">
                  <Label>File Type</Label>
                  <Select
                    value={formData.fileType}
                    onValueChange={(value) => setFormData({ ...formData, fileType: value })}
                  >
                    <SelectTrigger data-testid="select-resource-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="doc">Word Document</SelectItem>
                      <SelectItem value="xls">Excel Spreadsheet</SelectItem>
                      <SelectItem value="ppt">PowerPoint</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublic">Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.isPublic ? "Visible to all in school" : "Only visible to selected class"}
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                  data-testid="switch-resource-public"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUploading || uploadMutation.isPending || createMutation.isPending}
                  data-testid="button-save-resource"
                >
                  {isUploading || uploadMutation.isPending || createMutation.isPending ? "Saving..." : (editingMaterial ? "Update" : "Save")} Resource
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Resources ({materials?.length || 0})
            </CardTitle>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search-resources"
                />
              </div>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-40" data-testid="select-filter-subject">
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : filteredMaterials && filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="hover-elevate" data-testid={`card-resource-${material.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        {getFileIcon(material.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{material.title}</h3>
                        {material.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {material.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {getSubjectName(material.subjectId)}
                          </Badge>
                          {getClassName(material.classId) && (
                            <Badge variant="secondary" className="text-xs">
                              {getClassName(material.classId)}
                            </Badge>
                          )}
                          {material.isPublic ? (
                            <Globe className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {material.fileSize && (
                            <span>{formatFileSize(material.fileSize)}</span>
                          )}
                          {material.viewCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {material.viewCount}
                            </span>
                          )}
                          {material.downloadCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {material.downloadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(material)}
                        className="text-primary"
                        data-testid={`button-download-${material.id}`}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      {canManageResources && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(material)} data-testid={`button-edit-${material.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(material.id)} data-testid={`button-delete-${material.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No resources found</h3>
              <p className="text-muted-foreground">
                {canManageResources 
                  ? "Upload your first resource to get started." 
                  : "No learning materials have been shared yet. Check back later."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
