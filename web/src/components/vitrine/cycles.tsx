import Image from "next/image";
import { Baby, BookOpen, GraduationCap, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, Stagger, StaggerItem } from "./motion";

const cycles = [
  {
    icon: Baby,
    nom: "Pré-primaire",
    tranche: "Dès 3 ans",
    slogan: "La référence",
    description:
      "Un cadre bienveillant et stimulant pour les premiers apprentissages : éveil, langage, motricité et vie en collectivité.",
    photo: "/photos/cour-prescolaire.jpg",
    alt: "La cour du pré-primaire et ses salles de classe",
    accent: "bg-warning/15 text-yellow-700 dark:text-warning",
    badge: "border-warning/40 bg-warning/10 text-yellow-700 dark:text-warning",
  },
  {
    icon: BookOpen,
    nom: "Primaire",
    tranche: "De la 1re à la 5e année",
    slogan: "La référence",
    description:
      "Des fondamentaux solides — lecture, écriture, calcul — avec un suivi individualisé jusqu'au certificat d'études primaires.",
    photo: "/photos/sous-le-manguier.jpg",
    alt: "Élèves du primaire dans la cour, sous le grand manguier",
    accent: "bg-danger/10 text-danger",
    badge: "border-danger/30 bg-danger/10 text-danger",
  },
  {
    icon: Library,
    nom: "Collège",
    tranche: "De la 6e à la 3e",
    slogan: "Persévérance-Excellence",
    description:
      "Ouvert depuis la rentrée 2025-2026, le collège accueille notamment les élèves orientés par l'État, dans la continuité de nos exigences.",
    photo: "/photos/escalier-college.jpg",
    alt: "Élèves sur les marches du bâtiment Collège & Lycée",
    accent: "bg-primary-50 text-primary",
    badge: "border-primary/30 bg-primary-50 text-primary-700",
  },
  {
    icon: GraduationCap,
    nom: "Lycée",
    tranche: "De la 2nde à la Terminale",
    slogan: "Persévérance-Excellence",
    description:
      "Préparer le baccalauréat et l'avenir : rigueur, méthode et accompagnement vers les études supérieures.",
    photo: "/photos/lyceennes.jpg",
    alt: "Élèves du collège-lycée avec leur enseignante",
    accent: "bg-primary-50 text-primary",
    badge: "border-primary/30 bg-primary-50 text-primary-700",
  },
];

export function VitrineCycles() {
  return (
    <section id="cycles" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Nos cycles
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Un parcours complet, de 3 ans au baccalauréat
          </h2>
          <p className="mt-4 text-muted-foreground">
            Établissement établi et reconnu par le ministère de l&apos;Éducation
            nationale, le C.S.O accompagne chaque élève à chaque étape de sa
            scolarité.
          </p>
        </Reveal>

        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cycles.map((cycle) => (
            <StaggerItem
              key={cycle.nom}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="relative h-40 overflow-hidden">
                <Image
                  src={cycle.photo}
                  alt={cycle.alt}
                  fill
                  sizes="(min-width: 1024px) 270px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent"
                />
                <div
                  className={cn(
                    "absolute bottom-3 left-3 flex size-10 items-center justify-center rounded-xl shadow-md backdrop-blur-sm",
                    cycle.accent,
                    "bg-card/90"
                  )}
                >
                  <cycle.icon className="size-5" />
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg font-bold">{cycle.nom}</h3>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  {cycle.tranche}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {cycle.description}
                </p>
                <span
                  className={cn(
                    "mt-4 inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                    cycle.badge
                  )}
                >
                  {cycle.slogan}
                </span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
