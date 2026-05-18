import { requireVendor } from "@/lib/auth-guards";
import { SidebarPos } from "@/components/layout/sidebar-pos";
import { Topbar } from "@/components/layout/topbar";
import { StoreSelector } from "@/components/layout/store-selector";

export default async function VendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireVendor();

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarPos />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar storeSelector={<StoreSelector />} />
        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
      </div>
    </div>
  );
}
