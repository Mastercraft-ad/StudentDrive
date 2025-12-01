import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  ArrowLeft,
  Users,
  GraduationCap,
  BookOpen,
  School,
  Search,
  Mail,
  Phone,
  Calendar,
  Edit,
  Shield,
  UserCog,
  UserPlus,
  MoreVertical,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

interface SchoolUser {
  id: string;
  schoolId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  profileImageUrl: string | null;
  classId: string | null;
  createdAt: string;
}

interface School {
  id: string;
  name: string;
  subdomain: string;
  subscriptionStatus: string;
  email: string | null;
  phone: string | null;
}

interface SchoolUsersResponse {
  school: School;
  users: SchoolUser[];
  total: number;
  roleStats: Record<string, number>;
}

const roleConfig: Record<string, { label: string; icon: any; color: string }> = {
  school_admin: { label: "School Admin", icon: Shield, color: "text-amber-500" },
  teacher: { label: "Teacher", icon: BookOpen, color: "text-blue-500" },
  student: { label: "Student", icon: GraduationCap, color: "text-green-500" },
  parent: { label: "Parent", icon: Users, color: "text-purple-500" },
};

function UserRow({ 
  user, 
  onEdit 
}: { 
  user: SchoolUser; 
  onEdit: (user: SchoolUser) => void;
}) {
  const roleInfo = roleConfig[user.role] || { 
    label: user.role, 
    icon: Users, 
    color: "text-muted-foreground" 
  };
  const RoleIcon = roleInfo.icon;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback>
              {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="flex items-center gap-1 w-fit">
          <RoleIcon className={`h-3 w-3 ${roleInfo.color}`} />
          {roleInfo.label}
        </Badge>
      </TableCell>
      <TableCell>
        {user.phone || <span className="text-muted-foreground">-</span>}
      </TableCell>
      <TableCell>
        {user.isActive ? (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-red-500/10 text-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {format(new Date(user.createdAt), "MMM d, yyyy")}
      </TableCell>
      <TableCell>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onEdit(user)}
          data-testid={`button-edit-user-${user.id}`}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function UserRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  );
}

function EditUserDialog({ 
  user, 
  open, 
  onOpenChange,
  onSave,
  isPending,
}: { 
  user: SchoolUser | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<SchoolUser>) => void;
  isPending: boolean;
}) {
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information for {user.firstName} {user.lastName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                data-testid="input-first-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                data-testid="input-last-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              data-testid="input-phone"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Account Active</Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              data-testid="switch-is-active"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => onSave({ firstName, lastName, email, phone, isActive })}
            disabled={isPending}
            data-testid="button-save-user"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RoleStatCard({ 
  role, 
  count 
}: { 
  role: string; 
  count: number;
}) {
  const roleInfo = roleConfig[role] || { 
    label: role, 
    icon: Users, 
    color: "text-muted-foreground" 
  };
  const Icon = roleInfo.icon;

  return (
    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
      <div className="p-2 bg-background rounded-lg">
        <Icon className={`h-5 w-5 ${roleInfo.color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold">{count}</p>
        <p className="text-xs text-muted-foreground">{roleInfo.label}s</p>
      </div>
    </div>
  );
}

export default function SchoolUsersPage() {
  const [, params] = useRoute("/super-admin/schools/:schoolId/users");
  const schoolId = params?.schoolId;
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<SchoolUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data, isLoading, error } = useQuery<SchoolUsersResponse>({
    queryKey: ["/api/super-admin/schools", schoolId, "users", { role: roleFilter, search }],
    enabled: !!schoolId,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (updates: Partial<SchoolUser>) => {
      return apiRequest(
        "PATCH",
        `/api/super-admin/schools/${schoolId}/users/${editingUser?.id}`,
        updates
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/super-admin/schools", schoolId, "users"] 
      });
      setShowEditDialog(false);
      setEditingUser(null);
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: SchoolUser) => {
    setEditingUser(user);
    setShowEditDialog(true);
  };

  const handleSaveUser = (updates: Partial<SchoolUser>) => {
    updateUserMutation.mutate(updates);
  };

  if (!schoolId) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Invalid school ID</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/super-admin/schools">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-section font-heading text-foreground">
            {isLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              data?.school?.name || "School Users"
            )}
          </h1>
          <p className="text-muted-foreground">
            Manage users in this school
          </p>
        </div>
      </div>

      {data?.school && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <School className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{data.school.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.school.subdomain}.studentdrive.com
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {data.school.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {data.school.email}
                  </span>
                )}
                {data.school.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {data.school.phone}
                  </span>
                )}
              </div>
              <Badge 
                variant={data.school.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                className="ml-auto"
              >
                {data.school.subscriptionStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {data?.roleStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.roleStats).map(([role, count]) => (
            <RoleStatCard key={role} role={role} count={count} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users ({data?.total || 0})
              </CardTitle>
              <CardDescription>
                All users registered in this school
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-[200px]"
                  data-testid="input-search-users"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-role-filter">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="school_admin">School Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <UserRowSkeleton key={i} />
                  ))
                ) : data?.users && data.users.length > 0 ? (
                  data.users.map((user) => (
                    <UserRow 
                      key={user.id} 
                      user={user} 
                      onEdit={handleEditUser}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No users found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EditUserDialog
        user={editingUser}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleSaveUser}
        isPending={updateUserMutation.isPending}
      />
    </div>
  );
}
