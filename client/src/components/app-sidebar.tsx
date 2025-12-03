import { useAuth } from "@/hooks/useAuth";
import { useSchoolAuth } from "@/hooks/useSchoolAuth";
import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar";
import { SidebarProfile } from "@/components/sidebar/SidebarProfile";
import { SidebarSection } from "@/components/sidebar/SidebarSection";
import { SidebarFooter } from "@/components/sidebar/SidebarFooter";
import { menuConfig } from "@/config/navigation";
import { Separator } from "@/components/ui/separator";

function isInSchoolContext(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  const subdomainFromQuery = urlParams.get('subdomain') || urlParams.get('__school');
  
  if (subdomainFromQuery) {
    return true;
  }
  
  const pathname = window.location.pathname;
  if (pathname.startsWith('/school/') && !pathname.startsWith('/school/register')) {
    return true;
  }
  
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('studentdrive.com')) {
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      return true;
    }
  }
  
  return false;
}

export function AppSidebar() {
  const platformAuth = useAuth();
  const schoolAuth = useSchoolAuth();
  const inSchoolContext = isInSchoolContext();
  
  const user = inSchoolContext ? schoolAuth.user : platformAuth.user;
  const userRole = inSchoolContext 
    ? (schoolAuth.user?.role || "school_admin") 
    : (platformAuth.user?.role || "student");
  
  const roleConfig = menuConfig[userRole];

  if (!roleConfig) {
    return null;
  }

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-border bg-card"
    >
      <SidebarProfile />

      <SidebarContent className="py-4">
        <SidebarSection section={roleConfig.primary} />
        
        {roleConfig.secondary && (
          <>
            <Separator className="my-3 mx-4" />
            <SidebarSection section={roleConfig.secondary} />
          </>
        )}
      </SidebarContent>

      <SidebarFooter footerItems={roleConfig.footer} />
    </Sidebar>
  );
}
