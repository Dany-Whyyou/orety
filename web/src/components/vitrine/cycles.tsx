"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Baby, BookOpen, GraduationCap, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./motion";
import { SectionHeader } from "./section-header";

const cycles = [
  {
    icon: Baby,
    numero: "01",
    nom: "Pré-primaire",
    tranche: "Dès 3 ans",
    slogan: "La référence",
    description:
      "Un cadre bienveillant et stimulant pour les premiers apprentissages : éveil, langage, motricité et vie en collectivité.",
    photo: "/photos/cour-prescolaire.jpg",
    alt: "La cour du pré-primaire et ses salles de classe",
    badge: "border-warning/50 bg-warning/20 text-warning",
  },
  {
    icon: BookOpen,
    numero: "02",
    nom: "Primaire",
    tranche: "De la 1re à la 5e année",
    slogan: "La référence",
    description:
      "Des fondamentaux solides — lecture, écriture, calcul — avec un suivi individualisé jusqu'au certificat d'études primaires.",
    photo: "/photos/sous-le-manguier.jpg",
    alt: "Élèves du primaire dans la cour, sous le grand manguier",
    badge: "border-danger/50 bg-danger/25 text-red-100",
  },
  {
    icon: Library,
    numero: "03",
    nom: "Collège",
    tranche: "De la 6e à la 3e",
    slogan: "Persévérance-Excellence",
    description:
      "Ouvert depuis la rentrée 2025-2026, le collège accueille notamment les élèves orientés par l'État, dans la continuité de nos exigences.",
    photo: "/photos/escalier-college.jpg",
    alt: "Élèves sur les marches du bâtiment Collège & Lycée",
    badge: "border-primary-200/60 bg-primary/30 text-primary-100",
  },
  {
    icon: GraduationCap,
    numero: "04",
    nom: "Lycée",
    tranche: "De la 2nde à la Terminale",
    slogan: "Persévérance-Excellence",
    description:
      "Préparer le baccalauréat et l'avenir : rigueur, méthode et accompagnement vers les études supérieures.",
    photo: "/photos/lyceennes.jpg",
    alt: "Élèves du collège-lycée avec leur enseignante",
    badge: "border-primary-200/60 bg-primary/30 text-primary-100",
  },
];

export function VitrineCycles() {
  const [actif, setActif] = React.useState(0);

  return (
    <section id="cycles" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          kicker="Nos cycles"
          titre="Un parcours complet, de 3 ans au baccalauréat"
          description="Établissement établi et reconnu par le ministère de l'Éducation nationale, le C.S.O accompagne chaque élève à chaque étape de sa scolarité."
        />

        <Reveal className="mt-14" delay={0.1}>
          <div className="flex h-[40rem] flex-col gap-3 sm:h-[34rem] lg:flex-row lg:gap-4">
            {cycles.map((cycle, i) => {
              const estActif = actif === i;
              return (
                <motion.button
                  key={cycle.nom}
                  type="button"
                  onMouseEnter={() => setActif(i)}
                  onFocus={() => setActif(i)}
                  onClick={() => setActif(i)}
                  aria-expanded={estActif}
                  className={cn(
                    "group relative min-h-0 cursor-pointer overflow-hidden rounded-3xl text-left ring-1 ring-border",
                    estActif && "shadow-2xl shadow-primary/20"
                  )}
                  animate={{ flexGrow: estActif ? 4 : 1 }}
                  style={{ flexBasis: 0 }}
                  transition={{ type: "spring", stiffness: 160, damping: 24 }}
                >
                  <Image
                    src={cycle.photo}
                    alt={cycle.alt}
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className={cn(
                      "object-cover transition-all duration-700",
                      estActif ? "scale-100 saturate-100" : "scale-110 saturate-[0.55]"
                    )}
                  />
                  <div
                    aria-hidden
                    className={cn(
                      "absolute inset-0 transition-opacity duration-500",
                      estActif
                        ? "bg-gradient-to-t from-primary-900/95 via-primary-900/35 to-transparent"
                        : "bg-primary-900/60"
                    )}
                  />

                  {/* numéro en filigrane */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute right-4 top-3 font-display text-5xl font-black text-transparent transition-opacity duration-500 sm:text-6xl",
                      estActif ? "opacity-90" : "opacity-40"
                    )}
                    style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.5)" }}
                  >
                    {cycle.numero}
                  </span>

                  {/* état replié */}
                  {!estActif && (
                    <div className="absolute inset-0 flex items-end p-5 lg:items-end">
                      <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm">
                          <cycle.icon className="size-5" />
                        </span>
                        <span className="font-display text-lg font-bold text-white drop-shadow lg:[writing-mode:vertical-rl] lg:rotate-180 lg:text-xl">
                          {cycle.nom}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* état déployé */}
                  <AnimatePresence>
                    {estActif && (
                      <motion.div
                        className="absolute inset-x-0 bottom-0 p-6 sm:p-8"
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.45, delay: 0.12, ease: [0.21, 0.47, 0.32, 0.98] }}
                      >
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm">
                          <cycle.icon className="size-6" />
                        </span>
                        <h3 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
                          {cycle.nom}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-white/70">
                          {cycle.tranche}
                        </p>
                        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85">
                          {cycle.description}
                        </p>
                        <span
                          className={cn(
                            "mt-4 inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm",
                            cycle.badge
                          )}
                        >
                          {cycle.slogan}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
