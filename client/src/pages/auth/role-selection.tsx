import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, GraduationCap, ArrowRight } from "lucide-react";

interface RoleSelectionProps {
  onRoleSelect: (role: "student") => void;
}

export default function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<"student" | null>(null);

  const role = {
    id: "student" as const,
    title: "Student",
    description: "Access educational resources, take quizzes, and track your academic performance",
    icon: GraduationCap,
    color: "from-purple-500/20 to-purple-600/20 border-purple-500/50 hover:border-purple-500",
    iconColor: "text-purple-600 dark:text-purple-400",
    features: [
      "Access verified lecture notes and study materials",
      "Take interactive quizzes with instant feedback",
      "Track your performance with detailed analytics",
      "Bookmark favorite resources for quick access",
    ],
  };

  const handleContinue = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole);
    }
  };

  const Icon = role.icon;
  const isSelected = selectedRole === role.id;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-heading font-bold">StudentDrive</span>
          </div>
          <div>
            <CardTitle className="text-3xl">Welcome to StudentDrive</CardTitle>
            <CardDescription className="text-lg mt-2">
              Get started with your personalized learning journey
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Card
            className={`cursor-pointer transition-all ${
              isSelected
                ? `bg-gradient-to-br ${role.color} border-2`
                : "hover:shadow-lg border-2 border-transparent"
            }`}
            onClick={() => setSelectedRole(role.id)}
            data-testid="card-role-student"
          >
            <CardHeader className="text-center">
              <div className="flex justify-center mb-3">
                <div className="rounded-full p-4 bg-background/50">
                  <Icon className={`h-8 w-8 ${role.iconColor}`} />
                </div>
              </div>
              <CardTitle className="text-xl">{role.title}</CardTitle>
              <CardDescription className="text-sm">
                {role.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {role.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {selectedRole && (
            <Alert className="bg-primary/10 border-primary/50">
              <AlertDescription className="text-center">
                You've selected <strong>{role.title}</strong>. 
                Click continue to complete your profile setup.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!selectedRole}
              className="min-w-[200px]"
              data-testid="button-continue"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
