import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationPanel } from "@/components/notification-panel";
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
import { Settings, LogOut } from "lucide-react";
// @ts-expect-error - Asset import
import logoImg from "@assets/StudentDrive logo_1762056464003.png";

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
    <header className="w-full h-16 flex items-center gap-4 border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6 z-50">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-border/40 shadow-sm flex-shrink-0">
          <img 
            src={logoImg} 
            alt="StudentDrive Logo" 
            className="h-6 w-6 object-contain"
            data-testid="img-app-logo"
          />
        </div>
        <span className="font-heading font-bold text-lg tracking-tight hidden md:inline-block whitespace-nowrap" data-testid="text-app-name">
          StudentDrive
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <NotificationPanel />

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
