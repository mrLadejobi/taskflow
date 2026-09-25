"use client";

import { useState } from "react";
import { HelpCircle, Menu } from "lucide-react";

import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ShortcutsModal } from "@/components/shortcuts-modal";
import { useKeyboardShortcut } from "@/lib/hooks/use-keyboard-shortcut";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

/** Sticky top bar: mobile nav trigger, notifications, theme toggle, and account menu. */
export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useKeyboardShortcut("?", () => setShortcutsOpen(true));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="flex h-16 items-start justify-center border-b px-6">
            <SheetTitle asChild>
              <Brand href="/dashboard" />
            </SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Brand on mobile (desktop shows it in the sidebar) */}
      <div className="lg:hidden">
        <Brand href="/dashboard" iconOnly />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShortcutsOpen(true)}
          title="Keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts"
          className="text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
        <NotificationBell />
        <ThemeToggle />
        <UserMenu />
      </div>

      <ShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </header>
  );
}
