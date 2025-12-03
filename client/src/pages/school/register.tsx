import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Globe,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const schoolRegistrationSchema = z.object({
  name: z.string().min(3, "School name must be at least 3 characters"),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(50, "Subdomain must be less than 50 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Subdomain can only contain lowercase letters, numbers, and hyphens"
    ),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  adminFirstName: z.string().min(1, "First name is required"),
  adminLastName: z.string().min(1, "Last name is required"),
  adminEmail: z.string().email("Please enter a valid admin email"),
  adminPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SchoolRegistrationForm = z.infer<typeof schoolRegistrationSchema>;

export default function SchoolRegister() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredSchool, setRegisteredSchool] = useState<{ subdomain: string; trialEndDate: string } | null>(null);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<SchoolRegistrationForm>({
    resolver: zodResolver(schoolRegistrationSchema),
    defaultValues: {
      country: "Nigeria",
    },
  });

  const subdomain = watch("subdomain");
  const normalizedSubdomain = subdomain?.toLowerCase().trim() || "";

  useEffect(() => {
    if (!normalizedSubdomain || normalizedSubdomain.length < 3) {
      setSubdomainStatus("idle");
      return;
    }

    const checkSubdomain = async () => {
      setSubdomainStatus("checking");
      try {
        const response = await fetch(`/api/schools/check-subdomain/${normalizedSubdomain}`);
        if (!response.ok) {
          setSubdomainStatus("idle");
          return;
        }
        const data = await response.json();
        setSubdomainStatus(data.available ? "available" : "taken");
      } catch {
        setSubdomainStatus("idle");
      }
    };

    const timeoutId = setTimeout(checkSubdomain, 500);
    return () => clearTimeout(timeoutId);
  }, [normalizedSubdomain]);

  const registerMutation = useMutation({
    mutationFn: async (data: SchoolRegistrationForm) => {
      const normalizedData = {
        ...data,
        subdomain: data.subdomain.toLowerCase().trim(),
      };
      const response = await apiRequest("POST", "/api/schools/register", {
        name: normalizedData.name,
        subdomain: normalizedData.subdomain,
        email: normalizedData.email,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country,
        adminFirstName: data.adminFirstName,
        adminLastName: data.adminLastName,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setRegisteredSchool({
        subdomain: data.school.subdomain,
        trialEndDate: data.school.trialEndDate,
      });
      setRegistrationComplete(true);
    },
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof SchoolRegistrationForm)[] = [];

    if (step === 1) {
      fieldsToValidate = ["name", "subdomain", "email", "country"];
      if (subdomainStatus !== "available") {
        return;
      }
    } else if (step === 2) {
      fieldsToValidate = ["adminFirstName", "adminLastName", "adminEmail", "adminPassword", "confirmPassword"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const onSubmit = (data: SchoolRegistrationForm) => {
    registerMutation.mutate(data);
  };

  if (registrationComplete && registeredSchool) {
    const trialEndDate = new Date(registeredSchool.trialEndDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // For testing: use current domain with subdomain as query parameter
    // Production URL would be: https://{subdomain}.studentdrive.com
    const isTestMode = !window.location.hostname.includes('studentdrive.com');
    const testPortalUrl = `${window.location.origin}/school/login?subdomain=${registeredSchool.subdomain}`;
    const productionPortalUrl = `https://${registeredSchool.subdomain}.studentdrive.com/school/login`;
    const portalUrl = isTestMode ? testPortalUrl : productionPortalUrl;
    const displayUrl = isTestMode 
      ? `${window.location.host}/school/login?subdomain=${registeredSchool.subdomain}`
      : `${registeredSchool.subdomain}.studentdrive.com`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Registration Successful!</CardTitle>
            <CardDescription>Your school portal is ready to use</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Your school portal URL:</p>
              <p className="font-mono text-primary font-medium text-sm break-all" data-testid="text-portal-url">
                {displayUrl}
              </p>
              {isTestMode && (
                <p className="text-xs text-muted-foreground mt-2">
                  (Testing mode - production URL will be: {registeredSchool.subdomain}.studentdrive.com)
                </p>
              )}
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <Badge variant="secondary" className="mb-2">14-Day Free Trial</Badge>
              <p className="text-sm text-muted-foreground">
                Your trial ends on <span className="font-medium">{trialEndDate}</span>
              </p>
            </div>
            <div className="pt-4 space-y-2">
              <Button
                className="w-full"
                onClick={() => window.open(portalUrl, "_blank")}
                data-testid="button-go-to-portal"
              >
                Go to School Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/")}
                data-testid="button-back-home"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">StudentDrive</span>
          </div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Register Your School</h1>
          <p className="text-muted-foreground">
            Create your school portal and start your 14-day free trial
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <Badge variant={step >= 1 ? "default" : "secondary"}>1</Badge>
                <span className={step >= 1 ? "font-medium" : "text-muted-foreground"}>School Info</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={step >= 2 ? "default" : "secondary"}>2</Badge>
                <span className={step >= 2 ? "font-medium" : "text-muted-foreground"}>Admin Account</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={step >= 3 ? "default" : "secondary"}>3</Badge>
                <span className={step >= 3 ? "font-medium" : "text-muted-foreground"}>Confirm</span>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {registerMutation.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {(registerMutation.error as Error).message || "Registration failed. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">School Name *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="e.g., Springfield Academy"
                        className="pl-10"
                        {...register("name")}
                        data-testid="input-school-name"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Choose Your Subdomain *</Label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="subdomain"
                          placeholder="e.g., springfield"
                          className="pl-10"
                          {...register("subdomain")}
                          data-testid="input-subdomain"
                        />
                      </div>
                      <span className="text-muted-foreground whitespace-nowrap text-sm">
                        {window.location.hostname.includes('studentdrive.com') 
                          ? '.studentdrive.com' 
                          : '(subdomain)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {subdomainStatus === "checking" && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Checking availability...
                        </span>
                      )}
                      {subdomainStatus === "available" && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Available!
                        </span>
                      )}
                      {subdomainStatus === "taken" && (
                        <span className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Already taken
                        </span>
                      )}
                    </div>
                    {errors.subdomain && (
                      <p className="text-sm text-destructive">{errors.subdomain.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">School Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="info@school.com"
                          className="pl-10"
                          {...register("email")}
                          data-testid="input-school-email"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="+234 800 000 0000"
                          className="pl-10"
                          {...register("phone")}
                          data-testid="input-school-phone"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address (Optional)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="address"
                        placeholder="123 Education Street"
                        className="pl-10"
                        {...register("address")}
                        data-testid="input-school-address"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Lagos"
                        {...register("city")}
                        data-testid="input-city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="Lagos"
                        {...register("state")}
                        data-testid="input-state"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        placeholder="Nigeria"
                        {...register("country")}
                        data-testid="input-country"
                      />
                      {errors.country && (
                        <p className="text-sm text-destructive">{errors.country.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <h3 className="font-medium mb-1">Admin Account Details</h3>
                    <p className="text-sm text-muted-foreground">
                      This will be the school administrator account with full access to manage the portal.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminFirstName">First Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="adminFirstName"
                          placeholder="John"
                          className="pl-10"
                          {...register("adminFirstName")}
                          data-testid="input-admin-first-name"
                        />
                      </div>
                      {errors.adminFirstName && (
                        <p className="text-sm text-destructive">{errors.adminFirstName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminLastName">Last Name *</Label>
                      <Input
                        id="adminLastName"
                        placeholder="Doe"
                        {...register("adminLastName")}
                        data-testid="input-admin-last-name"
                      />
                      {errors.adminLastName && (
                        <p className="text-sm text-destructive">{errors.adminLastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="admin@school.com"
                        className="pl-10"
                        {...register("adminEmail")}
                        data-testid="input-admin-email"
                      />
                    </div>
                    {errors.adminEmail && (
                      <p className="text-sm text-destructive">{errors.adminEmail.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminPassword">Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="adminPassword"
                          type="password"
                          placeholder="Min. 8 characters"
                          className="pl-10"
                          {...register("adminPassword")}
                          data-testid="input-admin-password"
                        />
                      </div>
                      {errors.adminPassword && (
                        <p className="text-sm text-destructive">{errors.adminPassword.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm password"
                          className="pl-10"
                          {...register("confirmPassword")}
                          data-testid="input-confirm-password"
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Password must contain at least 8 characters, one uppercase letter, and one number.
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-medium mb-3">Review Your Information</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">School Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium" data-testid="text-review-name">{watch("name")}</span>
                          <span className="text-muted-foreground">Portal URL:</span>
                          <span className="font-medium text-primary text-xs break-all" data-testid="text-review-url">
                            {window.location.hostname.includes('studentdrive.com')
                              ? `${watch("subdomain")}.studentdrive.com`
                              : `${window.location.host}/school/login?subdomain=${watch("subdomain")}`}
                          </span>
                          <span className="text-muted-foreground">Email:</span>
                          <span data-testid="text-review-email">{watch("email")}</span>
                          {watch("phone") && (
                            <>
                              <span className="text-muted-foreground">Phone:</span>
                              <span>{watch("phone")}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Admin Account</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium" data-testid="text-review-admin-name">
                            {watch("adminFirstName")} {watch("adminLastName")}
                          </span>
                          <span className="text-muted-foreground">Email:</span>
                          <span data-testid="text-review-admin-email">{watch("adminEmail")}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">14-Day Free Trial</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                          Get full access to all features. No credit card required. Cancel anytime.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    By registering, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep} data-testid="button-prev-step">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" onClick={() => setLocation("/")} data-testid="button-cancel">
                    Cancel
                  </Button>
                )}

                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={step === 1 && subdomainStatus === "taken"}
                    data-testid="button-next-step"
                  >
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    data-testid="button-register-school"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating School...
                      </>
                    ) : (
                      <>
                        Create School
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have a school portal?{" "}
          <a href="/school/login" className="text-primary hover:underline">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}
