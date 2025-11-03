import { Bell, Search, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Settings, LogOut } from "lucide-react";

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export function AppHeader() {
  const { user } = useAuth();
  const [location] = useLocation();

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.[0].toUpperCase() || "U";

  const getBreadcrumbs = (): BreadcrumbSegment[] => {
    const paths = location.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbSegment[] = [];

    if (paths.length === 0) {
      return [{ label: "Dashboard" }];
    }

    const rolePrefix = paths[0];
    let currentPath = "";

    paths.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      const labelMap: Record<string, string> = {
        "admin": "Admin",
        "instructor": "Instructor",
        "institution": "Institution",
        "student": "Student",
        "resources": "Resources",
        "materials": "Materials",
        "quizzes": "Quizzes",
        "performance": "Performance",
        "analytics": "Analytics",
        "users": "Users",
        "institutions": "Institutions",
        "courses": "Courses",
        "content": "Content Moderation",
        "blog": "Blog",
        "posts": "Posts",
        "categories": "Categories",
        "tags": "Tags",
        "new": "New",
        "edit": "Edit",
        "create": "Create",
        "upload": "Upload",
        "my-library": "My Library",
        "bookmarks": "Bookmarks",
        "settings": "Settings",
        "students": "Students",
        "instructors": "Instructors",
      };

      const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      if (index < paths.length - 1) {
        breadcrumbs.push({ label, href: currentPath });
      } else {
        breadcrumbs.push({ label });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      <SidebarTrigger data-testid="button-sidebar-toggle" className="-ml-1" />
      
      <div className="hidden md:flex items-center flex-1">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" data-testid="breadcrumb-home">
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.length > 0 && breadcrumbs[0].label !== "Dashboard" && (
              <>
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {crumb.href ? (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href} data-testid={`breadcrumb-${crumb.label.toLowerCase().replace(/\s+/g, '-')}`}>
                            {crumb.label}
                          </Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage data-testid={`breadcrumb-${crumb.label.toLowerCase().replace(/\s+/g, '-')}`}>
                          {crumb.label}
                        </BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            3
          </Badge>
          <span className="sr-only">Notifications</span>
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full"
              data-testid="button-user-menu-header"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage 
                  src={user?.profileImageUrl || undefined} 
                  alt={user?.firstName || "User"} 
                  style={{ objectFit: 'cover' }}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" data-testid="menu-settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                window.location.href = '/login';
              }}
              data-testid="menu-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
