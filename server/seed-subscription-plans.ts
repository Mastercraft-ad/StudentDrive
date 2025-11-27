import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedSubscriptionPlans() {
  console.log("Seeding subscription plans...");

  const plans = [
    {
      code: "free_trial",
      name: "Free Trial",
      description: "14-day free trial with full access to all features",
      price: 0,
      billingPeriod: "trial",
      trialDays: 14,
      features: JSON.stringify([
        "Up to 100 students",
        "Up to 20 teachers",
        "Attendance tracking",
        "Grade management",
        "Basic reporting",
        "Email support"
      ]),
      maxStudents: 100,
      maxTeachers: 20,
      maxParents: 200,
      isActive: true,
      displayOrder: 0,
    },
    {
      code: "basic",
      name: "Basic",
      description: "Perfect for small schools getting started",
      price: 15000, // 15,000 NGN per month
      billingPeriod: "monthly",
      trialDays: null,
      features: JSON.stringify([
        "Up to 200 students",
        "Up to 30 teachers",
        "Attendance tracking",
        "Grade management",
        "Report card generation",
        "Fee management",
        "Timetable management",
        "Email support",
        "Basic analytics"
      ]),
      maxStudents: 200,
      maxTeachers: 30,
      maxParents: 400,
      isActive: true,
      displayOrder: 1,
    },
    {
      code: "standard",
      name: "Standard",
      description: "Ideal for growing schools with more needs",
      price: 35000, // 35,000 NGN per month
      billingPeriod: "monthly",
      trialDays: null,
      features: JSON.stringify([
        "Up to 500 students",
        "Up to 50 teachers",
        "All Basic features",
        "Online fee payment (Paystack)",
        "Parent portal access",
        "SMS notifications",
        "Advanced reporting",
        "Priority email support",
        "Custom school branding"
      ]),
      maxStudents: 500,
      maxTeachers: 50,
      maxParents: 1000,
      isActive: true,
      displayOrder: 2,
    },
    {
      code: "premium",
      name: "Premium",
      description: "For large schools requiring full feature access",
      price: 75000, // 75,000 NGN per month
      billingPeriod: "monthly",
      trialDays: null,
      features: JSON.stringify([
        "Unlimited students",
        "Unlimited teachers",
        "All Standard features",
        "Multi-branch support",
        "API access",
        "Custom integrations",
        "Dedicated account manager",
        "Phone support",
        "Training sessions",
        "Data export tools"
      ]),
      maxStudents: null,
      maxTeachers: null,
      maxParents: null,
      isActive: true,
      displayOrder: 3,
    },
  ];

  for (const plan of plans) {
    // Check if plan already exists
    const existing = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.code, plan.code))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(subscriptionPlans).values(plan);
      console.log(`Created subscription plan: ${plan.name}`);
    } else {
      console.log(`Subscription plan already exists: ${plan.name}`);
    }
  }

  console.log("Subscription plans seeded successfully!");
}

seedSubscriptionPlans()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding subscription plans:", error);
    process.exit(1);
  });
