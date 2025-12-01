import { Link } from "wouter";
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { NavItem as NavItemType } from "@/config/navigation";

interface NavItemProps {
  item: NavItemType;
  isActive: boolean;
}

export function NavItem({ item, isActive }: NavItemProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const buttonContent = (
    <Link href={item.url} className="flex items-center gap-3 w-full">
      <item.icon className={cn(
        "flex-shrink-0 transition-colors",
        isCollapsed ? "w-5 h-5" : "w-5 h-5",
        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
      )} />
      {!isCollapsed && (
        <span className={cn(
          "text-sm font-medium truncate transition-colors",
          isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
        )}>
          {item.title}
        </span>
      )}
    </Link>
  );

  const menuButton = (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
      className={cn(
        "group h-10 transition-all duration-200",
        isCollapsed ? "w-10 justify-center px-0" : "px-3",
        isActive 
          ? "bg-primary/10 border border-primary/20" 
          : "hover:bg-accent"
      )}
    >
      {buttonContent}
    </SidebarMenuButton>
  );

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            {menuButton}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      {menuButton}
    </SidebarMenuItem>
  );
}
