"use client";

import * as React from "react";

import { Input } from "./input";
import { sanitizePeruRuc } from "@/lib/peru";

type Props = Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
};

/**
 * Input de RUC peruano. Filtra todo lo que no sea dígito y limita a 11.
 * Para usar con react-hook-form Controller.
 */
export const RucInput = React.forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="20123456789"
        maxLength={11}
        className="font-mono"
        value={value ?? ""}
        onChange={(e) => onChange(sanitizePeruRuc(e.target.value))}
        {...props}
      />
    );
  },
);
RucInput.displayName = "RucInput";
