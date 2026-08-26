import { Brand } from "@/components/brand";
import { SidebarNav } from "./sidebar-nav";

/** Fixed desktop sidebar (hidden below the lg breakpoint). */
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Brand href="/dashboard" />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <SidebarNav />
      </div>
    </aside>
  );
}
