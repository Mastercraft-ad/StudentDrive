import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  GraduationCap, 
  Building2, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Eye, 
  EyeOff,
  Loader2,
  BookOpen,
  Users,
  BarChart3,
  Calendar
} from "lucide-react";
import logoImg from "@assets/StudentDrive logo_1762056464003.png";

const learnerRegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LearnerRegisterForm = z.infer<typeof learnerRegisterSchema>;

type RegisterType = "choice" | "learner" | "school";

export default function Register() {
  const [, setLocation] = useLocation();
  const [registerType, setRegisterType] = useState<RegisterType>("choice");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LearnerRegisterForm>({
    resolver: zodResolver(learnerRegisterSchema),
  });

  const onLearnerSubmit = async (data: LearnerRegisterForm) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Registration failed");
        setLoading(false);
        return;
      }

      setLocation("/login");
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Choice screen
  if (registerType === "choice") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Back to Home */}
          <Button 
            variant="ghost" 
            className="absolute top-4 left-4"
            onClick={() => setLocation("/")}
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          {/* Logo and Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <img 
                src={logoImg} 
                alt="StudentDrive Logo" 
                className="h-16 w-16 object-contain"
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
              Join StudentDrive
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Choose how you want to use StudentDrive
            </p>
          </div>

          {/* Choice Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Learner Card */}
            <Card 
              className="relative overflow-hidden border-2 hover:border-[#0ea5e9]/50 transition-all duration-300 cursor-pointer group"
              onClick={() => setRegisterType("learner")}
              data-testid="card-learner-choice"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7]"></div>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-xl bg-[#0ea5e9]/10 flex items-center justify-center group-hover:bg-[#0ea5e9]/20 transition-colors">
                    <GraduationCap className="h-8 w-8 text-[#0ea5e9]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">I'm a Learner</h3>
                    <p className="text-muted-foreground">Self-paced learning</p>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6">
                  Access study materials, take quizzes, and track your learning progress on your own terms.
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-[#0ea5e9] flex-shrink-0" />
                    <span>Access 50,000+ study materials</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-[#0ea5e9] flex-shrink-0" />
                    <span>Track your learning progress</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-[#0ea5e9] flex-shrink-0" />
                    <span>Take interactive quizzes</span>
                  </li>
                </ul>

                <Button className="w-full bg-[#0ea5e9] hover:bg-[#0284c7]" data-testid="button-select-learner">
                  Create Learner Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Free to start, upgrade anytime
                </p>
              </CardContent>
            </Card>

            {/* School Card */}
            <Card 
              className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
              onClick={() => setLocation("/school/register")}
              data-testid="card-school-choice"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary to-primary/70"></div>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">I'm a School</h3>
                    <p className="text-muted-foreground">Institution management</p>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6">
                  Complete school management solution for colleges, primary schools, and educational institutions.
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Manage students & staff</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Track attendance & grades</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Fee collection & reports</span>
                  </li>
                </ul>

                <Button className="w-full" data-testid="button-select-school">
                  Register Your School
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-xs text-muted-foreground mt-4 text-center">
                  14-day free trial, no credit card required
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Already have account */}
          <div className="text-center mt-8">
            <span className="text-muted-foreground">Already have an account? </span>
            <button
              className="text-primary hover:text-primary/80 transition-colors font-medium hover:underline"
              onClick={() => setLocation("/login")}
              data-testid="link-login"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Learner registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          {/* Back button */}
          <Button 
            variant="ghost" 
            size="sm"
            className="w-fit -ml-2"
            onClick={() => setRegisterType("choice")}
            data-testid="button-back-choice"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#0ea5e9]/10 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-[#0ea5e9]" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Create Learner Account</CardTitle>
            <CardDescription>
              Join StudentDrive to start your learning journey
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onLearnerSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive" data-testid="alert-error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                {...register("email")}
                data-testid="input-email"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className="pr-10"
                  {...register("password")}
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="pr-10"
                  {...register("confirmPassword")}
                  data-testid="input-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-toggle-confirm-password"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#0ea5e9] hover:bg-[#0284c7]" 
              disabled={loading}
              data-testid="button-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <button
                type="button"
                className="text-primary hover:text-primary/80 transition-colors font-medium hover:underline"
                onClick={() => setLocation("/login")}
                data-testid="link-login"
              >
                Sign In
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
