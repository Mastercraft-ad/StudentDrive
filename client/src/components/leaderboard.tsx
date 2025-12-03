import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy,
  Medal,
  Crown,
  Zap,
  Flame,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  totalXp: number;
  level: number;
  currentStreak: number;
  weeklyXp?: number;
  monthlyXp?: number;
}

const positionStyles: Record<number, { icon: typeof Trophy; color: string; bgClass: string }> = {
  1: { icon: Crown, color: 'text-yellow-500', bgClass: 'bg-yellow-100 dark:bg-yellow-900/30' },
  2: { icon: Medal, color: 'text-gray-400', bgClass: 'bg-gray-100 dark:bg-gray-800' },
  3: { icon: Medal, color: 'text-orange-400', bgClass: 'bg-orange-100 dark:bg-orange-900/30' },
};

function LeaderboardRow({ entry, currentUserId }: { entry: LeaderboardEntry; currentUserId?: string }) {
  const isCurrentUser = entry.userId === currentUserId;
  const positionConfig = positionStyles[entry.rank];
  const PositionIcon = positionConfig?.icon || null;
  
  return (
    <div 
      className={`flex items-center gap-4 p-3 rounded-lg ${isCurrentUser ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover-elevate'}`}
      data-testid={`leaderboard-entry-${entry.rank}`}
    >
      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${positionConfig?.bgClass || 'bg-muted'}`}>
        {PositionIcon ? (
          <PositionIcon className={`h-5 w-5 ${positionConfig?.color}`} />
        ) : (
          <span className="font-bold text-muted-foreground">{entry.rank}</span>
        )}
      </div>
      
      <Avatar className="h-10 w-10">
        <AvatarImage src={entry.profileImageUrl || undefined} />
        <AvatarFallback>
          {entry.firstName?.[0]}{entry.lastName?.[0]}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {entry.firstName} {entry.lastName}
          {isCurrentUser && <span className="text-xs text-muted-foreground ml-2">(You)</span>}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Level {entry.level}
          </span>
          {entry.currentStreak > 0 && (
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {entry.currentStreak}
            </span>
          )}
        </div>
      </div>
      
      <div className="text-right">
        <p className="font-bold flex items-center gap-1">
          <Zap className="h-4 w-4 text-primary" />
          {entry.totalXp.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">XP</p>
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export function Leaderboard({ 
  compact = false,
  limit = 10,
}: { 
  compact?: boolean;
  limit?: number;
}) {
  const { user } = useAuth();
  
  const { data: weeklyLeaderboard = [], isLoading: weeklyLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard", "weekly"],
  });
  
  const { data: allTimeLeaderboard = [], isLoading: allTimeLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard", "all-time"],
  });
  
  if (compact) {
    const topEntries = allTimeLeaderboard.slice(0, 3);
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-5 w-5 text-primary" />
            Top Learners
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allTimeLoading ? (
            <LeaderboardSkeleton />
          ) : topEntries.length > 0 ? (
            <div className="space-y-2">
              {topEntries.map((entry) => (
                <LeaderboardRow key={entry.userId} entry={entry} currentUserId={user?.id} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No leaderboard data available yet
            </p>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Leaderboard
        </CardTitle>
        <CardDescription>See how you rank against other learners</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly">
          <TabsList className="mb-4">
            <TabsTrigger value="weekly" data-testid="tab-weekly-leaderboard">This Week</TabsTrigger>
            <TabsTrigger value="all-time" data-testid="tab-alltime-leaderboard">All Time</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly">
            <ScrollArea className="h-[400px]">
              {weeklyLoading ? (
                <LeaderboardSkeleton />
              ) : weeklyLeaderboard.length > 0 ? (
                <div className="space-y-2 pr-4">
                  {weeklyLeaderboard.slice(0, limit).map((entry) => (
                    <LeaderboardRow key={entry.userId} entry={entry} currentUserId={user?.id} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-1">No Activity This Week</h3>
                  <p className="text-sm text-muted-foreground">
                    Be the first to earn XP this week!
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="all-time">
            <ScrollArea className="h-[400px]">
              {allTimeLoading ? (
                <LeaderboardSkeleton />
              ) : allTimeLeaderboard.length > 0 ? (
                <div className="space-y-2 pr-4">
                  {allTimeLeaderboard.slice(0, limit).map((entry) => (
                    <LeaderboardRow key={entry.userId} entry={entry} currentUserId={user?.id} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-1">No Leaderboard Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Start learning to appear on the leaderboard!
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
