import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { BookOpen } from "lucide-react";

interface SidebarProfileProps {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: string | null;
  profileImageUrl?: string | null;
}

export function SidebarProfile({
  firstName,
  lastName,
  email,
  role,
  profileImageUrl,
}: SidebarProfileProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`
      : email?.[0].toUpperCase() || "U";

  const displayName = firstName && lastName ? `${firstName} ${lastName}` : email || "User";
  const roleName = role ? role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ') : "User";

  return (
    <SidebarHeader className="p-4 border-b border-border">
      <div className="flex items-center gap-3" data-testid="sidebar-user-profile">
        {isCollapsed ? (
          <div className="flex items-center justify-center w-full">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
          </div>
        ) : (
          <>
            <Avatar className="h-10 w-10 border-2 border-primary/20 flex-shrink-0" data-testid="avatar-user">
              <AvatarImage src={profileImageUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-foreground" data-testid="text-user-name">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate" data-testid="text-user-role">
                {roleName}
              </p>
            </div>
          </>
        )}
      </div>
    </SidebarHeader>
  );
}
