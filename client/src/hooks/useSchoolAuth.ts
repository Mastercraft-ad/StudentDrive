import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface SchoolUser {
  id: string;
  schoolId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  phone?: string;
  profileImageUrl?: string;
}

interface SchoolInfo {
  id: string;
  name: string;
  subdomain: string;
  logoUrl: string | null;
}

interface SchoolAuthResponse {
  user: SchoolUser;
  school: SchoolInfo;
}

function getSubdomainFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  const subdomainFromQuery = urlParams.get('subdomain') || urlParams.get('__school');
  
  if (subdomainFromQuery) {
    return subdomainFromQuery;
  }
  
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.includes('studentdrive.com')) {
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      return parts[0];
    }
  }
  
  return null;
}

export function useSchoolAuth() {
  const subdomain = getSubdomainFromUrl();
  
  const { data, isLoading, error, refetch } = useQuery<SchoolAuthResponse>({
    queryKey: ["/api/school/auth/me", subdomain],
    queryFn: async () => {
      if (!subdomain) {
        throw new Error("No subdomain");
      }
      
      const response = await fetch(`/api/school/auth/me?subdomain=${subdomain}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Not authenticated");
      }
      
      return response.json();
    },
    enabled: !!subdomain,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: data?.user,
    school: data?.school,
    subdomain,
    isLoading,
    isAuthenticated: !!data?.user,
    isSchoolAdmin: data?.user?.role === "school_admin",
    isTeacher: data?.user?.role === "teacher",
    isParent: data?.user?.role === "parent",
    isStudent: data?.user?.role === "student",
    refetch,
  };
}
