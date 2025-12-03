import { db } from "../server/db";
import { badges } from "../shared/schema";

const badgeDefinitions = [
  // Quiz badges
  {
    name: "First Steps",
    description: "Complete your first quiz",
    icon: "Trophy",
    category: "quiz",
    xpReward: 50,
    unlockCondition: { type: "quiz_count", value: 1 },
    rarity: "common",
    sortOrder: 1,
  },
  {
    name: "Quiz Enthusiast",
    description: "Complete 10 quizzes",
    icon: "BookOpen",
    category: "quiz",
    xpReward: 100,
    unlockCondition: { type: "quiz_count", value: 10 },
    rarity: "uncommon",
    sortOrder: 2,
  },
  {
    name: "Quiz Master",
    description: "Complete 50 quizzes",
    icon: "GraduationCap",
    category: "quiz",
    xpReward: 250,
    unlockCondition: { type: "quiz_count", value: 50 },
    rarity: "rare",
    sortOrder: 3,
  },
  {
    name: "Quiz Legend",
    description: "Complete 100 quizzes",
    icon: "Crown",
    category: "quiz",
    xpReward: 500,
    unlockCondition: { type: "quiz_count", value: 100 },
    rarity: "legendary",
    sortOrder: 4,
  },
  
  // Perfect score badges
  {
    name: "Perfect Start",
    description: "Score 100% on a quiz",
    icon: "Star",
    category: "quiz",
    xpReward: 75,
    unlockCondition: { type: "perfect_score", value: 1 },
    rarity: "uncommon",
    sortOrder: 5,
  },
  {
    name: "Perfectionist",
    description: "Score 100% on 5 quizzes",
    icon: "Stars",
    category: "quiz",
    xpReward: 200,
    unlockCondition: { type: "perfect_score", value: 5 },
    rarity: "rare",
    sortOrder: 6,
  },
  {
    name: "Flawless",
    description: "Score 100% on 20 quizzes",
    icon: "Sparkles",
    category: "quiz",
    xpReward: 500,
    unlockCondition: { type: "perfect_score", value: 20 },
    rarity: "epic",
    sortOrder: 7,
  },
  
  // Streak badges
  {
    name: "Committed",
    description: "Maintain a 3-day study streak",
    icon: "Flame",
    category: "streak",
    xpReward: 50,
    unlockCondition: { type: "streak_days", value: 3 },
    rarity: "common",
    sortOrder: 8,
  },
  {
    name: "Dedicated",
    description: "Maintain a 7-day study streak",
    icon: "Zap",
    category: "streak",
    xpReward: 150,
    unlockCondition: { type: "streak_days", value: 7 },
    rarity: "uncommon",
    sortOrder: 9,
  },
  {
    name: "Unstoppable",
    description: "Maintain a 14-day study streak",
    icon: "TrendingUp",
    category: "streak",
    xpReward: 300,
    unlockCondition: { type: "streak_days", value: 14 },
    rarity: "rare",
    sortOrder: 10,
  },
  {
    name: "Habit Master",
    description: "Maintain a 30-day study streak",
    icon: "Award",
    category: "streak",
    xpReward: 750,
    unlockCondition: { type: "streak_days", value: 30 },
    rarity: "epic",
    sortOrder: 11,
  },
  
  // Learning badges
  {
    name: "Curious Mind",
    description: "View 10 study materials",
    icon: "Eye",
    category: "learning",
    xpReward: 50,
    unlockCondition: { type: "materials_viewed", value: 10 },
    rarity: "common",
    sortOrder: 12,
  },
  {
    name: "Knowledge Seeker",
    description: "View 50 study materials",
    icon: "Search",
    category: "learning",
    xpReward: 150,
    unlockCondition: { type: "materials_viewed", value: 50 },
    rarity: "uncommon",
    sortOrder: 13,
  },
  {
    name: "Scholar",
    description: "View 100 study materials",
    icon: "Library",
    category: "learning",
    xpReward: 300,
    unlockCondition: { type: "materials_viewed", value: 100 },
    rarity: "rare",
    sortOrder: 14,
  },
  
  // Spaced repetition badges
  {
    name: "Memory Training",
    description: "Complete 10 flashcard reviews",
    icon: "Brain",
    category: "learning",
    xpReward: 50,
    unlockCondition: { type: "reviews_completed", value: 10 },
    rarity: "common",
    sortOrder: 15,
  },
  {
    name: "Memory Master",
    description: "Complete 100 flashcard reviews",
    icon: "Lightbulb",
    category: "learning",
    xpReward: 200,
    unlockCondition: { type: "reviews_completed", value: 100 },
    rarity: "rare",
    sortOrder: 16,
  },
  
  // Level badges
  {
    name: "Rising Star",
    description: "Reach level 5",
    icon: "Rocket",
    category: "milestone",
    xpReward: 100,
    unlockCondition: { type: "level", value: 5 },
    rarity: "uncommon",
    sortOrder: 17,
  },
  {
    name: "Achiever",
    description: "Reach level 10",
    icon: "Medal",
    category: "milestone",
    xpReward: 250,
    unlockCondition: { type: "level", value: 10 },
    rarity: "rare",
    sortOrder: 18,
  },
  {
    name: "Champion",
    description: "Reach level 25",
    icon: "Shield",
    category: "milestone",
    xpReward: 500,
    unlockCondition: { type: "level", value: 25 },
    rarity: "epic",
    sortOrder: 19,
  },
  {
    name: "Elite",
    description: "Reach level 50",
    icon: "Gem",
    category: "milestone",
    xpReward: 1000,
    unlockCondition: { type: "level", value: 50 },
    rarity: "legendary",
    sortOrder: 20,
  },
];

async function seedBadges() {
  console.log("Seeding badges...");
  
  for (const badge of badgeDefinitions) {
    try {
      await db.insert(badges).values(badge as any).onConflictDoNothing();
      console.log(`Created badge: ${badge.name}`);
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        console.log(`Badge already exists: ${badge.name}`);
      } else {
        console.error(`Error creating badge ${badge.name}:`, error.message);
      }
    }
  }
  
  console.log("\nBadge seeding complete!");
  console.log(`Total badges defined: ${badgeDefinitions.length}`);
  process.exit(0);
}

seedBadges().catch(console.error);
