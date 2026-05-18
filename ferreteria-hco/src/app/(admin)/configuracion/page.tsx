import { getSettings } from "@/server/queries/settings.queries";
import { ConfigTabs } from "./_components/config-tabs";

export default async function ConfiguracionPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Personaliza la identidad, apariencia, formato de ticket y parámetros
          operativos del sistema.
        </p>
      </div>

      <ConfigTabs settings={settings} />
    </div>
  );
}
