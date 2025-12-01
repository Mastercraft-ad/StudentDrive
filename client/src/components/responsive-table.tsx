import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="hidden md:block">
        <Table>{children}</Table>
      </div>
      <ScrollArea className="md:hidden w-full">
        <div className="min-w-[600px]">
          <Table>{children}</Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

interface MobileCardListProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function MobileCardList<T>({ 
  items, 
  renderCard, 
  className 
}: MobileCardListProps<T>) {
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => renderCard(item, index))}
    </div>
  );
}

interface DataListItemProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function DataListItem({ label, value, className }: DataListItemProps) {
  return (
    <div className={cn("flex justify-between items-center py-1", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
