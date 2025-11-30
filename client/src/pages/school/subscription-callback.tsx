import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function SubscriptionCallback() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get("reference");

      if (!reference) {
        setStatus("error");
        setMessage("No payment reference found");
        return;
      }

      try {
        const response = await fetch(`/api/school/subscription/verify/${reference}`);
        const data = await response.json();

        if (response.ok && data.status === "success") {
          setStatus("success");
          setMessage(data.message || "Your subscription has been activated successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "Payment verification failed");
        }
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Failed to verify payment");
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
              <CardTitle data-testid="text-payment-status">Verifying Payment</CardTitle>
              <CardDescription>
                Please wait while we verify your subscription payment...
              </CardDescription>
            </>
          )}
          {status === "success" && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-green-600" data-testid="text-payment-status">
                Payment Successful!
              </CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
          {status === "error" && (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-destructive" data-testid="text-payment-status">
                Payment Failed
              </CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {status !== "loading" && (
            <>
              <Button
                onClick={() => navigate("/school/subscription")}
                data-testid="button-view-subscription"
              >
                View Subscription
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/school/dashboard")}
                data-testid="button-go-dashboard"
              >
                Go to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
