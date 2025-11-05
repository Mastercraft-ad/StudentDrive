import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { SidebarProfile } from "@/components/sidebar/SidebarProfile";
import { NavItem } from "@/components/sidebar/NavItem";
import { CollapsibleNavGroup } from "@/components/sidebar/CollapsibleNavGroup";
import { menuConfig, isPathActive } from "@/config/navigation";

export function AppSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const userRole = user?.role || "student";
  const menuItems = menuConfig[userRole] || [];

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-slate-900 dark:bg-slate-950">
      <SidebarProfile
        firstName={user?.firstName}
        lastName={user?.lastName}
        email={user?.email}
        role={user?.role}
        profileImageUrl={user?.profileImageUrl}
      />

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                if (item.children && item.children.length > 0) {
                  return <CollapsibleNavGroup key={item.title} item={item} />;
                }

                const isActive = isPathActive(item.url, location);
                return <NavItem key={item.title} item={item} isActive={isActive} />;
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
