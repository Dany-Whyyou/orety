import Image from "next/image";
import { ArrowRight, Sparkles, Trophy, Users, MapPin, BadgeCheck } from "lucide-react";

const stats = [
  {
    icon: Trophy,
    value: "100 %",
    label: "de réussite au CEP et à l'entrée en 6e",
  },
  {
    icon: Users,
    value: "Dès 3 ans",
    label: "du pré-primaire jusqu'au lycée",
  },
  {
    icon: MapPin,
    value: "2 sites",
    label: "à Port-Gentil : Transfo et carrefour SEG",
  },
];

export function VitrineHero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-28 sm:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/4 size-[34rem] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/5 size-[26rem] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute inset-0 dot-pattern opacity-40" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="flex flex-col items-start text-left">
            <div className="mb-6 flex items-center gap-2 rounded-full border border-primary/30 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700 animate-fade-up">
              <Sparkles className="size-3.5" />
              Inscriptions ouvertes — Année scolaire 2026-2027
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
              Complexe Scolaire{" "}
              <span className="bg-gradient-to-r from-primary via-primary-500 to-accent bg-clip-text text-transparent">
                Orety
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Persévérance, excellence, la référence. Du pré-primaire au lycée,
              une équipe pédagogique investie accompagne l&apos;épanouissement
              et la réussite de vos enfants, à Port-Gentil.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#admissions"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-primary via-primary-500 to-accent bg-[length:200%_100%] bg-left px-8 font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-500 hover:bg-right hover:shadow-xl hover:shadow-primary/40"
              >
                Inscrire mon enfant
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#cycles"
                className="inline-flex h-12 items-center rounded-full border border-border bg-card px-8 font-semibold transition-colors hover:bg-muted"
              >
                Découvrir nos cycles
              </a>
            </div>

            <div className="mt-10 flex items-center gap-7">
              <Image
                src="/logo-primaire.png"
                alt="Logo C.S.O Préprimaire-Primaire — La référence"
                width={64}
                height={64}
                className="size-14 object-contain"
              />
              <Image
                src="/logo-college.png"
                alt="Logo C.S.O Collège et Lycée — Persévérance-Excellence"
                width={64}
                height={64}
                className="size-14 object-contain"
              />
              <p className="max-w-[180px] text-xs leading-snug text-muted-foreground">
                Établissement reconnu par le ministère de l&apos;Éducation
                nationale
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div
              aria-hidden
              className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/15 via-transparent to-accent/15 blur-xl"
            />
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
            </div>

            <div className="absolute -bottom-8 -left-4 w-44 overflow-hidden rounded-2xl border-4 border-background shadow-xl sm:-left-8 sm:w-52">
              <Image
                src="/photos/cour-prescolaire.jpg"
                alt="La cour du pré-primaire"
                width={520}
                height={390}
                sizes="208px"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>

            <div className="glass absolute -right-2 top-6 flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-lg sm:-right-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <BadgeCheck className="size-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold leading-none">100 % de réussite</p>
                <p className="mt-1 text-[11px] text-muted-foreground">CEP & entrée en 6e</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-24 grid max-w-4xl gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.value}
              className="gradient-border flex items-center gap-4 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
                <stat.icon className="size-5" />
              </div>
              <div>
                <p className="font-display text-xl font-bold">{stat.value}</p>
                <p className="text-xs leading-snug text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
