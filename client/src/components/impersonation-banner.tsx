import { useImpersonation } from "@/contexts/ImpersonationContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, X, School, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function ImpersonationBanner() {
  const { isImpersonating, activeSession, endImpersonation, isEnding } = useImpersonation();

  if (!isImpersonating || !activeSession) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between gap-4 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Shield className="h-4 w-4" />
        <span className="text-sm font-medium">
          Impersonating: {activeSession.targetSchoolName}
        </span>
        {activeSession.targetUserEmail && (
          <Badge variant="secondary" className="bg-amber-200 text-amber-900 text-xs">
            as {activeSession.targetUserEmail}
          </Badge>
        )}
        <span className="text-xs opacity-75 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Started {formatDistanceToNow(new Date(activeSession.startedAt), { addSuffix: true })}
        </span>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => endImpersonation()}
        disabled={isEnding}
        className="bg-amber-200 text-amber-900 hover:bg-amber-300"
        data-testid="button-end-impersonation"
      >
        <X className="h-3 w-3 mr-1" />
        {isEnding ? "Ending..." : "End Session"}
      </Button>
    </div>
  );
}
