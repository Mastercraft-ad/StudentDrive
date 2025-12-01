import { LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  SidebarFooter as BaseSidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { NavItem } from "./NavItem";
import { isPathActive } from "@/config/navigation";
import type { NavItem as NavItemType } from "@/config/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  footerItems?: NavItemType[];
}

export function SidebarFooter({ footerItems = [] }: SidebarFooterProps) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        queryClient.setQueryData(["/api/auth/user"], null);
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation("/login");
        
        toast({
          title: "Logged out successfully",
          description: "See you next time!",
        });
      }
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const logoutButton = (
    <SidebarMenuButton
      onClick={handleLogout}
      data-testid="button-logout"
      className={cn(
        "group h-10 transition-all duration-200 text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
        isCollapsed ? "w-10 justify-center px-0" : "px-3"
      )}
    >
      <div className="flex items-center gap-3">
        <LogOut className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && (
          <span className="text-sm font-medium">Logout</span>
        )}
      </div>
    </SidebarMenuButton>
  );

  return (
    <BaseSidebarFooter className="mt-auto border-t border-border p-2">
      {footerItems.length > 0 && (
        <>
          <SidebarMenu className="space-y-1 px-2 mb-2">
            {footerItems.map((item) => {
              const isActive = isPathActive(item.url, location);
              return <NavItem key={item.title} item={item} isActive={isActive} />;
            })}
          </SidebarMenu>
          <Separator className="my-2" />
        </>
      )}
      
      <SidebarMenu className="px-2">
        <SidebarMenuItem>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                {logoutButton}
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Logout
              </TooltipContent>
            </Tooltip>
          ) : (
            logoutButton
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </BaseSidebarFooter>
  );
}
