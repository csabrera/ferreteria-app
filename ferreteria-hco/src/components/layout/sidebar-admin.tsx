"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Receipt,
  Wallet,
  Store,
  Users,
  BarChart3,
  ShieldCheck,
  Settings,
  Tag,
  Boxes,
  Ruler,
  Truck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/components/providers/settings-provider";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Catálogo",
    items: [
      { label: "Productos", href: "/productos", icon: Package },
      { label: "Categorías", href: "/categorias", icon: Tag },
      { label: "Marcas", href: "/marcas", icon: Boxes },
      { label: "Unidades", href: "/unidades", icon: Ruler },
    ],
  },
  {
    title: "Operación",
    items: [
      { label: "Inventario", href: "/inventario", icon: Warehouse },
      { label: "Proveedores", href: "/proveedores", icon: Truck },
      { label: "Ventas", href: "/ventas", icon: Receipt },
      { label: "Caja", href: "/cajas", icon: Wallet },
    ],
  },
  {
    title: "Administración",
    items: [
      { label: "Sucursales", href: "/sucursales", icon: Store },
      { label: "Usuarios", href: "/usuarios", icon: Users },
      { label: "Reportes", href: "/reportes/ventas", icon: BarChart3 },
      { label: "Auditoría", href: "/auditoria", icon: ShieldCheck },
    ],
  },
  {
    items: [{ label: "Configuración", href: "/configuracion", icon: Settings }],
  },
];

export function SidebarAdmin() {
  const pathname = usePathname();
  const settings = useSettings();

  return (
    <aside className="hidden h-screen w-60 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        {settings.logoUrl && (
          <div className="relative h-8 w-8 shrink-0">
            <Image
              src={settings.logoUrl}
              alt={settings.businessName}
              fill
              sizes="32px"
              className="object-contain"
              unoptimized
            />
          </div>
        )}
        <Link
          href="/dashboard"
          className="truncate text-sm font-semibold"
          title={settings.businessName}
        >
          {settings.businessName}
        </Link>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {section.title && (
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
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
          </div>
        ))}
      </nav>

      <Separator />
      <div className="p-3 text-xs text-muted-foreground">
        <p>v0.1.0 — Fase 1</p>
      </div>
    </aside>
  );
}
