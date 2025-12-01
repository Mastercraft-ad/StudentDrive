import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { CardSkeleton } from "@/components/loading-skeleton";
import { Plus, Bell, Megaphone, Pin, Edit, Trash2, Eye, Calendar, Users } from "lucide-react";
import type { SchoolAnnouncement, SchoolClass } from "@shared/schema";

interface CurrentUser {
  user: {
    id: string;
    role: string;
  };
}

export default function AnnouncementsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<SchoolAnnouncement | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "general",
    targetAudience: "all",
    targetClassIds: [] as string[],
    isPinned: false,
    isPublished: true,
  });

  const { data: currentUser } = useQuery<CurrentUser>({
    queryKey: ["/api/school/auth/me"],
  });

  const { data: announcements, isLoading, error, refetch } = useQuery<SchoolAnnouncement[]>({
    queryKey: ["/api/school/announcements"],
  });

  const { data: classes } = useQuery<SchoolClass[]>({
    queryKey: ["/api/school/classes"],
  });

  const isAdmin = currentUser?.user?.role === "admin" || currentUser?.user?.role === "school_admin";

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/school/announcements", {
        ...data,
        targetClassIds: data.targetAudience === "classes" ? data.targetClassIds : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/announcements"] });
      toast({ title: "Announcement created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create announcement", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return apiRequest("PATCH", `/api/school/announcements/${id}`, {
        ...data,
        targetClassIds: data.targetAudience === "classes" ? data.targetClassIds : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/announcements"] });
      toast({ title: "Announcement updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update announcement", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/school/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/announcements"] });
      toast({ title: "Announcement deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete announcement", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", content: "", type: "general", targetAudience: "all", targetClassIds: [], isPinned: false, isPublished: true });
    setEditingAnnouncement(null);
  };

  const handleEdit = (announcement: SchoolAnnouncement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      targetAudience: announcement.targetClassIds && announcement.targetClassIds.length > 0 ? "classes" : announcement.targetAudience,
      targetClassIds: announcement.targetClassIds || [],
      isPinned: announcement.isPinned,
      isPublished: announcement.isPublished,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.targetAudience === "classes" && formData.targetClassIds.length === 0) {
      toast({ title: "Please select at least one class", variant: "destructive" });
      return;
    }
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleClassToggle = (classId: string) => {
    setFormData((prev) => ({
      ...prev,
      targetClassIds: prev.targetClassIds.includes(classId)
        ? prev.targetClassIds.filter((id) => id !== classId)
        : [...prev.targetClassIds, classId],
    }));
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "event":
        return <Badge className="bg-purple-600">Event</Badge>;
      case "holiday":
        return <Badge className="bg-green-600">Holiday</Badge>;
      default:
        return <Badge variant="secondary">General</Badge>;
    }
  };

  const getAudienceBadge = (announcement: SchoolAnnouncement) => {
    if (announcement.targetClassIds && announcement.targetClassIds.length > 0) {
      const classNames = announcement.targetClassIds
        .map((id) => classes?.find((c) => c.id === id)?.name)
        .filter(Boolean)
        .slice(0, 2)
        .join(", ");
      const remaining = announcement.targetClassIds.length - 2;
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {classNames}{remaining > 0 && ` +${remaining}`}
        </Badge>
      );
    }
    switch (announcement.targetAudience) {
      case "students":
        return <Badge variant="outline">Students</Badge>;
      case "teachers":
        return <Badge variant="outline">Teachers</Badge>;
      case "parents":
        return <Badge variant="outline">Parents</Badge>;
      default:
        return <Badge variant="outline">All</Badge>;
    }
  };

  const pinnedAnnouncements = announcements?.filter((a) => a.isPinned && a.isPublished) || [];
  const regularAnnouncements = announcements?.filter((a) => !a.isPinned) || [];

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Announcements"
          description={isAdmin ? "Create and manage school announcements" : "View school announcements"}
          breadcrumbs={[
            { label: "Dashboard", href: "/school/dashboard" },
            { label: "Announcements" }
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton count={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Announcements"
          description={isAdmin ? "Create and manage school announcements" : "View school announcements"}
          breadcrumbs={[
            { label: "Dashboard", href: "/school/dashboard" },
            { label: "Announcements" }
          ]}
        />
        <ErrorState 
          message="Failed to load announcements. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Announcements"
        description={isAdmin ? "Create and manage school announcements" : "View school announcements"}
        breadcrumbs={[
          { label: "Dashboard", href: "/school/dashboard" },
          { label: "Announcements" }
        ]}
        actions={
          isAdmin ? (
            <Button data-testid="button-add-announcement" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">New Announcement</span>
              <span className="sm:hidden">New</span>
            </Button>
          ) : undefined
        }
      />

      {isAdmin && (
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAnnouncement ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Announcement title"
                    required
                    data-testid="input-announcement-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your announcement..."
                    rows={5}
                    required
                    data-testid="textarea-announcement-content"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger data-testid="select-announcement-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select
                      value={formData.targetAudience}
                      onValueChange={(value) => setFormData({ ...formData, targetAudience: value, targetClassIds: [] })}
                    >
                      <SelectTrigger data-testid="select-announcement-audience">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="students">Students Only</SelectItem>
                        <SelectItem value="teachers">Teachers Only</SelectItem>
                        <SelectItem value="parents">Parents Only</SelectItem>
                        <SelectItem value="classes">Specific Classes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formData.targetAudience === "classes" && (
                  <div className="space-y-2">
                    <Label>Select Classes</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                      {classes && classes.length > 0 ? (
                        classes.map((cls) => (
                          <div key={cls.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`class-${cls.id}`}
                              checked={formData.targetClassIds.includes(cls.id)}
                              onCheckedChange={() => handleClassToggle(cls.id)}
                              data-testid={`checkbox-class-${cls.id}`}
                            />
                            <Label htmlFor={`class-${cls.id}`} className="text-sm font-normal cursor-pointer">
                              {cls.name}{cls.section && ` (${cls.section})`}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No classes available</p>
                      )}
                    </div>
                    {formData.targetClassIds.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {formData.targetClassIds.length} class{formData.targetClassIds.length !== 1 && "es"} selected
                      </p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPinned"
                      checked={formData.isPinned}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked })}
                      data-testid="switch-announcement-pinned"
                    />
                    <Label htmlFor="isPinned">Pin announcement</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPublished"
                      checked={formData.isPublished}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                      data-testid="switch-announcement-published"
                    />
                    <Label htmlFor="isPublished">Publish immediately</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-announcement">
                    {editingAnnouncement ? "Update" : "Create"} Announcement
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Total Announcements</p>
                  <p className="text-2xl font-bold">{announcements?.length || 0}</p>
                </div>
                <Megaphone className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Pinned</p>
                  <p className="text-2xl font-bold">{pinnedAnnouncements.length}</p>
                </div>
                <Pin className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold">{announcements?.filter((a) => a.isPublished).length || 0}</p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {pinnedAnnouncements.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Pin className="h-5 w-5 text-orange-600" />
                Pinned Announcements
              </h2>
              <div className="space-y-4">
                {pinnedAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="border-l-4 border-l-orange-500" data-testid={`card-announcement-${announcement.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                          {getTypeBadge(announcement.type)}
                          {getAudienceBadge(announcement)}
                          {!announcement.isPublished && <Badge variant="outline">Draft</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(announcement.createdAt!).toLocaleDateString()}
                          </span>
                          {announcement.viewCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {announcement.viewCount} views
                            </span>
                          )}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(announcement)} data-testid={`button-edit-${announcement.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(announcement.id)} data-testid={`button-delete-${announcement.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">{announcement.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {isAdmin ? "All Announcements" : "Recent Announcements"}
            </h2>
            {regularAnnouncements.length > 0 ? (
              <div className="space-y-4">
                {regularAnnouncements.map((announcement) => (
                  <Card key={announcement.id} data-testid={`card-announcement-${announcement.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                          {getTypeBadge(announcement.type)}
                          {getAudienceBadge(announcement)}
                          {!announcement.isPublished && <Badge variant="outline">Draft</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(announcement.createdAt!).toLocaleDateString()}
                          </span>
                          {announcement.viewCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {announcement.viewCount} views
                            </span>
                          )}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(announcement)} data-testid={`button-edit-${announcement.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(announcement.id)} data-testid={`button-delete-${announcement.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">{announcement.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No announcements yet</h3>
                    <p className="text-muted-foreground">
                      {isAdmin 
                        ? "Create your first announcement to notify students, teachers, and parents."
                        : "Check back later for school announcements."
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
