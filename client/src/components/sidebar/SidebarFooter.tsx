import { LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  SidebarFooter as BaseSidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NavItem } from "./NavItem";
import { isPathActive } from "@/config/navigation";
import type { NavItem as NavItemType } from "@/config/navigation";
import { useToast } from "@/hooks/use-toast";

interface SidebarFooterProps {
  footerItems?: NavItemType[];
}

export function SidebarFooter({ footerItems = [] }: SidebarFooterProps) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        // Clear auth state first
        queryClient.setQueryData(["/api/auth/user"], null);
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        // Then redirect
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

  return (
    <BaseSidebarFooter className="mt-auto border-t border-border/40 px-3 py-3 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
      {footerItems.length > 0 && (
        <>
          <SidebarMenu className="space-y-1">
            {footerItems.map((item) => {
              const isActive = isPathActive(item.url, location);
              return <NavItem key={item.title} item={item} isActive={isActive} />;
            })}
          </SidebarMenu>
          <Separator className="my-3 bg-slate-700/50 group-data-[collapsible=icon]:hidden" />
        </>
      )}
      
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={handleLogout}
            tooltip="Logout"
            data-testid="button-logout"
            className="text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-150 h-10 px-2.5 rounded-lg group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:px-0"
          >
            <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
              <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
              <span className="font-medium text-[13px] group-data-[collapsible=icon]:hidden">
                Logout
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </BaseSidebarFooter>
  );
}
