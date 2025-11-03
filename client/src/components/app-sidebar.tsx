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
} from "@/components/ui/sidebar";
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
  ChevronRight,
  Library,
  Upload,
  Newspaper,
  FolderTree,
  Tag,
} from "lucide-react";
// @ts-expect-error - Asset import
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

  const roleStyles = isStudent
    ? { bg: "bg-role-student/10", text: "text-role-student", iconBg: "bg-gradient-to-br from-role-student/20 to-role-student/5" }
    : isInstructor
    ? { bg: "bg-role-instructor/10", text: "text-role-instructor", iconBg: "bg-gradient-to-br from-role-instructor/20 to-role-instructor/5" }
    : isInstitution
    ? { bg: "bg-role-institution/10", text: "text-role-institution", iconBg: "bg-gradient-to-br from-role-institution/20 to-role-institution/5" }
    : isAdmin
    ? { bg: "bg-role-admin/10", text: "text-role-admin", iconBg: "bg-gradient-to-br from-role-admin/20 to-role-admin/5" }
    : { bg: "bg-primary/10", text: "text-primary", iconBg: "bg-gradient-to-br from-primary/20 to-primary/5" };

  return (
    <Sidebar collapsible="icon" className="border-r-2 border-border h-full">
      <SidebarHeader className="p-4 border-b-2 border-border/40">
        <div className="flex items-center gap-3 min-h-[52px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
          <div className={`p-2.5 rounded-xl ${roleStyles.iconBg} border border-border/50 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center justify-center`}>
            <img 
              src={logoImg} 
              alt="StudentDrive Logo" 
              className="h-7 w-7 object-contain"
            />
          </div>
          <div className="group-data-[collapsible=icon]:hidden flex flex-col gap-0.5 min-w-0">
            <p className="font-heading font-bold text-lg tracking-tight truncate">StudentDrive</p>
            <p className={`text-[10px] font-bold ${roleStyles.text} uppercase tracking-wider px-2.5 py-1 rounded-md ${roleStyles.bg} inline-block w-fit`}>{roleName}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    tooltip={item.title}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className="transition-all duration-200 rounded-lg h-11 group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:mx-auto"
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-3 py-2.5 w-full group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center">
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="font-medium text-sm group-data-[collapsible=icon]:hidden truncate">{item.title}</span>
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
                        className="transition-all duration-200 rounded-lg h-11 group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:mx-auto"
                      >
                        <div className="flex items-center gap-3 px-3 py-2.5 w-full group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center">
                          <Newspaper className="h-5 w-5 shrink-0" />
                          <span className="font-medium text-sm group-data-[collapsible=icon]:hidden truncate">Blog</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                        </div>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="transition-all duration-300 group-data-[collapsible=icon]:hidden">
                      <SidebarMenuSub className="ml-4 mt-1 space-y-1 border-l-2 border-border/50 pl-3">
                        {blogSubItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location === subItem.url}
                              className="transition-colors duration-200 rounded-md h-9"
                            >
                              <Link href={subItem.url} className="flex items-center gap-2.5 px-3 py-2">
                                <subItem.icon className="h-4 w-4 shrink-0" />
                                <span className="text-sm font-medium truncate">{subItem.title}</span>
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
    </Sidebar>
  );
}
