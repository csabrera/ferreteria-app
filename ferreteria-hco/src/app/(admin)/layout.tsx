import { requireAdmin } from "@/lib/auth-guards";
import { SidebarAdmin } from "@/components/layout/sidebar-admin";
import { Topbar } from "@/components/layout/topbar";
import { StoreSelector } from "@/components/layout/store-selector";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarAdmin />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar storeSelector={<StoreSelector />} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  );
}
