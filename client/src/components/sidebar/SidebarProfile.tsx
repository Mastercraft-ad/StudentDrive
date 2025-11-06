import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarHeader } from "@/components/ui/sidebar";

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
  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`
      : email?.[0].toUpperCase() || "U";

  const roleName = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

  return (
    <SidebarHeader className="border-b border-border/40 px-3 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
      <div
        className="flex items-center gap-3 px-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        data-testid="sidebar-user-profile"
      >
        <Avatar className="h-9 w-9 border-2 border-primary/20 flex-shrink-0" data-testid="avatar-user">
          <AvatarImage src={profileImageUrl || undefined} alt={firstName || "User"} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="group-data-[collapsible=icon]:hidden flex flex-col min-w-0">
          <p className="text-sm font-semibold truncate text-slate-100 leading-tight" data-testid="text-user-name">
            {firstName} {lastName}
          </p>
          <p className="text-xs text-slate-400 truncate leading-tight mt-0.5" data-testid="text-user-role">
            {roleName}
          </p>
        </div>
      </div>
    </SidebarHeader>
  );
}
