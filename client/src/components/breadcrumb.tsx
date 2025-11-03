import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-foreground transition-colors" data-testid="breadcrumb-home">
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          {item.href && index !== items.length - 1 ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
              data-testid={`breadcrumb-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={index === items.length - 1 ? "text-foreground font-medium" : ""}
              data-testid={`breadcrumb-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
