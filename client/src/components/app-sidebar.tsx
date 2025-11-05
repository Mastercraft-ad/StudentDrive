import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Library,
  Upload,
  Newspaper,
  FolderTree,
  Tag,
} from "lucide-react";

export function AppSidebar() {
  const { user, isStudent, isInstructor, isInstitution, isAdmin } = useAuth();
  const [location] = useLocation();
  const { state } = useSidebar();

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.[0].toUpperCase() || "U";

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

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-slate-900 dark:bg-slate-950">
      <SidebarHeader className="border-b border-border/40 p-4 group-data-[collapsible=icon]:p-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center" data-testid="sidebar-user-profile">
          <Avatar className="h-10 w-10 border-2 border-primary/20" data-testid="avatar-user">
            <AvatarImage 
              src={user?.profileImageUrl || undefined} 
              alt={user?.firstName || "User"}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="group-data-[collapsible=icon]:hidden flex flex-col min-w-0">
            <p className="text-sm font-semibold truncate text-slate-100" data-testid="text-user-name">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate" data-testid="text-user-role">
              {roleName}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`
                        transition-colors duration-150 h-11
                        ${isActive 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                          : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                        }
                        group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:h-11
                      `}
                    >
                      <Link 
                        href={item.url} 
                        className="flex items-center gap-3 px-3 py-2 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium text-sm group-data-[collapsible=icon]:hidden truncate">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              
              {isAdmin && (
                <Collapsible open={blogOpen} onOpenChange={setBlogOpen} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Blog"
                        data-testid="nav-blog"
                        className="text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors duration-150 h-11 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:h-11"
                      >
                        <div className="flex items-center gap-3 px-3 py-2 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
                          <Newspaper className="h-5 w-5 flex-shrink-0" />
                          <span className="font-medium text-sm group-data-[collapsible=icon]:hidden flex-1">Blog</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden flex-shrink-0" />
                        </div>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="transition-all duration-200 group-data-[collapsible=icon]:hidden">
                      <SidebarMenuSub className="ml-6 mt-1 space-y-1 border-l border-slate-700 pl-3">
                        {blogSubItems.map((subItem) => {
                          const isSubActive = location === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                data-testid={`nav-blog-${subItem.title.toLowerCase()}`}
                                className={`
                                  transition-colors duration-150 h-9
                                  ${isSubActive
                                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                  }
                                `}
                              >
                                <Link href={subItem.url} className="flex items-center gap-2.5 px-2 py-1.5">
                                  <subItem.icon className="h-4 w-4 flex-shrink-0" />
                                  <span className="text-sm truncate">
                                    {subItem.title}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
