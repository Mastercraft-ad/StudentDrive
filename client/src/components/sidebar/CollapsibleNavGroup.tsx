import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

  if (!item.children || item.children.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            className={cn(
              baseStyles,
              inactiveStyles,
              "group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:h-11"
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium text-sm group-data-[collapsible=icon]:hidden flex-1">
                {item.title}
              </span>
              <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden flex-shrink-0" />
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>
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
