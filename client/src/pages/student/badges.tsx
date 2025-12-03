import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Zap,
  Flame,
  Target,
  Star,
  BookOpen,
  Calendar,
  Lock,
  CheckCircle,
  Award,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  xpReward: number;
  category: string;
  unlockCondition: {
    type: string;
    value: number;
  };
}

interface UserBadge {
  id: string;
  badgeId: string;
  earnedAt: string;
  badge: BadgeData;
}

interface UserGamification {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  quizzesCompleted: number;
  perfectScores: number;
  materialsViewed: number;
  reviewsCompleted: number;
}

const rarityConfig: Record<string, { color: string; bgClass: string; textClass: string }> = {
  common: { 
    color: 'gray',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    textClass: 'text-gray-700 dark:text-gray-300'
  },
  uncommon: { 
    color: 'green',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-300'
  },
  rare: { 
    color: 'blue',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-300'
  },
  epic: { 
    color: 'purple',
    bgClass: 'bg-purple-100 dark:bg-purple-900/30',
    textClass: 'text-purple-700 dark:text-purple-300'
  },
  legendary: { 
    color: 'yellow',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    textClass: 'text-yellow-700 dark:text-yellow-300'
  },
};

const categoryIcons: Record<string, typeof Trophy> = {
  quiz: Target,
  streak: Flame,
  study: BookOpen,
  achievement: Trophy,
  special: Star,
};

function getProgressForBadge(badge: BadgeData, gamification: UserGamification): { current: number; target: number } {
  const condition = badge.unlockCondition;
  let current = 0;
  
  switch (condition.type) {
    case 'quiz_count':
      current = gamification.quizzesCompleted;
      break;
    case 'perfect_score':
      current = gamification.perfectScores;
      break;
    case 'streak_days':
      current = gamification.currentStreak;
      break;
    case 'materials_viewed':
      current = gamification.materialsViewed;
      break;
    case 'reviews_completed':
      current = gamification.reviewsCompleted;
      break;
    case 'level':
      current = gamification.level;
      break;
    case 'total_xp':
      current = gamification.totalXp;
      break;
    default:
      current = 0;
  }
  
  return { current: Math.min(current, condition.value), target: condition.value };
}

function BadgeCard({ 
  badge, 
  isEarned, 
  earnedAt,
  progress,
}: { 
  badge: BadgeData; 
  isEarned: boolean; 
  earnedAt?: string;
  progress?: { current: number; target: number };
}) {
  const rarity = rarityConfig[badge.rarity] || rarityConfig.common;
  const CategoryIcon = categoryIcons[badge.category] || Trophy;
  const progressPercent = progress ? (progress.current / progress.target) * 100 : 0;
  
  return (
    <Card className={`relative overflow-hidden ${isEarned ? '' : 'opacity-75'}`} data-testid={`badge-card-${badge.id}`}>
      {isEarned && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
        </div>
      )}
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className={`p-4 rounded-full ${rarity.bgClass} ${isEarned ? '' : 'grayscale'}`}>
            <CategoryIcon className={`h-8 w-8 ${isEarned ? rarity.textClass : 'text-muted-foreground'}`} />
          </div>
          
          <div>
            <h3 className="font-semibold">{badge.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Badge variant="outline" className={`${rarity.bgClass} ${rarity.textClass} capitalize`}>
              {badge.rarity}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              +{badge.xpReward} XP
            </Badge>
          </div>
          
          {isEarned ? (
            <p className="text-xs text-muted-foreground">
              Earned {earnedAt ? new Date(earnedAt).toLocaleDateString() : 'recently'}
            </p>
          ) : progress ? (
            <div className="w-full space-y-1">
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {progress.current} / {progress.target}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span className="text-xs">Locked</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GamificationSummary({ gamification }: { gamification: UserGamification }) {
  const xpProgress = (gamification.currentLevelXp / gamification.xpToNextLevel) * 100;
  
  return (
    <Card className="mb-6">
      <CardContent className="py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">Level {gamification.level}</p>
            <div className="mt-2 space-y-1">
              <Progress value={xpProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">{gamification.currentLevelXp} / {gamification.xpToNextLevel} XP</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{gamification.currentStreak}</p>
            <p className="text-sm text-muted-foreground">Day Streak</p>
            <p className="text-xs text-muted-foreground">Best: {gamification.longestStreak}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{gamification.totalXp.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total XP</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <Target className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <p className="text-2xl font-bold">{gamification.quizzesCompleted}</p>
            <p className="text-sm text-muted-foreground">Quizzes Done</p>
            <p className="text-xs text-muted-foreground">{gamification.perfectScores} perfect</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BadgesPage() {
  const { toast } = useToast();
  
  const { data: allBadges = [], isLoading: badgesLoading } = useQuery<BadgeData[]>({
    queryKey: ["/api/badges"],
  });
  
  const { data: userBadges = [], isLoading: userBadgesLoading } = useQuery<UserBadge[]>({
    queryKey: ["/api/gamification/badges"],
  });
  
  const { data: gamification, isLoading: gamificationLoading } = useQuery<UserGamification>({
    queryKey: ["/api/gamification/profile"],
  });
  
  const checkBadgesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/gamification/check-badges"),
    onSuccess: (data: any) => {
      if (data.newBadges?.length > 0) {
        toast({
          title: "New Badges Earned!",
          description: `You earned ${data.newBadges.length} new badge(s)!`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/gamification/badges"] });
        queryClient.invalidateQueries({ queryKey: ["/api/gamification/profile"] });
      } else {
        toast({
          title: "All caught up!",
          description: "No new badges to award right now. Keep learning!",
        });
      }
    },
  });
  
  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
  
  const earnedBadges = allBadges.filter(b => earnedBadgeIds.has(b.id));
  const lockedBadges = allBadges.filter(b => !earnedBadgeIds.has(b.id));
  
  const categories = [...new Set(allBadges.map(b => b.category))];
  
  const isLoading = badgesLoading || userBadgesLoading || gamificationLoading;
  
  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-section font-heading text-foreground mb-1">Badges & Achievements</h1>
          <p className="text-muted-foreground">
            Track your progress and unlock achievements
          </p>
        </div>
        <Button 
          onClick={() => checkBadgesMutation.mutate()} 
          disabled={checkBadgesMutation.isPending}
          data-testid="button-check-badges"
        >
          <Trophy className="h-4 w-4 mr-2" />
          {checkBadgesMutation.isPending ? "Checking..." : "Check for New Badges"}
        </Button>
      </div>
      
      {gamification && <GamificationSummary gamification={gamification} />}
      
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-badges">All ({allBadges.length})</TabsTrigger>
          <TabsTrigger value="earned" data-testid="tab-earned-badges">Earned ({earnedBadges.length})</TabsTrigger>
          <TabsTrigger value="locked" data-testid="tab-locked-badges">Locked ({lockedBadges.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-8">
          {categories.map(category => {
            const categoryBadges = allBadges.filter(b => b.category === category);
            if (categoryBadges.length === 0) return null;
            
            return (
              <div key={category} className="space-y-4">
                <h2 className="text-lg font-semibold capitalize flex items-center gap-2">
                  {categoryIcons[category] && (() => {
                    const Icon = categoryIcons[category];
                    return <Icon className="h-5 w-5" />;
                  })()}
                  {category} Badges
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {categoryBadges.map(badge => {
                    const userBadge = userBadges.find(ub => ub.badgeId === badge.id);
                    return (
                      <BadgeCard
                        key={badge.id}
                        badge={badge}
                        isEarned={!!userBadge}
                        earnedAt={userBadge?.earnedAt}
                        progress={gamification && !userBadge ? getProgressForBadge(badge, gamification) : undefined}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>
        
        <TabsContent value="earned">
          {earnedBadges.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {earnedBadges.map(badge => {
                const userBadge = userBadges.find(ub => ub.badgeId === badge.id);
                return (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    isEarned={true}
                    earnedAt={userBadge?.earnedAt}
                  />
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Badges Yet</h3>
                <p className="text-muted-foreground">Complete activities to earn your first badge!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="locked">
          {lockedBadges.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lockedBadges.map(badge => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isEarned={false}
                  progress={gamification ? getProgressForBadge(badge, gamification) : undefined}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="font-semibold mb-2">All Badges Earned!</h3>
                <p className="text-muted-foreground">Congratulations! You've unlocked every badge!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
