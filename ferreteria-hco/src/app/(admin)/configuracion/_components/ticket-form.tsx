"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ticketSchema, type TicketInput } from "@/schemas/settings.schema";
import { updateTicket } from "@/server/actions/settings.actions";
import type { AppSettingsData } from "@/server/queries/settings.queries";

import { SectionCard } from "./section-card";

export function TicketForm({ settings }: { settings: AppSettingsData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<TicketInput>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      ticketHeader: settings.ticketHeader ?? "",
      ticketFooter: settings.ticketFooter ?? "",
      thankYouMessage: settings.thankYouMessage,
      showLogoOnTicket: settings.showLogoOnTicket,
    },
  });

  function onSubmit(data: TicketInput) {
    startTransition(async () => {
      const result = await updateTicket(data);
      if (result.ok) {
        toast.success("Formato de ticket actualizado");
        reset(data);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <SectionCard
      title="Formato del ticket"
      description="Texto que aparece al inicio y final del comprobante impreso."
      isPending={isPending}
      isDirty={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="showLogoOnTicket">Mostrar logo en el ticket</Label>
          <p className="text-xs text-muted-foreground">
            Se imprime el logo del negocio en la cabecera del ticket.
          </p>
        </div>
        <Controller
          control={control}
          name="showLogoOnTicket"
          render={({ field }) => (
            <Switch
              id="showLogoOnTicket"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticketHeader">
          Encabezado <span className="text-xs text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="ticketHeader"
          rows={3}
          placeholder="Dirección, teléfono, horario de atención..."
          {...register("ticketHeader")}
        />
        {errors.ticketHeader && (
          <p className="text-sm text-destructive">{errors.ticketHeader.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticketFooter">
          Pie de ticket <span className="text-xs text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="ticketFooter"
          rows={3}
          placeholder="Garantía de 7 días con boleta, no se aceptan devoluciones de mercadería en oferta..."
          {...register("ticketFooter")}
        />
        {errors.ticketFooter && (
          <p className="text-sm text-destructive">{errors.ticketFooter.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="thankYouMessage">Mensaje de agradecimiento</Label>
        <Input
          id="thankYouMessage"
          placeholder="¡Gracias por su compra!"
          {...register("thankYouMessage")}
        />
        {errors.thankYouMessage && (
          <p className="text-sm text-destructive">{errors.thankYouMessage.message}</p>
        )}
      </div>
    </SectionCard>
  );
}
