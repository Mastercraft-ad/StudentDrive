import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, Trash2, FileText, GraduationCap, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ModerationStatus = "pending" | "approved" | "rejected" | "all";

interface Material {
  id: string;
  title: string;
  description: string;
  materialType: string;
  uploadedById: string;
  moderationStatus: string;
  moderatedAt: string | null;
  moderationNotes: string | null;
  createdAt: string;
  level: number | null;
  semester: number | null;
  topic: string | null;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  createdById: string;
  moderationStatus: string;
  moderatedAt: string | null;
  moderationNotes: string | null;
  createdAt: string;
  timeLimit: number | null;
}

export default function ContentModeration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [materialStatus, setMaterialStatus] = useState<ModerationStatus>("pending");
  const [quizStatus, setQuizStatus] = useState<ModerationStatus>("pending");
  const [selectedItem, setSelectedItem] = useState<{ type: 'material' | 'quiz', id: string, title: string } | null>(null);
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | 'delete' | 'bulk' | null>(null);
  const [moderationNotes, setModerationNotes] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [selectedQuizzes, setSelectedQuizzes] = useState<Set<string>>(new Set());

  const { data: materials = [], isLoading: materialsLoading } = useQuery<Material[]>({
    queryKey: ["/api/admin/content/materials", materialStatus === "all" ? undefined : materialStatus],
    queryFn: async () => {
      const params = materialStatus !== "all" ? `?status=${materialStatus}` : "";
      const res = await fetch(`/api/admin/content/materials${params}`);
      if (!res.ok) throw new Error("Failed to fetch materials");
      return res.json();
    },
  });

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/admin/content/quizzes", quizStatus === "all" ? undefined : quizStatus],
    queryFn: async () => {
      const params = quizStatus !== "all" ? `?status=${quizStatus}` : "";
      const res = await fetch(`/api/admin/content/quizzes${params}`);
      if (!res.ok) throw new Error("Failed to fetch quizzes");
      return res.json();
    },
  });

  const moderateMaterialMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string, status: string, reason?: string }) => {
      const res = await fetch(`/api/admin/content/materials/${id}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      if (!res.ok) throw new Error("Failed to moderate material");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content/materials"] });
      toast({ title: "Success", description: "Material moderated successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to moderate material", variant: "destructive" });
    },
  });

  const moderateQuizMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string, status: string, reason?: string }) => {
      const res = await fetch(`/api/admin/content/quizzes/${id}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      if (!res.ok) throw new Error("Failed to moderate quiz");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content/quizzes"] });
      toast({ title: "Success", description: "Quiz moderated successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to moderate quiz", variant: "destructive" });
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/content/materials/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete material");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content/materials"] });
      toast({ title: "Success", description: "Material deleted successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete material", variant: "destructive" });
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/content/quizzes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete quiz");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content/quizzes"] });
      toast({ title: "Success", description: "Quiz deleted successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete quiz", variant: "destructive" });
    },
  });

  const bulkModerateMutation = useMutation({
    mutationFn: async ({ type, ids, status, reason }: { type: 'material' | 'quiz', ids: string[], status: string, reason?: string }) => {
      const promises = ids.map(async id => {
        const url = type === 'material' 
          ? `/api/admin/content/materials/${id}/moderate`
          : `/api/admin/content/quizzes/${id}/moderate`;
        const response = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, reason }),
        });
        if (!response.ok) {
          throw new Error(`Failed to moderate ${type} ${id}`);
        }
        return response.json();
      });
      await Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      if (variables.type === 'material') {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/content/materials"] });
        setSelectedMaterials(new Set());
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/content/quizzes"] });
        setSelectedQuizzes(new Set());
      }
      toast({ title: "Success", description: `${variables.ids.length} items moderated successfully` });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to moderate items", 
        variant: "destructive" 
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async ({ type, ids }: { type: 'material' | 'quiz', ids: string[] }) => {
      const promises = ids.map(async id => {
        const url = type === 'material' 
          ? `/api/admin/content/materials/${id}`
          : `/api/admin/content/quizzes/${id}`;
        const response = await fetch(url, { method: "DELETE" });
        if (!response.ok) {
          throw new Error(`Failed to delete ${type} ${id}`);
        }
        return response.json();
      });
      await Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      if (variables.type === 'material') {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/content/materials"] });
        setSelectedMaterials(new Set());
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/content/quizzes"] });
        setSelectedQuizzes(new Set());
      }
      toast({ title: "Success", description: `${variables.ids.length} items deleted successfully` });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete items", 
        variant: "destructive" 
      });
    },
  });

  const openDialog = (type: 'material' | 'quiz', id: string, title: string, action: 'approve' | 'reject' | 'delete') => {
    setSelectedItem({ type, id, title });
    setModerationAction(action);
    setModerationNotes("");
  };

  const openBulkDialog = (type: 'material' | 'quiz', action: 'approve' | 'reject' | 'delete') => {
    setSelectedItem({ type, id: '', title: '' });
    setModerationAction('bulk');
    setModerationNotes("");
  };

  const closeDialog = () => {
    setSelectedItem(null);
    setModerationAction(null);
    setModerationNotes("");
  };

  const handleConfirm = () => {
    if (!selectedItem) return;

    if (moderationAction === 'bulk') {
      const ids = selectedItem.type === 'material' 
        ? Array.from(selectedMaterials) 
        : Array.from(selectedQuizzes);
      
      if (bulkAction === 'delete') {
        bulkDeleteMutation.mutate({ type: selectedItem.type, ids });
      } else {
        const status = bulkAction === 'approve' ? 'approved' : 'rejected';
        bulkModerateMutation.mutate({ 
          type: selectedItem.type, 
          ids, 
          status,
          reason: moderationNotes || undefined 
        });
      }
    } else if (moderationAction === 'delete') {
      if (selectedItem.type === 'material') {
        deleteMaterialMutation.mutate(selectedItem.id);
      } else {
        deleteQuizMutation.mutate(selectedItem.id);
      }
    } else {
      if (selectedItem.type === 'material') {
        moderateMaterialMutation.mutate({ 
          id: selectedItem.id, 
          status: moderationAction === 'approve' ? 'approved' : 'rejected',
          reason: moderationNotes || undefined
        });
      } else {
        moderateQuizMutation.mutate({ 
          id: selectedItem.id, 
          status: moderationAction === 'approve' ? 'approved' : 'rejected',
          reason: moderationNotes || undefined
        });
      }
    }
  };

  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'delete'>('approve');

  const toggleMaterialSelection = (id: string) => {
    const newSet = new Set(selectedMaterials);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedMaterials(newSet);
  };

  const toggleQuizSelection = (id: string) => {
    const newSet = new Set(selectedQuizzes);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedQuizzes(newSet);
  };

  const selectAllMaterials = () => {
    if (selectedMaterials.size === materials.length) {
      setSelectedMaterials(new Set());
    } else {
      setSelectedMaterials(new Set(materials.map(m => m.id)));
    }
  };

  const selectAllQuizzes = () => {
    if (selectedQuizzes.size === quizzes.length) {
      setSelectedQuizzes(new Set());
    } else {
      setSelectedQuizzes(new Set(quizzes.map(q => q.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Content Moderation</h1>
        <p className="text-muted-foreground">Review and moderate learning materials and quizzes</p>
      </div>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="materials">
            <FileText className="w-4 h-4 mr-2" />
            Materials ({materials.length})
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            <GraduationCap className="w-4 h-4 mr-2" />
            Quizzes ({quizzes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Learning Materials</CardTitle>
                  <CardDescription>Review and moderate uploaded learning materials</CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                  {selectedMaterials.size > 0 && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50"
                        onClick={() => {
                          setBulkAction('approve');
                          openBulkDialog('material', 'approve');
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve ({selectedMaterials.size})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setBulkAction('reject');
                          openBulkDialog('material', 'reject');
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject ({selectedMaterials.size})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setBulkAction('delete');
                          openBulkDialog('material', 'delete');
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete ({selectedMaterials.size})
                      </Button>
                    </div>
                  )}
                  <Select value={materialStatus} onValueChange={(v) => setMaterialStatus(v as ModerationStatus)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {materialsLoading ? (
                <div className="text-center py-8">Loading materials...</div>
              ) : materials.length === 0 ? (
                <Alert>
                  <AlertDescription>No materials found for the selected status.</AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedMaterials.size === materials.length && materials.length > 0}
                          onCheckedChange={selectAllMaterials}
                        />
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedMaterials.has(material.id)}
                            onCheckedChange={() => toggleMaterialSelection(material.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{material.title}</TableCell>
                        <TableCell><Badge variant="secondary">{material.materialType}</Badge></TableCell>
                        <TableCell>{material.level ? `Level ${material.level}` : '-'}</TableCell>
                        <TableCell>{getStatusBadge(material.moderationStatus)}</TableCell>
                        <TableCell>{new Date(material.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {material.moderationStatus === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:bg-green-50"
                                  onClick={() => openDialog('material', material.id, material.title, 'approve')}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => openDialog('material', material.id, material.title, 'reject')}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => openDialog('material', material.id, material.title, 'delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quizzes</CardTitle>
                  <CardDescription>Review and moderate created quizzes</CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                  {selectedQuizzes.size > 0 && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50"
                        onClick={() => {
                          setBulkAction('approve');
                          openBulkDialog('quiz', 'approve');
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve ({selectedQuizzes.size})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setBulkAction('reject');
                          openBulkDialog('quiz', 'reject');
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject ({selectedQuizzes.size})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setBulkAction('delete');
                          openBulkDialog('quiz', 'delete');
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete ({selectedQuizzes.size})
                      </Button>
                    </div>
                  )}
                  <Select value={quizStatus} onValueChange={(v) => setQuizStatus(v as ModerationStatus)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {quizzesLoading ? (
                <div className="text-center py-8">Loading quizzes...</div>
              ) : quizzes.length === 0 ? (
                <Alert>
                  <AlertDescription>No quizzes found for the selected status.</AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedQuizzes.size === quizzes.length && quizzes.length > 0}
                          onCheckedChange={selectAllQuizzes}
                        />
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Time Limit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizzes.map((quiz) => (
                      <TableRow key={quiz.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedQuizzes.has(quiz.id)}
                            onCheckedChange={() => toggleQuizSelection(quiz.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{quiz.title}</TableCell>
                        <TableCell>{quiz.timeLimit ? `${quiz.timeLimit} mins` : 'No limit'}</TableCell>
                        <TableCell>{getStatusBadge(quiz.moderationStatus)}</TableCell>
                        <TableCell>{new Date(quiz.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {quiz.moderationStatus === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:bg-green-50"
                                  onClick={() => openDialog('quiz', quiz.id, quiz.title, 'approve')}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => openDialog('quiz', quiz.id, quiz.title, 'reject')}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => openDialog('quiz', quiz.id, quiz.title, 'delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderationAction === 'bulk'
                ? `Bulk ${bulkAction === 'delete' ? 'Delete' : bulkAction === 'approve' ? 'Approve' : 'Reject'} ${selectedItem?.type === 'material' ? 'Materials' : 'Quizzes'}`
                : `${moderationAction === 'delete' ? 'Delete' : moderationAction === 'approve' ? 'Approve' : 'Reject'} ${selectedItem?.type === 'material' ? 'Material' : 'Quiz'}`
              }
            </DialogTitle>
            <DialogDescription>
              {moderationAction === 'bulk'
                ? `Are you sure you want to ${bulkAction} ${selectedItem?.type === 'material' ? selectedMaterials.size : selectedQuizzes.size} items?`
                : `Are you sure you want to ${moderationAction} "${selectedItem?.title}"?`
              }
              {(moderationAction === 'delete' || bulkAction === 'delete') && ' This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          {(moderationAction === 'reject' || (moderationAction === 'bulk' && bulkAction === 'reject')) && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for rejection (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this content is being rejected..."
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button 
              onClick={handleConfirm}
              variant={(moderationAction === 'delete' || moderationAction === 'reject' || bulkAction === 'delete' || bulkAction === 'reject') ? 'destructive' : 'default'}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
