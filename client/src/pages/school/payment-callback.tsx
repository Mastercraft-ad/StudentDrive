import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Loader2, Receipt, ArrowLeft } from "lucide-react";

interface VerifyResponse {
  status: "success" | "failed";
  message: string;
  payment?: {
    id: string;
    amount: number;
    receiptNumber: string;
    status: string;
  };
}

export default function PaymentCallbackPage() {
  const [, setLocation] = useLocation();
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("reference");
    setReference(ref);
  }, []);

  const { data, isLoading, error } = useQuery<VerifyResponse>({
    queryKey: [`/api/school/paystack/verify/${reference}`],
    enabled: !!reference,
    retry: false,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount / 100);
  };

  if (!reference) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">Invalid Payment Reference</h2>
              <p className="text-muted-foreground mb-6">
                No payment reference was provided. Please try again.
              </p>
              <Button onClick={() => setLocation("/school/parent/fees")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Fees
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-16 w-16 mx-auto text-blue-600 mb-4 animate-spin" />
              <h2 className="text-xl font-bold mb-2">Verifying Payment</h2>
              <p className="text-muted-foreground">
                Please wait while we verify your payment...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">Verification Failed</h2>
              <p className="text-muted-foreground mb-6">
                {(error as Error)?.message || "Unable to verify payment. Please contact support."}
              </p>
              <Button onClick={() => setLocation("/school/parent/fees")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Fees
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
              <CardTitle className="text-2xl">Payment Successful</CardTitle>
              <CardDescription>
                Your payment has been processed successfully
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.payment && (
              <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receipt Number</span>
                  <span className="font-mono font-medium">{data.payment.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(data.payment.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-sm">{reference}</span>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {data.payment && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`/school/receipt/${data.payment!.id}`, '_blank')}
                  data-testid="button-view-receipt"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View Receipt
                </Button>
              )}
              <Button onClick={() => setLocation("/school/parent/fees")} data-testid="button-back-fees">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Fees
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <XCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
            <h2 className="text-xl font-bold mb-2">Payment Failed</h2>
            <p className="text-muted-foreground mb-6">
              {data.message || "Your payment could not be completed. Please try again."}
            </p>
            <Button onClick={() => setLocation("/school/parent/fees")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Fees
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
