import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarHeader } from "@/components/ui/sidebar";

interface SidebarProfileProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  profileImageUrl?: string | null;
}

export function SidebarProfile({
  firstName,
  lastName,
  email,
  role,
  profileImageUrl,
}: SidebarProfileProps) {
  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`
      : email?.[0].toUpperCase() || "U";

  const roleName = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

  return (
    <SidebarHeader className="border-b border-border/40 p-4">
      <div
        className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
        data-testid="sidebar-user-profile"
      >
        <Avatar className="h-10 w-10 border-2 border-primary/20" data-testid="avatar-user">
          <AvatarImage src={profileImageUrl || undefined} alt={firstName || "User"} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="group-data-[collapsible=icon]:hidden flex flex-col min-w-0">
          <p className="text-sm font-semibold truncate text-slate-100" data-testid="text-user-name">
            {firstName} {lastName}
          </p>
          <p className="text-xs text-slate-400 truncate" data-testid="text-user-role">
            {roleName}
          </p>
        </div>
      </div>
    </SidebarHeader>
  );
}
