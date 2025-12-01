import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar";
import { SidebarProfile } from "@/components/sidebar/SidebarProfile";
import { SidebarSection } from "@/components/sidebar/SidebarSection";
import { SidebarFooter } from "@/components/sidebar/SidebarFooter";
import { menuConfig } from "@/config/navigation";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  const { user } = useAuth();

  const userRole = user?.role || "student";
  const roleConfig = menuConfig[userRole];

  if (!roleConfig) {
    return null;
  }

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-border bg-card"
    >
      <SidebarProfile
        firstName={user?.firstName}
        lastName={user?.lastName}
        email={user?.email}
        role={user?.role}
        profileImageUrl={user?.profileImageUrl}
      />

      <SidebarContent className="py-4">
        <SidebarSection section={roleConfig.primary} />
        
        {roleConfig.secondary && (
          <>
            <Separator className="my-3 mx-4" />
            <SidebarSection section={roleConfig.secondary} />
          </>
        )}
      </SidebarContent>

      <SidebarFooter footerItems={roleConfig.footer} />
    </Sidebar>
  );
}
