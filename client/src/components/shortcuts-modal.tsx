"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

const SHORTCUTS: { category: string; items: ShortcutItem[] }[] = [
  {
    category: "Navigation",
    items: [
      { keys: ["G", "D"], description: "Navigate to Dashboard" },
      { keys: ["G", "P"], description: "Navigate to Projects" },
      { keys: ["Esc"], description: "Close modal or dismiss drawer" },
    ],
  },
  {
    category: "Tasks & Board",
    items: [
      { keys: ["N"], description: "Quick create new task" },
      { keys: ["/"], description: "Focus task filter and search" },
      { keys: ["Ctrl", "K"], description: "Global command palette" },
    ],
  },
  {
    category: "General",
    items: [
      { keys: ["?"], description: "Show keyboard shortcuts reference" },
    ],
  },
];

export function ShortcutsModal({ open, onOpenChange }: ShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick hotkeys to navigate TaskFlow with your keyboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {SHORTCUTS.map((section) => (
            <div key={section.category} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.category}
              </h4>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <div
                    key={item.description}
                    className="flex items-center justify-between text-sm py-1 border-b border-border/40 last:border-b-0"
                  >
                    <span className="text-foreground">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-0.5 text-xs font-mono bg-muted text-muted-foreground border rounded shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
