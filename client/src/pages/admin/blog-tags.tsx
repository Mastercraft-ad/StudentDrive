import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, Tag, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BlogTag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  usageCount: number;
  createdAt: string;
}

export default function BlogTags() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>("");
  const [newTagName, setNewTagName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const { data: tags = [], isLoading } = useQuery<BlogTag[]>({
    queryKey: ["/api/blog/tags"],
  });

  const filteredTags = tags.filter((tag) => {
    const matchesSearch = searchQuery === "" || tag.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "published" && tag.usageCount > 0) ||
      (filterStatus === "unused" && tag.usageCount === 0);
    return matchesSearch && matchesStatus;
  });

  const createTagMutation = useMutation({
    mutationFn: async (name: string) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const response = await fetch("/api/admin/blog/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create tag");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/tags"] });
      setNewTagName("");
      toast({ title: "Success", description: "Tag created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create tag", variant: "destructive" });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/blog/tags/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete tag");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/tags"] });
      setDeleteConfirmId(null);
      toast({ title: "Success", description: "Tag deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete tag", variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map(async id => {
        const response = await fetch(`/api/admin/blog/tags/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!response.ok) throw new Error(`Failed to delete tag ${id}`);
      });
      await Promise.all(promises);
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/tags"] });
      setSelectedTags(new Set());
      toast({ title: "Success", description: `${ids.length} tags deleted` });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete some tags",
        variant: "destructive"
      });
    },
  });

  const handleAddTag = () => {
    if (newTagName.trim()) {
      createTagMutation.mutate(newTagName.trim());
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
  };

  const toggleTagSelection = (id: string) => {
    const newSet = new Set(selectedTags);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTags(newSet);
  };

  const selectAllTags = () => {
    if (selectedTags.size === filteredTags.length) {
      setSelectedTags(new Set());
    } else {
      setSelectedTags(new Set(filteredTags.map(t => t.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tags...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Blog Tags</h1>
          <p className="text-muted-foreground mt-2">
            Manage tags for blog posts
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Add New Tag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Enter tag name (e.g., AI, Laravel Boost, PHP)"
                />
                <Button
                  onClick={handleAddTag}
                  disabled={!newTagName.trim() || createTagMutation.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create
                </Button>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="unused">Unused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedTags.size > 0 && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedTags.size} selected</span>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => bulkDeleteMutation.mutate(Array.from(selectedTags))}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="border-b">
                <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm bg-muted/50">
                  <div className="col-span-1">
                    <Checkbox
                      checked={selectedTags.size === filteredTags.length && filteredTags.length > 0}
                      onCheckedChange={selectAllTags}
                    />
                  </div>
                  <div className="col-span-1">ID</div>
                  <div className="col-span-4">NAME</div>
                  <div className="col-span-3">CREATED AT</div>
                  <div className="col-span-2">STATUS</div>
                  <div className="col-span-1">OPERATIONS</div>
                </div>
              </div>

              {filteredTags.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {searchQuery || filterStatus !== "all"
                      ? "No tags match your filters"
                      : "No tags yet. Create your first tag above."}
                  </p>
                </div>
              ) : (
                <div>
                  {filteredTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-muted/30 transition-colors items-center"
                    >
                      <div className="col-span-1">
                        <Checkbox
                          checked={selectedTags.has(tag.id)}
                          onCheckedChange={() => toggleTagSelection(tag.id)}
                        />
                      </div>
                      <div className="col-span-1 text-sm text-muted-foreground">
                        {parseInt(tag.id.replace(/\D/g, '').slice(-2)) || tag.id.slice(-2)}
                      </div>
                      <div className="col-span-4">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-primary">{tag.name}</span>
                          {tag.usageCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({tag.usageCount})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="col-span-3 text-sm text-muted-foreground">
                        {format(new Date(tag.createdAt), "yyyy-MM-dd")}
                      </div>
                      <div className="col-span-2">
                        <Badge
                          variant={tag.usageCount > 0 ? "default" : "secondary"}
                          className={tag.usageCount > 0 ? "bg-green-500" : ""}
                        >
                          {tag.usageCount > 0 ? "Published" : "Unused"}
                        </Badge>
                      </div>
                      <div className="col-span-1">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(tag.id, tag.name)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredTags.length > 0 && (
                <div className="p-4 text-sm text-muted-foreground border-t">
                  Show from 1 to {filteredTags.length} in {filteredTags.length} records
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Tag?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteConfirmName}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && deleteTagMutation.mutate(deleteConfirmId)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
