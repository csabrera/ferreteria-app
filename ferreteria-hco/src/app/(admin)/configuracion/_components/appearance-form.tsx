"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/shared/image-uploader";
import {
  appearanceSchema,
  type AppearanceInput,
} from "@/schemas/settings.schema";
import { updateAppearance } from "@/server/actions/settings.actions";
import type { AppSettingsData } from "@/server/queries/settings.queries";

import { SectionCard } from "./section-card";

const COLOR_PRESETS = [
  "#2563eb", // azul
  "#16a34a", // verde
  "#dc2626", // rojo
  "#ea580c", // naranja
  "#7c3aed", // morado
  "#0891b2", // cyan
  "#db2777", // rosa
  "#475569", // slate
];

export function AppearanceForm({ settings }: { settings: AppSettingsData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<AppearanceInput>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      accentColor: settings.accentColor,
      darkModeDefault: settings.darkModeDefault,
      faviconUrl: settings.faviconUrl,
    },
  });

  const currentColor = watch("accentColor");

  function onSubmit(data: AppearanceInput) {
    startTransition(async () => {
      const result = await updateAppearance(data);
      if (result.ok) {
        toast.success("Apariencia actualizada");
        reset(data);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <SectionCard
      title="Apariencia"
      description="Color de acento, modo oscuro por defecto y favicon."
      isPending={isPending}
      isDirty={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-2">
        <Label htmlFor="accentColor">Color de acento</Label>
        <div className="flex items-center gap-3">
          <input
            id="accentColor"
            type="color"
            className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
            {...register("accentColor")}
          />
          <Input
            value={currentColor}
            onChange={(e) => setValue("accentColor", e.target.value, { shouldDirty: true })}
            placeholder="#2563eb"
            className="max-w-[140px] font-mono uppercase"
            maxLength={7}
          />
        </div>
        {errors.accentColor && (
          <p className="text-sm text-destructive">{errors.accentColor.message}</p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue("accentColor", color, { shouldDirty: true })}
              className="h-7 w-7 rounded-md ring-offset-2 transition-all hover:scale-110 hover:ring-2 hover:ring-ring"
              style={{ backgroundColor: color }}
              aria-label={`Usar color ${color}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Se aplica al guardar — los botones, links activos y elementos primarios usarán este color.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="darkModeDefault">Modo oscuro por defecto</Label>
          <p className="text-xs text-muted-foreground">
            Si se activa, todos los usuarios verán la app en modo oscuro al ingresar.
          </p>
        </div>
        <Controller
          control={control}
          name="darkModeDefault"
          render={({ field }) => (
            <Switch
              id="darkModeDefault"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>
          Favicon <span className="text-xs text-muted-foreground">(opcional)</span>
        </Label>
        <Controller
          control={control}
          name="faviconUrl"
          render={({ field }) => (
            <ImageUploader
              value={field.value ?? null}
              onChange={field.onChange}
              folder="settings"
              label="Subir favicon"
            />
          )}
        />
        <p className="text-xs text-muted-foreground">
          ICO, PNG o SVG cuadrado (recomendado 32×32 o 64×64).
        </p>
      </div>
    </SectionCard>
  );
}
