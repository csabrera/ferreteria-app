"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { resetPassword } from "@/server/actions/user.actions";
import type { UserListItem } from "@/server/queries/user.queries";
import { composeFullName } from "@/lib/strings";

const formSchema = z.object({
  newPassword: z.string().min(8, "Mínimo 8 caracteres").max(72),
});
type FormValues = z.infer<typeof formSchema>;

type Props = {
  user: UserListItem | null;
  onClose: () => void;
};

export function ResetPasswordDialog({ user, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { newPassword: "" },
  });

  useEffect(() => {
    if (user) reset({ newPassword: "" });
  }, [user, reset]);

  function onSubmit(data: FormValues) {
    if (!user) return;
    startTransition(async () => {
      const result = await resetPassword({
        id: user.id,
        newPassword: data.newPassword,
      });
      if (result.ok) {
        toast.success(
          `Contraseña actualizada para ${composeFullName(user).toUpperCase()}`,
        );
        onClose();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={user !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resetear contraseña</DialogTitle>
          <DialogDescription>
            {user ? (
              <>
                Define una nueva contraseña para{" "}
                <strong className="uppercase">{composeFullName(user)}</strong> (
                {user.documentType} {user.documentNumber}). Comunícasela en persona
                — no se enviará por email.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva contraseña</Label>
            <Input
              id="newPassword"
              type="text"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="text-sm text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cerrar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Cambiar contraseña"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
