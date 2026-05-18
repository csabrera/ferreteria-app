"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: "settings" | "products" | "brands" | "categories";
  label?: string;
  className?: string;
};

export function ImageUploader({
  value,
  onChange,
  folder = "settings",
  label = "Subir imagen",
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pick() {
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Error al subir");
        }
        onChange(data.url);
        toast.success("Imagen subida");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        setError(msg);
        toast.error(msg);
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
        className="hidden"
        onChange={handleFileChange}
      />

      {value ? (
        <div className="flex items-center gap-3">
          <div className="relative h-20 w-20 overflow-hidden rounded-md border bg-muted">
            <Image
              src={value}
              alt="Preview"
              fill
              sizes="80px"
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={pick}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cambiar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
              Quitar
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={pick} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {label}
            </>
          )}
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
