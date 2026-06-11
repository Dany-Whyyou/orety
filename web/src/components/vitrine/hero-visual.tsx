"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { Floating, TiltCard } from "./motion";

export function HeroVisual() {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-lg lg:max-w-none"
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <motion.div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-transparent to-accent/20 blur-2xl"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <TiltCard className="relative">
        <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-primary/15 ring-1 ring-border">
          <Image
            src="/photos/cour-recreation.jpg"
            alt="La cour de récréation du Complexe Scolaire Orety"
            width={1600}
            height={1200}
            priority
            sizes="(min-width: 1024px) 540px, 100vw"
            className="aspect-[4/3] w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-primary-900/30 via-transparent to-transparent"
          />
          {/* reflet qui balaie la photo */}
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            initial={{ x: "-120%" }}
            animate={{ x: "120%" }}
            transition={{ duration: 2.2, delay: 1, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
            style={{ transform: "skewX(-15deg)" }}
          />
        </div>

        <motion.div
          className="absolute -bottom-8 -left-4 w-44 overflow-hidden rounded-2xl border-4 border-background shadow-xl sm:-left-8 sm:w-52"
          style={{ translateZ: 40 }}
          initial={{ opacity: 0, x: -24, rotate: -4 }}
          animate={{ opacity: 1, x: 0, rotate: -2 }}
          transition={{ duration: 0.7, delay: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
          whileHover={{ rotate: 0, scale: 1.04 }}
        >
          <Image
            src="/photos/cour-prescolaire.jpg"
            alt="La cour du pré-primaire"
            width={520}
            height={390}
            sizes="208px"
            className="aspect-[4/3] w-full object-cover"
          />
        </motion.div>

        <Floating className="absolute -right-2 top-6 sm:-right-4" amplitude={10} duration={4.5}>
          <motion.div
            className="glass flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-lg"
            style={{ translateZ: 60 }}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BadgeCheck className="size-5" />
            </div>
            <div>
              <p className="font-display text-sm font-bold leading-none">100 % de réussite</p>
              <p className="mt-1 text-[11px] text-muted-foreground">CEP & entrée en 6e</p>
            </div>
          </motion.div>
        </Floating>
      </TiltCard>
    </motion.div>
  );
}
