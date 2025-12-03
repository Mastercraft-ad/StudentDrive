import { SpacedRepetitionReview } from "@/components/spaced-repetition-review";
import { LearningRecommendations } from "@/components/learning-recommendations";
import { GamificationProfile } from "@/components/gamification-profile";

export default function SpacedRepetitionReviewPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-section font-heading text-foreground mb-1">Review & Learn</h1>
        <p className="text-muted-foreground">
          Practice with spaced repetition to strengthen your memory
        </p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SpacedRepetitionReview />
          <LearningRecommendations />
        </div>
        
        <div className="space-y-6">
          <GamificationProfile />
        </div>
      </div>
    </div>
  );
}
