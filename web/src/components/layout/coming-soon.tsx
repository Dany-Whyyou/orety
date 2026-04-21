"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Sparkles, type LucideIcon } from "lucide-react";

type ComingSoonProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  features?: string[];
};

export function ComingSoon({ icon: Icon, title, description, features }: ComingSoonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-96 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 size-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 dot-pattern opacity-30" />
      </div>

      <div className="relative max-w-md mx-auto">
        <div className="mb-6 inline-flex relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent blur-xl opacity-40" />
          <div className="relative size-16 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg flex items-center justify-center text-white">
            <Icon className="size-8" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 backdrop-blur px-3 py-1 text-[11px] font-medium mb-3">
          <Sparkles className="size-3 text-primary" />
          En cours de construction
        </div>

        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{description}</p>

        {features && features.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8 text-left">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-start gap-2 rounded-lg bg-card/60 border border-border/50 px-3 py-2 text-xs"
              >
                <span className="mt-0.5 size-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-muted-foreground">{f}</span>
              </motion.div>
            ))}
          </div>
        )}

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-border bg-card/60 backdrop-blur text-sm font-medium hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="size-4" />
          Retour au tableau de bord
        </Link>
      </div>
    </motion.div>
  );
}
