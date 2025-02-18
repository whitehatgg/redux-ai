import * as React from "react"

import { cn } from "@/lib/utils"

const Code = React.forwardRef<
  HTMLPreElement,
  React.HTMLAttributes<HTMLPreElement>
>(({ className, ...props }, ref) => (
  <pre
    ref={ref}
    className={cn(
      "relative rounded-lg bg-muted p-4 overflow-x-auto font-mono text-sm",
      className
    )}
    {...props}
  />
))
Code.displayName = "Code"

export { Code }
