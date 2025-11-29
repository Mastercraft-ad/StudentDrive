import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  DollarSign, 
  CreditCard, 
  Receipt, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  Loader2,
} from "lucide-react";
import type { FeeType, FeePayment, ClassFee, AcademicTerm } from "@shared/schema";

interface ChildInfo {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  classId: string;
  className: string;
  email?: string;
}

interface OutstandingFee {
  feeType: FeeType;
  classFee: ClassFee;
  termId: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
}

interface PaystackStatus {
  configured: boolean;
}

export default function ParentFeesPage() {
  const { toast } = useToast();
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [activeTab, setActiveTab] = useState("outstanding");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<OutstandingFee | null>(null);

  const { data: children, isLoading: childrenLoading } = useQuery<ChildInfo[]>({
    queryKey: ["/api/school/parent/children"],
  });

  const { data: terms } = useQuery<AcademicTerm[]>({
    queryKey: ["/api/school/terms"],
  });

  const { data: paystackStatus } = useQuery<PaystackStatus>({
    queryKey: ["/api/school/paystack/status"],
  });

  useEffect(() => {
    if (children && children.length > 0 && !selectedChild) {
      setSelectedChild(children[0].id);
    }
  }, [children, selectedChild]);

  const { data: outstandingFees, isLoading: feesLoading } = useQuery<OutstandingFee[]>({
    queryKey: [`/api/school/parent/children/${selectedChild}/outstanding-fees`],
    enabled: !!selectedChild,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<FeePayment[]>({
    queryKey: [`/api/school/students/${selectedChild}/payments`],
    enabled: !!selectedChild,
  });

  const initializePaymentMutation = useMutation({
    mutationFn: async (data: { studentId: string; feeTypeId: string; termId: string; email: string }) => {
      return apiRequest("POST", "/api/school/paystack/initialize", data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectedChildInfo = children?.find((c) => c.id === selectedChild);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount / 100);
  };

  const getTermName = (termId: string) => {
    const term = terms?.find(t => t.id === termId);
    return term?.name || termId;
  };

  const handlePayNow = (fee: OutstandingFee) => {
    setSelectedFee(fee);
    setPaymentDialogOpen(true);
  };

  const confirmPayment = () => {
    if (!selectedFee || !selectedChildInfo) return;

    const parentEmail = selectedChildInfo.email || `parent-${selectedChild}@school.com`;
    
    initializePaymentMutation.mutate({
      studentId: selectedChild,
      feeTypeId: selectedFee.feeType.id,
      termId: selectedFee.termId,
      email: parentEmail,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
      case "pending":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalOutstanding = outstandingFees?.reduce((sum, f) => sum + f.balance, 0) || 0;
  const totalPaid = payments?.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0) || 0;

  if (childrenLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Fee Payments</h1>
          <p className="text-muted-foreground">View and pay your child's school fees</p>
        </div>
        {children && children.length > 0 && (
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-56" data-testid="select-child">
              <SelectValue placeholder="Select your child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!children || children.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Children Linked</h3>
              <p className="text-muted-foreground">
                Contact the school administration to link your child's account.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : selectedChild ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card data-testid="card-outstanding-balance">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                    <p className="text-2xl font-bold text-red-600" data-testid="text-outstanding-balance">
                      {formatCurrency(totalOutstanding)}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-total-paid">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-total-paid">
                      {formatCurrency(totalPaid)}
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-payment-method">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="text-lg font-medium" data-testid="text-payment-method">
                      {paystackStatus?.configured ? "Online Payment" : "Bank Transfer"}
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="outstanding" data-testid="tab-outstanding">
                Outstanding Fees {outstandingFees && outstandingFees.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{outstandingFees.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-history">Payment History</TabsTrigger>
            </TabsList>

            <TabsContent value="outstanding" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Outstanding Fees
                  </CardTitle>
                  <CardDescription>
                    Fees that are due for payment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {feesLoading ? (
                    <Skeleton className="h-48" />
                  ) : outstandingFees && outstandingFees.length > 0 ? (
                    <div className="space-y-4">
                      {outstandingFees.map((fee, index) => (
                        <Card key={`${fee.feeType.id}-${fee.termId}`} data-testid={`card-fee-${index}`}>
                          <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <h3 className="font-semibold text-lg">{fee.feeType.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {getTermName(fee.termId)} | {fee.feeType.description || "School fee"}
                                </p>
                                <div className="flex gap-4 text-sm">
                                  <span>Amount Due: <strong>{formatCurrency(fee.amountDue)}</strong></span>
                                  <span>Paid: <strong className="text-green-600">{formatCurrency(fee.amountPaid)}</strong></span>
                                  <span>Balance: <strong className="text-red-600">{formatCurrency(fee.balance)}</strong></span>
                                </div>
                              </div>
                              {paystackStatus?.configured && (
                                <Button 
                                  onClick={() => handlePayNow(fee)}
                                  data-testid={`button-pay-${index}`}
                                >
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Pay Now
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
                      <h3 className="text-lg font-medium">All Caught Up</h3>
                      <p className="text-muted-foreground">
                        No outstanding fees at the moment.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Payment History
                  </CardTitle>
                  <CardDescription>
                    All payment transactions for this child
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentsLoading ? (
                    <Skeleton className="h-48" />
                  ) : payments && payments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                            <TableCell className="font-mono">
                              {payment.receiptNumber || payment.id.slice(0, 8)}
                            </TableCell>
                            <TableCell>
                              {new Date(payment.createdAt!).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell className="capitalize">
                              {payment.paymentMethod.replace("_", " ")}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(payment.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              {payment.status === "completed" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(`/school/receipt/${payment.id}`, '_blank')}
                                  data-testid={`button-receipt-${payment.id}`}
                                >
                                  <Receipt className="h-4 w-4 mr-1" />
                                  Receipt
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
                      <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No Payment History</h3>
                      <p className="text-muted-foreground">
                        No payments have been recorded yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              You are about to pay for the following fee
            </DialogDescription>
          </DialogHeader>
          {selectedFee && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fee Type</p>
                  <p className="font-medium">{selectedFee.feeType.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Term</p>
                  <p className="font-medium">{getTermName(selectedFee.termId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="font-medium">
                    {selectedChildInfo?.firstName} {selectedChildInfo?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount to Pay</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(selectedFee.balance)}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  You will be redirected to Paystack to complete the payment securely.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              disabled={initializePaymentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPayment}
              disabled={initializePaymentMutation.isPending}
              data-testid="button-confirm-payment"
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
    </div>
  );
}
