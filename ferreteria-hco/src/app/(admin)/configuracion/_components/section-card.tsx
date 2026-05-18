"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  title: string;
  description: string;
  isPending: boolean;
  isDirty: boolean;
  onSubmit: () => void;
  children: React.ReactNode;
};

export function SectionCard({
  title,
  description,
  isPending,
  isDirty,
  onSubmit,
  children,
}: Props) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
        <CardFooter className="justify-end gap-2 border-t pt-6">
          <Button type="submit" disabled={isPending || !isDirty}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
