import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/loading-skeleton";
import { Plus, DollarSign, CreditCard, Receipt, Search, Edit, Trash2, Bell, Send, AlertCircle, Loader2 } from "lucide-react";
import type { FeeType, FeePayment, SchoolUser } from "@shared/schema";

interface OverduePayment {
  student: SchoolUser;
  parent?: SchoolUser;
  balance: number;
  termId: string;
}

export default function FeesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("fee-types");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingFeeType, setEditingFeeType] = useState<FeeType | null>(null);
  
  const [feeFormData, setFeeFormData] = useState({
    name: "",
    code: "",
    amount: "",
    description: "",
    frequency: "termly",
    isRecurring: true,
  });

  const [paymentFormData, setPaymentFormData] = useState({
    studentId: "",
    feeTypeId: "",
    amount: "",
    paymentMethod: "cash",
    paymentReference: "",
    notes: "",
  });

  const { data: feeTypes, isLoading: feeTypesLoading } = useQuery<FeeType[]>({
    queryKey: ["/api/school/fee-types"],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<FeePayment[]>({
    queryKey: ["/api/school/payments"],
  });

  const { data: students } = useQuery<SchoolUser[]>({
    queryKey: ["/api/school/users", { role: "student" }],
  });

  const { data: overduePayments, isLoading: overdueLoading, refetch: refetchOverdue } = useQuery<OverduePayment[]>({
    queryKey: ["/api/school/fees/overdue"],
  });

  const createFeeTypeMutation = useMutation({
    mutationFn: async (data: typeof feeFormData) => {
      return apiRequest("POST", "/api/school/fee-types", {
        ...data,
        amount: parseInt(data.amount) * 100, // Convert to kobo
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/fee-types"] });
      toast({ title: "Fee type created successfully" });
      resetFeeForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create fee type", description: error.message, variant: "destructive" });
    },
  });

  const updateFeeTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof feeFormData }) => {
      return apiRequest("PATCH", `/api/school/fee-types/${id}`, {
        ...data,
        amount: parseInt(data.amount) * 100,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/fee-types"] });
      toast({ title: "Fee type updated successfully" });
      resetFeeForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update fee type", description: error.message, variant: "destructive" });
    },
  });

  const deleteFeeTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/school/fee-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/fee-types"] });
      toast({ title: "Fee type deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete fee type", description: error.message, variant: "destructive" });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: typeof paymentFormData) => {
      return apiRequest("POST", "/api/school/payments", {
        ...data,
        amount: parseInt(data.amount) * 100,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/payments"] });
      toast({ title: "Payment recorded successfully" });
      resetPaymentForm();
      setIsPaymentDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to record payment", description: error.message, variant: "destructive" });
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (data: { studentId: string; parentId: string; amount: number; termId: string }) => {
      return apiRequest("POST", "/api/school/fees/send-reminder", data);
    },
    onSuccess: () => {
      toast({ title: "Fee reminder sent successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send reminder", description: error.message, variant: "destructive" });
    },
  });

  const sendBulkRemindersMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/school/fees/send-bulk-reminders", {});
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "Bulk reminders sent", 
        description: `${data.totalSent} reminders sent, ${data.totalFailed} failed` 
      });
      refetchOverdue();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send bulk reminders", description: error.message, variant: "destructive" });
    },
  });

  const resetFeeForm = () => {
    setFeeFormData({ name: "", code: "", amount: "", description: "", frequency: "termly", isRecurring: true });
    setEditingFeeType(null);
  };

  const resetPaymentForm = () => {
    setPaymentFormData({ studentId: "", feeTypeId: "", amount: "", paymentMethod: "cash", paymentReference: "", notes: "" });
  };

  const handleEditFeeType = (feeType: FeeType) => {
    setEditingFeeType(feeType);
    setFeeFormData({
      name: feeType.name,
      code: feeType.code || "",
      amount: (feeType.amount / 100).toString(),
      description: feeType.description || "",
      frequency: feeType.frequency || "termly",
      isRecurring: feeType.isRecurring,
    });
    setIsDialogOpen(true);
  };

  const handleFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFeeType) {
      updateFeeTypeMutation.mutate({ id: editingFeeType.id, data: feeFormData });
    } else {
      createFeeTypeMutation.mutate(feeFormData);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordPaymentMutation.mutate(paymentFormData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Fees & Payments</h1>
          <p className="text-muted-foreground">Manage school fees and record payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fee Types</p>
                <p className="text-2xl font-bold">{feeTypes?.length || 0}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">{payments?.length || 0}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue This Term</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    payments?.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0) || 0
                  )}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fee-types" data-testid="tab-fee-types">Fee Types</TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
          <TabsTrigger value="reminders" data-testid="tab-reminders">Reminders</TabsTrigger>
        </TabsList>

        <TabsContent value="fee-types" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Fee Types</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetFeeForm(); }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-fee-type">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Fee Type
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingFeeType ? "Edit Fee Type" : "Add Fee Type"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFeeSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="feeName">Fee Name</Label>
                        <Input
                          id="feeName"
                          value={feeFormData.name}
                          onChange={(e) => setFeeFormData({ ...feeFormData, name: e.target.value })}
                          placeholder="e.g., Tuition Fee"
                          required
                          data-testid="input-fee-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="feeCode">Code</Label>
                        <Input
                          id="feeCode"
                          value={feeFormData.code}
                          onChange={(e) => setFeeFormData({ ...feeFormData, code: e.target.value.toUpperCase() })}
                          placeholder="e.g., TUI"
                          data-testid="input-fee-code"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="feeAmount">Amount (NGN)</Label>
                        <Input
                          id="feeAmount"
                          type="number"
                          value={feeFormData.amount}
                          onChange={(e) => setFeeFormData({ ...feeFormData, amount: e.target.value })}
                          placeholder="50000"
                          required
                          data-testid="input-fee-amount"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="feeFrequency">Frequency</Label>
                        <Select
                          value={feeFormData.frequency}
                          onValueChange={(value) => setFeeFormData({ ...feeFormData, frequency: value })}
                        >
                          <SelectTrigger data-testid="select-fee-frequency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="termly">Termly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="one-time">One-time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="feeDescription">Description</Label>
                      <Input
                        id="feeDescription"
                        value={feeFormData.description}
                        onChange={(e) => setFeeFormData({ ...feeFormData, description: e.target.value })}
                        placeholder="Optional description"
                        data-testid="input-fee-description"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetFeeForm(); }}>
                        Cancel
                      </Button>
                      <Button type="submit" data-testid="button-save-fee-type">
                        {editingFeeType ? "Update" : "Create"} Fee Type
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {feeTypesLoading ? (
                <Skeleton className="h-64" />
              ) : feeTypes && feeTypes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeTypes.map((fee) => (
                      <TableRow key={fee.id} data-testid={`row-fee-${fee.id}`}>
                        <TableCell className="font-medium">{fee.name}</TableCell>
                        <TableCell><Badge variant="outline">{fee.code || "-"}</Badge></TableCell>
                        <TableCell>{formatCurrency(fee.amount)}</TableCell>
                        <TableCell className="capitalize">{fee.frequency || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={fee.isActive ? "default" : "secondary"}>
                            {fee.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditFeeType(fee)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteFeeTypeMutation.mutate(fee.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No fee types found</h3>
                  <p className="text-muted-foreground">Create your first fee type to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Payment Records</CardTitle>
              <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => { setIsPaymentDialogOpen(open); if (!open) resetPaymentForm(); }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-record-payment">
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Student</Label>
                      <Select
                        value={paymentFormData.studentId}
                        onValueChange={(value) => setPaymentFormData({ ...paymentFormData, studentId: value })}
                      >
                        <SelectTrigger data-testid="select-payment-student">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students?.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.firstName} {student.lastName} ({student.admissionNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fee Type</Label>
                        <Select
                          value={paymentFormData.feeTypeId}
                          onValueChange={(value) => setPaymentFormData({ ...paymentFormData, feeTypeId: value })}
                        >
                          <SelectTrigger data-testid="select-payment-fee-type">
                            <SelectValue placeholder="Select fee type" />
                          </SelectTrigger>
                          <SelectContent>
                            {feeTypes?.map((fee) => (
                              <SelectItem key={fee.id} value={fee.id}>
                                {fee.name} ({formatCurrency(fee.amount)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Amount (NGN)</Label>
                        <Input
                          type="number"
                          value={paymentFormData.amount}
                          onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                          placeholder="50000"
                          required
                          data-testid="input-payment-amount"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select
                          value={paymentFormData.paymentMethod}
                          onValueChange={(value) => setPaymentFormData({ ...paymentFormData, paymentMethod: value })}
                        >
                          <SelectTrigger data-testid="select-payment-method">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Reference</Label>
                        <Input
                          value={paymentFormData.paymentReference}
                          onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentReference: e.target.value })}
                          placeholder="Transaction reference"
                          data-testid="input-payment-reference"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => { setIsPaymentDialogOpen(false); resetPaymentForm(); }}>
                        Cancel
                      </Button>
                      <Button type="submit" data-testid="button-save-payment">
                        Record Payment
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-payments"
                  />
                </div>
              </div>
              {paymentsLoading ? (
                <Skeleton className="h-64" />
              ) : payments && payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                        <TableCell className="font-mono">{payment.receiptNumber || payment.id.slice(0, 8)}</TableCell>
                        <TableCell>{payment.studentId}</TableCell>
                        <TableCell>{payment.feeTypeId}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell className="capitalize">{payment.paymentMethod.replace("_", " ")}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>{new Date(payment.createdAt!).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No payments recorded</h3>
                  <p className="text-muted-foreground">Record your first payment to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Outstanding Balances & Reminders
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  View students with outstanding fees and send payment reminders
                </p>
              </div>
              <Button
                onClick={() => sendBulkRemindersMutation.mutate()}
                disabled={sendBulkRemindersMutation.isPending || !overduePayments?.length}
                data-testid="button-send-bulk-reminders"
              >
                {sendBulkRemindersMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send All Reminders
              </Button>
            </CardHeader>
            <CardContent>
              {overdueLoading ? (
                <Skeleton className="h-64" />
              ) : overduePayments && overduePayments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Outstanding Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overduePayments.map((item) => (
                      <TableRow key={item.student.id} data-testid={`row-overdue-${item.student.id}`}>
                        <TableCell className="font-medium">
                          {item.student.firstName} {item.student.lastName}
                        </TableCell>
                        <TableCell className="font-mono">
                          {item.student.admissionNumber || "-"}
                        </TableCell>
                        <TableCell>
                          {item.parent ? (
                            `${item.parent.firstName} ${item.parent.lastName}`
                          ) : (
                            <span className="text-muted-foreground">No parent linked</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-red-600">
                          {formatCurrency(item.balance)}
                        </TableCell>
                        <TableCell>
                          {item.parent ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendReminderMutation.mutate({
                                studentId: item.student.id,
                                parentId: item.parent!.id,
                                amount: item.balance,
                                termId: item.termId,
                              })}
                              disabled={sendReminderMutation.isPending}
                              data-testid={`button-send-reminder-${item.student.id}`}
                            >
                              {sendReminderMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Bell className="h-4 w-4 mr-1" />
                              )}
                              Send Reminder
                            </Button>
                          ) : (
                            <Badge variant="secondary">No parent</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">No Outstanding Balances</h3>
                  <p className="text-muted-foreground">All students are up to date with their payments.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
