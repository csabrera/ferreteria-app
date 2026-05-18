"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";

import {
  loginSchema,
  type LoginInput,
  DOCUMENT_TYPES,
  DOCUMENT_LABEL,
} from "@/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettings } from "@/components/providers/settings-provider";

const DOC_PLACEHOLDER: Record<(typeof DOCUMENT_TYPES)[number], string> = {
  DNI: "12345678",
  CE: "Ej: 001234567",
  PAS: "Ej: AB123456",
};

const DOC_MAXLENGTH: Record<(typeof DOCUMENT_TYPES)[number], number> = {
  DNI: 8,
  CE: 12,
  PAS: 12,
};

export function LoginForm() {
  const router = useRouter();
  const settings = useSettings();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      documentType: "DNI",
      documentNumber: "",
      password: "",
    },
    mode: "onTouched",
  });

  const docType = watch("documentType");

  function onSubmit(data: LoginInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError("Documento o contraseña incorrectos");
        return;
      }

      router.push("/");
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2 text-center">
        {settings.logoUrl && (
          <div className="relative mx-auto mb-2 h-16 w-16">
            <Image
              src={settings.logoUrl}
              alt={settings.businessName}
              fill
              sizes="64px"
              className="object-contain"
              unoptimized
            />
          </div>
        )}
        <CardTitle>{settings.businessName}</CardTitle>
        <CardDescription>
          {settings.slogan ?? "Ingresa con tu documento de identidad"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="documentType">Tipo de documento</Label>
            <Controller
              name="documentType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="documentType">
                    <SelectValue placeholder="Selecciona tipo" />
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
            {errors.documentType && (
              <p className="text-sm text-destructive">{errors.documentType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentNumber">Número de documento</Label>
            <Input
              id="documentNumber"
              type="text"
              autoComplete="username"
              placeholder={DOC_PLACEHOLDER[docType]}
              maxLength={DOC_MAXLENGTH[docType]}
              {...register("documentNumber")}
            />
            {errors.documentNumber && (
              <p className="text-sm text-destructive">{errors.documentNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Mínimo 8 caracteres"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ingresando...
              </>
            ) : (
              "Ingresar"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
