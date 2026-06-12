"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion";

const photos = [
  {
    src: "/photos/sous-le-manguier.jpg",
    alt: "Élèves en uniforme dans la cour, sous le grand manguier",
    legende: "La cour principale, sous le grand manguier",
    classe: "sm:col-span-2 sm:row-span-2",
  },
  {
    src: "/photos/groupe-culturel.jpg",
    alt: "Élèves en tenues traditionnelles lors de la journée culturelle",
    legende: "La journée culturelle",
    classe: "",
  },
  {
    src: "/photos/duo-traditionnel.jpg",
    alt: "Deux élèves en tenues traditionnelles",
    legende: "Tenues traditionnelles",
    classe: "sm:row-span-2",
  },
  {
    src: "/photos/cour-recreation.jpg",
    alt: "La récréation dans la cour du C.S.O",
    legende: "La récréation",
    classe: "",
  },
  {
    src: "/photos/lyceennes.jpg",
    alt: "Élèves du collège-lycée avec leur enseignante",
    legende: "La grande famille du C.S.O",
    classe: "sm:col-span-2",
  },
  {
    src: "/photos/groupe-fete.jpg",
    alt: "Élèves, parents et équipe lors de la journée culturelle",
    legende: "Toute l'école réunie",
    classe: "",
  },
  {
    src: "/photos/vie-scolaire.jpg",
    alt: "Élèves devant les salles de classe",
    legende: "Devant les salles de classe",
    classe: "",
  },
  {
    src: "/photos/facade-principale.jpg",
    alt: "La façade du site principal, quartier Transfo",
    legende: "Le site principal, quartier Transfo",
    classe: "",
  },
];

export function VitrineGalerie() {
  const [actif, setActif] = React.useState<number | null>(null);

  const fermer = React.useCallback(() => setActif(null), []);
  const naviguer = React.useCallback((delta: number) => {
    setActif((i) => (i === null ? null : (i + delta + photos.length) % photos.length));
  }, []);

  React.useEffect(() => {
    if (actif === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermer();
      if (e.key === "ArrowRight") naviguer(1);
      if (e.key === "ArrowLeft") naviguer(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [actif, fermer, naviguer]);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            En images
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            La vie au C.S.O
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Cliquez sur une photo pour l&apos;agrandir
          </p>
        </Reveal>

        <Stagger className="mt-12 grid auto-rows-[180px] grid-cols-1 gap-4 sm:grid-cols-3 sm:auto-rows-[200px]">
          {photos.map((photo, i) => (
            <StaggerItem
              key={photo.src}
              className={`group relative overflow-hidden rounded-2xl ${photo.classe}`}
            >
              <button
                type="button"
                onClick={() => setActif(i)}
                className="absolute inset-0 size-full cursor-zoom-in text-left"
                aria-label={`Agrandir : ${photo.legende}`}
              >
                <motion.span
                  layoutId={`galerie-${i}`}
                  className="absolute inset-0 block overflow-hidden rounded-2xl"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </motion.span>
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <span className="absolute bottom-3 left-4 right-4 translate-y-2 text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {photo.legende}
                </span>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      <AnimatePresence>
        {actif !== null && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={fermer}
          >
            <motion.figure
              key={actif}
              layoutId={`galerie-${actif}`}
              className="relative max-h-full w-full max-w-4xl overflow-hidden rounded-2xl"
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={photos[actif].src}
                alt={photos[actif].alt}
                width={1600}
                height={1200}
                sizes="(min-width: 1024px) 896px, 100vw"
                className="max-h-[80vh] w-full rounded-2xl object-contain"
                priority
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10 text-center text-sm text-white/90">
                {photos[actif].legende} — {actif + 1} / {photos.length}
              </figcaption>
            </motion.figure>

            <button
              type="button"
              onClick={fermer}
              aria-label="Fermer"
              className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
            >
              <X className="size-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                naviguer(-1);
              }}
              aria-label="Photo précédente"
              className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:left-6"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                naviguer(1);
              }}
              aria-label="Photo suivante"
              className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:right-6"
            >
              <ChevronRight className="size-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
