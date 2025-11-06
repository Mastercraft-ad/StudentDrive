import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar";
import { SidebarProfile } from "@/components/sidebar/SidebarProfile";
import { SidebarSection } from "@/components/sidebar/SidebarSection";
import { SidebarFooter } from "@/components/sidebar/SidebarFooter";
import { menuConfig } from "@/config/navigation";

export function AppSidebar() {
  const { user } = useAuth();

  const userRole = user?.role || "student";
  const roleConfig = menuConfig[userRole];

  if (!roleConfig) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-slate-900 dark:bg-slate-950">
      <SidebarProfile
        firstName={user?.firstName}
        lastName={user?.lastName}
        email={user?.email}
        role={user?.role}
        profileImageUrl={user?.profileImageUrl}
      />

      <SidebarContent className="p-4 group-data-[collapsible=icon]:p-2">
        <SidebarSection section={roleConfig.primary} showSeparator={!!roleConfig.secondary} />
        
        {roleConfig.secondary && (
          <SidebarSection section={roleConfig.secondary} />
        )}
      </SidebarContent>

      <SidebarFooter footerItems={roleConfig.footer} />
    </Sidebar>
  );
}
