import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
  RefreshCw,
  ChevronRight,
  CheckCircle,
  XCircle,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Timer,
  Zap,
  Calendar,
  BookOpen,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SpacedRepetitionCard {
  id: string;
  userId: string;
  materialId: string | null;
  quizQuestionId: string | null;
  cardType: string;
  front: string;
  back: string;
  difficulty: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  createdAt: string;
}

interface ReviewSession {
  cards: SpacedRepetitionCard[];
  totalCards: number;
  reviewedToday: number;
}

const qualityLabels = [
  { value: 0, label: "Complete Blackout", icon: XCircle, color: "text-red-500" },
  { value: 1, label: "Wrong, but recognized", icon: ThumbsDown, color: "text-orange-500" },
  { value: 2, label: "Wrong, but easy to recall", icon: ThumbsDown, color: "text-yellow-500" },
  { value: 3, label: "Correct, difficult recall", icon: ThumbsUp, color: "text-blue-500" },
  { value: 4, label: "Correct, some hesitation", icon: ThumbsUp, color: "text-green-500" },
  { value: 5, label: "Perfect recall", icon: CheckCircle, color: "text-green-600" },
];

function FlashCard({ 
  card, 
  isFlipped, 
  onFlip 
}: { 
  card: SpacedRepetitionCard;
  isFlipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div 
      className="relative w-full cursor-pointer perspective-1000"
      style={{ minHeight: '250px' }}
      onClick={onFlip}
      data-testid="flashcard"
    >
      <div 
        className={`absolute w-full h-full transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        <Card 
          className="absolute w-full h-full backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Badge variant="secondary" className="mb-4">Front</Badge>
            <p className="text-lg font-medium">{card.front}</p>
            <p className="text-sm text-muted-foreground mt-4">Click to reveal answer</p>
          </CardContent>
        </Card>
        
        <Card 
          className="absolute w-full h-full backface-hidden bg-muted/50"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Badge variant="secondary" className="mb-4">Answer</Badge>
            <p className="text-lg font-medium">{card.back}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RatingButtons({ 
  onRate, 
  isSubmitting 
}: { 
  onRate: (quality: number) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">How well did you know this?</p>
      <div className="grid grid-cols-3 gap-2">
        {qualityLabels.slice(0, 3).map((q) => (
          <Button
            key={q.value}
            variant="outline"
            size="sm"
            className="flex-col h-auto py-2"
            onClick={() => onRate(q.value)}
            disabled={isSubmitting}
            data-testid={`rate-button-${q.value}`}
          >
            <q.icon className={`h-4 w-4 mb-1 ${q.color}`} />
            <span className="text-xs">{q.label}</span>
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {qualityLabels.slice(3).map((q) => (
          <Button
            key={q.value}
            variant="outline"
            size="sm"
            className="flex-col h-auto py-2"
            onClick={() => onRate(q.value)}
            disabled={isSubmitting}
            data-testid={`rate-button-${q.value}`}
          >
            <q.icon className={`h-4 w-4 mb-1 ${q.color}`} />
            <span className="text-xs">{q.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

export function SpacedRepetitionReview() {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  
  const { data: session, isLoading, refetch } = useQuery<ReviewSession>({
    queryKey: ["/api/spaced-repetition/due"],
  });
  
  const reviewMutation = useMutation({
    mutationFn: ({ cardId, quality }: { cardId: string; quality: number }) => 
      apiRequest("POST", `/api/spaced-repetition/${cardId}/review`, { quality }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/profile"] });
      
      if (session && currentIndex < session.cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        setSessionComplete(true);
        toast({
          title: "Review Complete!",
          description: "Great job! You've finished all your reviews for now.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleRate = (quality: number) => {
    if (!session?.cards[currentIndex]) return;
    reviewMutation.mutate({ 
      cardId: session.cards[currentIndex].id, 
      quality 
    });
  };
  
  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionComplete(false);
    refetch();
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (!session || session.cards.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h3 className="font-semibold text-lg mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground mb-4">
            No cards due for review right now. Come back later!
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Reviewed today: {session?.reviewedToday || 0} cards</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (sessionComplete) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h3 className="font-semibold text-lg mb-2">Session Complete!</h3>
          <p className="text-muted-foreground mb-4">
            You reviewed {session.cards.length} card{session.cards.length !== 1 ? 's' : ''}.
          </p>
          <Button onClick={handleRestart} data-testid="button-restart-review">
            <RotateCcw className="h-4 w-4 mr-2" />
            Check for More Cards
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const currentCard = session.cards[currentIndex];
  const progress = ((currentIndex + 1) / session.cards.length) * 100;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Spaced Repetition Review
            </CardTitle>
            <CardDescription>
              Card {currentIndex + 1} of {session.cards.length}
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            +5 XP per card
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <FlashCard 
          card={currentCard} 
          isFlipped={isFlipped} 
          onFlip={() => setIsFlipped(!isFlipped)} 
        />
        
        {isFlipped && (
          <RatingButtons 
            onRate={handleRate} 
            isSubmitting={reviewMutation.isPending} 
          />
        )}
        
        {!isFlipped && (
          <div className="text-center">
            <Button 
              onClick={() => setIsFlipped(true)}
              data-testid="button-show-answer"
            >
              Show Answer
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Timer className="h-4 w-4" />
          <span>Interval: {currentCard.interval} days</span>
        </div>
        <div className="flex items-center gap-1">
          <RefreshCw className="h-4 w-4" />
          <span>{currentCard.repetitions} reviews</span>
        </div>
      </CardFooter>
    </Card>
  );
}

export function SpacedRepetitionWidget() {
  const { data: session, isLoading } = useQuery<ReviewSession>({
    queryKey: ["/api/spaced-repetition/due"],
  });
  
  if (isLoading) {
    return <Skeleton className="h-24" />;
  }
  
  const dueCount = session?.cards.length || 0;
  
  return (
    <Card className="hover-elevate">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${dueCount > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
              <Brain className={`h-5 w-5 ${dueCount > 0 ? 'text-orange-500' : 'text-green-500'}`} />
            </div>
            <div>
              <p className="font-medium">Spaced Repetition</p>
              <p className="text-sm text-muted-foreground">
                {dueCount > 0 
                  ? `${dueCount} card${dueCount !== 1 ? 's' : ''} due for review` 
                  : 'All caught up!'}
              </p>
            </div>
          </div>
          {dueCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              +{dueCount * 5} XP
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
