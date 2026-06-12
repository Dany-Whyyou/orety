"use client";

import { WordReveal } from "./motion";

export function HeroTitle() {
  return (
    <h1 className="text-balance font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight sm:text-6xl xl:text-7xl">
      <WordReveal delay={0.15}>Complexe Scolaire</WordReveal>{" "}
      <WordReveal
        delay={0.45}
        className="animate-gradient bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent"
      >
        Orety
      </WordReveal>
    </h1>
  );
}
