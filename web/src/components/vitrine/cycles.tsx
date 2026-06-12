"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useScroll, useSpring } from "framer-motion";
import { Baby, BookOpen, GraduationCap, Library, Award } from "lucide-react";
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
    accent: "bg-warning/15 text-yellow-700 dark:text-warning",
    badge: "border-warning/40 bg-warning/10 text-yellow-700 dark:text-warning",
    point: "bg-warning",
  },
  {
    icon: BookOpen,
    numero: "02",
    nom: "Primaire",
    tranche: "De la 1re à la 5e année",
    slogan: "La référence",
    description:
      "Des fondamentaux solides — lecture, écriture, calcul — avec un suivi individualisé jusqu'au certificat d'études primaires, réussi à 100 %.",
    photo: "/photos/sous-le-manguier.jpg",
    alt: "Élèves du primaire dans la cour, sous le grand manguier",
    accent: "bg-danger/10 text-danger",
    badge: "border-danger/30 bg-danger/10 text-danger",
    point: "bg-danger",
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
    accent: "bg-primary-50 text-primary",
    badge: "border-primary/30 bg-primary-50 text-primary-700",
    point: "bg-primary",
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
    accent: "bg-accent/10 text-accent",
    badge: "border-accent/30 bg-accent/10 text-accent",
    point: "bg-accent",
  },
];

export function VitrineCycles() {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 75%"],
  });
  const ligne = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <section id="cycles" className="scroll-mt-20 overflow-hidden py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          kicker="Nos cycles"
          titre="Un parcours complet, de 3 ans au baccalauréat"
          description="Établissement établi et reconnu par le ministère de l'Éducation nationale, le C.S.O accompagne chaque élève à chaque étape de sa scolarité."
        />

        <div ref={ref} className="relative mt-20">
          {/* ligne de parcours */}
          <div
            aria-hidden
            className="absolute bottom-0 left-5 top-0 w-px bg-border lg:left-1/2 lg:-translate-x-1/2"
          />
          <motion.div
            aria-hidden
            className="absolute bottom-0 left-5 top-0 w-px origin-top bg-gradient-to-b from-warning via-primary to-accent lg:left-1/2 lg:-translate-x-1/2"
            style={{ scaleY: ligne }}
          />

          <div className="space-y-20 lg:space-y-28">
            {cycles.map((cycle, i) => {
              const inverse = i % 2 === 1;
              return (
                <div
                  key={cycle.nom}
                  className="relative grid items-center gap-8 pl-14 lg:grid-cols-2 lg:gap-16 lg:pl-0"
                >
                  {/* point sur la ligne */}
                  <div
                    aria-hidden
                    className="absolute left-5 top-2 -translate-x-1/2 lg:left-1/2 lg:top-1/2 lg:-translate-y-1/2"
                  >
                    <span className="relative flex size-5 items-center justify-center">
                      <span
                        className={cn(
                          "absolute size-full animate-ping rounded-full opacity-25",
                          cycle.point
                        )}
                      />
                      <span
                        className={cn(
                          "relative size-3.5 rounded-full ring-4 ring-background",
                          cycle.point
                        )}
                      />
                    </span>
                  </div>

                  {/* photo */}
                  <Reveal
                    direction={inverse ? "left" : "right"}
                    className={cn("relative", inverse && "lg:order-2")}
                  >
                    <div
                      className={cn(
                        "group relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-border",
                        inverse ? "lg:rotate-1" : "lg:-rotate-1"
                      )}
                    >
                      <Image
                        src={cycle.photo}
                        alt={cycle.alt}
                        width={1600}
                        height={1200}
                        sizes="(min-width: 1024px) 520px, 100vw"
                        className="aspect-[16/11] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-t from-primary-900/40 via-transparent to-transparent"
                      />
                      <span className="absolute bottom-4 left-5 font-display text-sm font-bold uppercase tracking-[0.2em] text-white/90">
                        {cycle.tranche}
                      </span>
                    </div>
                    {/* numéro en filigrane derrière la photo */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute -top-12 -z-10 hidden font-display text-[9rem] font-black leading-none text-transparent lg:block",
                        inverse ? "-right-6" : "-left-6"
                      )}
                      style={{ WebkitTextStroke: "1.5px hsl(var(--border))" }}
                    >
                      {cycle.numero}
                    </span>
                  </Reveal>

                  {/* contenu */}
                  <Reveal
                    direction={inverse ? "right" : "left"}
                    delay={0.12}
                    className={cn(inverse && "lg:order-1 lg:text-right")}
                  >
                    <div
                      className={cn(
                        "flex size-12 items-center justify-center rounded-2xl",
                        cycle.accent,
                        inverse && "lg:ml-auto"
                      )}
                    >
                      <cycle.icon className="size-6" />
                    </div>
                    <h3 className="mt-5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                      {cycle.nom}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">
                      {cycle.tranche}
                    </p>
                    <p
                      className={cn(
                        "mt-4 max-w-md leading-relaxed text-muted-foreground",
                        inverse && "lg:ml-auto"
                      )}
                    >
                      {cycle.description}
                    </p>
                    <span
                      className={cn(
                        "mt-5 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                        cycle.badge
                      )}
                    >
                      {cycle.slogan}
                    </span>
                  </Reveal>
                </div>
              );
            })}
          </div>

          {/* aboutissement : le bac */}
          <Reveal className="relative mt-20 flex justify-center pl-14 lg:mt-24 lg:pl-0">
            <div className="relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary-700 via-primary to-accent px-7 py-3.5 text-white shadow-lg shadow-primary/30">
              <Award className="size-5" />
              <span className="font-display text-sm font-bold uppercase tracking-[0.15em]">
                Cap sur le baccalauréat
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
