"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingCart, Wallet, Receipt, PackageSearch } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSettings } from "@/components/providers/settings-provider";

const POS_ITEMS = [
  { label: "POS", href: "/pos", icon: ShoppingCart },
  { label: "Mi caja", href: "/caja", icon: Wallet },
  { label: "Mis ventas", href: "/ventas", icon: Receipt },
  { label: "Stock", href: "/stock", icon: PackageSearch },
];

export function SidebarPos() {
  const pathname = usePathname();
  const settings = useSettings();

  return (
    <aside className="hidden h-screen w-48 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-3">
        {settings.logoUrl && (
          <div className="relative h-7 w-7 shrink-0">
            <Image
              src={settings.logoUrl}
              alt={settings.businessName}
              fill
              sizes="28px"
              className="object-contain"
              unoptimized
            />
          </div>
        )}
        <Link
          href="/pos"
          className="truncate text-sm font-semibold"
          title={settings.businessName}
        >
          {settings.businessName}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {POS_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
