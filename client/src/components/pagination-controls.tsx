"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationControlsProps {
  offset: number;
  limit: number;
  total: number;
  onOffsetChange: (offset: number) => void;
  /** When provided, renders a page-size selector. */
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
}

/** Range summary + prev/next paging, with an optional page-size selector. */
export function PaginationControls({
  offset,
  limit,
  total,
  onOffsetChange,
  onLimitChange,
  pageSizeOptions = [10, 20, 50],
}: PaginationControlsProps) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-4">
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows</span>
            <Select
              value={String(limit)}
              onValueChange={(v) => {
                onLimitChange(Number(v));
                onOffsetChange(0);
              }}
            >
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOffsetChange(Math.max(0, offset - limit))}
            disabled={!canPrev}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOffsetChange(offset + limit)}
            disabled={!canNext}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
