import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Pencil, Trash2, Plus, FolderTree, GripVertical, Info, ChevronRight, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  pointerWithin,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  displayOrder: number;
  isDefault: boolean;
  createdAt: string;
  postCount?: number;
  children?: Category[];
}

interface CategoryTreeNode extends Category {
  level: number;
  isExpanded?: boolean;
}

function SortableCategory({
  category,
  level,
  isExpanded,
  hasChildren,
  onEdit,
  onDelete,
  onToggle,
  overId,
}: {
  category: Category;
  level: number;
  isExpanded?: boolean;
  hasChildren: boolean;
  onEdit: (category: Category) => void;
  onDelete: (id: string, name: string) => void;
  onToggle: (id: string) => void;
  overId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    data: {
      category,
      level,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    paddingLeft: `${level * 24}px`,
  };

  const isOver = overId === category.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded-lg hover:border-primary/50 bg-background mb-2 ${
        isOver ? "border-primary border-2 bg-primary/5" : ""
      }`}
    >
      {hasChildren ? (
        <button
          onClick={() => onToggle(category.id)}
          className="text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ) : (
        <div className="w-4" />
      )}
      
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{category.name}</span>
          {category.isDefault && (
            <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
              Default
            </span>
          )}
          {typeof category.postCount === 'number' && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              category.postCount > 0 
                ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
            }`}>
              {category.postCount} {category.postCount === 1 ? 'post' : 'posts'}
            </span>
          )}
          {level > 0 && (
            <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
              Level {level}
            </span>
          )}
        </div>
        {category.description && (
          <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(category)}
          className="hover:bg-primary/10"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(category.id, category.name)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function BlogCategories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [overId, setOverId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    color: "",
    parentId: "",
  });

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/blog/categories?withStats=true"],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const buildTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const roots: Category[] = [];

    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach((cat) => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!;
        parent.children!.push(category);
      } else {
        roots.push(category);
      }
    });

    const sortCategories = (cats: Category[]): Category[] => {
      return cats
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((cat) => ({
          ...cat,
          children: cat.children ? sortCategories(cat.children) : [],
        }));
    };

    return sortCategories(roots);
  };

  const flattenTree = (tree: Category[], level = 0): CategoryTreeNode[] => {
    let result: CategoryTreeNode[] = [];
    
    tree.forEach((node) => {
      result.push({ ...node, level, isExpanded: expandedCategories.has(node.id) });
      
      if (node.children && node.children.length > 0 && expandedCategories.has(node.id)) {
        result = result.concat(flattenTree(node.children, level + 1));
      }
    });
    
    return result;
  };

  const categoryTree = useMemo(() => buildTree(categories), [categories]);
  const flatCategories = useMemo(() => flattenTree(categoryTree), [categoryTree, expandedCategories]);

  const isDescendant = (childId: string, potentialParentId: string): boolean => {
    if (childId === potentialParentId) {
      return true;
    }
    
    const getAllDescendants = (parentId: string): string[] => {
      const children = categories.filter((c) => c.parentId === parentId);
      let descendants = children.map((c) => c.id);
      
      children.forEach((child) => {
        descendants = descendants.concat(getAllDescendants(child.id));
      });
      
      return descendants;
    };
    
    const descendants = getAllDescendants(childId);
    return descendants.includes(potentialParentId);
  };

  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/admin/blog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/categories?withStats=true"] });
      resetForm();
      toast({ title: "Success", description: "Category created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create category", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await fetch(`/api/admin/blog/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/categories?withStats=true"] });
      setEditingCategory(null);
      resetForm();
      toast({ title: "Success", description: "Category updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/blog/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete category");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/categories?withStats=true"] });
      setDeleteConfirmId(null);
      toast({ title: "Success", description: "Category deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    },
  });

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string | null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setOverId(null);

    if (!over) {
      return;
    }

    if (active.id === over.id) {
      return;
    }

    const activeCategory = categories.find((c) => c.id === active.id);
    const overCategory = categories.find((c) => c.id === over.id);

    if (!activeCategory || !overCategory) {
      toast({
        title: "Invalid Drop",
        description: "Drop target is not a valid category.",
        variant: "destructive",
      });
      return;
    }

    const isSameParent = activeCategory.parentId === overCategory.parentId;

    if (isSameParent) {
      const siblings = categories
        .filter((c) => c.parentId === activeCategory.parentId)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      
      const oldIndex = siblings.findIndex((c) => c.id === active.id);
      const newIndex = siblings.findIndex((c) => c.id === over.id);

      const reordered = siblings.map((cat, idx) => {
        let newOrder = idx;
        if (idx === oldIndex) {
          newOrder = newIndex;
        } else if (oldIndex < newIndex && idx > oldIndex && idx <= newIndex) {
          newOrder = idx - 1;
        } else if (oldIndex > newIndex && idx >= newIndex && idx < oldIndex) {
          newOrder = idx + 1;
        }
        return { id: cat.id, displayOrder: newOrder };
      });

      const promises = reordered.map(({ id, displayOrder }) =>
        fetch(`/api/admin/blog/categories/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder }),
          credentials: "include",
        })
      );

      try {
        await Promise.all(promises);
        queryClient.invalidateQueries({ queryKey: ["/api/blog/categories?withStats=true"] });
        toast({ title: "Success", description: "Categories reordered" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to reorder categories", variant: "destructive" });
      }
    } else {
      const newParentId = overCategory.id;
      
      if (isDescendant(activeCategory.id, newParentId)) {
        toast({
          title: "Invalid Move",
          description: "Cannot move a category to one of its own descendants. This would create a circular reference.",
          variant: "destructive",
        });
        return;
      }
      
      try {
        const newSiblings = categories.filter((c) => c.parentId === newParentId);
        
        await fetch(`/api/admin/blog/categories/${activeCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentId: newParentId,
            displayOrder: newSiblings.length,
          }),
          credentials: "include",
        });

        queryClient.invalidateQueries({ queryKey: ["/api/blog/categories?withStats=true"] });
        setExpandedCategories((prev) => new Set([...prev, newParentId]));
        toast({ title: "Success", description: `Moved "${activeCategory.name}" under "${overCategory.name}"` });
      } catch (error) {
        toast({ title: "Error", description: "Failed to move category", variant: "destructive" });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Category name is required", variant: "destructive" });
      return;
    }

    if (editingCategory && formData.parentId) {
      if (isDescendant(editingCategory.id, formData.parentId)) {
        toast({
          title: "Invalid Parent",
          description: "Cannot set a parent that would create a circular reference. The selected parent is a descendant of this category.",
          variant: "destructive",
        });
        return;
      }
    }

    const slug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        data: { ...formData, slug },
      });
    } else {
      createCategoryMutation.mutate({ 
        ...formData, 
        slug,
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      color: category.color || "",
      parentId: category.parentId || "",
    });
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      color: "",
      parentId: "",
    });
    setEditingCategory(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Blog Categories</h1>
          <p className="text-muted-foreground mt-2">
            Manage blog post categories with hierarchical structure and drag-and-drop ordering
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FolderTree className="h-5 w-5" />
                  <CardTitle>Categories ({categories.length})</CardTitle>
                </div>
                <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <p><strong>Drag & Drop:</strong> Drag categories to reorder within the same level</p>
                    <p><strong>Make Sub-category:</strong> Drag a category onto another to make it a child</p>
                    <p><strong>Expand/Collapse:</strong> Click chevron to show/hide children</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 text-sm">
                    No categories yet. Create your first category.
                  </p>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={pointerWithin}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={flatCategories.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div>
                        {flatCategories.map((category) => {
                          const hasChildren = categoryTree.some((c) => 
                            c.id === category.id && c.children && c.children.length > 0
                          ) || categories.some((c) => c.parentId === category.id);
                          
                          return (
                            <SortableCategory
                              key={category.id}
                              category={category}
                              level={category.level}
                              isExpanded={category.isExpanded}
                              hasChildren={hasChildren}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onToggle={toggleCategory}
                              overId={overId}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingCategory ? "Edit Category" : "Create New Category"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      data-testid="input-category-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Tech for Entrepreneurs"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Permalink</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        https://studentdrive.com/
                      </span>
                      <Input
                        id="slug"
                        data-testid="input-category-slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="Auto-generated from name"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Preview: https://studentdrive.com/{formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="parent">Parent Category</Label>
                    <Select
                      value={formData.parentId}
                      onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                    >
                      <SelectTrigger id="parent" data-testid="select-category-parent">
                        <SelectValue placeholder="None (Top Level)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None (Top Level)</SelectItem>
                        {categories
                          .filter((c) => c.id !== editingCategory?.id)
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a parent to create a sub-category
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      data-testid="input-category-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Short description of this category"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="color">Color/Icon</Label>
                    <Input
                      id="color"
                      data-testid="input-category-color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="e.g., #3B82F6"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      data-testid="button-submit-category"
                      disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {editingCategory ? "Update Category" : "Create Category"}
                    </Button>
                    {editingCategory && (
                      <Button type="button" variant="outline" onClick={resetForm} data-testid="button-cancel-edit-category">
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteConfirmName}"? Posts using this category will have their category removed. Child categories will be moved to top level. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && deleteCategoryMutation.mutate(deleteConfirmId)}
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
