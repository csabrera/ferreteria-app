"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { AppSettingsData } from "@/server/queries/settings.queries";

import { IdentityForm } from "./identity-form";
import { AppearanceForm } from "./appearance-form";
import { TicketForm } from "./ticket-form";
import { OperationsForm } from "./operations-form";

export function ConfigTabs({ settings }: { settings: AppSettingsData }) {
  return (
    <Tabs defaultValue="identity">
      <TabsList>
        <TabsTrigger value="identity">Identidad</TabsTrigger>
        <TabsTrigger value="appearance">Apariencia</TabsTrigger>
        <TabsTrigger value="ticket">Ticket</TabsTrigger>
        <TabsTrigger value="operations">Operación</TabsTrigger>
      </TabsList>

      <TabsContent value="identity">
        <IdentityForm settings={settings} />
      </TabsContent>
      <TabsContent value="appearance">
        <AppearanceForm settings={settings} />
      </TabsContent>
      <TabsContent value="ticket">
        <TicketForm settings={settings} />
      </TabsContent>
      <TabsContent value="operations">
        <OperationsForm settings={settings} />
      </TabsContent>
    </Tabs>
  );
}
