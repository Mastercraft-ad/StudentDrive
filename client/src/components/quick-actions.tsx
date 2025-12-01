import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, Zap } from "lucide-react";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  href: string;
  color?: string;
  description?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
  columns?: 2 | 3 | 4;
  variant?: "card" | "inline";
}

export function QuickActions({ 
  actions, 
  title = "Quick Actions", 
  columns = 4,
  variant = "card"
}: QuickActionsProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  const ActionButtons = () => (
    <div className={`grid ${gridCols[columns]} gap-3`}>
      {actions.map((action) => (
        <Link key={action.label} href={action.href}>
          <Button
            variant="outline"
            className="w-full h-auto min-h-[4.5rem] flex flex-col items-center justify-center gap-2 p-3"
            data-testid={`button-quick-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className={`p-2 rounded-full ${action.color || 'bg-primary'}`}>
              <action.icon className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-medium text-center leading-tight">{action.label}</span>
          </Button>
        </Link>
      ))}
    </div>
  );

  if (variant === "inline") {
    return <ActionButtons />;
  }

  return (
    <Card data-testid="card-quick-actions">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ActionButtons />
      </CardContent>
    </Card>
  );
}

export function QuickActionButton({ 
  action 
}: { 
  action: QuickAction 
}) {
  return (
    <Link href={action.href}>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        data-testid={`button-quick-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <action.icon className="h-4 w-4" />
        <span>{action.label}</span>
      </Button>
    </Link>
  );
}
