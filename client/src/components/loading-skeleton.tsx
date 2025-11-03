import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CardSkeleton() {
  return (
    <Card className="w-full animate-pulse">
      <CardHeader>
        <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-4/6"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full animate-pulse space-y-3">
      <div className="h-10 bg-muted rounded"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 bg-muted/50 rounded"></div>
      ))}
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="w-full space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 animate-pulse">
          <div className="h-12 w-12 bg-muted rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
