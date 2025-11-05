import { Link } from "wouter";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { NavItem as NavItemType } from "@/config/navigation";

interface NavItemProps {
  item: NavItemType;
  isActive: boolean;
}

const baseStyles = "transition-colors duration-150 h-11";
const activeStyles = "bg-primary text-primary-foreground hover:bg-primary/90";
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
          "group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:h-11"
        )}
      >
        <Link href={item.url} className="flex items-center gap-3 w-full">
          <item.icon className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium text-sm group-data-[collapsible=icon]:hidden truncate">
            {item.title}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
