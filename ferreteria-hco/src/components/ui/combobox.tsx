"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type ComboboxOption = {
  value: string;
  label: string;
  /** Texto adicional para que el filtro lo encuentre (ej. SKU, código) */
  keywords?: string;
};

type Props = {
  id?: string;
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  clearable?: boolean;
  uppercaseLabels?: boolean;
};

/**
 * Combobox con búsqueda al escribir (estilo Select2).
 * Reemplaza al `<Select>` cuando hay muchas opciones (≥10).
 */
export function Combobox({
  id,
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin resultados.",
  disabled = false,
  clearable = true,
  uppercaseLabels = false,
}: Props) {
  const [open, setOpen] = React.useState(false);

  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "truncate",
              uppercaseLabels && selected && "uppercase",
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
          <span className="ml-2 flex shrink-0 items-center gap-1">
            {selected && clearable && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Limpiar"
                className="rounded hover:bg-muted"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null);
                }}
              >
                <X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command
          filter={(value, search, keywords) => {
            // value es el label, keywords incluye lo extra que pasamos
            const haystack = [value, ...(keywords ?? [])].join(" ").toLowerCase();
            const needle = search.toLowerCase().trim();
            if (!needle) return 1;
            return haystack.includes(needle) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  keywords={opt.keywords ? [opt.keywords] : undefined}
                  onSelect={() => {
                    onChange(opt.value === value ? null : opt.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-1 h-4 w-4",
                      value === opt.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className={cn("flex-1 truncate", uppercaseLabels && "uppercase")}>
                    {opt.label}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
