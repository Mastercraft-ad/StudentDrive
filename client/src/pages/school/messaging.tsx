import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/useAuth";
import {
  MessageSquare,
  Plus,
  Send,
  User,
  Clock,
  ArrowLeft,
  Search,
  Mail,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  schoolId: string;
  parentId: string;
  teacherId: string;
  studentId: string | null;
  subject: string | null;
  lastMessageAt: string;
  parentUnreadCount: number;
  teacherUnreadCount: number;
  status: string;
  parent: Participant | null;
  teacher: Participant | null;
  student: Participant | null;
  messages?: Message[];
}

interface TeacherOption {
  teacher: Participant;
  className?: string;
}

interface ParentOption {
  parent: Participant;
  student: Participant;
}

const newConversationSchema = z.object({
  recipientId: z.string().min(1, "Please select a recipient"),
  studentId: z.string().optional(),
  subject: z.string().optional(),
  initialMessage: z.string().min(1, "Message is required"),
});

type NewConversationFormData = z.infer<typeof newConversationSchema>;

export default function MessagingPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const userRole = user?.role;
  const isParent = userRole === 'parent';
  const isTeacher = userRole === 'teacher';

  const { data: conversations, isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/school/conversations"],
    enabled: isParent || isTeacher,
  });

  const { data: conversationDetails, isLoading: detailsLoading } = useQuery<Conversation>({
    queryKey: ["/api/school/conversations", selectedConversation?.id],
    enabled: !!selectedConversation,
  });

  const { data: teachers } = useQuery<TeacherOption[]>({
    queryKey: ["/api/school/messaging/teachers"],
    enabled: isParent,
  });

  const { data: parents } = useQuery<ParentOption[]>({
    queryKey: ["/api/school/messaging/parents"],
    enabled: isTeacher,
  });

  const form = useForm<NewConversationFormData>({
    resolver: zodResolver(newConversationSchema),
    defaultValues: {
      recipientId: "",
      studentId: "",
      subject: "",
      initialMessage: "",
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async (data: NewConversationFormData) => {
      const payload: any = {
        subject: data.subject,
        initialMessage: data.initialMessage,
      };
      
      if (isParent) {
        payload.teacherId = data.recipientId;
      } else {
        payload.parentId = data.recipientId;
        payload.studentId = data.studentId;
      }
      
      return await apiRequest("POST", "/api/school/conversations", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/conversations"] });
      setShowNewDialog(false);
      form.reset();
      toast({
        title: "Conversation Started",
        description: "Your message has been sent.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start conversation",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      return await apiRequest("POST", `/api/school/conversations/${conversationId}/messages`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school/conversations", selectedConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/school/conversations"] });
      setNewMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!selectedConversation || !newMessage.trim()) return;
    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      content: newMessage.trim(),
    });
  };

  const handleNewConversation = (data: NewConversationFormData) => {
    createConversationMutation.mutate(data);
  };

  const getOtherParticipant = (conv: Conversation) => {
    return isParent ? conv.teacher : conv.parent;
  };

  const getUnreadCount = (conv: Conversation) => {
    return isParent ? conv.parentUnreadCount : conv.teacherUnreadCount;
  };

  const filteredConversations = conversations?.filter(conv => {
    if (!searchQuery) return true;
    const participant = getOtherParticipant(conv);
    const name = `${participant?.firstName} ${participant?.lastName}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || 
           conv.subject?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isParent && !isTeacher) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <PageHeader
          title="Messages"
          description="Parent-teacher messaging"
        />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Messaging Not Available</h3>
              <p className="text-muted-foreground">
                Parent-teacher messaging is only available for parents and teachers.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Messages"
        description="Communicate with teachers and parents"
      />

      <div className="flex-1 flex overflow-hidden">
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r bg-background`}>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-conversations"
                />
              </div>
              <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogTrigger asChild>
                  <Button size="icon" data-testid="button-new-conversation">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Conversation</DialogTitle>
                    <DialogDescription>
                      Start a new conversation with a {isParent ? "teacher" : "parent"}.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleNewConversation)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="recipientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {isParent ? "Select Teacher" : "Select Parent"}
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-recipient">
                                  <SelectValue placeholder={`Choose a ${isParent ? "teacher" : "parent"}`} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isParent && teachers?.map((t) => (
                                  <SelectItem key={t.teacher.id} value={t.teacher.id}>
                                    {t.teacher.firstName} {t.teacher.lastName}
                                    {t.className && ` - ${t.className}`}
                                  </SelectItem>
                                ))}
                                {isTeacher && parents?.map((p) => (
                                  <SelectItem key={`${p.parent.id}-${p.student.id}`} value={p.parent.id}>
                                    {p.parent.firstName} {p.parent.lastName} (Parent of {p.student.firstName})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter subject"
                                {...field}
                                data-testid="input-subject"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="initialMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Type your message..."
                                rows={4}
                                {...field}
                                data-testid="input-initial-message"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowNewDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createConversationMutation.isPending}
                          data-testid="button-send-new-conversation"
                        >
                          {createConversationMutation.isPending ? "Sending..." : "Send"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {conversationsLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredConversations?.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a new conversation to get started</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations?.map((conv) => {
                  const participant = getOtherParticipant(conv);
                  const unreadCount = getUnreadCount(conv);
                  const isSelected = selectedConversation?.id === conv.id;
                  
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 text-left hover-elevate ${
                        isSelected ? 'bg-accent' : ''
                      }`}
                      data-testid={`conversation-${conv.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={participant?.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {participant?.firstName?.[0]}{participant?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium truncate">
                              {participant?.firstName} {participant?.lastName}
                            </span>
                            {unreadCount > 0 && (
                              <Badge variant="default" className="shrink-0">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                          {conv.subject && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.subject}
                            </p>
                          )}
                          {conv.student && (
                            <p className="text-xs text-muted-foreground">
                              Re: {conv.student.firstName} {conv.student.lastName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
          {selectedConversation ? (
            <>
              <div className="p-4 border-b flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                  data-testid="button-back-to-list"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getOtherParticipant(selectedConversation)?.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {getOtherParticipant(selectedConversation)?.firstName?.[0]}
                    {getOtherParticipant(selectedConversation)?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">
                    {getOtherParticipant(selectedConversation)?.firstName}{" "}
                    {getOtherParticipant(selectedConversation)?.lastName}
                  </h3>
                  {selectedConversation.subject && (
                    <p className="text-sm text-muted-foreground">{selectedConversation.subject}</p>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {detailsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-3/4" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationDetails?.messages?.map((message) => {
                      const isMine = message.senderId === user?.id || 
                        (isParent && message.senderType === 'parent') ||
                        (isTeacher && message.senderType === 'teacher');
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                          data-testid={`message-${message.id}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              isMine
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={2}
                    className="resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    data-testid="input-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    size="icon"
                    className="shrink-0 h-auto"
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-1">Select a conversation</h3>
                <p className="text-sm">Choose a conversation from the list or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
