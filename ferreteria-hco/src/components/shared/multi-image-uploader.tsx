"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Star, StarOff, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: "settings" | "products" | "brands" | "categories";
  maxImages?: number;
  className?: string;
};

/**
 * Galería de imágenes. La primera es la principal (se muestra en la lista).
 * Acciones por imagen:
 *   - quitar
 *   - mover izquierda / derecha (reordenar)
 *   - marcar como principal (mover al inicio)
 */
export function MultiImageUploader({
  value,
  onChange,
  folder = "products",
  maxImages = 8,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const canAdd = value.length < maxImages;

  function pick() {
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al subir");
        onChange([...value, data.url]);
        toast.success("Imagen agregada");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al subir imagen");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function moveLeft(idx: number) {
    if (idx === 0) return;
    const next = [...value];
    const a = next[idx - 1]!;
    const b = next[idx]!;
    next[idx - 1] = b;
    next[idx] = a;
    onChange(next);
  }

  function moveRight(idx: number) {
    if (idx === value.length - 1) return;
    const next = [...value];
    const a = next[idx]!;
    const b = next[idx + 1]!;
    next[idx] = b;
    next[idx + 1] = a;
    onChange(next);
  }

  function setPrimary(idx: number) {
    if (idx === 0) return;
    const target = value[idx]!;
    const next = [target, ...value.filter((_, i) => i !== idx)];
    onChange(next);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {value.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-muted/30 text-sm text-muted-foreground">
          <Upload className="h-6 w-6" />
          <p>Sin imágenes</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={pick}
            disabled={isPending}
          >
            Agregar la primera
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((url, idx) => {
            const isPrimary = idx === 0;
            return (
              <div
                key={`${url}-${idx}`}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-md border bg-muted",
                  isPrimary && "ring-2 ring-primary ring-offset-2",
                )}
              >
                <Image
                  src={url}
                  alt={`Imagen ${idx + 1}`}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-contain"
                  unoptimized
                />

                {isPrimary && (
                  <div className="absolute left-1 top-1 z-10 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
                    Principal
                  </div>
                )}

                {/* Overlay de acciones */}
                <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveLeft(idx)}
                      disabled={idx === 0}
                      className="rounded bg-white/90 p-1 text-foreground shadow disabled:opacity-30 hover:bg-white"
                      aria-label="Mover izquierda"
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRight(idx)}
                      disabled={idx === value.length - 1}
                      className="rounded bg-white/90 p-1 text-foreground shadow disabled:opacity-30 hover:bg-white"
                      aria-label="Mover derecha"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </button>
                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimary(idx)}
                        className="rounded bg-white/90 p-1 text-amber-600 shadow hover:bg-white"
                        aria-label="Marcar como principal"
                        title="Marcar como principal"
                      >
                        <Star className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    className="rounded bg-destructive p-1 text-destructive-foreground shadow hover:bg-destructive/90"
                    aria-label="Quitar imagen"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {canAdd && (
            <button
              type="button"
              onClick={pick}
              disabled={isPending}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed bg-muted/30 text-xs text-muted-foreground transition-colors hover:border-primary hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Agregar
                </>
              )}
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {value.length} de {maxImages} imágenes. La primera es la principal y se
        muestra en la lista de productos.
      </p>
    </div>
  );
}
