import Link from "next/link";
import { ListChecks } from "lucide-react";

import { cn } from "@/lib/utils";

interface BrandProps {
  /** Render as a link to the given href instead of a plain element. */
  href?: string;
  /** Hide the wordmark and show only the logo mark. */
  iconOnly?: boolean;
  className?: string;
}

/** The TaskFlow logo mark + wordmark. */
export function Brand({ href, iconOnly = false, className }: BrandProps) {
  const content = (
    <span className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600 text-primary-foreground shadow-sm">
        <ListChecks className="h-5 w-5" />
      </span>
      {!iconOnly && (
        <span className="text-lg tracking-tight">TaskFlow</span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }
  return content;
}
