"use client";

import * as React from "react";

import { Input } from "./input";
import { sanitizePeruMobile } from "@/lib/peru";

type Props = Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
};

/**
 * Input de celular peruano. Filtra todo lo que no sea dígito y limita a 9.
 * Para usar con react-hook-form Controller.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="999 999 999"
        maxLength={9}
        value={value ?? ""}
        onChange={(e) => onChange(sanitizePeruMobile(e.target.value))}
        {...props}
      />
    );
  },
);
PhoneInput.displayName = "PhoneInput";
