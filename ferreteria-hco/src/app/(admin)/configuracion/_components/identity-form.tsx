"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/shared/image-uploader";
import {
  identitySchema,
  type IdentityInput,
} from "@/schemas/settings.schema";
import { updateIdentity } from "@/server/actions/settings.actions";
import type { AppSettingsData } from "@/server/queries/settings.queries";

import { SectionCard } from "./section-card";

export function IdentityForm({ settings }: { settings: AppSettingsData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<IdentityInput>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      businessName: settings.businessName,
      ruc: settings.ruc ?? "",
      logoUrl: settings.logoUrl,
      slogan: settings.slogan ?? "",
    },
  });

  function onSubmit(data: IdentityInput) {
    startTransition(async () => {
      const result = await updateIdentity(data);
      if (result.ok) {
        toast.success("Identidad actualizada");
        reset(data);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <SectionCard
      title="Identidad del negocio"
      description="Nombre, RUC y logo que se mostrarán en la app y en los tickets."
      isPending={isPending}
      isDirty={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-2">
        <Label htmlFor="businessName">Nombre del negocio</Label>
        <Input id="businessName" {...register("businessName")} />
        {errors.businessName && (
          <p className="text-sm text-destructive">{errors.businessName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ruc">
          RUC <span className="text-xs text-muted-foreground">(opcional · 11 dígitos)</span>
        </Label>
        <Input id="ruc" placeholder="20123456789" maxLength={11} {...register("ruc")} />
        {errors.ruc && <p className="text-sm text-destructive">{errors.ruc.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slogan">
          Slogan <span className="text-xs text-muted-foreground">(opcional)</span>
        </Label>
        <Input id="slogan" placeholder="Todo para tu hogar" {...register("slogan")} />
      </div>

      <div className="space-y-2">
        <Label>Logo</Label>
        <Controller
          control={control}
          name="logoUrl"
          render={({ field }) => (
            <ImageUploader
              value={field.value ?? null}
              onChange={field.onChange}
              folder="settings"
              label="Subir logo"
            />
          )}
        />
        <p className="text-xs text-muted-foreground">
          PNG, JPG, WEBP o SVG. Máximo 5MB.
        </p>
      </div>
    </SectionCard>
  );
}
