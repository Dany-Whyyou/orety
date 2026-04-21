import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        warning: "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400",
        danger: "border-transparent bg-rose-500/10 text-rose-700 dark:text-rose-400",
        info: "border-transparent bg-accent/10 text-accent",
        outline: "text-foreground border-border",
        glass: "border-border/50 bg-card/60 backdrop-blur-lg text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
