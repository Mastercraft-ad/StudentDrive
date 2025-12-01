import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface ImpersonationSession {
  id: string;
  superAdminId: string;
  targetSchoolId: string;
  targetSchoolName: string;
  targetUserId?: string;
  targetUserEmail?: string;
  targetUserRole?: string;
  startedAt: string;
  sessionToken: string;
}

interface ImpersonationContextType {
  isImpersonating: boolean;
  activeSession: ImpersonationSession | null;
  startImpersonation: (schoolId: string, reason: string, targetUserId?: string) => Promise<void>;
  endImpersonation: () => Promise<void>;
  isStarting: boolean;
  isEnding: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { user, isSuperAdmin } = useAuth();
  const [activeSession, setActiveSession] = useState<ImpersonationSession | null>(null);

  const { data: activeImpersonation, refetch } = useQuery<{ active: ImpersonationSession | null }>({
    queryKey: ["/api/super-admin/impersonation/active"],
    enabled: !!isSuperAdmin,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (activeImpersonation?.active) {
      setActiveSession(activeImpersonation.active);
    } else {
      setActiveSession(null);
    }
  }, [activeImpersonation]);

  const startMutation = useMutation({
    mutationFn: async ({ schoolId, reason, targetUserId }: { schoolId: string; reason: string; targetUserId?: string }) => {
      const response = await apiRequest("POST", `/api/super-admin/impersonate/${schoolId}`, {
        reason,
        targetUserId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setActiveSession({
        id: data.impersonationId,
        superAdminId: user?.id || "",
        targetSchoolId: data.school.id,
        targetSchoolName: data.school.name,
        targetUserId: data.targetUser?.id,
        targetUserEmail: data.targetUser?.email,
        targetUserRole: data.targetUser?.role,
        startedAt: data.startedAt || new Date().toISOString(),
        sessionToken: data.sessionToken,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/impersonation/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/activity-feed"] });
    },
  });

  const endMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession) return;
      await apiRequest("POST", `/api/super-admin/impersonate/${activeSession.targetSchoolId}/end`, {});
    },
    onSuccess: () => {
      setActiveSession(null);
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/impersonation/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/activity-feed"] });
    },
  });

  const startImpersonation = useCallback(async (schoolId: string, reason: string, targetUserId?: string) => {
    await startMutation.mutateAsync({ schoolId, reason, targetUserId });
  }, [startMutation]);

  const endImpersonation = useCallback(async () => {
    await endMutation.mutateAsync();
  }, [endMutation]);

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating: !!activeSession,
        activeSession,
        startImpersonation,
        endImpersonation,
        isStarting: startMutation.isPending,
        isEnding: endMutation.isPending,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error("useImpersonation must be used within an ImpersonationProvider");
  }
  return context;
}
