import Image from "next/image";
import { Award, HeartHandshake, ShieldCheck, Target } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion";

const atouts = [
  {
    icon: Award,
    titre: "Des résultats qui parlent",
    description:
      "100 % de réussite au certificat d'études primaires et à l'entrée en 6e — 130 candidats présentés, 130 admis à la dernière session.",
  },
  {
    icon: HeartHandshake,
    titre: "Une équipe investie",
    description:
      "Une équipe pédagogique passionnée, dédiée à l'épanouissement et à la réussite de chaque enfant, avec un accompagnement individualisé.",
  },
  {
    icon: ShieldCheck,
    titre: "Un établissement reconnu",
    description:
      "Établi et reconnu par le ministère de l'Éducation nationale, avec une reconnaissance d'utilité publique depuis la rentrée 2025-2026.",
  },
  {
    icon: Target,
    titre: "Le travail, la persévérance, le succès",
    description:
      "Une exigence assumée et des méthodes d'enseignement innovantes, dans un cadre idéal au cœur de Port-Gentil.",
  },
];

export function VitrineAtouts() {
  return (
    <section id="atouts" className="scroll-mt-20 bg-muted/50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.3fr]">
          <Reveal direction="right" className="lg:sticky lg:top-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700">
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              Pourquoi le C.S.O
            </span>
            <h2 className="mt-5 text-balance font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.75rem]">
              Au complexe scolaire Orety, c&apos;est le travail, la persévérance
              et le succès
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Depuis sa création, le C.S.O s&apos;engage à offrir une éducation
              d&apos;excellence aux enfants de Port-Gentil. Nos performances aux
              examens nationaux et la confiance des familles font de notre
              établissement la référence de la ville.
            </p>

            <div className="relative mt-8 overflow-hidden rounded-2xl shadow-lg ring-1 ring-border">
              <Image
                src="/photos/equipe-pedagogique.jpg"
                alt="L'équipe pédagogique entourée des élèves"
                width={1080}
                height={606}
                sizes="(min-width: 1024px) 420px, 100vw"
                className="aspect-[16/10] w-full object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
              />
              <p className="absolute bottom-3 left-4 right-4 text-xs font-medium text-white/90">
                L&apos;équipe pédagogique du C.S.O, entourée de ses élèves
              </p>
            </div>
          </Reveal>

          <Stagger className="grid gap-5 sm:grid-cols-2">
            {atouts.map((atout) => (
              <StaggerItem
                key={atout.titre}
                className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
                  <atout.icon className="size-5" />
                </div>
                <h3 className="font-display text-base font-bold">{atout.titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {atout.description}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
