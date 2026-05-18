"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UpperInput } from "@/components/ui/upper-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { DocumentNumberInput } from "@/components/ui/document-number-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  createUserSchema,
  updateUserSchema,
  GENDERS,
  GENDER_LABEL,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/schemas/user.schema";
import { DOCUMENT_TYPES, DOCUMENT_LABEL } from "@/schemas/auth.schema";
import { createUser, updateUser } from "@/server/actions/user.actions";
import type { UserListItem } from "@/server/queries/user.queries";

type ActiveStore = { id: string; code: string; name: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserListItem | null;
  stores: ActiveStore[];
};

// Para el input HTML5 date necesitamos formato "YYYY-MM-DD"
function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function UserFormDialog({ open, onOpenChange, user, stores }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const editing = user !== null;
  const schema = editing ? updateUserSchema : createUserSchema;

  type FormValues = CreateUserInput;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema as never),
    defaultValues: {
      documentType: user?.documentType ?? "DNI",
      documentNumber: user?.documentNumber ?? "",
      lastNameP: user?.lastNameP ?? "",
      lastNameM: user?.lastNameM ?? "",
      firstName: user?.firstName ?? "",
      phone: user?.phone ?? "",
      email: user?.email ?? "",
      birthDate: (toDateInputValue(user?.birthDate) as unknown) as Date,
      address: user?.address ?? "",
      gender: user?.gender ?? "M",
      role: user?.role ?? "VENDOR",
      storeId: user?.storeId ?? null,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        documentType: user?.documentType ?? "DNI",
        documentNumber: user?.documentNumber ?? "",
        lastNameP: user?.lastNameP ?? "",
        lastNameM: user?.lastNameM ?? "",
        firstName: user?.firstName ?? "",
        phone: user?.phone ?? "",
        email: user?.email ?? "",
        birthDate: (toDateInputValue(user?.birthDate) as unknown) as Date,
        address: user?.address ?? "",
        gender: user?.gender ?? "M",
        role: user?.role ?? "VENDOR",
        storeId: user?.storeId ?? null,
      });
    }
  }, [open, user, reset]);

  const currentRole = watch("role");
  const currentDocType = watch("documentType");
  const currentDocNumber = watch("documentNumber");

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      if (editing) {
        const result = await updateUser({
          id: user!.id,
          ...data,
        } as UpdateUserInput);
        if (result.ok) {
          toast.success("Usuario actualizado");
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createUser(data);
        if (result.ok) {
          toast.success(
            `Usuario creado. Contraseña inicial: ${result.data?.initialPassword}`,
            { duration: 8000 },
          );
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(result.error);
        }
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Modifica los datos del usuario. Para cambiar la contraseña usa el botón de la tabla."
              : "Completa los datos del usuario. La contraseña inicial será el número de documento."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* — Documento — */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Documento de identidad</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
              <div className="space-y-1">
                <Label htmlFor="documentType">Tipo</Label>
                <Controller
                  control={control}
                  name="documentType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="documentType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {DOCUMENT_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="documentNumber">Número</Label>
                <Controller
                  control={control}
                  name="documentNumber"
                  render={({ field }) => (
                    <DocumentNumberInput
                      id="documentNumber"
                      documentType={currentDocType}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.documentNumber && (
                  <p className="text-sm text-destructive">
                    {errors.documentNumber.message}
                  </p>
                )}
              </div>
            </div>
            {!editing && currentDocNumber && (
              <p className="text-xs text-muted-foreground">
                La contraseña inicial será:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                  {currentDocNumber}
                </code>
              </p>
            )}
          </div>

          {/* — Nombres — */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Datos personales</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="lastNameP">Apellido paterno</Label>
                <UpperInput
                  id="lastNameP"
                  placeholder="PÉREZ"
                  {...register("lastNameP")}
                />
                {errors.lastNameP && (
                  <p className="text-sm text-destructive">{errors.lastNameP.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastNameM">Apellido materno</Label>
                <UpperInput
                  id="lastNameM"
                  placeholder="RAMÍREZ"
                  {...register("lastNameM")}
                />
                {errors.lastNameM && (
                  <p className="text-sm text-destructive">{errors.lastNameM.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="firstName">Nombres</Label>
                <UpperInput
                  id="firstName"
                  placeholder="JUAN CARLOS"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* — Contacto — */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="phone">Celular</Label>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <PhoneInput
                    id="phone"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">
                Email <span className="text-xs text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                autoComplete="off"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
            <div className="space-y-1">
              <Label htmlFor="birthDate">Fecha de nacimiento</Label>
              <Input
                id="birthDate"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                min="1900-01-01"
                {...register("birthDate" as never)}
              />
              {errors.birthDate && (
                <p className="text-sm text-destructive">
                  {errors.birthDate.message as string}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="gender">Sexo</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {GENDER_LABEL[g]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="address">Dirección</Label>
            <UpperInput
              id="address"
              placeholder="JR. DOS DE MAYO 123, HUÁNUCO"
              {...register("address")}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          {/* — Rol y sucursal — */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Rol del sistema</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="role">Rol</Label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                        <SelectItem value="VENDOR">Vendedor</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="storeId">
                  Sucursal{" "}
                  {currentRole === "VENDOR" ? (
                    <span className="text-destructive">*</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">(opcional)</span>
                  )}
                </Label>
                <Controller
                  control={control}
                  name="storeId"
                  render={({ field }) => (
                    <Combobox
                      id="storeId"
                      options={stores.map<ComboboxOption>((s) => ({
                        value: s.id,
                        label: `${s.code} · ${s.name.toUpperCase()}`,
                        keywords: s.code,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Sin sucursal"
                      searchPlaceholder="Buscar sucursal..."
                    />
                  )}
                />
                {errors.storeId && (
                  <p className="text-sm text-destructive">{errors.storeId.message}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cerrar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : editing ? (
                "Guardar cambios"
              ) : (
                "Crear usuario"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
