"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

export function VitrineParallax() {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const opacity = useTransform(scrollYProgress, [0.15, 0.4], [0, 1]);
  const scale = useTransform(scrollYProgress, [0.15, 0.45], [0.92, 1]);

  return (
    <section ref={ref} className="relative h-[26rem] overflow-hidden sm:h-[30rem]">
      <motion.div className="absolute inset-[-14%]" style={{ y }}>
        <Image
          src="/photos/journee-culturelle.jpg"
          alt="Élèves et équipe pédagogique lors de la journée culturelle"
          fill
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-primary-900/75 via-primary-900/45 to-primary-900/75"
      />

      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
        style={{ opacity, scale }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
          Notre devise
        </p>
        <blockquote className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
          « Le travail, la persévérance
          <span className="block bg-gradient-to-r from-warning via-white to-warning bg-clip-text text-transparent">
            et le succès »
          </span>
        </blockquote>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
          Depuis sa création, le Complexe Scolaire Orety forme des élèves
          épanouis, enracinés dans leur culture et tournés vers l&apos;avenir.
        </p>
      </motion.div>
    </section>
  );
}
