"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

const DUREE_MS = 2100;

export function VitrineIntro() {
  const [visible, setVisible] = React.useState(true);
  const [anime, setAnime] = React.useState(false);

  React.useEffect(() => {
    if (sessionStorage.getItem("orety-intro-vue")) {
      setVisible(false);
      return;
    }
    sessionStorage.setItem("orety-intro-vue", "1");
    setAnime(true);
    const t = setTimeout(() => setVisible(false), DUREE_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-primary"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden
        >
          <div className="absolute inset-0 dot-pattern opacity-10" />
          {anime && (
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="relative"
              >
                <div className="absolute inset-0 scale-150 rounded-full bg-white/10 blur-2xl" />
                <Image
                  src="/logo-neutre.png"
                  alt=""
                  width={88}
                  height={88}
                  priority
                  className="relative size-20 object-contain invert"
                />
              </motion.div>
              <motion.p
                className="mt-5 font-display text-xl font-bold tracking-wide text-white"
                initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.35, duration: 0.6 }}
              >
                Complexe Scolaire Orety
              </motion.p>
              <motion.div
                className="mt-4 h-px w-40 origin-left bg-gradient-to-r from-transparent via-white/70 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.55, duration: 0.9, ease: "easeOut" }}
              />
              <motion.p
                className="mt-3 text-[11px] font-medium uppercase tracking-[0.35em] text-white/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                Persévérance · Excellence
              </motion.p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
