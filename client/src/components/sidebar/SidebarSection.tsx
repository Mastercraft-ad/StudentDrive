import { useLocation } from "wouter";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NavItem } from "./NavItem";
import { CollapsibleNavGroup } from "./CollapsibleNavGroup";
import { isPathActive } from "@/config/navigation";
import type { MenuSection } from "@/config/navigation";

interface SidebarSectionProps {
  section: MenuSection;
  showSeparator?: boolean;
}

export function SidebarSection({ section, showSeparator = false }: SidebarSectionProps) {
  const [location] = useLocation();

  return (
    <>
      <SidebarGroup>
        {section.label && (
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 group-data-[collapsible=icon]:hidden">
            {section.label}
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu className="space-y-1">
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
      {showSeparator && (
        <Separator className="my-2 bg-slate-700/50 group-data-[collapsible=icon]:hidden" />
      )}
    </>
  );
}
