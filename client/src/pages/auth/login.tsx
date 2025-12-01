import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Loader2, GraduationCap, Building2, ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import logoImg from "@assets/StudentDrive logo_1762056464003.png";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const inspirationalImages = [
  {
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80",
    quote: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela"
  },
  {
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80",
    quote: "The beautiful thing about learning is that nobody can take it away from you.",
    author: "B.B. King"
  },
  {
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80",
    quote: "The expert in anything was once a beginner.",
    author: "Helen Hayes"
  },
  {
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80",
    quote: "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.",
    author: "Abigail Adams"
  }
];

export default function Login() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"learner" | "school">("learner");
  const [learnerError, setLearnerError] = useState("");
  const [schoolError, setSchoolError] = useState("");
  const [learnerLoading, setLearnerLoading] = useState(false);
  const [showLearnerPassword, setShowLearnerPassword] = useState(false);
  const [showSchoolPassword, setShowSchoolPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const queryClient = useQueryClient();

  const [schoolFormData, setSchoolFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * inspirationalImages.length);
    setCurrentImage(randomIndex);
  }, []);

  const {
    register: registerLearner,
    handleSubmit: handleLearnerSubmit,
    formState: { errors: learnerErrors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onLearnerSubmit = async (data: LoginForm) => {
    setLearnerLoading(true);
    setLearnerError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setLearnerError(result.message || "Login failed");
        setLearnerLoading(false);
        return;
      }

      if (!result.user.emailVerified) {
        setLearnerError("Please verify your email before logging in");
        setLearnerLoading(false);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      setLocation("/");
      setLearnerLoading(false);
    } catch (err) {
      setLearnerError("An error occurred. Please try again.");
      setLearnerLoading(false);
    }
  };

  const schoolLoginMutation = useMutation({
    mutationFn: async (data: typeof schoolFormData) => {
      const response = await fetch("/api/school/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.user.role === "parent") {
        setLocation("/school/parent-dashboard");
      } else {
        setLocation("/school/dashboard");
      }
    },
    onError: (error: Error) => {
      setSchoolError(error.message || "Invalid email or password");
    },
  });

  const handleSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSchoolError("");
    schoolLoginMutation.mutate(schoolFormData);
  };

  const selectedImage = inspirationalImages[currentImage];

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center bg-slate-900 dark:bg-slate-950 p-6 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md animate-in fade-in duration-500">
          {/* Back to Home */}
          <Button 
            variant="ghost" 
            className="absolute top-4 left-4 text-slate-400 hover:text-white"
            onClick={() => setLocation("/")}
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          {/* Logo */}
          <div className="flex justify-center mb-8 mt-8">
            <div className="w-20 h-20 flex items-center justify-center transition-transform hover:scale-105 duration-300">
              <img 
                src={logoImg} 
                alt="StudentDrive Logo" 
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2" data-testid="text-login-title">
            Welcome Back
          </h1>
          <p className="text-slate-400 text-center text-sm mb-6">
            Sign in to continue your journey
          </p>

          {/* Login Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "learner" | "school")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-800">
              <TabsTrigger 
                value="learner" 
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
                data-testid="tab-learner"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Learner
              </TabsTrigger>
              <TabsTrigger 
                value="school"
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
                data-testid="tab-school"
              >
                <Building2 className="h-4 w-4 mr-2" />
                School
              </TabsTrigger>
            </TabsList>

            {/* Learner Login Form */}
            <TabsContent value="learner" className="mt-0">
              <form onSubmit={handleLearnerSubmit(onLearnerSubmit)} className="space-y-5">
                {learnerError && (
                  <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300" data-testid="alert-learner-error">
                    <AlertDescription>{learnerError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="learner-email" className="text-white text-sm font-medium">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="learner-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 h-11 
                              focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200
                              hover:bg-slate-800"
                    {...registerLearner("email")}
                    data-testid="input-learner-email"
                  />
                  {learnerErrors.email && (
                    <p className="text-sm text-red-400 animate-in slide-in-from-top-1 duration-200">
                      {learnerErrors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="learner-password" className="text-white text-sm font-medium">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <button
                      type="button"
                      className="text-sm text-primary hover:text-primary/80 transition-colors duration-200 hover:underline"
                      onClick={() => setLocation("/forgot-password")}
                      data-testid="link-learner-forgot-password"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="learner-password"
                      type={showLearnerPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 h-11 pr-11
                                focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200
                                hover:bg-slate-800"
                      {...registerLearner("password")}
                      data-testid="input-learner-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLearnerPassword(!showLearnerPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white 
                                transition-colors duration-200 p-1 rounded hover:bg-slate-700/50"
                      data-testid="button-toggle-learner-password"
                      aria-label={showLearnerPassword ? "Hide password" : "Show password"}
                    >
                      {showLearnerPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {learnerErrors.password && (
                    <p className="text-sm text-red-400 animate-in slide-in-from-top-1 duration-200">
                      {learnerErrors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="remember-learner"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    data-testid="checkbox-remember-learner"
                  />
                  <label
                    htmlFor="remember-learner"
                    className="text-sm text-slate-300 cursor-pointer select-none hover:text-white transition-colors duration-200"
                  >
                    Remember me
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 font-medium 
                            shadow-lg shadow-primary/20 hover:shadow-primary/30
                            transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={learnerLoading}
                  data-testid="button-learner-signin"
                >
                  {learnerLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign in as Learner"
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-500">Or</span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-slate-400 text-sm">Don't have an account? </span>
                  <button
                    type="button"
                    className="text-sm text-primary hover:text-primary/80 transition-colors duration-200 
                              font-medium hover:underline"
                    onClick={() => setLocation("/register")}
                    data-testid="link-learner-register"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </TabsContent>

            {/* School Login Form */}
            <TabsContent value="school" className="mt-0">
              <form onSubmit={handleSchoolSubmit} className="space-y-5">
                {schoolError && (
                  <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300" data-testid="alert-school-error">
                    <AlertDescription>{schoolError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="school-email" className="text-white text-sm font-medium">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="school-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your school email"
                    className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 h-11 
                              focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200
                              hover:bg-slate-800"
                    value={schoolFormData.email}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, email: e.target.value })}
                    required
                    disabled={schoolLoginMutation.isPending}
                    data-testid="input-school-email"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="school-password" className="text-white text-sm font-medium">
                      Password <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="school-password"
                      type={showSchoolPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 h-11 pr-11
                                focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200
                                hover:bg-slate-800"
                      value={schoolFormData.password}
                      onChange={(e) => setSchoolFormData({ ...schoolFormData, password: e.target.value })}
                      required
                      disabled={schoolLoginMutation.isPending}
                      data-testid="input-school-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSchoolPassword(!showSchoolPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white 
                                transition-colors duration-200 p-1 rounded hover:bg-slate-700/50"
                      data-testid="button-toggle-school-password"
                      aria-label={showSchoolPassword ? "Hide password" : "Show password"}
                    >
                      {showSchoolPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 font-medium 
                            shadow-lg shadow-primary/20 hover:shadow-primary/30
                            transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={schoolLoginMutation.isPending}
                  data-testid="button-school-signin"
                >
                  {schoolLoginMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign in to School Portal"
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-500">Or</span>
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <p className="text-slate-400 text-sm">
                    Want to register your school?{" "}
                    <button
                      type="button"
                      className="text-primary hover:text-primary/80 transition-colors duration-200 font-medium hover:underline"
                      onClick={() => setLocation("/school/register")}
                      data-testid="link-school-register"
                    >
                      Start free trial
                    </button>
                  </p>
                  <p className="text-slate-500 text-xs">
                    Contact your school administrator if you have trouble logging in.
                  </p>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Side - Image with Quote (Desktop Only) */}
      <div 
        className="hidden lg:flex lg:w-3/5 relative bg-cover bg-center transition-all duration-700 ease-in-out"
        style={{ backgroundImage: `url(${selectedImage.image})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          <blockquote className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-12 h-1 bg-gradient-to-r from-primary to-primary/70 rounded-full mb-6"></div>
            <p className="text-white text-2xl lg:text-3xl font-medium leading-relaxed" data-testid="text-quote">
              "{selectedImage.quote}"
            </p>
            <footer className="text-white/90 text-lg font-light" data-testid="text-author">
              {selectedImage.author}
            </footer>
          </blockquote>
        </div>

        {/* Stats Cards */}
        <div className="absolute top-8 right-8 flex flex-col gap-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 flex items-center gap-3 
                        hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">500+</div>
              <div className="text-sm text-muted-foreground">Schools</div>
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 flex items-center gap-3 
                        hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="w-12 h-12 bg-[#0ea5e9]/10 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-[#0ea5e9]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">50K+</div>
              <div className="text-sm text-muted-foreground">Learners</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
