import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Calendar, Edit, Trash2, Check } from "lucide-react";
import type { AcademicTerm } from "@shared/schema";

export default function TermsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<AcademicTerm | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sessionYear: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
  });

  const { data: terms, isLoading } = useQuery<AcademicTerm[]>({
    queryKey: ["/api/school/terms"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/school/terms", {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/terms"] });
      toast({ title: "Academic term created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create term", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return apiRequest("PATCH", `/api/school/terms/${id}`, {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/terms"] });
      toast({ title: "Academic term updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update term", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/school/terms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/terms"] });
      toast({ title: "Academic term deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete term", description: error.message, variant: "destructive" });
    },
  });

  const setCurrentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/school/terms/${id}/set-current`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/terms"] });
      toast({ title: "Current term updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to set current term", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", sessionYear: "", startDate: "", endDate: "", isCurrent: false });
    setEditingTerm(null);
  };

  const handleEdit = (term: AcademicTerm) => {
    setEditingTerm(term);
    setFormData({
      name: term.name,
      sessionYear: term.sessionYear,
      startDate: new Date(term.startDate).toISOString().split("T")[0],
      endDate: new Date(term.endDate).toISOString().split("T")[0],
      isCurrent: term.isCurrent,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTerm) {
      updateMutation.mutate({ id: editingTerm.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Academic Terms</h1>
          <p className="text-muted-foreground">Manage academic sessions and terms</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-term">
              <Plus className="h-4 w-4 mr-2" />
              Add Term
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTerm ? "Edit Term" : "Add New Academic Term"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Term Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., First Term"
                    required
                    data-testid="input-term-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionYear">Session Year</Label>
                  <Input
                    id="sessionYear"
                    value={formData.sessionYear}
                    onChange={(e) => setFormData({ ...formData, sessionYear: e.target.value })}
                    placeholder="e.g., 2024/2025"
                    required
                    data-testid="input-term-session"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    data-testid="input-term-start"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    data-testid="input-term-end"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isCurrent"
                  checked={formData.isCurrent}
                  onCheckedChange={(checked) => setFormData({ ...formData, isCurrent: checked })}
                  data-testid="switch-term-current"
                />
                <Label htmlFor="isCurrent">Set as current term</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-term">
                  {editingTerm ? "Update" : "Create"} Term
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            All Terms ({terms?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {terms && terms.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term Name</TableHead>
                  <TableHead>Session Year</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terms.map((term) => (
                  <TableRow key={term.id} data-testid={`row-term-${term.id}`}>
                    <TableCell className="font-medium">{term.name}</TableCell>
                    <TableCell>{term.sessionYear}</TableCell>
                    <TableCell>{formatDate(term.startDate)}</TableCell>
                    <TableCell>{formatDate(term.endDate)}</TableCell>
                    <TableCell>
                      {term.isCurrent ? (
                        <Badge className="bg-green-600">Current</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!term.isCurrent && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentMutation.mutate(term.id)}
                            title="Set as current term"
                            data-testid={`button-set-current-${term.id}`}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(term)}
                          data-testid={`button-edit-term-${term.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(term.id)}
                          data-testid={`button-delete-term-${term.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No academic terms found</h3>
              <p className="text-muted-foreground">Create your first academic term to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
