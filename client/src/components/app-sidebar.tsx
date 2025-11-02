import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Home,
  BookOpen,
  FileText,
  ClipboardList,
  TrendingUp,
  Users,
  Settings,
  BarChart3,
  Shield,
  ChevronDown,
  ChevronRight,
  LogOut,
  Library,
  Mail,
  Upload,
  Newspaper,
  FolderTree,
  Tag,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logoImg from "@assets/StudentDrive logo_1762056464003.png";

export function AppSidebar() {
  const { user, isStudent, isInstructor, isInstitution, isAdmin } = useAuth();
  const [location] = useLocation();

  const studentMenuItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Resources", url: "/resources", icon: BookOpen },
    { title: "My Library", url: "/my-library", icon: Library },
    { title: "Upload Material", url: "/student/upload", icon: Upload },
    { title: "Quizzes", url: "/quizzes", icon: ClipboardList },
    { title: "Performance", url: "/performance", icon: TrendingUp },
    { title: "Bookmarks", url: "/bookmarks", icon: FileText },
  ];

  const instructorMenuItems = [
    { title: "Dashboard", url: "/instructor", icon: Home },
    { title: "My Courses", url: "/instructor/courses", icon: BookOpen },
    { title: "Materials", url: "/instructor/materials", icon: FileText },
    { title: "Quizzes", url: "/instructor/quizzes", icon: ClipboardList },
    { title: "Analytics", url: "/instructor/analytics", icon: BarChart3 },
  ];

  const institutionMenuItems = [
    { title: "Dashboard", url: "/institution", icon: Home },
    { title: "Students", url: "/institution/students", icon: Users },
    { title: "Instructors", url: "/institution/instructors", icon: Users },
    { title: "Courses", url: "/institution/courses", icon: BookOpen },
    { title: "Analytics", url: "/institution/analytics", icon: BarChart3 },
    { title: "Settings", url: "/institution/settings", icon: Settings },
  ];

  const [blogOpen, setBlogOpen] = useState(
    location.startsWith("/admin/blog")
  );

  const adminMenuItems = [
    { title: "Dashboard", url: "/admin", icon: Home },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Institutions", url: "/admin/institutions", icon: Shield },
    { title: "Content", url: "/admin/content", icon: FileText },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ];

  const blogSubItems = [
    { title: "Posts", url: "/admin/blog/posts", icon: Newspaper },
    { title: "Categories", url: "/admin/blog/categories", icon: FolderTree },
    { title: "Tags", url: "/admin/blog/tags", icon: Tag },
  ];

  const menuItems = isStudent
    ? studentMenuItems
    : isInstructor
    ? instructorMenuItems
    : isInstitution
    ? institutionMenuItems
    : isAdmin
    ? adminMenuItems
    : [];

  const roleName = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User";

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.[0].toUpperCase() || "U";

  const roleStyles = isStudent
    ? { bg: "bg-role-student/10", text: "text-role-student" }
    : isInstructor
    ? { bg: "bg-role-instructor/10", text: "text-role-instructor" }
    : isInstitution
    ? { bg: "bg-role-institution/10", text: "text-role-institution" }
    : isAdmin
    ? { bg: "bg-role-admin/10", text: "text-role-admin" }
    : { bg: "bg-primary/10", text: "text-primary" };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img 
            src={logoImg} 
            alt="StudentDrive Logo" 
            className="h-8 w-8 object-contain"
          />
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="font-heading font-bold">StudentDrive</p>
            <p className="text-xs text-muted-foreground">{roleName}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    tooltip={item.title}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {isAdmin && (
                <Collapsible open={blogOpen} onOpenChange={setBlogOpen} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Blog"
                        data-testid="nav-blog"
                      >
                        <Newspaper className="h-4 w-4" />
                        <span>Blog</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {blogSubItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <subItem.icon className="h-4 w-4" />
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full hover-elevate active-elevate-2 rounded-md p-2" data-testid="button-user-menu">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} style={{ objectFit: 'cover' }} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                window.location.href = '/login';
              }}
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
