import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Shield, 
  MoreVertical, 
  UserCog, 
  Trash2, 
  Key,
  Search,
  Filter,
  X,
  BarChart3,
  Activity,
  Calendar,
  FileText,
  GraduationCap,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface UserStatistics {
  userId: string;
  loginCount: number;
  lastLoginAt: string | null;
  materialsUploaded: number;
  materialsViewed: number;
  materialsDownloaded: number;
  quizzesTaken: number;
  quizzesCreated: number;
  blogPostsCreated: number;
  bookmarksCreated: number;
  averageQuizScore: number | null;
  totalTimeSpent: number;
}

interface UserActivityLog {
  id: string;
  userId: string;
  activityType: string;
  description: string;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function UsersManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [resettingPassword, setResettingPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [viewingStatistics, setViewingStatistics] = useState<User | null>(null);
  const [viewingActivity, setViewingActivity] = useState<User | null>(null);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkUpdateData, setBulkUpdateData] = useState<any>({});
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    let filtered = users;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          user.firstName?.toLowerCase().includes(query) ||
          user.lastName?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (filterRole !== "all") {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    // Status filter
    if (filterStatus === "verified") {
      filtered = filtered.filter((user) => user.emailVerified);
    } else if (filterStatus === "unverified") {
      filtered = filtered.filter((user) => !user.emailVerified);
    } else if (filterStatus === "active") {
      filtered = filtered.filter((user) => user.onboardingCompleted);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((user) => !user.onboardingCompleted);
    }

    return filtered;
  }, [users, searchQuery, filterRole, filterStatus]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<User> }) => {
      const response = await fetch(`/api/admin/users/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setEditingUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setDeletingUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { userId: string; newPassword: string }) => {
      const response = await fetch(`/api/admin/users/${data.userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword: data.newPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset password");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset successfully",
      });
      setResettingPassword(null);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const response = await fetch("/api/admin/users/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userIds }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete users");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: data.message,
      });
      setSelectedUsers([]);
      setShowBulkDelete(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { userIds: string[]; updates: any }) => {
      const response = await fetch("/api/admin/users/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update users");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: data.message,
      });
      setSelectedUsers([]);
      setShowBulkUpdate(false);
      setBulkUpdateData({});
      setBulkAction("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: userStatistics } = useQuery<UserStatistics>({
    queryKey: ["/api/admin/users", viewingStatistics?.id, "statistics"],
    enabled: !!viewingStatistics,
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${viewingStatistics?.id}/statistics`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch statistics");
      return response.json();
    },
  });

  const { data: userActivity } = useQuery<UserActivityLog[]>({
    queryKey: ["/api/admin/users", viewingActivity?.id, "activity"],
    enabled: !!viewingActivity,
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${viewingActivity?.id}/activity?limit=50`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch activity");
      return response.json();
    },
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-role-admin/10 text-role-admin border-role-admin/20";
      case "institution":
        return "bg-role-institution/10 text-role-institution border-role-institution/20";
      case "student":
        return "bg-role-student/10 text-role-student border-role-student/20";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    
    updateUserMutation.mutate({
      id: editingUser.id,
      updates: {
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        role: editingUser.role,
        emailVerified: editingUser.emailVerified,
        onboardingCompleted: editingUser.onboardingCompleted,
      },
    });
  };

  const handleResetPassword = () => {
    if (!resettingPassword || !newPassword) return;
    
    resetPasswordMutation.mutate({
      userId: resettingPassword.id,
      newPassword,
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterRole("all");
    setFilterStatus("all");
  };

  const activeFiltersCount = 
    (searchQuery ? 1 : 0) +
    (filterRole !== "all" ? 1 : 0) +
    (filterStatus !== "all" ? 1 : 0);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) return;
    setShowBulkDelete(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedUsers);
  };

  const handleBulkUpdate = () => {
    if (selectedUsers.length === 0 || !bulkAction) return;
    setShowBulkUpdate(true);
  };

  const confirmBulkUpdate = () => {
    bulkUpdateMutation.mutate({ userIds: selectedUsers, updates: bulkUpdateData });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-section font-heading text-foreground mb-2">
          User Management
        </h1>
        <p className="text-muted-foreground">
          Manage all platform users, roles, and permissions
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="institution">Institution</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="w-full md:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Operations Toolbar */}
      {selectedUsers.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {selectedUsers.length} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Select value={bulkAction} onValueChange={(value) => {
                  setBulkAction(value);
                  if (value === "role") {
                    setBulkUpdateData({});
                  } else if (value === "verify") {
                    setBulkUpdateData({ emailVerified: true });
                  } else if (value === "unverify") {
                    setBulkUpdateData({ emailVerified: false });
                  }
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verify">Verify Emails</SelectItem>
                    <SelectItem value="unverify">Unverify Emails</SelectItem>
                    <SelectItem value="role">Change Role</SelectItem>
                  </SelectContent>
                </Select>
                {bulkAction === "role" && (
                  <Select onValueChange={(value) => setBulkUpdateData({ role: value })}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="institution">Institution</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {bulkAction && (
                  <Button onClick={handleBulkUpdate} size="sm">
                    Apply
                  </Button>
                )}
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-role-admin" />
                All Users
              </CardTitle>
              <CardDescription>
                {filteredUsers.length} of {users?.length || 0} users
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>No users found</p>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={toggleAllUsers}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold">
                              {user.firstName?.[0] || user.email[0].toUpperCase()}
                              {user.lastName?.[0] || ""}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : "No name set"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role || "student")}>
                          {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                          {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Student"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            {user.emailVerified ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-xs">
                              {user.emailVerified ? "Verified" : "Unverified"}
                            </span>
                          </div>
                          {user.onboardingCompleted && (
                            <span className="text-xs text-muted-foreground">Active</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setViewingStatistics(user)}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Statistics
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewingActivity(user)}>
                              <Activity className="h-4 w-4 mr-2" />
                              View Activity
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                              <UserCog className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setResettingPassword(user)}>
                              <Key className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeletingUser(user)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editingUser.firstName || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editingUser.lastName || ""}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editingUser.role || "student"}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, role: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="institution">Institution</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="emailVerified"
                    checked={editingUser.emailVerified}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, emailVerified: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="emailVerified" className="cursor-pointer">
                    Email Verified
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="onboardingCompleted"
                    checked={editingUser.onboardingCompleted}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        onboardingCompleted: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="onboardingCompleted" className="cursor-pointer">
                    Onboarding Completed
                  </Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateUser}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for{" "}
              <strong>{deletingUser?.email}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingUser && deleteUserMutation.mutate(deletingUser.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resettingPassword} onOpenChange={(open) => !open && setResettingPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resettingPassword?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setResettingPassword(null);
              setNewPassword("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending || newPassword.length < 8}
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Statistics Dialog */}
      <Dialog open={!!viewingStatistics} onOpenChange={(open) => !open && setViewingStatistics(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              User Statistics
            </DialogTitle>
            <DialogDescription>
              Activity statistics for {viewingStatistics?.email}
            </DialogDescription>
          </DialogHeader>
          {!userStatistics ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Loading statistics...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-600" />
                  Login Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Login Count:</span>
                  <Badge variant="secondary">{userStatistics?.loginCount || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Login:</span>
                  <span className="text-sm">
                    {userStatistics?.lastLoginAt
                      ? new Date(userStatistics.lastLoginAt).toLocaleDateString()
                      : "Never"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  Materials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Uploaded:</span>
                  <Badge variant="secondary">{userStatistics?.materialsUploaded || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Viewed:</span>
                  <Badge variant="secondary">{userStatistics?.materialsViewed || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Downloaded:</span>
                  <Badge variant="secondary">{userStatistics?.materialsDownloaded || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                  Quizzes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Taken:</span>
                  <Badge variant="secondary">{userStatistics?.quizzesTaken || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created:</span>
                  <Badge variant="secondary">{userStatistics?.quizzesCreated || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Score:</span>
                  <Badge variant="secondary">
                    {userStatistics?.averageQuizScore ? `${userStatistics.averageQuizScore}%` : "N/A"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-600" />
                  Other Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Blog Posts:</span>
                  <Badge variant="secondary">{userStatistics?.blogPostsCreated || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bookmarks:</span>
                  <Badge variant="secondary">{userStatistics?.bookmarksCreated || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Time Spent:</span>
                  <Badge variant="secondary">
                    {userStatistics?.totalTimeSpent ? `${userStatistics.totalTimeSpent}m` : "0m"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Activity Dialog */}
      <Dialog open={!!viewingActivity} onOpenChange={(open) => !open && setViewingActivity(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Log
            </DialogTitle>
            <DialogDescription>
              Recent activity for {viewingActivity?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {!userActivity ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Loading activity...</p>
                </div>
              </div>
            ) : userActivity.length > 0 ? (
              userActivity.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          {log.activityType.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{log.description}</p>
                      {log.ipAddress && (
                        <p className="text-xs text-muted-foreground mt-1">IP: {log.ipAddress}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No activity logs found</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedUsers.length} users?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedUsers.length} user account{selectedUsers.length !== 1 ? 's' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete Users"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Update Dialog */}
      <Dialog open={showBulkUpdate} onOpenChange={setShowBulkUpdate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update {selectedUsers.length} users?</DialogTitle>
            <DialogDescription>
              This will update {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} with the selected changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {bulkAction === "verify" && (
              <p className="text-sm">All selected users will be marked as email verified.</p>
            )}
            {bulkAction === "unverify" && (
              <p className="text-sm">All selected users will be marked as email unverified.</p>
            )}
            {bulkAction === "role" && bulkUpdateData.role && (
              <p className="text-sm">
                All selected users will have their role changed to: <Badge>{bulkUpdateData.role}</Badge>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkUpdate(false)}>
              Cancel
            </Button>
            <Button onClick={confirmBulkUpdate} disabled={bulkUpdateMutation.isPending}>
              {bulkUpdateMutation.isPending ? "Updating..." : "Update Users"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
