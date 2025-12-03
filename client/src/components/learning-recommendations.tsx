import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Lightbulb,
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  Brain,
  ChevronRight,
  X,
  CheckCircle,
  RefreshCw,
  Zap,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface LearningRecommendation {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  reason: string;
  priority: number;
  relatedMaterialId: string | null;
  relatedCourseId: string | null;
  status: string;
  xpReward: number;
  expiresAt: string | null;
  viewedAt: string | null;
  completedAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
}

const typeConfig: Record<string, { icon: typeof BookOpen; color: string; bgClass: string }> = {
  material_suggestion: { 
    icon: BookOpen, 
    color: 'text-blue-500',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30'
  },
  review_reminder: { 
    icon: Brain, 
    color: 'text-purple-500',
    bgClass: 'bg-purple-100 dark:bg-purple-900/30'
  },
  difficulty_adjustment: { 
    icon: TrendingUp, 
    color: 'text-orange-500',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30'
  },
  streak_reminder: { 
    icon: Target, 
    color: 'text-green-500',
    bgClass: 'bg-green-100 dark:bg-green-900/30'
  },
  achievement_progress: { 
    icon: Zap, 
    color: 'text-yellow-500',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
};

function RecommendationCard({ 
  recommendation,
  onComplete,
  onDismiss,
  isUpdating,
}: { 
  recommendation: LearningRecommendation;
  onComplete: () => void;
  onDismiss: () => void;
  isUpdating: boolean;
}) {
  const config = typeConfig[recommendation.type] || typeConfig.material_suggestion;
  const Icon = config.icon;
  
  const getActionLink = () => {
    if (recommendation.relatedMaterialId) {
      return `/material/${recommendation.relatedMaterialId}`;
    }
    if (recommendation.relatedCourseId) {
      return `/course/${recommendation.relatedCourseId}`;
    }
    if (recommendation.type === 'review_reminder') {
      return '/review';
    }
    return null;
  };
  
  const actionLink = getActionLink();
  
  return (
    <div 
      className="p-4 rounded-lg border bg-card hover-elevate"
      data-testid={`recommendation-${recommendation.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bgClass} flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium">{recommendation.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{recommendation.description}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 h-8 w-8"
              onClick={onDismiss}
              disabled={isUpdating}
              data-testid={`dismiss-recommendation-${recommendation.id}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {recommendation.reason}
            </Badge>
            {recommendation.xpReward > 0 && (
              <Badge variant="outline" className="text-xs gap-1">
                <Zap className="h-3 w-3" />
                +{recommendation.xpReward} XP
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            {actionLink ? (
              <Button
                size="sm"
                asChild
                onClick={onComplete}
                disabled={isUpdating}
              >
                <Link href={actionLink} data-testid={`action-recommendation-${recommendation.id}`}>
                  Start
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onComplete}
                disabled={isUpdating}
                data-testid={`complete-recommendation-${recommendation.id}`}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LearningRecommendations({ compact = false }: { compact?: boolean }) {
  const { toast } = useToast();
  
  const { data: recommendations = [], isLoading, refetch } = useQuery<LearningRecommendation[]>({
    queryKey: ["/api/recommendations"],
  });
  
  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/recommendations/generate"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({
        title: "Recommendations Updated",
        description: "New personalized recommendations have been generated!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate recommendations",
        variant: "destructive",
      });
    },
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/recommendations/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
    },
  });
  
  const activeRecommendations = recommendations.filter(r => r.status === 'active');
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (compact) {
    const topRecommendation = activeRecommendations[0];
    
    if (!topRecommendation) {
      return (
        <Card className="hover-elevate">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground">No recommendations right now</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    const config = typeConfig[topRecommendation.type] || typeConfig.material_suggestion;
    const Icon = config.icon;
    
    return (
      <Card className="hover-elevate">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-lg ${config.bgClass} flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{topRecommendation.title}</p>
                <p className="text-sm text-muted-foreground truncate">{topRecommendation.description}</p>
              </div>
            </div>
            {activeRecommendations.length > 1 && (
              <Badge variant="secondary">
                +{activeRecommendations.length - 1} more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Learning Recommendations
            </CardTitle>
            <CardDescription>
              Personalized suggestions to optimize your learning
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            data-testid="button-generate-recommendations"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeRecommendations.length > 0 ? (
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-3 pr-4">
              {activeRecommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onComplete={() => updateStatusMutation.mutate({ id: rec.id, status: 'completed' })}
                  onDismiss={() => updateStatusMutation.mutate({ id: rec.id, status: 'dismissed' })}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Active Recommendations</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click refresh to get personalized learning suggestions
            </p>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
              Generate Recommendations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
