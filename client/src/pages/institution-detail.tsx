import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Star,
  MapPin,
  Globe,
  Users,
  Calendar,
  Mail,
  Phone,
  MessageSquare,
  StarOff,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Institution, InstitutionReview, User } from "@shared/schema";

type ReviewWithUser = InstitutionReview & {
  user: User;
};

export default function InstitutionDetail() {
  const params = useParams();
  const slug = params.slug as string;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const { data: institution, isLoading: isLoadingInstitution } = useQuery<
    Institution
  >({
    queryKey: ["/api/institutions/slug", slug],
    queryFn: async () => {
      const res = await fetch(`/api/institutions/slug/${slug}`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Institution not found");
        }
        throw new Error("Failed to fetch institution");
      }
      return res.json();
    },
  });

  const { data: reviews, isLoading: isLoadingReviews, error: reviewsError } = useQuery<
    ReviewWithUser[]
  >({
    queryKey: ["/api/institutions", institution?.id, "reviews"],
    queryFn: async () => {
      if (!institution?.id) return [];
      const res = await fetch(`/api/institutions/${institution.id}/reviews`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
    enabled: !!institution?.id,
    retry: 2,
  });

  // Show error toast when reviews fail to load
  useEffect(() => {
    if (reviewsError && institution?.id) {
      toast({
        title: "Error",
        description: "Failed to load reviews. Please try again later.",
        variant: "destructive",
      });
    }
  }, [reviewsError, institution?.id, toast]);

  const createReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; title?: string; comment?: string }) => {
      if (!institution?.id) throw new Error("Institution not found");
      await apiRequest("POST", `/api/institutions/${institution.id}/reviews`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/institutions", institution?.id, "reviews"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/institutions/slug", slug],
      });
      toast({
        title: "Success",
        description: "Your review has been submitted",
      });
      setIsReviewDialogOpen(false);
      setRating(5);
      setTitle("");
      setComment("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast({
        title: "Error",
        description: "Rating must be between 1 and 5 stars",
        variant: "destructive",
      });
      return;
    }
    createReviewMutation.mutate({
      rating,
      title: title.trim() || undefined,
      comment: comment.trim() || undefined,
    });
  };

  if (isLoadingInstitution) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Institution not found</h3>
              <p className="text-muted-foreground mb-4">
                The institution you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate("/institutions")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Institutions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/institutions")}
          className="gap-2"
          data-testid="button-back-to-directory"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Button>

        {/* Institution Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle
                      className="text-3xl mb-2"
                      data-testid="text-institution-name"
                    >
                      {institution.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {institution.type && (
                        <Badge variant="secondary">{institution.type}</Badge>
                      )}
                      {institution.averageRating && institution.averageRating > 0 ? (
                        <div
                          className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-md"
                          data-testid="rating-display"
                        >
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">
                            {institution.averageRating.toFixed(1)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({institution.totalReviews} review
                            {institution.totalReviews !== 1 ? "s" : ""})
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline">No reviews yet</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {institution.description && (
                  <CardDescription className="text-base">
                    {institution.description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {institution.city && institution.country && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {institution.address && `${institution.address}, `}
                      {institution.city}, {institution.country}
                      {institution.postalCode && ` ${institution.postalCode}`}
                    </p>
                  </div>
                </div>
              )}

              {institution.studentCount && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Student Population</p>
                    <p className="text-sm text-muted-foreground">
                      {institution.studentCount.toLocaleString()} students
                    </p>
                  </div>
                </div>
              )}

              {institution.founded && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Founded</p>
                    <p className="text-sm text-muted-foreground">
                      {institution.founded}
                    </p>
                  </div>
                </div>
              )}

              {institution.website && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Website</p>
                    <a
                      href={institution.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                      data-testid="link-institution-website"
                    >
                      {institution.website}
                    </a>
                  </div>
                </div>
              )}

              {institution.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a
                      href={`mailto:${institution.email}`}
                      className="text-sm text-primary hover:underline"
                      data-testid="link-institution-email"
                    >
                      {institution.email}
                    </a>
                  </div>
                </div>
              )}

              {institution.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <a
                      href={`tel:${institution.phone}`}
                      className="text-sm text-primary hover:underline"
                      data-testid="link-institution-phone"
                    >
                      {institution.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Reviews
                </CardTitle>
                <CardDescription>
                  {reviews?.length || 0} review{reviews?.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Dialog
                open={isReviewDialogOpen}
                onOpenChange={setIsReviewDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-write-review">
                    <Star className="h-4 w-4" />
                    Write a Review
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                    <DialogDescription>
                      Share your experience with {institution.name}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitReview}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="rating">Rating *</Label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="focus:outline-none transition-transform hover:scale-110"
                              data-testid={`button-rating-${star}`}
                            >
                              <Star
                                className={`h-8 w-8 ${
                                  star <= rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({rating} star{rating !== 1 ? "s" : ""})
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="title">Review Title (Optional)</Label>
                        <Input
                          id="title"
                          data-testid="input-review-title"
                          placeholder="e.g., Great academic environment"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          maxLength={255}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="comment">Your Review (Optional)</Label>
                        <Textarea
                          id="comment"
                          data-testid="textarea-review-comment"
                          placeholder="Share your thoughts about this institution..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsReviewDialogOpen(false)}
                        data-testid="button-cancel-review"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createReviewMutation.isPending}
                        data-testid="button-submit-review"
                      >
                        {createReviewMutation.isPending
                          ? "Submitting..."
                          : "Submit Review"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {isLoadingReviews ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ))}
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} data-testid={`review-${review.id}`}>
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {review.user?.firstName?.[0] || "U"}
                          {review.user?.lastName?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">
                              {review.user?.firstName} {review.user?.lastName}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              {review.verified && (
                                <Badge variant="secondary" className="text-xs">
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>

                        {review.title && (
                          <p className="font-medium">{review.title}</p>
                        )}

                        {review.comment && (
                          <p className="text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    </div>
                    <Separator className="mt-6" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <StarOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to review {institution.name}
                </p>
                <Button
                  onClick={() => setIsReviewDialogOpen(true)}
                  data-testid="button-write-first-review"
                >
                  Write the First Review
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
