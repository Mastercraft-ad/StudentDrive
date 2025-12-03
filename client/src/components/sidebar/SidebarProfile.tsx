import { SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { GraduationCap } from "lucide-react";

export function SidebarProfile() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarHeader className="p-3 border-b border-border">
      <div className="flex items-center gap-3" data-testid="sidebar-header">
        {isCollapsed ? (
          <div className="flex items-center justify-center w-full">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </SidebarHeader>
  );
}
