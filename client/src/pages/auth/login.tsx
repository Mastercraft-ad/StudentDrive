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
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import goldenBridgeImg from "@assets/image_1762055411999.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const inspirationalImages = [
  {
    image: goldenBridgeImg,
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
    <div className="min-h-screen flex">
      {/* Left Side - Login Form (Desktop: 40%, Mobile: Full) */}
      <div className="w-full lg:w-2/5 flex items-center justify-center bg-slate-900 dark:bg-slate-950 p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo/Avatar */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-8" data-testid="text-login-title">
            Sign In Below
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive" data-testid="alert-error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email/Username Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email/Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter your username or email address"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                {...register("email")}
                data-testid="input-email"
              />
              {errors.email && (
                <p className="text-sm text-red-400" data-testid="text-email-error">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white">
                  Password <span className="text-red-500">*</span>
                </Label>
                <button
                  type="button"
                  className="p-0 h-auto text-blue-400 hover:text-blue-300 text-sm"
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
                  placeholder="Enter your password"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 pr-10"
                  {...register("password")}
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-400" data-testid="text-password-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-slate-600"
                data-testid="checkbox-remember"
              />
              <label
                htmlFor="remember"
                className="text-sm text-white cursor-pointer"
              >
                Remember me?
              </label>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
              data-testid="button-signin"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            {/* Register Link */}
            <div className="text-center text-sm">
              <span className="text-slate-400">Don't have an account? </span>
              <button
                type="button"
                className="p-0 h-auto text-blue-400 hover:text-blue-300"
                onClick={() => setLocation("/register")}
                data-testid="link-register"
              >
                Register
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Image with Quote (Desktop Only) */}
      <div 
        className="hidden lg:flex lg:w-3/5 relative bg-cover bg-center"
        style={{ backgroundImage: `url(${selectedImage.image})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30"></div>
        
        {/* Quote Section */}
        <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-black/80 to-transparent">
          <blockquote className="space-y-4">
            <p className="text-white text-2xl font-medium italic leading-relaxed" data-testid="text-quote">
              "{selectedImage.quote}"
            </p>
            <footer className="text-white/90 text-lg" data-testid="text-author">
              — {selectedImage.author}
            </footer>
          </blockquote>
          
          {/* Optional: Copyright/Credit */}
          <div className="mt-8 text-white/60 text-sm" data-testid="text-copyright">
            Copyright 2025 © Moses Pius - Software Engineer, Version 1.1.1
          </div>
        </div>

        {/* Optional: Success Rate Badge */}
        <div className="absolute top-8 right-8 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3" data-testid="card-success-rate">
          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">95%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
