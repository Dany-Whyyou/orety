"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type WelcomeBannerProps = {
  firstName: string;
  anneeLibelle?: string | null;
  periodeLibelle?: string | null;
};

export function WelcomeBanner({ firstName, anneeLibelle, periodeLibelle }: WelcomeBannerProps) {
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const contextBadge = anneeLibelle
    ? periodeLibelle
      ? `Année ${anneeLibelle} · ${periodeLibelle}`
      : `Année ${anneeLibelle}`
    : "Aucune année active";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/[0.08] via-card/60 to-accent/[0.05] backdrop-blur-xl p-6 md:p-8"
    >
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-20 size-80 rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/4 size-64 rounded-full bg-accent/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.03] dot-pattern" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="glass" className="gap-1.5 px-3 py-1">
              <Sparkles className="size-3 text-primary" />
              <span className="text-[11px]">{contextBadge}</span>
            </Badge>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-1">
            Bonjour{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {firstName}
            </span>{" "}
            👋
          </h1>
          <p className="text-sm text-muted-foreground capitalize-first">
            {today} — voici l&apos;état de votre établissement.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
