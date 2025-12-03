import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  MessageCircle,
  UserPlus,
  UserMinus,
  Crown,
  Shield,
  Zap,
  Clock,
  Globe,
  Lock,
  Send,
  ChevronRight,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  courseId: string | null;
  isPublic: boolean;
  maxMembers: number | null;
  createdById: string;
  lastActivityAt: string | null;
  totalXpEarned: number;
  isActive: boolean;
  memberCount: number;
  isMember?: boolean;
  memberRole?: string;
}

interface StudyGroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  xpContributed: number;
  messagesCount: number;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
}

interface StudyGroupMessage {
  id: string;
  groupId: string;
  userId: string;
  content: string;
  attachmentType: string | null;
  attachmentId: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
}

const createGroupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
  maxMembers: z.number().min(2).max(50).default(10),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: Users,
};

function GroupCard({ 
  group, 
  onJoin, 
  onLeave,
  onSelect,
  isJoining,
  isLeaving,
}: { 
  group: StudyGroup;
  onJoin: () => void;
  onLeave: () => void;
  onSelect: () => void;
  isJoining: boolean;
  isLeaving: boolean;
}) {
  return (
    <Card 
      className="hover-elevate cursor-pointer"
      onClick={onSelect}
      data-testid={`group-card-${group.id}`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{group.name}</h3>
              {group.isPublic ? (
                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            {group.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {group.description}
              </p>
            )}
            
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {group.memberCount}/{group.maxMembers || 10}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Zap className="h-3 w-3" />
                {group.totalXpEarned} XP
              </Badge>
              {group.memberRole && (
                <Badge variant="secondary" className="capitalize gap-1">
                  {roleIcons[group.memberRole] && (() => {
                    const Icon = roleIcons[group.memberRole];
                    return <Icon className="h-3 w-3" />;
                  })()}
                  {group.memberRole}
                </Badge>
              )}
            </div>
          </div>
          
          <div onClick={(e) => e.stopPropagation()}>
            {group.isMember ? (
              group.memberRole !== 'owner' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLeave}
                  disabled={isLeaving}
                  data-testid={`leave-group-${group.id}`}
                >
                  <UserMinus className="h-4 w-4 mr-1" />
                  Leave
                </Button>
              )
            ) : (
              <Button
                size="sm"
                onClick={onJoin}
                disabled={isJoining || (group.maxMembers !== null && group.memberCount >= group.maxMembers)}
                data-testid={`join-group-${group.id}`}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Join
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupDetail({ 
  group, 
  onClose 
}: { 
  group: StudyGroup;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messageInput, setMessageInput] = useState("");
  
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery<StudyGroupMessage[]>({
    queryKey: ["/api/study-groups", group.id, "messages"],
    enabled: !!group.isMember,
  });
  
  const { data: members = [], isLoading: membersLoading } = useQuery<StudyGroupMember[]>({
    queryKey: ["/api/study-groups", group.id, "members"],
  });
  
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest("POST", `/api/study-groups/${group.id}/messages`, { content }),
    onSuccess: () => {
      setMessageInput("");
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/profile"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessageMutation.mutate(messageInput.trim());
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{group.name}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Back to Groups
          </Button>
        </div>
        {group.description && (
          <p className="text-muted-foreground mt-1">{group.description}</p>
        )}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Discussion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {group.isMember ? (
                <>
                  <ScrollArea className="h-[400px] pr-4">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-12 w-48" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div 
                            key={msg.id} 
                            className={`flex gap-3 ${msg.userId === user?.id ? 'flex-row-reverse' : ''}`}
                            data-testid={`message-${msg.id}`}
                          >
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src={msg.user.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {msg.user.firstName?.[0]}{msg.user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`max-w-[70%] ${msg.userId === user?.id ? 'text-right' : ''}`}>
                              <p className="text-sm font-medium">
                                {msg.user.firstName} {msg.user.lastName}
                              </p>
                              <div 
                                className={`mt-1 p-3 rounded-lg ${
                                  msg.userId === user?.id 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm">{msg.content}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(msg.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                      </div>
                    )}
                  </ScrollArea>
                  
                  <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      disabled={sendMessageMutation.isPending}
                      data-testid="input-message"
                    />
                    <Button 
                      type="submit" 
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </>
              ) : (
                <div className="text-center py-12">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Join the group to participate in discussions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {membersLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => {
                      const RoleIcon = roleIcons[member.role] || Users;
                      return (
                        <div key={member.id} className="flex items-center gap-3" data-testid={`member-${member.id}`}>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.user.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {member.user.firstName?.[0]}{member.user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {member.user.firstName} {member.user.lastName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <RoleIcon className="h-3 w-3" />
                              <span className="capitalize">{member.role}</span>
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {member.xpContributed}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CreateGroupDialog({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  const form = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: true,
      maxMembers: 10,
    },
  });
  
  const createMutation = useMutation({
    mutationFn: (data: CreateGroupForm) =>
      apiRequest("POST", "/api/study-groups", data),
    onSuccess: () => {
      toast({
        title: "Group Created",
        description: "Your study group has been created successfully!",
      });
      setOpen(false);
      form.reset();
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create study group",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: CreateGroupForm) => {
    createMutation.mutate(data);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-group">
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Study Group</DialogTitle>
          <DialogDescription>
            Start a new study group to collaborate with peers
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Math Study Buddies" {...field} data-testid="input-group-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What is this group about?" 
                      {...field} 
                      data-testid="input-group-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Public Group</FormLabel>
                    <FormDescription>
                      Anyone can join a public group
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-public"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="maxMembers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Members</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={2} 
                      max={50}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                      data-testid="input-max-members"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid="button-submit-create-group"
              >
                {createMutation.isPending ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function StudyGroupsPage() {
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  
  const { data: myGroups = [], isLoading: myGroupsLoading, refetch: refetchMyGroups } = useQuery<StudyGroup[]>({
    queryKey: ["/api/study-groups", { onlyMine: true }],
  });
  
  const { data: publicGroups = [], isLoading: publicGroupsLoading, refetch: refetchPublicGroups } = useQuery<StudyGroup[]>({
    queryKey: ["/api/study-groups"],
  });
  
  const joinMutation = useMutation({
    mutationFn: (groupId: string) =>
      apiRequest("POST", `/api/study-groups/${groupId}/join`),
    onSuccess: () => {
      toast({
        title: "Joined Group",
        description: "You've successfully joined the study group!",
      });
      refetchMyGroups();
      refetchPublicGroups();
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join group",
        variant: "destructive",
      });
    },
  });
  
  const leaveMutation = useMutation({
    mutationFn: (groupId: string) =>
      apiRequest("POST", `/api/study-groups/${groupId}/leave`),
    onSuccess: () => {
      toast({
        title: "Left Group",
        description: "You've left the study group",
      });
      refetchMyGroups();
      refetchPublicGroups();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave group",
        variant: "destructive",
      });
    },
  });
  
  const handleRefresh = () => {
    refetchMyGroups();
    refetchPublicGroups();
  };
  
  if (selectedGroup) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <GroupDetail 
          group={selectedGroup} 
          onClose={() => {
            setSelectedGroup(null);
            handleRefresh();
          }} 
        />
      </div>
    );
  }
  
  const isLoading = myGroupsLoading || publicGroupsLoading;
  
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-section font-heading text-foreground mb-1">Study Groups</h1>
          <p className="text-muted-foreground">
            Collaborate with peers and learn together
          </p>
        </div>
        <CreateGroupDialog onSuccess={handleRefresh} />
      </div>
      
      <Tabs defaultValue="my-groups" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-groups" data-testid="tab-my-groups">
            My Groups ({myGroups.length})
          </TabsTrigger>
          <TabsTrigger value="discover" data-testid="tab-discover-groups">
            Discover
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-groups">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : myGroups.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {myGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onJoin={() => joinMutation.mutate(group.id)}
                  onLeave={() => leaveMutation.mutate(group.id)}
                  onSelect={() => setSelectedGroup(group)}
                  isJoining={joinMutation.isPending}
                  isLeaving={leaveMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Groups Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create a study group or join an existing one to start collaborating!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="discover">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : publicGroups.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {publicGroups.filter(g => !myGroups.some(mg => mg.id === g.id)).map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onJoin={() => joinMutation.mutate(group.id)}
                  onLeave={() => leaveMutation.mutate(group.id)}
                  onSelect={() => setSelectedGroup(group)}
                  isJoining={joinMutation.isPending}
                  isLeaving={leaveMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Public Groups</h3>
                <p className="text-muted-foreground">
                  Be the first to create a public study group!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
