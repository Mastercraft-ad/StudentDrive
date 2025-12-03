import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Flame,
  Zap,
  Trophy,
  Star,
  Target,
  Calendar,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";

interface UserGamification {
  id: string;
  userId: string;
  level: number;
  totalXp: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  quizzesCompleted: number;
  perfectScores: number;
  materialsViewed: number;
  reviewsCompleted: number;
}

interface UserBadge {
  id: string;
  badgeId: string;
  earnedAt: string;
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: string;
    xpReward: number;
    category: string;
  };
}

function XpProgressBar({ current, total, level }: { current: number; total: number; level: number }) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Level {level}</span>
        <span className="text-muted-foreground">{current} / {total} XP</span>
      </div>
      <div className="relative">
        <Progress value={progress} className="h-3" />
        <div 
          className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-accent border-2 border-accent-foreground flex items-center justify-center"
          style={{ right: `${100 - progress}%`, transform: 'translate(50%, -50%)' }}
        >
          <Zap className="h-3 w-3 text-accent-foreground" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {total - current} XP to level {level + 1}
      </p>
    </div>
  );
}

function StreakDisplay({ current, longest }: { current: number; longest: number }) {
  const isActiveToday = current > 0;
  
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${isActiveToday ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-muted'}`}>
        <Flame className={`h-6 w-6 ${isActiveToday ? 'text-orange-500' : 'text-muted-foreground'}`} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{current}</span>
          <span className="text-sm text-muted-foreground">day streak</span>
        </div>
        <p className="text-xs text-muted-foreground">Best: {longest} days</p>
      </div>
    </div>
  );
}

function BadgeShowcase({ badges }: { badges: UserBadge[] }) {
  const displayBadges = badges.slice(0, 5);
  const remainingCount = Math.max(0, badges.length - 5);
  
  const rarityColors: Record<string, string> = {
    common: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    uncommon: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    rare: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    epic: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    legendary: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Recent Badges</h4>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/badges" data-testid="link-all-badges">
            View all
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {displayBadges.length > 0 ? (
          <>
            {displayBadges.map((ub) => (
              <Tooltip key={ub.id}>
                <TooltipTrigger>
                  <div 
                    className={`p-2 rounded-lg ${rarityColors[ub.badge.rarity] || rarityColors.common} transition-transform hover:scale-110`}
                    data-testid={`badge-${ub.badgeId}`}
                  >
                    <Trophy className="h-5 w-5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-semibold">{ub.badge.name}</p>
                    <p className="text-xs text-muted-foreground">{ub.badge.description}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
            {remainingCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{remainingCount} more
              </Badge>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No badges earned yet. Complete activities to unlock!</p>
        )}
      </div>
    </div>
  );
}

function QuickStats({ gamification }: { gamification: UserGamification }) {
  const stats = [
    { icon: Target, label: "Quizzes", value: gamification.quizzesCompleted },
    { icon: Star, label: "Perfect Scores", value: gamification.perfectScores },
    { icon: TrendingUp, label: "Materials", value: gamification.materialsViewed },
    { icon: Calendar, label: "Reviews", value: gamification.reviewsCompleted },
  ];
  
  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((stat, i) => (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center p-2 rounded-lg hover-elevate" data-testid={`stat-${stat.label.toLowerCase()}`}>
              <stat.icon className="h-4 w-4 text-muted-foreground mb-1" />
              <span className="font-bold text-lg">{stat.value}</span>
              <span className="text-xs text-muted-foreground truncate">{stat.label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {stat.value} {stat.label.toLowerCase()} completed
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export function GamificationProfile({ compact = false }: { compact?: boolean }) {
  const { data: gamification, isLoading: gamificationLoading } = useQuery<UserGamification>({
    queryKey: ["/api/gamification/profile"],
  });
  
  const { data: badges = [], isLoading: badgesLoading } = useQuery<UserBadge[]>({
    queryKey: ["/api/gamification/badges"],
  });
  
  if (gamificationLoading || badgesLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (!gamification) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Start learning to track your progress!</p>
        </CardContent>
      </Card>
    );
  }
  
  if (compact) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Level {gamification.level}</p>
                <p className="text-xs text-muted-foreground">{gamification.totalXp} XP</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${gamification.currentStreak > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-muted'}`}>
                <Flame className={`h-5 w-5 ${gamification.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-semibold">{gamification.currentStreak}</p>
                <p className="text-xs text-muted-foreground">day streak</p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <Trophy className="h-3 w-3" />
              {badges.length}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <XpProgressBar 
          current={gamification.currentLevelXp} 
          total={gamification.xpToNextLevel} 
          level={gamification.level} 
        />
        
        <StreakDisplay 
          current={gamification.currentStreak} 
          longest={gamification.longestStreak} 
        />
        
        <QuickStats gamification={gamification} />
        
        <BadgeShowcase badges={badges} />
      </CardContent>
    </Card>
  );
}

export function GamificationMiniCard() {
  const { data: gamification, isLoading } = useQuery<UserGamification>({
    queryKey: ["/api/gamification/profile"],
  });
  
  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }
  
  if (!gamification) return null;
  
  return (
    <Link href="/badges">
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate active-elevate-2" data-testid="gamification-mini-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">Level {gamification.level}</p>
            <p className="text-xs text-muted-foreground">{gamification.totalXp} XP</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {gamification.currentStreak > 0 && (
            <Badge variant="outline" className="gap-1 bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800">
              <Flame className="h-3 w-3 text-orange-500" />
              {gamification.currentStreak}
            </Badge>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}
