import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Eye, ArrowRight, BookOpen, Search, X, Star } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  publishedAt: string;
  tags: string[] | null;
  category: string | null;
  featured: boolean;
  readTime: number | null;
  viewCount: number;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: posts = [], isLoading: isLoadingPosts } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts"],
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<BlogCategory[]>({
    queryKey: ["/api/blog/categories"],
  });

  // Get all unique tags from posts
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach((post) => {
      post.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [posts]);

  // Get categories that actually have posts
  const categoriesWithPosts = useMemo(() => {
    return categories
      .map((category) => ({
        ...category,
        count: posts.filter((p) => p.category === category.name).length,
      }))
      .filter((cat) => cat.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [categories, posts]);

  // Filter posts based on search, category, and tag
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt?.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter((post) => post.category === selectedCategory);
    }

    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter((post) => post.tags?.includes(selectedTag));
    }

    return filtered;
  }, [posts, searchQuery, selectedCategory, selectedTag]);

  // Featured posts
  const featuredPosts = useMemo(() => {
    return posts.filter((post) => post.featured).slice(0, 3);
  }, [posts]);

  const BlogPostCard = ({ post, featured = false }: { post: BlogPost; featured?: boolean }) => (
    <Link href={`/blog/${post.slug}`}>
      <Card
        className={`group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer ${
          featured ? "border-yellow-500 border-2" : "hover:border-primary/30"
        }`}
      >
        <div className="grid md:grid-cols-[240px_1fr] gap-6 p-6">
          {/* Image Section */}
          {post.coverImageUrl && (
            <div className="relative h-48 md:h-full min-h-[180px] overflow-hidden rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {featured && (
                <div className="absolute top-3 right-3">
                  <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                    <Star className="mr-1 h-3 w-3 fill-white" />
                    Featured
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Content Section */}
          <div className="flex flex-col justify-between space-y-3">
            {/* Meta Info */}
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {post.category && (
                  <Badge variant="outline" className="font-medium">
                    {post.category}
                  </Badge>
                )}
                {post.tags && post.tags.length > 0 && (
                  <>
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-secondary/80"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedTag(tag);
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </>
                )}
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold group-hover:text-primary transition-colors line-clamp-2 mb-3">
                {post.title}
              </h3>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-muted-foreground line-clamp-2 mb-4">
                  {post.excerpt}
                </p>
              )}
            </div>

            {/* Footer Meta */}
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
              <div className="flex items-center gap-4">
                {post.readTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime} min read</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.viewCount} views</span>
                </div>
              </div>
              <span className="text-xs">
                {format(new Date(post.publishedAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );

  if (isLoadingPosts) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading content...</div>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold">Blog</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover insights, tips, and stories to help you succeed in your academic journey
          </p>
        </div>
      </div>

      {/* Main Content with Sidebar Layout */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Active Filters */}
            {(searchQuery || (selectedCategory && selectedCategory !== "all") || selectedTag) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => setSearchQuery("")}
                    />
                  </Badge>
                )}
                {selectedCategory && selectedCategory !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedCategory}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => setSelectedCategory("all")}
                    />
                  </Badge>
                )}
                {selectedTag && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedTag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => setSelectedTag(null)}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedTag(null);
                  }}
                  className="text-xs h-7"
                >
                  Clear All
                </Button>
              </div>
            )}

            {/* Posts Heading */}
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-2xl font-bold">
                {selectedCategory && selectedCategory !== "all"
                  ? selectedCategory
                  : "Latest Articles"}
              </h2>
              <span className="text-sm text-muted-foreground">
                {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}
              </span>
            </div>

            {/* Blog Posts List */}
            {filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No articles found</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-4">
                    {searchQuery || selectedCategory !== "all" || selectedTag
                      ? "Try adjusting your filters or search query"
                      : "Check back soon for helpful tips, stories, and insights about your academic success."}
                  </p>
                  {(searchQuery || (selectedCategory && selectedCategory !== "all") || selectedTag) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                        setSelectedTag(null);
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Categories Widget */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory("all")}
                >
                  All Categories
                  <Badge variant="secondary" className="ml-auto">
                    {posts.length}
                  </Badge>
                </Button>
                {isLoadingCategories ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Loading categories...
                  </div>
                ) : categoriesWithPosts.length > 0 ? (
                  categoriesWithPosts.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.name ? "default" : "ghost"}
                      className="w-full justify-between"
                      onClick={() => setSelectedCategory(category.name)}
                    >
                      <span>{category.name}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {category.count}
                      </Badge>
                    </Button>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No categories yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Featured Posts Widget */}
            {featuredPosts.length > 0 && (
              <Card className="border-2 bg-gradient-to-br from-yellow-50 to-background dark:from-yellow-950/20 dark:to-background">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    Featured
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {featuredPosts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <div className="group cursor-pointer space-y-2 pb-4 border-b last:border-b-0 last:pb-0">
                        {post.coverImageUrl && (
                          <div className="relative h-32 overflow-hidden rounded-lg">
                            <img
                              src={post.coverImageUrl}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <h4 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {post.readTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.readTime} min
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.viewCount}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Tags Widget */}
            {allTags.length > 0 && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg">Popular Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTag === tag ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>
      
      <PublicFooter />
    </div>
  );
}
