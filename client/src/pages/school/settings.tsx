import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Palette,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Upload,
  Save,
  RefreshCw,
  CheckCircle2,
  Image,
  Link2,
  BookOpen,
} from "lucide-react";

interface SchoolSettings {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  phone: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  primaryColor: string;
  secondaryColor: string;
  allowPublicPlatformAccess: boolean;
}

const schoolInfoSchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

const brandingSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
});

type SchoolInfoFormData = z.infer<typeof schoolInfoSchema>;
type BrandingFormData = z.infer<typeof brandingSchema>;

export default function SchoolSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  const { data: school, isLoading } = useQuery<SchoolSettings>({
    queryKey: ["/api/school/me"],
  });

  const infoForm = useForm<SchoolInfoFormData>({
    resolver: zodResolver(schoolInfoSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
    },
    values: school ? {
      name: school.name,
      email: school.email || "",
      phone: school.phone || "",
      address: school.address || "",
      city: school.city || "",
      state: school.state || "",
      country: school.country || "",
    } : undefined,
  });

  const brandingForm = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logoUrl: "",
      primaryColor: "#3b82f6",
      secondaryColor: "#1e40af",
    },
    values: school ? {
      logoUrl: school.logoUrl || "",
      primaryColor: school.primaryColor || "#3b82f6",
      secondaryColor: school.secondaryColor || "#1e40af",
    } : undefined,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<SchoolInfoFormData & BrandingFormData & { allowPublicPlatformAccess: boolean }>) => {
      return await apiRequest("PATCH", "/api/school/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/me"] });
      toast({
        title: "Settings Updated",
        description: "Your school settings have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleInfoSubmit = (data: SchoolInfoFormData) => {
    updateSettingsMutation.mutate(data);
  };

  const handleBrandingSubmit = (data: BrandingFormData) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="School Settings"
        description="Manage your school profile, branding, and preferences"
      />

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2" data-testid="tab-general">
              <Building2 className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2" data-testid="tab-branding">
              <Palette className="h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2" data-testid="tab-integrations">
              <Link2 className="h-4 w-4" />
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  School Information
                </CardTitle>
                <CardDescription>
                  Update your school's basic information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...infoForm}>
                  <form onSubmit={infoForm.handleSubmit(handleInfoSubmit)} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={infoForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter school name" 
                                {...field} 
                                data-testid="input-school-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <Label>Subdomain</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={school?.subdomain || ""} 
                            disabled 
                            className="bg-muted"
                            data-testid="input-subdomain"
                          />
                          <Badge variant="secondary">.studentdrive.com</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Subdomain cannot be changed after registration
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={infoForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="school@example.com" 
                                {...field} 
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={infoForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Phone
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="+234 123 456 7890" 
                                {...field} 
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </h4>
                      
                      <FormField
                        control={infoForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Street address" 
                                {...field} 
                                data-testid="input-address"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          control={infoForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="City" 
                                  {...field} 
                                  data-testid="input-city"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={infoForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="State" 
                                  {...field} 
                                  data-testid="input-state"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={infoForm.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Country" 
                                  {...field} 
                                  data-testid="input-country"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => infoForm.reset()}
                        data-testid="button-reset-info"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateSettingsMutation.isPending}
                        data-testid="button-save-info"
                      >
                        {updateSettingsMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Branding & Appearance
                </CardTitle>
                <CardDescription>
                  Customize your school's visual identity with logo and colors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...brandingForm}>
                  <form onSubmit={brandingForm.handleSubmit(handleBrandingSubmit)} className="space-y-6">
                    <FormField
                      control={brandingForm.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            School Logo
                          </FormLabel>
                          <div className="flex items-start gap-4">
                            <div className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                              {field.value ? (
                                <img 
                                  src={field.value} 
                                  alt="School logo" 
                                  className="h-full w-full object-contain rounded-lg"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Upload className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <FormControl>
                                <Input 
                                  placeholder="https://example.com/logo.png" 
                                  {...field} 
                                  data-testid="input-logo-url"
                                />
                              </FormControl>
                              <FormDescription>
                                Enter a URL to your school logo. Recommended size: 200x200 pixels.
                              </FormDescription>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Brand Colors</h4>
                      <p className="text-sm text-muted-foreground">
                        Choose colors that represent your school. These will be used throughout your portal.
                      </p>

                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={brandingForm.control}
                          name="primaryColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Color</FormLabel>
                              <div className="flex items-center gap-3">
                                <div 
                                  className="h-12 w-12 rounded-lg border-2 shadow-sm"
                                  style={{ backgroundColor: field.value }}
                                />
                                <FormControl>
                                  <div className="flex-1 flex items-center gap-2">
                                    <Input 
                                      type="color"
                                      className="h-10 w-14 p-1 cursor-pointer"
                                      value={field.value}
                                      onChange={(e) => field.onChange(e.target.value)}
                                      data-testid="input-primary-color-picker"
                                    />
                                    <Input 
                                      placeholder="#3b82f6" 
                                      {...field}
                                      className="font-mono"
                                      data-testid="input-primary-color"
                                    />
                                  </div>
                                </FormControl>
                              </div>
                              <FormDescription>
                                Used for buttons, links, and accents
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={brandingForm.control}
                          name="secondaryColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Secondary Color</FormLabel>
                              <div className="flex items-center gap-3">
                                <div 
                                  className="h-12 w-12 rounded-lg border-2 shadow-sm"
                                  style={{ backgroundColor: field.value }}
                                />
                                <FormControl>
                                  <div className="flex-1 flex items-center gap-2">
                                    <Input 
                                      type="color"
                                      className="h-10 w-14 p-1 cursor-pointer"
                                      value={field.value}
                                      onChange={(e) => field.onChange(e.target.value)}
                                      data-testid="input-secondary-color-picker"
                                    />
                                    <Input 
                                      placeholder="#1e40af" 
                                      {...field}
                                      className="font-mono"
                                      data-testid="input-secondary-color"
                                    />
                                  </div>
                                </FormControl>
                              </div>
                              <FormDescription>
                                Used for hover states and backgrounds
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Preview</h4>
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-4 mb-4">
                          {brandingForm.watch("logoUrl") ? (
                            <img 
                              src={brandingForm.watch("logoUrl")} 
                              alt="Logo preview" 
                              className="h-12 w-12 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">{school?.name || "Your School"}</h3>
                            <p className="text-sm text-muted-foreground">{school?.subdomain}.studentdrive.com</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            type="button"
                            style={{ backgroundColor: brandingForm.watch("primaryColor") }}
                            className="text-white"
                          >
                            Primary Button
                          </Button>
                          <Button 
                            type="button"
                            variant="outline"
                            style={{ 
                              borderColor: brandingForm.watch("primaryColor"),
                              color: brandingForm.watch("primaryColor"),
                            }}
                          >
                            Outline Button
                          </Button>
                          <Badge 
                            style={{ backgroundColor: brandingForm.watch("secondaryColor") }}
                            className="text-white"
                          >
                            Badge
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => brandingForm.reset()}
                        data-testid="button-reset-branding"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateSettingsMutation.isPending}
                        data-testid="button-save-branding"
                      >
                        {updateSettingsMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Apply Branding
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Platform Integration
                </CardTitle>
                <CardDescription>
                  Connect your school to the StudentDrive public platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span className="font-medium">Public Platform Access</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Allow your students to access the StudentDrive public learning platform, 
                      including shared resources, quizzes, and community features.
                    </p>
                  </div>
                  <Switch
                    checked={school?.allowPublicPlatformAccess || false}
                    onCheckedChange={(checked) => {
                      updateSettingsMutation.mutate({ allowPublicPlatformAccess: checked });
                    }}
                    data-testid="switch-public-platform-access"
                  />
                </div>

                {school?.allowPublicPlatformAccess && (
                  <div className="space-y-4 p-4 rounded-lg border border-green-500/20 bg-green-500/10">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Public Platform Access Enabled</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>Your students can now access the following features:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Browse and access shared educational resources</li>
                        <li>Participate in public quizzes and assessments</li>
                        <li>Join study groups and community discussions</li>
                        <li>Access their personal learning dashboard</li>
                      </ul>
                      <p className="mt-4">
                        Students can access the platform using their school credentials. Their 
                        activity on the public platform will be associated with your school.
                      </p>
                    </div>
                  </div>
                )}

                {!school?.allowPublicPlatformAccess && (
                  <div className="space-y-4 p-4 rounded-lg border border-muted bg-muted/30">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-5 w-5" />
                      <span className="font-medium">Public Platform Access Disabled</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        When enabled, your students will be able to access the StudentDrive 
                        public learning platform. This includes:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                        <li>Access to thousands of shared educational resources</li>
                        <li>Public quizzes and practice assessments</li>
                        <li>Community features and study groups</li>
                        <li>Personalized learning recommendations</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
