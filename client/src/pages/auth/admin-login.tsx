import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Shield, ArrowLeft, Lock } from "lucide-react";
import logoImg from "@assets/StudentDrive logo_1762056464003.png";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

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

      if (result.user.role !== "admin" && result.user.role !== "super_admin") {
        setError("Access denied. This portal is for administrators only.");
        await fetch("/api/auth/logout", { method: "POST" });
        setLoading(false);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      if (result.user.role === "super_admin") {
        setLocation("/super-admin/dashboard");
      } else {
        setLocation("/admin/dashboard");
      }
      setLoading(false);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
      
      <Card className="w-full max-w-md relative z-10 bg-slate-900/95 border-slate-700 shadow-2xl">
        <CardHeader className="space-y-4 text-center pb-2">
          <Button 
            variant="ghost" 
            size="sm"
            className="absolute top-4 left-4 text-slate-400 hover:text-white"
            onClick={() => setLocation("/")}
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Home
          </Button>
          
          <div className="flex justify-center pt-4">
            <div className="w-16 h-16 flex items-center justify-center">
              <img 
                src={logoImg} 
                alt="StudentDrive Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl text-white" data-testid="text-admin-login-title">
                Admin Portal
              </CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Secure access for platform administrators
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300" data-testid="alert-admin-error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-white text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                placeholder="Enter your admin email"
                className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 h-11 
                          focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                {...register("email")}
                data-testid="input-admin-email"
              />
              {errors.email && (
                <p className="text-sm text-red-400 animate-in slide-in-from-top-1 duration-200">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-white text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 h-11 pr-11
                            focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  {...register("password")}
                  data-testid="input-admin-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 w-11 text-slate-400 hover:text-white hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-400 animate-in slide-in-from-top-1 duration-200">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium
                        transition-all duration-200 shadow-lg shadow-primary/20"
              disabled={loading}
              data-testid="button-admin-login"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              This is a restricted area. Unauthorized access attempts are logged and monitored.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
