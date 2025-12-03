import { SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { GraduationCap, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SidebarProfile() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarHeader className="p-3 border-b border-border">
      <div className="flex items-center justify-between gap-2" data-testid="sidebar-header">
        {isCollapsed ? (
          <div className="flex flex-col items-center justify-center w-full gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="w-8 h-8"
              data-testid="button-sidebar-toggle"
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-bold truncate text-foreground" data-testid="text-site-name">
                  StudentDrive
                </p>
                <p className="text-xs text-muted-foreground truncate" data-testid="text-site-tagline">
                  School Management
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="w-8 h-8 flex-shrink-0"
              data-testid="button-sidebar-toggle"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </SidebarHeader>
  );
}
