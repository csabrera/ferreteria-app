"use client";

import * as React from "react";

import { Input } from "./input";
import type { DocumentTypeT } from "@/schemas/auth.schema";

type Props = Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
  documentType: DocumentTypeT;
  value: string;
  onChange: (value: string) => void;
};

const RULES: Record<
  DocumentTypeT,
  { maxLength: number; sanitize: (v: string) => string; placeholder: string }
> = {
  DNI: {
    maxLength: 8,
    sanitize: (v) => v.replace(/\D/g, "").slice(0, 8),
    placeholder: "12345678",
  },
  CE: {
    maxLength: 12,
    sanitize: (v) =>
      v
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase()
        .slice(0, 12),
    placeholder: "001234567",
  },
  PAS: {
    maxLength: 12,
    sanitize: (v) =>
      v
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase()
        .slice(0, 12),
    placeholder: "AB123456",
  },
};

/**
 * Input para número de documento. Restringe en tiempo real qué caracteres
 * se aceptan según el tipo de documento.
 */
export const DocumentNumberInput = React.forwardRef<HTMLInputElement, Props>(
  ({ documentType, value, onChange, ...props }, ref) => {
    const rule = RULES[documentType];
    return (
      <Input
        ref={ref}
        type="text"
        inputMode={documentType === "DNI" ? "numeric" : "text"}
        autoComplete="off"
        placeholder={rule.placeholder}
        maxLength={rule.maxLength}
        className={documentType === "DNI" ? undefined : "uppercase"}
        value={value ?? ""}
        onChange={(e) => onChange(rule.sanitize(e.target.value))}
        {...props}
      />
    );
  },
);
DocumentNumberInput.displayName = "DocumentNumberInput";
