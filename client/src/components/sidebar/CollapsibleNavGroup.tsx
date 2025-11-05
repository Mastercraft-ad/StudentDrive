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
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/config/navigation";
import { isPathActive, isPathWithin } from "@/config/navigation";

interface CollapsibleNavGroupProps {
  item: NavItem;
}

const baseStyles = "transition-colors duration-150 h-11";
const inactiveStyles = "text-slate-300 hover:bg-slate-800 hover:text-slate-100";
const subItemBaseStyles = "transition-colors duration-150 h-9";
const subItemActiveStyles = "bg-primary/10 text-primary hover:bg-primary/20";
const subItemInactiveStyles = "text-slate-400 hover:bg-slate-800 hover:text-slate-200";

export function CollapsibleNavGroup({ item }: CollapsibleNavGroupProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(() => isPathWithin(item.url, location));
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { state } = useSidebar();
  const isWithinSection = isPathWithin(item.url, location);

  if (!item.children || item.children.length === 0) {
    return null;
  }

  const isCollapsed = state === "collapsed";

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                baseStyles,
                isWithinSection ? "bg-primary text-primary-foreground hover:bg-primary/90" : inactiveStyles,
                "w-11 h-11"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent 
            side="right" 
            align="start" 
            className="w-56 p-2 bg-slate-900 border-slate-700"
            data-testid={`popover-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="space-y-1">
              <div className="px-3 py-2 text-sm font-semibold text-slate-100">
                {item.title}
              </div>
              {item.children.map((subItem) => {
                const isSubActive = isPathActive(subItem.url, location);
                return (
                  <Link
                    key={subItem.title}
                    href={subItem.url}
                    onClick={() => setPopoverOpen(false)}
                    data-testid={`nav-${item.title.toLowerCase()}-${subItem.title.toLowerCase()}`}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                      isSubActive 
                        ? "bg-primary/10 text-primary hover:bg-primary/20" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    )}
                  >
                    <subItem.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{subItem.title}</span>
                  </Link>
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
        <div className="flex items-center gap-0 group-data-[collapsible=icon]:flex-col">
          <SidebarMenuButton
            asChild
            tooltip={item.title}
            data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            className={cn(
              baseStyles,
              isWithinSection ? "bg-primary text-primary-foreground hover:bg-primary/90" : inactiveStyles,
              "group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:h-11 flex-1"
            )}
          >
            <Link href={item.url} className="flex items-center gap-3 flex-1">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">
                {item.title}
              </span>
            </Link>
          </SidebarMenuButton>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "p-2 rounded-md transition-colors group-data-[collapsible=icon]:hidden",
                inactiveStyles
              )}
              aria-label={`Toggle ${item.title} submenu`}
              data-testid={`toggle-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="transition-all duration-200 group-data-[collapsible=icon]:hidden">
          <SidebarMenuSub className="ml-3 mt-1 space-y-1 border-l-2 border-slate-700 pl-3">
            {item.children.map((subItem) => {
              const isSubActive = isPathActive(subItem.url, location);
              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isSubActive}
                    data-testid={`nav-${item.title.toLowerCase()}-${subItem.title.toLowerCase()}`}
                    className={cn(
                      subItemBaseStyles,
                      isSubActive ? subItemActiveStyles : subItemInactiveStyles
                    )}
                  >
                    <Link href={subItem.url} className="flex items-center gap-2.5">
                      <subItem.icon className="h-4 w-4 flex-shrink-0" />
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
