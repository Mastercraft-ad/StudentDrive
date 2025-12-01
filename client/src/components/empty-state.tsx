import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`} data-testid="empty-state">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1" data-testid="empty-state-title">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4" data-testid="empty-state-description">{description}</p>
      {action && (
        action.href ? (
          <Link href={action.href}>
            <Button data-testid="empty-state-action">{action.label}</Button>
          </Link>
        ) : (
          <Button onClick={action.onClick} data-testid="empty-state-action">{action.label}</Button>
        )
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid="error-state">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <svg
          className="h-10 w-10 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-1" data-testid="error-state-title">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4" data-testid="error-state-message">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} data-testid="error-state-retry">
          Try Again
        </Button>
      )}
    </div>
  );
}
