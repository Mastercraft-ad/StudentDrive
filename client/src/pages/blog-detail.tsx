import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Clock, Eye, ArrowLeft, Calendar, ArrowRight, MessageSquare, User, Heart, Bookmark, Share2, Link as LinkIcon, Check } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

const customSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div || []), 'className', 'class'],
    p: [...(defaultSchema.attributes?.p || []), 'className', 'class'],
  },
};

interface Author {
  id: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  profileImageUrl: string | null;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  authorId: string;
  publishedAt: string;
  tags: string[] | null;
  category: string | null;
  featured: boolean;
  commentsEnabled: boolean;
  readTime: number | null;
  viewCount: number;
  author?: Author;
  metaDescription: string | null;
  metaKeywords: string[] | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  authorName: string | null;
  authorBio: string | null;
}

interface BlogComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CommentItemProps {
  comment: BlogComment & { replies: BlogComment[] };
  user: UserData | undefined;
  replyingTo: string | null;
  replyContent: string;
  setReplyingTo: (id: string | null) => void;
  setReplyContent: (content: string) => void;
  handleSubmitReply: (e: React.FormEvent, parentId: string) => void;
  handleCancelReply: () => void;
  isSubmitting: boolean;
  depth?: number;
}

function CommentItem({
  comment,
  user,
  replyingTo,
  replyContent,
  setReplyingTo,
  setReplyContent,
  handleSubmitReply,
  handleCancelReply,
  isSubmitting,
  depth = 0,
}: CommentItemProps) {
  const maxDepth = 3;

  return (
    <div className={depth > 0 ? "ml-8 mt-4" : ""}>
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">User</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap mb-2">
                {comment.content}
              </p>
              {user && depth < maxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-xs h-7 px-2"
                >
                  Reply
                </Button>
              )}

              {/* Reply Form */}
              {replyingTo === comment.id && user && (
                <div className="mt-4 space-y-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[80px]"
                    maxLength={1000}
                  />
                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-xs text-muted-foreground">
                      {replyContent.length}/1000
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelReply}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => handleSubmitReply(e, comment.id)}
                        disabled={!replyContent.trim() || isSubmitting}
                      >
                        {isSubmitting ? "Posting..." : "Reply"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 space-y-4">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply as BlogComment & { replies: BlogComment[] }}
                      user={user}
                      replyingTo={replyingTo}
                      replyContent={replyContent}
                      setReplyingTo={setReplyingTo}
                      setReplyContent={setReplyContent}
                      handleSubmitReply={handleSubmitReply}
                      handleCancelReply={handleCancelReply}
                      isSubmitting={isSubmitting}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SEOMetaTags({ post }: { post: BlogPost }) {
  useEffect(() => {
    if (!post) return;

    const title = post.ogTitle || post.title;
    const description = post.metaDescription || post.excerpt || post.content.substring(0, 160);
    const image = post.ogImage || post.coverImageUrl || '';
    const url = window.location.href;

    const previousTitle = document.title;
    document.title = `${post.title} | StudentDrive Blog`;

    const createdElements: HTMLMetaElement[] = [];
    const modifiedElements: Array<{ element: HTMLMetaElement; originalContent: string | null }> = [];

    const updateMetaTag = (property: string, content: string, type: 'name' | 'property' = 'property') => {
      if (!content) return;
      
      let metaTag = document.querySelector<HTMLMetaElement>(`meta[${type}="${property}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute(type, property);
        document.head.appendChild(metaTag);
        createdElements.push(metaTag);
      } else {
        modifiedElements.push({
          element: metaTag,
          originalContent: metaTag.getAttribute('content')
        });
      }
      metaTag.setAttribute('content', content);
    };

    updateMetaTag('description', description, 'name');
    
    if (post.metaKeywords && post.metaKeywords.length > 0) {
      updateMetaTag('keywords', post.metaKeywords.join(', '), 'name');
    }

    updateMetaTag('og:title', title);
    updateMetaTag('og:description', post.ogDescription || description);
    updateMetaTag('og:type', 'article');
    updateMetaTag('og:url', url);
    if (image) {
      updateMetaTag('og:image', image);
    }
    updateMetaTag('og:site_name', 'StudentDrive');

    updateMetaTag('article:published_time', post.publishedAt);
    
    const existingTagMetas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[property="article:tag"]'));
    const savedTagMetas = existingTagMetas.map(el => ({
      content: el.getAttribute('content')
    }));
    existingTagMetas.forEach(el => el.remove());
    
    if (post.tags && post.tags.length > 0) {
      post.tags.forEach(tag => {
        const tagMeta = document.createElement('meta');
        tagMeta.setAttribute('property', 'article:tag');
        tagMeta.setAttribute('content', tag);
        document.head.appendChild(tagMeta);
        createdElements.push(tagMeta);
      });
    }

    updateMetaTag('twitter:card', post.twitterCard || 'summary_large_image', 'name');
    updateMetaTag('twitter:title', title, 'name');
    updateMetaTag('twitter:description', post.ogDescription || description, 'name');
    if (image) {
      updateMetaTag('twitter:image', image, 'name');
    }

    return () => {
      document.title = previousTitle;
      
      createdElements.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
      
      modifiedElements.forEach(({ element, originalContent }) => {
        if (originalContent !== null) {
          element.setAttribute('content', originalContent);
        } else {
          element.removeAttribute('content');
        }
      });
      
      savedTagMetas.forEach(({ content }) => {
        if (content) {
          const tagMeta = document.createElement('meta');
          tagMeta.setAttribute('property', 'article:tag');
          tagMeta.setAttribute('content', content);
          document.head.appendChild(tagMeta);
        }
      });
    };
  }, [post]);

  return null;
}

export default function BlogDetail() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug;
  const [scrollProgress, setScrollProgress] = useState(0);
  const [commentContent, setCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<UserData>({
    queryKey: ["/api/auth/user"],
  });

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: [`/api/blog/posts/${slug}`],
    enabled: !!slug,
  });

  const { data: allPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts"],
    enabled: !!post,
  });

  const { data: comments = [] } = useQuery<BlogComment[]>({
    queryKey: [`/api/blog/posts/${slug}/comments`],
    enabled: !!slug,
  });

  const { data: likeStatus } = useQuery<{ likeCount: number; liked: boolean }>({
    queryKey: [`/api/blog/posts/${slug}/like/status`],
    enabled: !!slug,
  });

  const { data: bookmarkStatus } = useQuery<{ bookmarkCount: number; bookmarked: boolean }>({
    queryKey: [`/api/blog/posts/${slug}/bookmark/status`],
    enabled: !!slug,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/blog/posts/${slug}/like`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to like post");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/blog/posts/${slug}/like/status`] });
      toast({
        title: "Success",
        description: "You liked this post!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/blog/posts/${slug}/like`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to unlike post");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/blog/posts/${slug}/like/status`] });
      toast({
        title: "Success",
        description: "You unliked this post",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLikeToggle = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like this post",
        variant: "destructive",
      });
      return;
    }

    if (likeStatus?.liked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/blog/posts/${slug}/bookmark`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to bookmark post");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/blog/posts/${slug}/bookmark/status`] });
      toast({
        title: "Success",
        description: "Post saved to your bookmarks!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unbookmarkMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/blog/posts/${slug}/bookmark`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove bookmark");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/blog/posts/${slug}/bookmark/status`] });
      toast({
        title: "Success",
        description: "Bookmark removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBookmarkToggle = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to bookmark this post",
        variant: "destructive",
      });
      return;
    }

    if (bookmarkStatus?.bookmarked) {
      unbookmarkMutation.mutate();
    } else {
      bookmarkMutation.mutate();
    }
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast({
        title: "Link copied!",
        description: "Blog post link copied to clipboard",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    if (!post) return;
    
    const url = window.location.href;
    const text = post.title;
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string | null }) => {
      const response = await fetch(`/api/blog/posts/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to post comment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/blog/posts/${slug}/comments`] });
      setCommentContent("");
      setReplyContent("");
      setReplyingTo(null);
      toast({
        title: "Success",
        description: "Your comment has been posted!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }
    addCommentMutation.mutate({ content: commentContent });
  };

  const handleSubmitReply = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply",
        variant: "destructive",
      });
      return;
    }
    addCommentMutation.mutate({ content: replyContent, parentId });
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
  };

  // Organize comments into threaded structure
  const organizeComments = (comments: BlogComment[]) => {
    const commentMap = new Map<string, BlogComment & { replies: BlogComment[] }>();
    const rootComments: (BlogComment & { replies: BlogComment[] })[] = [];

    // First pass: create comment objects with replies array
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into tree structure
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentWithReplies);
        } else {
          rootComments.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const threadedComments = organizeComments(comments);

  // Calculate related posts based on shared tags and category
  const relatedPosts = post
    ? allPosts
        .filter((p) => p.id !== post.id) // Exclude current post
        .map((p) => {
          let score = 0;
          // Same category gets high score
          if (p.category && p.category === post.category) score += 3;
          // Shared tags get points
          const sharedTags =
            post.tags?.filter((tag) => p.tags?.includes(tag)).length || 0;
          score += sharedTags;
          return { post: p, score };
        })
        .filter((item) => item.score > 0) // Only posts with some relation
        .sort((a, b) => b.score - a.score) // Sort by relevance
        .slice(0, 3) // Top 3
        .map((item) => item.post)
    : [];

  // Reading progress bar calculation
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollDistance = documentHeight - windowHeight;

      if (scrollDistance > 0) {
        const progress = (scrollTop / scrollDistance) * 100;
        setScrollProgress(Math.min(progress, 100));
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial calculation

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading blog post...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <h3 className="text-xl font-semibold mb-2">Blog post not found</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                The blog post you're looking for doesn't exist or has been removed.
              </p>
              <Button asChild>
                <Link href="/blog">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Blog
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOMetaTags post={post} />
      <PublicHeader />
      
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div
          className="h-full bg-primary transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>

        {/* Blog Post */}
        <article className="bg-background">
          {/* Cover Image */}
          {post.coverImageUrl && (
            <div className="relative h-96 rounded-xl overflow-hidden mb-8 bg-gradient-to-br from-primary/5 to-primary/10">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Category & Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.category && (
              <Badge variant="outline" className="font-medium">
                {post.category}
              </Badge>
            )}
            {post.tags && post.tags.length > 0 && (
              <>
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(post.publishedAt), "MMMM d, yyyy")}</span>
            </div>
            {post.readTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.readTime} min read</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{post.viewCount} views</span>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Button
                variant={likeStatus?.liked ? "default" : "outline"}
                size="sm"
                onClick={handleLikeToggle}
                disabled={likeMutation.isPending || unlikeMutation.isPending}
                className="gap-2"
              >
                <Heart
                  className={`h-4 w-4 ${likeStatus?.liked ? "fill-current" : ""}`}
                />
                <span>{likeStatus?.likeCount || 0}</span>
              </Button>
              <Button
                variant={bookmarkStatus?.bookmarked ? "default" : "outline"}
                size="sm"
                onClick={handleBookmarkToggle}
                disabled={bookmarkMutation.isPending || unbookmarkMutation.isPending}
                className="gap-2"
              >
                <Bookmark
                  className={`h-4 w-4 ${bookmarkStatus?.bookmarked ? "fill-current" : ""}`}
                />
                <span className="hidden sm:inline">Save</span>
              </Button>
              <Popover open={showShareMenu} onOpenChange={setShowShareMenu}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-2">
                    <p className="text-sm font-medium mb-3">Share this post</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => handleShare('twitter')}
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Share on X (Twitter)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => handleShare('facebook')}
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Share on Facebook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => handleShare('linkedin')}
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      Share on LinkedIn
                    </Button>
                    <div className="border-t pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={handleCopyLink}
                      >
                        {linkCopied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <LinkIcon className="h-4 w-4" />
                        )}
                        {linkCopied ? "Link copied!" : "Copy link"}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Content - Markdown Rendering */}
          <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-heading prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:text-foreground prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-img:rounded-lg prose-blockquote:border-l-primary">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, [rehypeSanitize, customSanitizeSchema]]}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Author Information Section */}
          {(post.authorName || post.authorBio || post.author) && (
            <Card className="mt-12 border-2 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-6">
                <div className="flex gap-4 items-start">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarFallback className="text-lg font-semibold bg-primary/10">
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">
                      About the Author
                    </h3>
                    <p className="text-base font-semibold text-foreground mb-2">
                      {post.authorName || 
                        (post.author ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() : 'Unknown Author')}
                    </p>
                    {(post.authorBio || post.author?.bio) && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {post.authorBio || post.author?.bio}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Posts Section */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 pt-8 border-t">
              <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Card
                    key={relatedPost.id}
                    className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
                  >
                    {relatedPost.coverImageUrl && (
                      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10">
                        <img
                          src={relatedPost.coverImageUrl}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                        {relatedPost.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {relatedPost.excerpt && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      )}
                      <Button variant="ghost" size="sm" className="w-full" asChild>
                        <Link href={`/blog/${relatedPost.slug}`}>
                          Read More
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          {post.commentsEnabled && (
          <div className="mt-16 pt-8 border-t">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Comments ({comments.length})</h2>
            </div>

            {/* Add Comment Form */}
            {user ? (
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmitComment}>
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-4">
                        <Textarea
                          placeholder="Share your thoughts..."
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          className="min-h-[100px]"
                          maxLength={1000}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {commentContent.length}/1000 characters
                          </span>
                          <Button
                            type="submit"
                            disabled={!commentContent.trim() || addCommentMutation.isPending}
                          >
                            {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-8">
                <CardContent className="py-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Please log in to leave a comment
                  </p>
                  <Button asChild>
                    <Link href="/login">Log In</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Comments List */}
            {comments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {threadedComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    user={user}
                    replyingTo={replyingTo}
                    replyContent={replyContent}
                    setReplyingTo={setReplyingTo}
                    setReplyContent={setReplyContent}
                    handleSubmitReply={handleSubmitReply}
                    handleCancelReply={handleCancelReply}
                    isSubmitting={addCommentMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
          )}

          {/* Back to Blog */}
          <div className="mt-12 pt-8 border-t">
            <Button asChild>
              <Link href="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </article>
      </div>
      
      <PublicFooter />
    </div>
  );
}
