"use client";

import { WordReveal } from "./motion";

export function HeroTitle() {
  return (
    <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
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
