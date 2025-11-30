import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SubscriptionPlan, SubscriptionPayment } from "@shared/schema";
import {
  CreditCard,
  Check,
  AlertTriangle,
  Clock,
  Crown,
  Users,
  GraduationCap,
  Calendar,
  ArrowRight,
  Receipt,
  RefreshCw,
  XCircle,
  Loader2,
  Sparkles,
  Building,
  History,
} from "lucide-react";

interface SubscriptionStatus {
  status: string;
  plan: {
    id: string;
    name: string;
    code: string;
    price: number;
    billingPeriod: string;
  } | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
}

interface UsageLimits {
  students: { current: number; max: number | null };
  teachers: { current: number; max: number | null };
  classes: { current: number; max: number | null };
}

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: subscription, isLoading: subLoading } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/school/subscription"],
  });

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/schools/subscription-plans"],
  });

  const { data: usage, isLoading: usageLoading } = useQuery<UsageLimits>({
    queryKey: ["/api/school/subscription/usage"],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<SubscriptionPayment[]>({
    queryKey: ["/api/school/subscription/payments"],
  });

  const initializePaymentMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiRequest("POST", "/api/school/subscription/initialize", { planId });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/school/subscription/cancel");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/subscription"] });
      setShowCancelDialog(false);
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled. You can continue using the service until the current period ends.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel subscription.",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeDialog(true);
  };

  const handleConfirmUpgrade = () => {
    if (selectedPlan) {
      initializePaymentMutation.mutate(selectedPlan.id);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return "N/A";
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "trial":
        return <Badge className="bg-blue-500">Trial</Badge>;
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUsagePercentage = (current: number, max: number | null) => {
    if (max === null) return 0;
    return Math.min(100, (current / max) * 100);
  };

  if (subLoading || plansLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  const currentPlan = plans?.find((p) => p.id === subscription?.plan?.id);
  const daysRemaining = subscription?.status === "trial" 
    ? getDaysRemaining(subscription.trialEndDate)
    : getDaysRemaining(subscription?.subscriptionEndDate ?? null);
  const isTrialExpiring = subscription?.status === "trial" && daysRemaining <= 3;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Subscription & Billing</h1>
          <p className="text-muted-foreground">Manage your school's subscription and payment history</p>
        </div>
      </div>

      {isTrialExpiring && (
        <Alert variant="destructive" data-testid="alert-trial-expiring">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Trial Expiring Soon!</AlertTitle>
          <AlertDescription>
            Your free trial expires in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}. 
            Upgrade now to continue using all features without interruption.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card data-testid="card-current-plan">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{subscription?.plan?.name || "Free Trial"}</p>
                {getStatusBadge(subscription?.status || "trial")}
              </div>
              {currentPlan && currentPlan.price > 0 && (
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatPrice(currentPlan.price)}</p>
                  <p className="text-sm text-muted-foreground">/{currentPlan.billingPeriod}</p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              {subscription?.status === "trial" && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Trial Ends
                  </span>
                  <span className="font-medium">{formatDate(subscription.trialEndDate)}</span>
                </div>
              )}
              {subscription?.status === "active" && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Started
                    </span>
                    <span className="font-medium">{formatDate(subscription.subscriptionStartDate)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Renews
                    </span>
                    <span className="font-medium">{formatDate(subscription.subscriptionEndDate)}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Days Remaining
                </span>
                <span className={`font-medium ${daysRemaining <= 3 ? "text-destructive" : ""}`}>
                  {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {subscription?.status !== "active" && (
              <Button 
                className="w-full" 
                onClick={() => plans && handleUpgrade(plans.find(p => p.code === "basic") || plans[1])}
                data-testid="button-upgrade-now"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            )}
            {subscription?.status === "active" && (
              <Button 
                variant="outline" 
                className="w-full text-destructive hover:text-destructive"
                onClick={() => setShowCancelDialog(true)}
                data-testid="button-cancel-subscription"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Subscription
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2" data-testid="card-usage">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Usage & Limits
            </CardTitle>
            <CardDescription>
              Your current usage compared to plan limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {usageLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : usage ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <GraduationCap className="h-4 w-4" />
                      Students
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {usage.students.current} / {usage.students.max ?? "Unlimited"}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(usage.students.current, usage.students.max)} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Users className="h-4 w-4" />
                      Teachers
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {usage.teachers.current} / {usage.teachers.max ?? "Unlimited"}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(usage.teachers.current, usage.teachers.max)} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Building className="h-4 w-4" />
                      Classes
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {usage.classes.current} / {usage.classes.max ?? "Unlimited"}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(usage.classes.current, usage.classes.max)} 
                    className="h-2"
                  />
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Unable to load usage data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-plans">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Available Plans
          </CardTitle>
          <CardDescription>
            Choose the plan that best fits your school's needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans?.filter(p => p.isActive).sort((a, b) => a.displayOrder - b.displayOrder).map((plan) => {
              const isCurrentPlan = subscription?.plan?.id === plan.id || 
                (subscription?.status === "trial" && plan.code === "free_trial");
              const features = plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) : [];
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative ${isCurrentPlan ? "border-primary border-2" : ""}`}
                  data-testid={`card-plan-${plan.code}`}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Current Plan</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">
                        {plan.price === 0 ? "Free" : formatPrice(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground text-sm">/{plan.billingPeriod}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                    <div className="space-y-2">
                      {features.slice(0, 5).map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {features.length > 5 && (
                        <p className="text-xs text-muted-foreground">+{features.length - 5} more features</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    {isCurrentPlan ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : plan.code === "free_trial" ? (
                      <Button variant="outline" className="w-full" disabled>
                        Trial Only
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => handleUpgrade(plan)}
                        data-testid={`button-select-${plan.code}`}
                      >
                        Select Plan
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-billing-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>
            Your past subscription payments and invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`payment-${payment.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${payment.status === "completed" ? "bg-green-100 dark:bg-green-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"}`}>
                      <Receipt className={`h-4 w-4 ${payment.status === "completed" ? "text-green-600" : "text-yellow-600"}`} />
                    </div>
                    <div>
                      <p className="font-medium">{formatPrice(payment.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.invoiceNumber || payment.paystackReference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                      {payment.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(payment.paidAt || payment.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No payment history yet</p>
              <p className="text-sm text-muted-foreground">Your payments will appear here after upgrading</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              You are about to upgrade your subscription. You will be redirected to our secure payment page.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Plan</span>
                <span className="font-medium">{selectedPlan?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount</span>
                <span className="font-medium">{selectedPlan ? formatPrice(selectedPlan.price) : ""}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing Period</span>
                <span className="font-medium capitalize">{selectedPlan?.billingPeriod}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmUpgrade}
              disabled={initializePaymentMutation.isPending}
              data-testid="button-confirm-upgrade"
            >
              {initializePaymentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You will continue to have access until your current billing period ends.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                After cancellation, you will lose access to premium features when your current period expires.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button 
              variant="destructive"
              onClick={() => cancelSubscriptionMutation.mutate()}
              disabled={cancelSubscriptionMutation.isPending}
              data-testid="button-confirm-cancel"
            >
              {cancelSubscriptionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
