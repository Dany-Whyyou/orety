"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number | null;
  delta?: number | null;
  deltaLabel?: string;
  icon: React.ReactNode;
  format?: "number" | "percent";
  accent?: "primary" | "accent" | "warning" | "danger";
  delay?: number;
  hint?: string;
};

export function StatCard({
  label,
  value,
  delta,
  deltaLabel = "vs. mois dernier",
  icon,
  format = "number",
  accent = "primary",
  delay = 0,
  hint,
}: StatCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) =>
    format === "percent" ? `${v.toFixed(1)}%` : formatNumber(Math.round(v))
  );

  React.useEffect(() => {
    if (inView && value !== null) {
      const controls = animate(count, value, {
        duration: 1.2,
        delay: delay + 0.1,
        ease: [0.16, 1, 0.3, 1],
      });
      return controls.stop;
    }
  }, [inView, value, count, delay]);

  const trendIcon =
    delta === undefined || delta === null ? null : delta > 0 ? (
      <ArrowUp className="size-3" />
    ) : delta < 0 ? (
      <ArrowDown className="size-3" />
    ) : (
      <Minus className="size-3" />
    );

  const trendColor =
    delta === undefined || delta === null
      ? "text-muted-foreground"
      : delta > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : delta < 0
      ? "text-rose-600 dark:text-rose-400"
      : "text-muted-foreground";

  const accentGrad = {
    primary: "from-primary/15 via-primary/5 to-transparent",
    accent: "from-accent/15 via-accent/5 to-transparent",
    warning: "from-warning/15 via-warning/5 to-transparent",
    danger: "from-danger/15 via-danger/5 to-transparent",
  }[accent];

  const iconBg = {
    primary: "from-primary to-primary-500",
    accent: "from-accent to-accent/70",
    warning: "from-warning to-warning/70",
    danger: "from-danger to-danger/70",
  }[accent];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 shadow-sm hover:shadow-lg transition-all"
      )}
    >
      <div
        aria-hidden
        className={cn(
          "absolute -top-12 -right-12 size-44 rounded-full blur-3xl bg-gradient-to-br opacity-60 group-hover:opacity-100 transition-opacity",
          accentGrad
        )}
      />

      <div className="relative flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        </div>
        <div
          className={cn(
            "size-10 rounded-xl bg-gradient-to-br shadow-md shadow-primary/10 flex items-center justify-center text-white",
            iconBg
          )}
        >
          {icon}
        </div>
      </div>

      <div className="relative flex items-end justify-between gap-3">
        {value === null ? (
          <span className="font-display text-3xl md:text-[2rem] font-bold tracking-tight leading-none text-muted-foreground/40">
            —
          </span>
        ) : (
          <motion.div className="font-display text-3xl md:text-[2rem] font-bold tracking-tight leading-none">
            {rounded}
          </motion.div>
        )}

        {delta !== undefined && delta !== null && (
          <div className={cn("flex items-center gap-1 text-xs font-semibold", trendColor)}>
            {trendIcon}
            <span>{Math.abs(delta).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <p className="relative mt-1 text-[11px] text-muted-foreground">
        {hint ?? (delta !== undefined && delta !== null ? deltaLabel : "")}
      </p>
    </motion.div>
  );
}
