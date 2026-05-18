import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "./input";

/**
 * Input que se ve en MAYÚSCULAS (CSS) pero el value subyacente queda como el
 * usuario lo escribe. Combinarlo con un schema Zod `.toLowerCase().trim()`
 * para que la BD almacene en lowercase normalizado.
 */
const UpperInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return <Input ref={ref} className={cn("uppercase", className)} {...props} />;
  },
);
UpperInput.displayName = "UpperInput";

export { UpperInput };
