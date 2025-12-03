import { useLocation } from "wouter";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavItem } from "./NavItem";
import { CollapsibleNavGroup } from "./CollapsibleNavGroup";
import { isPathActive } from "@/config/navigation";
import type { MenuSection } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface SidebarSectionProps {
  section: MenuSection;
}

export function SidebarSection({ section }: SidebarSectionProps) {
  const [location] = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroup>
      {section.label && !isCollapsed && (
        <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          {section.label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className={cn("space-y-1", isCollapsed ? "px-1" : "px-2")}>
          {section.items.map((item) => {
            if (item.children && item.children.length > 0) {
              return <CollapsibleNavGroup key={item.title} item={item} />;
            }

            const isActive = isPathActive(item.url, location);
            return <NavItem key={item.title} item={item} isActive={isActive} />;
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
