import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/config/navigation";
import { isPathActive, isPathWithin } from "@/config/navigation";

interface CollapsibleNavGroupProps {
  item: NavItem;
}

export function CollapsibleNavGroup({ item }: CollapsibleNavGroupProps) {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(() => isPathWithin(item.url, location));
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { state } = useSidebar();
  const isWithinSection = item.children?.some(child => isPathActive(child.url, location)) || false;
  const isCollapsed = state === "collapsed";

  if (!item.children || item.children.length === 0) {
    return null;
  }

  const handleNavigation = (url: string) => {
    setPopoverOpen(false);
    setLocation(url);
  };

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className={cn(
                    "group h-10 w-10 justify-center px-0 transition-all duration-200",
                    isWithinSection 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-accent"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors",
                    isWithinSection ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                </SidebarMenuButton>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {item.title}
            </TooltipContent>
          </Tooltip>
          <PopoverContent 
            side="right" 
            align="start" 
            sideOffset={8}
            className="w-48 p-2"
            data-testid={`popover-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="space-y-1">
              {item.children.map((subItem) => {
                const isSubActive = isPathActive(subItem.url, location);
                return (
                  <button
                    key={subItem.title}
                    onClick={() => handleNavigation(subItem.url)}
                    data-testid={`nav-${item.title.toLowerCase()}-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                      isSubActive 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <subItem.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{subItem.title}</span>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            className={cn(
              "group h-10 px-3 transition-all duration-200",
              isWithinSection 
                ? "bg-primary/10 border border-primary/20" 
                : "hover:bg-accent"
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-colors",
                isWithinSection ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              <span className={cn(
                "text-sm font-medium truncate flex-1 transition-colors",
                isWithinSection ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {item.title}
              </span>
              <ChevronRight className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-90"
              )} />
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="transition-all duration-200">
          <SidebarMenuSub className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
            {item.children.map((subItem) => {
              const isSubActive = isPathActive(subItem.url, location);
              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isSubActive}
                    data-testid={`nav-${item.title.toLowerCase()}-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className={cn(
                      "h-9 px-3 transition-all duration-200",
                      isSubActive 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Link href={subItem.url} className="flex items-center gap-2.5">
                      <subItem.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">{subItem.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
