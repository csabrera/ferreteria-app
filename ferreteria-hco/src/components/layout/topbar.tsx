"use client";

import { Bell, Search } from "lucide-react";

import { UserMenu } from "./user-menu";

export function Topbar({
  storeSelector,
}: {
  storeSelector?: React.ReactNode;
}) {
  return (
    <header className="flex h-14 items-center gap-3 border-b bg-card px-4 md:px-6">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar... (Cmd+K)"
          disabled
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {storeSelector}
        <button
          type="button"
          aria-label="Notificaciones"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          disabled
        >
          <Bell className="h-4 w-4" />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
