import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Pencil, Trash2, CheckCircle, XCircle, Clock, Star, Search } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  tags: string[] | null;
  category: string | null;
  featured: boolean;
  commentsEnabled: boolean;
  readTime: number | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBlog() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/admin/blog/posts"],
  });

  const categories = [...new Set(posts.map(p => p.category).filter(Boolean))] as string[];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === "all" || post.category === filterCategory;
    
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "published" && post.published) ||
      (filterStatus === "draft" && !post.published) ||
      (filterStatus === "featured" && post.featured);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const response = await fetch(`/api/admin/blog/posts/${id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to update publish status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      toast({ title: "Success", description: "Post status updated" });
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const response = await fetch(`/api/admin/blog/posts/${id}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to update featured status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      toast({ title: "Success", description: "Featured status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/blog/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete blog post");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      setDeleteConfirmId(null);
      toast({ title: "Success", description: "Post deleted successfully" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map(async id => {
        const response = await fetch(`/api/admin/blog/posts/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Failed to delete post ${id}`);
        }
        return response.json();
      });
      await Promise.all(promises);
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      setSelectedPosts(new Set());
      toast({ title: "Success", description: `${ids.length} posts deleted` });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete some posts", 
        variant: "destructive" 
      });
    },
  });

  const bulkPublishMutation = useMutation({
    mutationFn: async ({ ids, published }: { ids: string[]; published: boolean }) => {
      const promises = ids.map(async id => {
        const response = await fetch(`/api/admin/blog/posts/${id}/publish`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published }),
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Failed to ${published ? 'publish' : 'unpublish'} post ${id}`);
        }
        return response.json();
      });
      await Promise.all(promises);
    },
    onSuccess: (_, { ids, published }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      setSelectedPosts(new Set());
      toast({ title: "Success", description: `${ids.length} posts ${published ? 'published' : 'unpublished'}` });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update some posts", 
        variant: "destructive" 
      });
    },
  });

  const handleTogglePublish = (post: BlogPost) => {
    publishMutation.mutate({ id: post.id, published: !post.published });
  };

  const handleToggleFeatured = (post: BlogPost) => {
    toggleFeaturedMutation.mutate({ id: post.id, featured: !post.featured });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const togglePostSelection = (id: string) => {
    const newSet = new Set(selectedPosts);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPosts(newSet);
  };

  const selectAllPosts = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filteredPosts.map(p => p.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading blog posts...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground">Manage your blog content</p>
        </div>
        <Button onClick={() => navigate("/admin/blog/new")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Post
        </Button>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search posts by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedPosts.size > 0 && (
        <div className="mb-4 p-4 bg-muted rounded-lg flex gap-2 items-center">
          <span className="text-sm font-medium">{selectedPosts.size} selected</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => bulkPublishMutation.mutate({ ids: Array.from(selectedPosts), published: true })}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Publish Selected
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => bulkPublishMutation.mutate({ ids: Array.from(selectedPosts), published: false })}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Unpublish Selected
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => bulkDeleteMutation.mutate(Array.from(selectedPosts))}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterCategory !== "all" || filterStatus !== "all"
                  ? "No posts match your filters"
                  : "No blog posts yet"}
              </p>
              {!searchQuery && filterCategory === "all" && filterStatus === "all" && (
                <Button onClick={() => navigate("/admin/blog/new")}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Post
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
              <Checkbox
                checked={selectedPosts.size === filteredPosts.length && filteredPosts.length > 0}
                onCheckedChange={selectAllPosts}
              />
              <span className="text-sm font-medium">Select All ({filteredPosts.length})</span>
            </div>
            {filteredPosts.map((post) => (
              <Card key={post.id} className={post.featured ? "border-yellow-500 border-2" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={selectedPosts.has(post.id)}
                        onCheckedChange={() => togglePostSelection(post.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">{post.title}</CardTitle>
                          {post.featured && (
                            <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                              <Star className="mr-1 h-3 w-3" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                          <span>{post.slug}</span>
                          {post.category && (
                            <>
                              <span>•</span>
                              <Badge variant="outline">{post.category}</Badge>
                            </>
                          )}
                          <span>•</span>
                          <span>{post.viewCount} views</span>
                          {post.readTime && (
                            <>
                              <span>•</span>
                              <span>{post.readTime} min read</span>
                            </>
                          )}
                        </div>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {post.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.published ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          Draft
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {post.excerpt && (
                    <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                  )}
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="text-sm text-muted-foreground">
                      {post.publishedAt
                        ? `Published ${format(new Date(post.publishedAt), "MMM d, yyyy")}`
                        : `Created ${format(new Date(post.createdAt), "MMM d, yyyy")}`}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleFeatured(post)}
                        className={post.featured ? "border-yellow-500" : ""}
                      >
                        <Star className={`mr-2 h-4 w-4 ${post.featured ? "fill-yellow-500 text-yellow-500" : ""}`} />
                        {post.featured ? "Unfeature" : "Feature"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublish(post)}
                      >
                        {post.published ? (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Publish
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteConfirmId(post.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the blog post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
