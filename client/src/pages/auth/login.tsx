import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, Eye, EyeOff, Loader2, TrendingUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required").email("Invalid email address").or(z.string().min(3, "Username must be at least 3 characters")),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const inspirationalImages = [
  {
    image: "/attached_assets/image_1762055411999.png",
    quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  },
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * inspirationalImages.length);
    setCurrentImage(randomIndex);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Login failed");
        setLoading(false);
        return;
      }

      if (!result.user.emailVerified) {
        setError("Please verify your email before logging in");
        setLoading(false);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      setLocation("/");
      setLoading(false);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const selectedImage = inspirationalImages[currentImage];

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Login Form (Desktop: 40%, Mobile: Full) */}
      <div className="w-full lg:w-2/5 flex items-center justify-center bg-slate-900 dark:bg-slate-950 p-6 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md animate-in fade-in duration-500">
          {/* Logo/Avatar with pulse animation */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 transition-transform hover:scale-105 duration-300">
              <BookOpen className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2" data-testid="text-login-title">
            Sign In Below
          </h1>
          <p className="text-slate-400 text-center text-sm mb-8">
            Welcome back! Please enter your credentials.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300" data-testid="alert-error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email/Username Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-sm font-medium">
                Email/Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="text"
                autoComplete="username"
                placeholder="Enter your username or email address"
                className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 h-11 
                          focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200
                          hover:bg-slate-800"
                {...register("email")}
                data-testid="input-email"
              />
              {errors.email && (
                <p className="text-sm text-red-400 animate-in slide-in-from-top-1 duration-200" data-testid="text-email-error">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="password" className="text-white text-sm font-medium">
                  Password <span className="text-red-500">*</span>
                </Label>
                <button
                  type="button"
                  className="text-sm text-primary hover:text-primary/80 transition-colors duration-200 hover:underline"
                  onClick={() => setLocation("/forgot-password")}
                  data-testid="link-forgot-password"
                >
                  Lost your password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 h-11 pr-11
                            focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200
                            hover:bg-slate-800"
                  {...register("password")}
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white 
                            transition-colors duration-200 p-1 rounded hover:bg-slate-700/50"
                  data-testid="button-toggle-password"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-400 animate-in slide-in-from-top-1 duration-200" data-testid="text-password-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                data-testid="checkbox-remember"
              />
              <label
                htmlFor="remember"
                className="text-sm text-slate-300 cursor-pointer select-none hover:text-white transition-colors duration-200"
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 font-medium 
                        shadow-lg shadow-primary/20 hover:shadow-primary/30
                        transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              data-testid="button-signin"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">Or</span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <span className="text-slate-400 text-sm">Don't have an account? </span>
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 transition-colors duration-200 
                          font-medium hover:underline"
                onClick={() => setLocation("/register")}
                data-testid="link-register"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Image with Quote (Desktop Only) */}
      <div 
        className="hidden lg:flex lg:w-3/5 relative bg-cover bg-center transition-all duration-700 ease-in-out"
        style={{ backgroundImage: `url(${selectedImage.image})` }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50"></div>
        
        {/* Quote Section */}
        <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          <blockquote className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-6"></div>
            <p className="text-white text-2xl lg:text-3xl font-medium leading-relaxed" data-testid="text-quote">
              "{selectedImage.quote}"
            </p>
            <footer className="text-white/90 text-lg font-light" data-testid="text-author">
              — {selectedImage.author}
            </footer>
          </blockquote>
        </div>

        {/* Success Rate Badge */}
        <div className="absolute top-8 right-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-5 flex items-center gap-4 
                      hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-top-4 duration-500" 
                      data-testid="card-success-rate">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center 
                        shadow-lg shadow-green-500/30">
            <TrendingUp className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              95%
            </div>
            <div className="text-sm text-gray-600 font-medium">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
