import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  CreditCard, 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Users,
  GraduationCap,
  Layers,
  Crown,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const planFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  monthlyPrice: z.coerce.number().min(0, "Price must be 0 or more"),
  yearlyPrice: z.coerce.number().min(0, "Price must be 0 or more"),
  maxStudents: z.coerce.number().min(1, "Must have at least 1 student"),
  maxTeachers: z.coerce.number().min(1, "Must have at least 1 teacher"),
  maxClasses: z.coerce.number().min(1, "Must have at least 1 class"),
  features: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  maxStudents: number;
  maxTeachers: number;
  maxClasses: number;
  features: string[] | null;
  isActive: boolean;
  isFeatured: boolean;
  subscribersCount?: number;
}

export default function SuperAdminSubscriptionPlans() {
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const { toast } = useToast();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      description: "",
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxStudents: 100,
      maxTeachers: 10,
      maxClasses: 10,
      features: "",
      isActive: true,
      isFeatured: false,
    },
  });

  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/super-admin/subscription-plans"],
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: PlanFormValues) => {
      const payload = {
        ...data,
        features: data.features?.split("\n").filter(Boolean) || [],
      };
      return await apiRequest("POST", "/api/super-admin/subscription-plans", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/subscription-plans"] });
      toast({ title: "Success", description: "Plan created successfully" });
      setShowPlanDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, data }: { planId: string; data: PlanFormValues }) => {
      const payload = {
        ...data,
        features: data.features?.split("\n").filter(Boolean) || [],
      };
      return await apiRequest("PATCH", `/api/super-admin/subscription-plans/${planId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/subscription-plans"] });
      toast({ title: "Success", description: "Plan updated successfully" });
      setShowPlanDialog(false);
      setEditingPlan(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest("DELETE", `/api/super-admin/subscription-plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/subscription-plans"] });
      toast({ title: "Success", description: "Plan deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    form.reset({
      name: "",
      description: "",
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxStudents: 100,
      maxTeachers: 10,
      maxClasses: 10,
      features: "",
      isActive: true,
      isFeatured: false,
    });
    setShowPlanDialog(true);
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    form.reset({
      name: plan.name,
      description: plan.description || "",
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      maxStudents: plan.maxStudents,
      maxTeachers: plan.maxTeachers,
      maxClasses: plan.maxClasses,
      features: plan.features?.join("\n") || "",
      isActive: plan.isActive,
      isFeatured: plan.isFeatured,
    });
    setShowPlanDialog(true);
  };

  const onSubmit = (data: PlanFormValues) => {
    if (editingPlan) {
      updatePlanMutation.mutate({ planId: editingPlan.id, data });
    } else {
      createPlanMutation.mutate(data);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-section font-heading text-foreground">
            Subscription Plans
          </h1>
          <p className="text-muted-foreground">
            Manage pricing plans for schools
          </p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-create-plan">
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">No subscription plans yet</p>
            <Button className="mt-4" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.isFeatured ? "border-primary ring-2 ring-primary/20" : ""} data-testid={`card-plan-${plan.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      {plan.isFeatured && (
                        <Badge variant="default" className="bg-amber-500 gap-1">
                          <Crown className="h-3 w-3" />
                          Featured
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  {!plan.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(plan.monthlyPrice)}</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                  {plan.yearlyPrice > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      or {formatCurrency(plan.yearlyPrice)}/year
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>Up to {plan.maxStudents.toLocaleString()} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Up to {plan.maxTeachers.toLocaleString()} teachers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span>Up to {plan.maxClasses.toLocaleString()} classes</span>
                  </div>
                </div>

                {plan.features && plan.features.length > 0 && (
                  <div className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    {plan.subscribersCount || 0} schools subscribed
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(plan)} data-testid={`button-edit-plan-${plan.id}`}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this plan?")) {
                      deletePlanMutation.mutate(plan.id);
                    }
                  }}
                  data-testid={`button-delete-plan-${plan.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan ? "Update subscription plan details" : "Create a new subscription plan for schools"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Basic, Premium, Enterprise" {...field} data-testid="input-plan-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of the plan" {...field} data-testid="input-plan-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monthlyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Price (NGN)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-monthly-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yearlyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yearly Price (NGN)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-yearly-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="maxStudents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Students</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-max-students" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxTeachers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Teachers</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-max-teachers" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxClasses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Classes</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-max-classes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Features (one per line)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Unlimited storage&#10;Email support&#10;Custom branding" 
                        rows={4}
                        {...field} 
                        data-testid="input-features" 
                      />
                    </FormControl>
                    <FormDescription>Enter each feature on a new line</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-6">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-is-active" />
                      </FormControl>
                      <FormLabel className="!mt-0">Active</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-is-featured" />
                      </FormControl>
                      <FormLabel className="!mt-0">Featured</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowPlanDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                  data-testid="button-submit-plan"
                >
                  {createPlanMutation.isPending || updatePlanMutation.isPending ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
