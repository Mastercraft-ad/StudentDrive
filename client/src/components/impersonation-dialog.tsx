import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useToast } from "@/hooks/use-toast";
import { 
  School, 
  Shield, 
  AlertTriangle, 
  Search,
  Users,
  GraduationCap,
  BookOpen,
} from "lucide-react";

interface School {
  id: string;
  name: string;
  subdomain: string;
  subscriptionStatus: string;
  isActive: boolean;
  studentsCount: number;
  teachersCount: number;
  parentsCount: number;
}

interface SchoolAdmin {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImageUrl: string | null;
}

interface ImpersonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedSchool?: School;
}

export function ImpersonationDialog({ 
  open, 
  onOpenChange, 
  preselectedSchool 
}: ImpersonationDialogProps) {
  const { startImpersonation, isStarting } = useImpersonation();
  const { toast } = useToast();
  
  const [selectedSchool, setSelectedSchool] = useState<School | null>(preselectedSchool || null);
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");

  const { data: schools, isLoading: schoolsLoading } = useQuery<School[]>({
    queryKey: ["/api/super-admin/schools"],
    enabled: open && !preselectedSchool,
  });

  const filteredSchools = schools?.filter(school => 
    school.name.toLowerCase().includes(search.toLowerCase()) ||
    school.subdomain.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleStartImpersonation = async () => {
    if (!selectedSchool) {
      toast({
        title: "Error",
        description: "Please select a school to impersonate",
        variant: "destructive",
      });
      return;
    }

    if (reason.trim().length < 5) {
      toast({
        title: "Error",
        description: "Please provide a valid reason (minimum 5 characters)",
        variant: "destructive",
      });
      return;
    }

    try {
      await startImpersonation(selectedSchool.id, reason);
      toast({
        title: "Impersonation Started",
        description: `You are now viewing as ${selectedSchool.name} admin`,
      });
      onOpenChange(false);
      setReason("");
      setSelectedSchool(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start impersonation",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setReason("");
    setSelectedSchool(preselectedSchool || null);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            Impersonate School Admin
          </DialogTitle>
          <DialogDescription>
            View the platform as a school administrator. All actions will be logged for security.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-md bg-amber-500/10 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Impersonation is a powerful feature. All actions during impersonation are logged 
              and audited. Only use this for legitimate support and debugging purposes.
            </p>
          </div>

          {!preselectedSchool && (
            <div className="space-y-2">
              <Label>Select School</Label>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schools..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-schools"
                />
              </div>
              <ScrollArea className="h-[200px] rounded-md border">
                {schoolsLoading ? (
                  <div className="space-y-2 p-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredSchools.length > 0 ? (
                  <div className="space-y-1 p-2">
                    {filteredSchools.map((school) => (
                      <button
                        key={school.id}
                        onClick={() => setSelectedSchool(school)}
                        className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${
                          selectedSchool?.id === school.id
                            ? "bg-primary/10 border border-primary"
                            : "hover-elevate"
                        }`}
                        data-testid={`button-select-school-${school.id}`}
                      >
                        <div className="p-1.5 bg-muted rounded-md">
                          <School className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{school.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {school.subdomain}.studentdrive.com
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={school.isActive ? "default" : "secondary"} className="text-xs">
                            {school.subscriptionStatus}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <School className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No schools found</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {(selectedSchool || preselectedSchool) && (
            <div className="rounded-md border p-3 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <School className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{(selectedSchool || preselectedSchool)?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedSchool || preselectedSchool)?.subdomain}.studentdrive.com
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {(selectedSchool || preselectedSchool)?.studentsCount || 0} students
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {(selectedSchool || preselectedSchool)?.teachersCount || 0} teachers
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {(selectedSchool || preselectedSchool)?.parentsCount || 0} parents
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Impersonation *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you need to access this school's account (e.g., support ticket #1234, debugging issue with grades entry)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
              data-testid="textarea-reason"
            />
            <p className="text-xs text-muted-foreground">
              This reason will be logged and may be reviewed during audits.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleStartImpersonation}
            disabled={!selectedSchool && !preselectedSchool || reason.trim().length < 5 || isStarting}
            data-testid="button-start-impersonation"
          >
            {isStarting ? "Starting..." : "Start Impersonation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
