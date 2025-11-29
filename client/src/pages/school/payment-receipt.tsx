import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  CheckCircle2,
  Building,
  User,
  Calendar,
  Hash,
} from "lucide-react";
import type { FeePayment, FeeType, SchoolUser, School } from "@shared/schema";

interface PaymentDetails extends FeePayment {
  student?: SchoolUser;
  feeType?: FeeType;
  school?: School;
}

export default function PaymentReceiptPage() {
  const [match, params] = useRoute("/school/receipt/:id");
  const [, setLocation] = useLocation();
  const paymentId = params?.id;

  const { data: payment, isLoading, error } = useQuery<PaymentDetails>({
    queryKey: [`/api/school/payments/${paymentId}`],
    enabled: !!paymentId,
  });

  const { data: school } = useQuery<School>({
    queryKey: ["/api/school/current"],
    enabled: !!payment,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount / 100);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (!match) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Skeleton className="w-full max-w-2xl h-[600px]" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Receipt Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The payment receipt could not be found.
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

  return (
    <div className="min-h-screen p-6 bg-muted/30">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
          <Button variant="ghost" onClick={() => setLocation("/school/parent/fees")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Fees
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} data-testid="button-print">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <Card className="print:shadow-none print:border-none" data-testid="card-receipt">
          <CardHeader className="text-center border-b pb-6">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Payment Receipt</CardTitle>
            <p className="text-muted-foreground mt-2">
              {school?.name || "StudentDrive School"}
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Receipt Number</p>
                  <p className="font-mono font-medium" data-testid="text-receipt-number">
                    {payment.receiptNumber || payment.id.slice(0, 12)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium" data-testid="text-payment-date">
                    {formatDate(payment.paidAt || payment.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Student Information
              </h3>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <p className="text-sm text-muted-foreground">Student Name</p>
                  <p className="font-medium" data-testid="text-student-name">
                    {payment.student 
                      ? `${payment.student.firstName} ${payment.student.lastName}`
                      : "N/A"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission Number</p>
                  <p className="font-medium" data-testid="text-admission-number">
                    {payment.student?.admissionNumber || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Payment Details</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Fee Type</span>
                  <span className="font-medium" data-testid="text-fee-type">
                    {payment.feeType?.name || "School Fee"}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium capitalize" data-testid="text-payment-method">
                    {payment.paymentMethod.replace("_", " ")}
                  </span>
                </div>
                {payment.paymentReference && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono text-sm" data-testid="text-reference">
                      {payment.paymentReference}
                    </span>
                  </div>
                )}
                <Separator className="my-3" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Amount Paid</span>
                  <span className="text-2xl font-bold text-green-600" data-testid="text-amount">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 text-center text-sm text-muted-foreground print:pt-8">
              <p>Thank you for your payment.</p>
              <p className="mt-1">This is a computer-generated receipt and does not require a signature.</p>
            </div>
          </CardContent>
        </Card>

        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            [data-testid="card-receipt"],
            [data-testid="card-receipt"] * {
              visibility: visible;
            }
            [data-testid="card-receipt"] {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
