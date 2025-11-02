import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ArrowLeft, 
  Eye, 
  Save, 
  CheckCircle, 
  FileText,
  Star,
  MessageSquare,
  Image as ImageIcon,
  Tag,
  FolderTree,
  Calendar,
  Clock,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  Sparkles,
  Users,
  Table,
  RotateCcw,
  RotateCw,
  Eraser,
  Type
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { format } from "date-fns";

const customSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div || []), 'className', 'class'],
    p: [...(defaultSchema.attributes?.p || []), 'className', 'class'],
  },
};

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

export default function BlogEditor() {
  const [, params] = useRoute("/admin/blog/edit/:id");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const isEditMode = !!params?.id;
  const [previewTab, setPreviewTab] = useState("visual");
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [imageUploadMode, setImageUploadMode] = useState<"url" | "upload">("url");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [mediaUploadMode, setMediaUploadMode] = useState<"url" | "upload">("upload");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaImageUrl, setMediaImageUrl] = useState("");
  const [mediaAltText, setMediaAltText] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<{ entries: string[]; index: number }>({
    entries: [],
    index: -1
  });
  
  const [sidebarSections, setSidebarSections] = useState({
    publish: true,
    category: true,
    tags: true,
    featured: true,
    seo: true,
    author: true,
  });

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImageUrl: "",
    published: false,
    tags: "",
    category: "",
    featured: false,
    commentsEnabled: true,
    metaDescription: "",
    metaKeywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterCard: "summary_large_image",
    authorName: "",
    authorBio: "",
  });

  // Fetch existing post if editing
  const { data: existingPost, isLoading } = useQuery<BlogPost>({
    queryKey: [`/api/admin/blog/posts/${params?.id}`],
    enabled: isEditMode,
  });

  // Fetch categories from API
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Array<{id: string; name: string; slug: string}>>({
    queryKey: ["/api/blog/categories"],
  });

  // Fetch tags from API
  const { data: tags = [], isLoading: tagsLoading } = useQuery<Array<{id: string; name: string; slug: string}>>({
    queryKey: ["/api/blog/tags"],
  });

  // Load existing post data into form and initialize history
  useEffect(() => {
    if (existingPost) {
      const newFormData = {
        title: existingPost.title,
        slug: existingPost.slug,
        excerpt: existingPost.excerpt || "",
        content: existingPost.content,
        coverImageUrl: existingPost.coverImageUrl || "",
        published: existingPost.published,
        tags: existingPost.tags?.join(", ") || "",
        category: existingPost.category || "",
        featured: existingPost.featured,
        commentsEnabled: existingPost.commentsEnabled,
        metaDescription: (existingPost as any).metaDescription || "",
        metaKeywords: (existingPost as any).metaKeywords?.join(", ") || "",
        ogTitle: (existingPost as any).ogTitle || "",
        ogDescription: (existingPost as any).ogDescription || "",
        ogImage: (existingPost as any).ogImage || "",
        twitterCard: (existingPost as any).twitterCard || "summary_large_image",
        authorName: (existingPost as any).authorName || "",
        authorBio: (existingPost as any).authorBio || "",
      };
      setFormData(newFormData);
      // Initialize content history with existing content
      setHistory({ entries: [existingPost.content], index: 0 });
    }
  }, [existingPost]);

  // Initialize empty history for new posts
  useEffect(() => {
    if (!isEditMode && history.entries.length === 0) {
      setHistory({ entries: [""], index: 0 });
    }
  }, [isEditMode]);

  // Track unsaved changes
  useEffect(() => {
    if (existingPost) {
      const hasChanges = 
        formData.title !== existingPost.title ||
        formData.content !== existingPost.content ||
        formData.excerpt !== (existingPost.excerpt || "") ||
        formData.coverImageUrl !== (existingPost.coverImageUrl || "") ||
        formData.slug !== existingPost.slug ||
        formData.tags !== (existingPost.tags?.join(", ") || "") ||
        formData.category !== (existingPost.category || "") ||
        formData.featured !== existingPost.featured ||
        formData.commentsEnabled !== existingPost.commentsEnabled;
      setHasUnsavedChanges(hasChanges);
    } else if (formData.title || formData.content) {
      setHasUnsavedChanges(true);
    }
  }, [formData, existingPost]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { shouldExit?: boolean }) => {
      const response = await fetch("/api/admin/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tags: data.tags ? data.tags.split(",").map(t => t.trim()) : [],
          category: data.category || null,
          metaKeywords: data.metaKeywords ? data.metaKeywords.split(",").map(k => k.trim()) : [],
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create blog post");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      setHasUnsavedChanges(false);
      if (variables.shouldExit) {
        navigate("/admin/blog");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { shouldExit?: boolean }) => {
      const response = await fetch(`/api/admin/blog/posts/${params?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tags: data.tags ? data.tags.split(",").map(t => t.trim()) : [],
          category: data.category || null,
          metaKeywords: data.metaKeywords ? data.metaKeywords.split(",").map(k => k.trim()) : [],
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update blog post");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/blog/posts/${params?.id}`] });
      setHasUnsavedChanges(false);
      if (variables.shouldExit) {
        navigate("/admin/blog");
      }
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (published: boolean) => {
      const response = await fetch(`/api/admin/blog/posts/${params?.id}/publish`, {
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
      queryClient.invalidateQueries({ queryKey: [`/api/admin/blog/posts/${params?.id}`] });
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (value: string) => {
    setFormData({
      ...formData,
      title: value,
      slug: !isEditMode ? generateSlug(value) : formData.slug,
    });
  };

  const handleSaveDraft = () => {
    const dataToSave = { ...formData, published: false, shouldExit: false };
    if (isEditMode) {
      updateMutation.mutate(dataToSave);
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const handleSaveAndExit = () => {
    const dataToSave = { ...formData, shouldExit: true };
    if (isEditMode) {
      updateMutation.mutate(dataToSave);
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const handlePublish = () => {
    if (isEditMode) {
      publishMutation.mutate(true);
    } else {
      const dataToSave = { ...formData, published: true };
      createMutation.mutate(dataToSave);
    }
  };

  const handleUpdate = () => {
    updateMutation.mutate({ ...formData, shouldExit: false });
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
    } else {
      navigate("/admin/blog");
    }
  };

  const confirmExit = () => {
    setShowExitDialog(false);
    navigate("/admin/blog");
  };

  // Undo/Redo functionality with atomic state management
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const clearDebounceTimer = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };

  const saveToHistory = (content: string) => {
    clearDebounceTimer(); // Clear any pending debounced saves
    
    setHistory((prev) => {
      // Don't save if it's the same as current history
      if (prev.entries[prev.index] === content) return prev;
      
      // Truncate history after current index and add new entry
      const newEntries = prev.entries.slice(0, prev.index + 1);
      newEntries.push(content);
      
      return {
        entries: newEntries,
        index: newEntries.length - 1
      };
    });
  };

  // Debounced history save for manual typing
  const handleContentChange = (newContent: string) => {
    setFormData((prev) => ({ ...prev, content: newContent }));
    
    // Debounce saving to history (wait 1 second after last keystroke)
    clearDebounceTimer();
    debounceTimerRef.current = setTimeout(() => {
      saveToHistory(newContent);
    }, 1000);
  };

  const handleUndo = () => {
    clearDebounceTimer(); // Clear any pending saves
    
    setHistory((prev) => {
      if (prev.index <= 0) return prev;
      
      const newIndex = prev.index - 1;
      setFormData((prevForm) => ({ ...prevForm, content: prev.entries[newIndex] }));
      
      return {
        ...prev,
        index: newIndex
      };
    });
  };

  const handleRedo = () => {
    clearDebounceTimer(); // Clear any pending saves
    
    setHistory((prev) => {
      if (prev.index >= prev.entries.length - 1) return prev;
      
      const newIndex = prev.index + 1;
      setFormData((prevForm) => ({ ...prevForm, content: prev.entries[newIndex] }));
      
      return {
        ...prev,
        index: newIndex
      };
    });
  };

  const handleClearFormatting = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    setFormData((prev) => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = prev.content.substring(start, end);
      
      const cleanText = selectedText
        .replace(/[*_~`#>\[\]()]/g, '')
        .replace(/<[^>]*>/g, '');
      
      const newText = 
        prev.content.substring(0, start) +
        cleanText +
        prev.content.substring(end);

      saveToHistory(newText);
      return { ...prev, content: newText };
    });
  };

  // Formatting helper functions
  const insertFormatting = (before: string, after: string = "", placeholder: string = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    setFormData((prev) => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = prev.content.substring(start, end);
      const textToInsert = selectedText || placeholder;
      const newText = 
        prev.content.substring(0, start) +
        before + textToInsert + after +
        prev.content.substring(end);

      saveToHistory(newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + textToInsert.length
        );
      }, 0);
      
      return { ...prev, content: newText };
    });
  };

  const insertTable = () => {
    const tableMarkdown = `
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

`;
    const textarea = textareaRef.current;
    if (!textarea) return;

    setFormData((prev) => {
      const start = textarea.selectionStart;
      const newText = 
        prev.content.substring(0, start) +
        tableMarkdown +
        prev.content.substring(start);

      saveToHistory(newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + tableMarkdown.length,
          start + tableMarkdown.length
        );
      }, 0);
      
      return { ...prev, content: newText };
    });
  };

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const response = await fetch("/api/admin/blog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create category");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/categories"] });
      setFormData({ ...formData, category: data.name });
      setNewCategory("");
    },
  });

  // Create tag mutation
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/tags"] });
      const currentTags = formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(t => t) : [];
      if (!currentTags.includes(data.name)) {
        const updatedTags = [...currentTags, data.name].join(", ");
        setFormData({ ...formData, tags: updatedTags });
      }
      setNewTag("");
    },
  });

  const addTag = () => {
    if (!newTag.trim()) return;
    
    const currentTags = formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(t => t) : [];
    const existingTag = tags.find(t => t.name.toLowerCase() === newTag.trim().toLowerCase());
    
    if (existingTag) {
      if (!currentTags.includes(existingTag.name)) {
        const updatedTags = [...currentTags, existingTag.name].join(", ");
        setFormData({ ...formData, tags: updatedTags });
      }
      setNewTag("");
    } else {
      createTagMutation.mutate(newTag.trim());
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = formData.tags.split(",").map(t => t.trim()).filter(t => t !== tagToRemove);
    setFormData({ ...formData, tags: currentTags.join(", ") });
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    
    const existingCategory = categories.find(c => c.name.toLowerCase() === newCategory.trim().toLowerCase());
    
    if (existingCategory) {
      setFormData({ ...formData, category: existingCategory.name });
      setNewCategory("");
    } else {
      createCategoryMutation.mutate(newCategory.trim());
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    const formDataToSend = new FormData();
    formDataToSend.append('file', file);

    try {
      const response = await fetch('/api/upload-blog-image', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setFormData({ ...formData, coverImageUrl: data.fileUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingMedia(true);
    const formDataToSend = new FormData();
    formDataToSend.append('file', file);

    try {
      const response = await fetch('/api/upload-blog-image', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setMediaImageUrl(data.fileUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const insertImage = () => {
    if (!mediaImageUrl.trim()) {
      alert('Please enter an image URL or upload an image');
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    setFormData((prev) => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const altText = mediaAltText.trim() || 'Image';
      let imageMarkdown = `\n\n![${altText}](${mediaImageUrl})\n`;
      
      if (mediaCaption.trim()) {
        imageMarkdown += `*${mediaCaption}*\n`;
      }
      imageMarkdown += `\n`;
      
      const newText = 
        prev.content.substring(0, start) +
        imageMarkdown +
        prev.content.substring(end);

      saveToHistory(newText);
      setShowMediaDialog(false);
      setMediaImageUrl("");
      setMediaAltText("");
      setMediaCaption("");
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + imageMarkdown.length,
          start + imageMarkdown.length
        );
      }, 0);
      
      return { ...prev, content: newText };
    });
  };

  if (isLoading && isEditMode) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading post...</div>
      </div>
    );
  }

  const wordCount = formData.content.split(/\s+/).filter(w => w).length;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Bar - WordPress Style */}
      <div className="sticky top-0 z-50 border-b bg-white dark:bg-slate-900 shadow-sm">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Posts
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">
                  {isEditMode ? "Edit Post" : "Add New Post"}
                </span>
                {isEditMode && existingPost && (
                  <span className="text-xs text-muted-foreground">
                    Last updated {format(new Date(existingPost.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50 dark:bg-orange-950">
                  Unsaved changes
                </Badge>
              )}
              {isEditMode && existingPost?.published && (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  Published
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="border-slate-300 dark:border-slate-700"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="border-slate-300 dark:border-slate-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              {isEditMode ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleUpdate}
                    disabled={updateMutation.isPending}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? "Updating..." : "Update"}
                  </Button>
                  {!existingPost?.published && (
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handlePublish}
                      disabled={publishMutation.isPending}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Publish
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handlePublish}
                  disabled={createMutation.isPending}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Publish
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal Overlay */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-8" onClick={() => setShowPreview(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Preview</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-8">
              <h1 className="text-4xl font-bold mb-4">{formData.title || "Untitled"}</h1>
              {formData.coverImageUrl && (
                <img src={formData.coverImageUrl} alt="Cover" className="w-full h-64 object-cover rounded-lg mb-6" />
              )}
              {formData.excerpt && (
                <p className="text-lg text-muted-foreground mb-6 italic">{formData.excerpt}</p>
              )}
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, [rehypeSanitize, customSanitizeSchema]]}
                >
                  {formData.content || "*No content yet*"}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Editor Area */}
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-8">
          {/* Left Column - Main Editor */}
          <div className="space-y-0">
            {/* Title Input - No card wrapper */}
            <div className="bg-white dark:bg-slate-900 border-b pt-8 pb-6 px-8">
              <Input
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Add title"
                className="text-4xl font-bold border-0 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 bg-transparent"
              />
            </div>

            {/* Permalink - Inline */}
            <div className="bg-white dark:bg-slate-900 border-b px-8 py-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Permalink:</span>
                <span className="text-blue-600 dark:text-blue-400">/blog/</span>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="url-friendly-slug"
                  className="flex-1 h-7 border-0 bg-transparent focus-visible:ring-0 px-0 text-blue-600 dark:text-blue-400"
                />
              </div>
            </div>

            {/* Add Media Button - WordPress Style */}
            <div className="bg-white dark:bg-slate-900 border-b px-8 py-3 flex items-center justify-between">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowMediaDialog(true)}
                className="bg-[#0073aa] hover:bg-[#005a87] text-white font-medium shadow-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Media
              </Button>
              <div className="text-xs text-muted-foreground">
                Upload or insert images into your content
              </div>
            </div>

            {/* Rich Text Toolbar - Enhanced WordPress Style */}
            <div className="bg-white dark:bg-slate-900 border-b px-8 py-3">
              <div className="flex items-center gap-1 flex-wrap">
                {/* Undo/Redo */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  disabled={history.index <= 0}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                  title="Undo (Ctrl+Z)"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  disabled={history.index >= history.entries.length - 1}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                  title="Redo (Ctrl+Y)"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-2" />

                {/* Paragraph/Heading Dropdown */}
                <Select defaultValue="paragraph" onValueChange={(value) => {
                  if (value === "h1") insertFormatting("# ", "", "Heading 1");
                  else if (value === "h2") insertFormatting("## ", "", "Heading 2");
                  else if (value === "h3") insertFormatting("### ", "", "Heading 3");
                  else if (value === "h4") insertFormatting("#### ", "", "Heading 4");
                  else if (value === "h5") insertFormatting("##### ", "", "Heading 5");
                  else if (value === "h6") insertFormatting("###### ", "", "Heading 6");
                }}>
                  <SelectTrigger className="w-[130px] h-8 text-sm border-slate-300 dark:border-slate-600">
                    <SelectValue placeholder="Paragraph" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paragraph">Paragraph</SelectItem>
                    <SelectItem value="h1">Heading 1</SelectItem>
                    <SelectItem value="h2">Heading 2</SelectItem>
                    <SelectItem value="h3">Heading 3</SelectItem>
                    <SelectItem value="h4">Heading 4</SelectItem>
                    <SelectItem value="h5">Heading 5</SelectItem>
                    <SelectItem value="h6">Heading 6</SelectItem>
                  </SelectContent>
                </Select>

                <div className="w-px h-6 bg-border mx-2" />

                {/* Text Formatting */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("**", "**", "bold text")}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("*", "*", "italic text")}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("<u>", "</u>", "underlined text")}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Underline (Ctrl+U)"
                >
                  <Underline className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("~~", "~~", "strikethrough text")}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Strikethrough"
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-2" />

                {/* Lists */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("- ", "", "List item")}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("1. ", "", "List item")}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Numbered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-2" />

                {/* Quote & Code */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("> ", "", "Quote text")}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Blockquote"
                >
                  <Quote className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("`", "`", "code")}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Inline Code"
                >
                  <Code className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-2" />

                {/* Alignment */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("<div class='text-left'>", "</div>", "Left aligned text")}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Align Left"
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("<div class='text-center'>", "</div>", "Centered text")}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Align Center"
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("<div class='text-right'>", "</div>", "Right aligned text")}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Align Right"
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("<div class='text-justify'>", "</div>", "Justified text")}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Justify"
                >
                  <AlignJustify className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-2" />

                {/* Link & Image */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("[", "](url)", "link text")}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Insert Link"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMediaDialog(true)}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Insert Image"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-2" />

                {/* Table & Horizontal Rule */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertTable}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Insert Table"
                >
                  <Table className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("\n\n---\n\n", "", "")}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Horizontal Rule"
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-2" />

                {/* Clear Formatting */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFormatting}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Clear Formatting"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content Editor with Tabs */}
            <div className="bg-white dark:bg-slate-900 border-b">
              <Tabs value={previewTab} onValueChange={setPreviewTab} className="w-full">
                <div className="border-b px-8">
                  <TabsList className="h-10 bg-transparent p-0 gap-4">
                    <TabsTrigger 
                      value="visual" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0"
                    >
                      Visual
                    </TabsTrigger>
                    <TabsTrigger 
                      value="code" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0"
                    >
                      Code
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="visual" className="mt-0 p-8">
                  <Textarea
                    ref={textareaRef}
                    value={formData.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Start writing your content... Use the formatting toolbar above or type Markdown directly."
                    rows={24}
                    className="resize-none min-h-[600px] focus-visible:ring-1 border-0 focus-visible:ring-blue-200 dark:focus-visible:ring-blue-800"
                  />
                </TabsContent>
                <TabsContent value="code" className="mt-0 p-8">
                  <Textarea
                    value={formData.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Write Markdown code here..."
                    rows={24}
                    className="font-mono text-sm resize-none min-h-[600px] focus-visible:ring-1 border-0"
                  />
                </TabsContent>
              </Tabs>
              
              {/* Word Count Footer */}
              <div className="px-8 py-3 border-t bg-slate-50 dark:bg-slate-900/50 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Word count: {wordCount}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Estimated read time: {estimatedReadTime} min
                  </span>
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div className="bg-white dark:bg-slate-900 p-8">
              <Label className="text-sm font-medium mb-3 block">Excerpt</Label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Write a short excerpt for the post (optional, 150-200 characters recommended)"
                rows={4}
                className="resize-none focus-visible:ring-1"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Excerpts are optional hand-crafted summaries of your content.
              </p>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* Publish Panel */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/50">
                <CardTitle className="text-base font-semibold">Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveDraft}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveAndExit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 border-slate-300 dark:border-slate-700"
                  >
                    Save & Exit
                  </Button>
                </div>

                {/* Status Dropdown */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Status</Label>
                  <Select
                    value={formData.published ? "published" : "draft"}
                    onValueChange={(value) => setFormData({ ...formData, published: value === "published" })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/50">
                <CardTitle className="text-base font-semibold">Categories</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    Save & Exit
                  </Button>
                </div>
                
                {/* Category Checkboxes */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categoriesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading categories...</p>
                  ) : categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No categories yet</p>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`category-${cat.id}`}
                          checked={formData.category === cat.name}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, category: cat.name });
                            } else {
                              setFormData({ ...formData, category: "" });
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label
                          htmlFor={`category-${cat.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {cat.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/50">
                <CardTitle className="text-base font-semibold">Tags</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Write some tags"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Separate tags with commas
                </p>
                
                {tags.length > 0 && (
                  <div className="pt-2 border-t">
                    <Label className="text-xs font-medium mb-2 block">Popular Tags</Label>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                      {tags.map((tag) => {
                        const currentTags = formData.tags ? formData.tags.split(",").map(t => t.trim()) : [];
                        const isSelected = currentTags.includes(tag.name);
                        return (
                          <Badge 
                            key={tag.id} 
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 text-xs"
                            onClick={() => {
                              if (!isSelected) {
                                const updatedTags = formData.tags 
                                  ? `${formData.tags}, ${tag.name}`
                                  : tag.name;
                                setFormData({ ...formData, tags: updatedTags });
                              }
                            }}
                          >
                            {tag.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Allow Comments */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/50">
                <CardTitle className="text-base font-semibold">Allow comments</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="comments-enabled"
                    checked={formData.commentsEnabled}
                    onChange={(e) => setFormData({ ...formData, commentsEnabled: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="comments-enabled"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Enable comments for this post
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Image */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/50">
                <CardTitle className="text-base font-semibold">Image</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {formData.coverImageUrl ? (
                  <div className="border rounded-lg overflow-hidden mb-3 relative group">
                    <img
                      src={formData.coverImageUrl}
                      alt="Cover preview"
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setFormData({ ...formData, coverImageUrl: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <ImageIcon className="h-12 w-12 text-slate-400 mb-3" />
                  </div>
                )}
                
                <div className="space-y-2 mt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    {uploadingImage ? "Uploading..." : "Choose image"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">or</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-blue-600 hover:text-blue-700 hover:bg-transparent"
                    onClick={() => {
                      const url = prompt("Enter image URL:");
                      if (url) setFormData({ ...formData, coverImageUrl: url });
                    }}
                  >
                    Add from URL
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SEO Metadata Section */}
            <Card className="border shadow-sm">
              <Collapsible 
                open={sidebarSections.seo} 
                onOpenChange={(open) => setSidebarSections({...sidebarSections, seo: open})}
              >
                <CardHeader className="pb-3">
                  <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-blue-600 transition-colors">
                    <CardTitle className="text-sm font-semibold flex items-center">
                      <Sparkles className="mr-2 h-4 w-4" />
                      SEO Metadata
                    </CardTitle>
                    {sidebarSections.seo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Meta Description</Label>
                      <Textarea
                        value={formData.metaDescription}
                        onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                        placeholder="Brief description for search engines (160 chars max)"
                        className="mt-1 text-sm"
                        rows={3}
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.metaDescription.length}/160 characters
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Meta Keywords (comma-separated)</Label>
                      <Input
                        value={formData.metaKeywords}
                        onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                        placeholder="keyword1, keyword2, keyword3"
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Open Graph Title</Label>
                      <Input
                        value={formData.ogTitle}
                        onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                        placeholder="Title for social media sharing"
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Open Graph Description</Label>
                      <Textarea
                        value={formData.ogDescription}
                        onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
                        placeholder="Description for social media previews"
                        className="mt-1 text-sm"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Open Graph Image URL</Label>
                      <Input
                        value={formData.ogImage}
                        onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                        placeholder="https://example.com/og-image.jpg"
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Twitter Card Type</Label>
                      <Select
                        value={formData.twitterCard}
                        onValueChange={(value) => setFormData({ ...formData, twitterCard: value })}
                      >
                        <SelectTrigger className="mt-1 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="summary">Summary</SelectItem>
                          <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                          <SelectItem value="app">App</SelectItem>
                          <SelectItem value="player">Player</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Author Information Section */}
            <Card className="border shadow-sm">
              <Collapsible 
                open={sidebarSections.author} 
                onOpenChange={(open) => setSidebarSections({...sidebarSections, author: open})}
              >
                <CardHeader className="pb-3">
                  <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-blue-600 transition-colors">
                    <CardTitle className="text-sm font-semibold flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Author Information
                    </CardTitle>
                    {sidebarSections.author ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Author Name</Label>
                      <Input
                        value={formData.authorName}
                        onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                        placeholder="Display name for this post"
                        className="mt-1 text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Overrides your account name for this post
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Author Bio</Label>
                      <Textarea
                        value={formData.authorBio}
                        onChange={(e) => setFormData({ ...formData, authorBio: e.target.value })}
                        placeholder="Brief bio about the author"
                        className="mt-1 text-sm"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>
        </div>
      </div>

      {/* Media Insert Dialog - Enhanced WordPress Style */}
      <AlertDialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
        <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Insert Media
            </AlertDialogTitle>
            <AlertDialogDescription>
              Upload an image or provide a URL, then add alt text and caption for accessibility
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-6 py-4">
            <Tabs value={mediaUploadMode} onValueChange={(value: any) => setMediaUploadMode(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload Image</TabsTrigger>
                <TabsTrigger value="url">Image URL</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4 mt-4">
                <input
                  ref={mediaFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleMediaUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center hover:border-[#36a477] transition-colors">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <Button
                    variant="outline"
                    onClick={() => mediaFileInputRef.current?.click()}
                    disabled={uploadingMedia}
                    className="mb-2"
                  >
                    {uploadingMedia ? "Uploading..." : "Choose Image File"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    JPEG, PNG, GIF, or WebP - Max 5MB
                  </p>
                </div>
                
                {mediaImageUrl && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Image Preview:</Label>
                    <div className="border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900">
                      <img
                        src={mediaImageUrl}
                        alt="Uploaded preview"
                        className="w-full h-64 object-contain"
                      />
                    </div>
                    <Input
                      value={mediaImageUrl}
                      onChange={(e) => setMediaImageUrl(e.target.value)}
                      placeholder="Image URL"
                      className="font-mono text-sm"
                      readOnly
                    />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="url" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={mediaImageUrl}
                    onChange={(e) => setMediaImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the full URL of the image you want to insert
                  </p>
                </div>
                
                {mediaImageUrl && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Image Preview:</Label>
                    <div className="border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900">
                      <img
                        src={mediaImageUrl}
                        alt="Preview"
                        className="w-full h-64 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).alt = 'Failed to load image';
                        }}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Image Attributes - WordPress Style */}
            {mediaImageUrl && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-sm font-semibold">Image Attributes</h3>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Alt Text <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={mediaAltText}
                    onChange={(e) => setMediaAltText(e.target.value)}
                    placeholder="Describe the image for accessibility"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alternative text for screen readers and SEO (recommended)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Caption (Optional)</Label>
                  <Textarea
                    value={mediaCaption}
                    onChange={(e) => setMediaCaption(e.target.value)}
                    placeholder="Add a caption that will appear below the image"
                    className="text-sm resize-none"
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    The caption text will be displayed below the image in your post
                  </p>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowMediaDialog(false);
              setMediaImageUrl("");
              setMediaAltText("");
              setMediaCaption("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={insertImage}
              disabled={!mediaImageUrl.trim() || uploadingMedia}
              className="bg-[#36a477] hover:bg-[#2d8761]"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Insert Image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on Page</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Leave Without Saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
