import { Link } from "wouter";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { NavItem as NavItemType } from "@/config/navigation";

interface NavItemProps {
  item: NavItemType;
  isActive: boolean;
}

const baseStyles = "transition-colors duration-150 h-10 px-2.5 rounded-lg";
const activeStyles = "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm";
const inactiveStyles = "text-slate-300 hover:bg-slate-800 hover:text-slate-100";

export function NavItem({ item, isActive }: NavItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
        className={cn(
          baseStyles,
          isActive ? activeStyles : inactiveStyles,
          "group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:px-0"
        )}
      >
        <Link href={item.url} className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
          <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
          <span className="font-medium text-[13px] group-data-[collapsible=icon]:hidden truncate">
            {item.title}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
