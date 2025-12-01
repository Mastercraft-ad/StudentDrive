import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  School, 
  Search, 
  MoreHorizontal,
  CheckCircle,
  XCircle,
  ExternalLink,
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { School as SchoolType } from "@shared/schema";

type SchoolWithStats = SchoolType & {
  studentsCount?: number;
  teachersCount?: number;
  parentsCount?: number;
  ownerEmail?: string;
  subscriptionPlanName?: string;
};

export default function SuperAdminSchools() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithStats | null>(null);
  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const { toast } = useToast();

  const { data: schools = [], isLoading } = useQuery<SchoolWithStats[]>({
    queryKey: ["/api/super-admin/schools", { search: searchTerm, status: statusFilter, subscription: subscriptionFilter }],
  });

  const updateSchoolMutation = useMutation({
    mutationFn: async ({ schoolId, data }: { schoolId: string; data: Partial<SchoolType> }) => {
      return await apiRequest("PATCH", `/api/super-admin/schools/${schoolId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/schools"] });
      toast({ title: "Success", description: "School updated successfully" });
      setShowSchoolDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case "trial":
        return <Badge variant="secondary">Trial</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredSchools = schools.filter((school) => {
    const matchesSearch = 
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (school.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && school.isActive) ||
      (statusFilter === "inactive" && !school.isActive) ||
      (statusFilter === "verified" && school.isVerified) ||
      (statusFilter === "unverified" && !school.isVerified);
    
    const matchesSubscription = 
      subscriptionFilter === "all" || 
      school.subscriptionStatus === subscriptionFilter;
    
    return matchesSearch && matchesStatus && matchesSubscription;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-section font-heading text-foreground">
            School Management
          </h1>
          <p className="text-muted-foreground">
            View and manage all registered schools in the SMS
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          <School className="h-3 w-3 mr-1" />
          {schools.length} schools
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <School className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{schools.length}</p>
                <p className="text-xs text-muted-foreground">Total Schools</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {schools.filter(s => s.subscriptionStatus === "active").length}
                </p>
                <p className="text-xs text-muted-foreground">Active Subscriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">
                  {schools.filter(s => s.subscriptionStatus === "trial").length}
                </p>
                <p className="text-xs text-muted-foreground">In Trial</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">
                  {schools.filter(s => s.subscriptionStatus === "expired").length}
                </p>
                <p className="text-xs text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, subdomain or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-schools"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
              <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                <SelectTrigger className="w-[160px]" data-testid="select-subscription-filter">
                  <SelectValue placeholder="Subscription" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subscriptions</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <School className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No schools found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.map((school) => (
                  <TableRow key={school.id} data-testid={`row-school-${school.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-md">
                          <AvatarImage src={school.logoUrl || undefined} />
                          <AvatarFallback className="rounded-md bg-primary/10">
                            {school.name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{school.name}</p>
                          <p className="text-sm text-muted-foreground">{school.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {school.subdomain}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => window.open(`https://${school.subdomain}.studentdrive.com`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getSubscriptionBadge(school.subscriptionStatus)}
                        {school.subscriptionPlanName && (
                          <p className="text-xs text-muted-foreground">
                            {school.subscriptionPlanName}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {school.studentsCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {school.teachersCount || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {school.isActive ? (
                          <Badge variant="default" className="bg-green-600 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-school-actions-${school.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedSchool(school);
                            setShowSchoolDialog(true);
                          }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            window.open(`https://${school.subdomain}.studentdrive.com`, '_blank');
                          }}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit Portal
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            updateSchoolMutation.mutate({
                              schoolId: school.id,
                              data: { isActive: !school.isActive }
                            });
                          }}>
                            {school.isActive ? "Deactivate School" : "Activate School"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            updateSchoolMutation.mutate({
                              schoolId: school.id,
                              data: { isVerified: !school.isVerified }
                            });
                          }}>
                            {school.isVerified ? "Remove Verification" : "Verify School"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSchoolDialog} onOpenChange={setShowSchoolDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>School Details</DialogTitle>
            <DialogDescription>
              View and manage school information
            </DialogDescription>
          </DialogHeader>
          {selectedSchool && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 rounded-md">
                  <AvatarImage src={selectedSchool.logoUrl || undefined} />
                  <AvatarFallback className="rounded-md bg-primary/10 text-lg">
                    {selectedSchool.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedSchool.name}</h3>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {selectedSchool.subdomain}.studentdrive.com
                  </code>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Subscription Status</p>
                  {getSubscriptionBadge(selectedSchool.subscriptionStatus)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">School Status</p>
                  <div className="flex gap-2">
                    {selectedSchool.isActive ? (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {selectedSchool.isVerified && (
                      <Badge variant="default" className="bg-blue-600">Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {selectedSchool.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedSchool.email}
                  </div>
                )}
                {selectedSchool.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {selectedSchool.phone}
                  </div>
                )}
                {selectedSchool.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={selectedSchool.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {selectedSchool.website}
                    </a>
                  </div>
                )}
                {(selectedSchool.city || selectedSchool.state || selectedSchool.country) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {[selectedSchool.city, selectedSchool.state, selectedSchool.country].filter(Boolean).join(", ")}
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-xl font-bold">{selectedSchool.studentsCount || 0}</p>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-xl font-bold">{selectedSchool.teachersCount || 0}</p>
                        <p className="text-xs text-muted-foreground">Teachers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-xl font-bold">{selectedSchool.parentsCount || 0}</p>
                        <p className="text-xs text-muted-foreground">Parents</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedSchool.description && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedSchool.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSchoolDialog(false)}>
              Close
            </Button>
            {selectedSchool && (
              <Button onClick={() => window.open(`https://${selectedSchool.subdomain}.studentdrive.com`, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Portal
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
