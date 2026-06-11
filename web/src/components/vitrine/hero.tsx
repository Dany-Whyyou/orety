import Image from "next/image";
import { ArrowRight, Sparkles, Trophy, Users, MapPin } from "lucide-react";
import { CountUp, Stagger, StaggerItem } from "./motion";
import { HeroVisual } from "./hero-visual";

const stats = [
  {
    icon: Trophy,
    value: <CountUp end={100} suffix=" %" />,
    label: "de réussite au CEP et à l'entrée en 6e",
  },
  {
    icon: Users,
    value: <CountUp end={3} prefix="Dès " suffix=" ans" />,
    label: "du pré-primaire jusqu'au lycée",
  },
  {
    icon: MapPin,
    value: <CountUp end={2} suffix=" sites" />,
    label: "à Port-Gentil : Transfo et carrefour SEG",
  },
];

export function VitrineHero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-28 sm:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-blob absolute -top-32 left-1/4 size-[34rem] rounded-full bg-primary/10 blur-[120px]" />
        <div className="animate-blob-slow absolute bottom-0 right-1/5 size-[26rem] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute inset-0 dot-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Stagger className="flex flex-col items-start text-left">
            <StaggerItem>
              <div className="mb-6 flex items-center gap-2 rounded-full border border-primary/30 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700">
                <Sparkles className="size-3.5 animate-pulse" />
                Inscriptions ouvertes — Année scolaire 2026-2027
              </div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
                Complexe Scolaire{" "}
                <span className="animate-gradient bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent">
                  Orety
                </span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Persévérance, excellence, la référence. Du pré-primaire au lycée,
                une équipe pédagogique investie accompagne l&apos;épanouissement
                et la réussite de vos enfants, à Port-Gentil.
              </p>
            </StaggerItem>

            <StaggerItem>
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
                  className="inline-flex h-12 items-center rounded-full border border-border bg-card px-8 font-semibold transition-all hover:-translate-y-0.5 hover:bg-muted hover:shadow-md"
                >
                  Découvrir nos cycles
                </a>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="mt-10 flex items-center gap-7">
                <Image
                  src="/logo-primaire.png"
                  alt="Logo C.S.O Préprimaire-Primaire — La référence"
                  width={64}
                  height={64}
                  className="size-14 object-contain transition-transform duration-300 hover:scale-110"
                />
                <Image
                  src="/logo-college.png"
                  alt="Logo C.S.O Collège et Lycée — Persévérance-Excellence"
                  width={64}
                  height={64}
                  className="size-14 object-contain transition-transform duration-300 hover:scale-110"
                />
                <p className="max-w-[180px] text-xs leading-snug text-muted-foreground">
                  Établissement reconnu par le ministère de l&apos;Éducation
                  nationale
                </p>
              </div>
            </StaggerItem>
          </Stagger>

          <HeroVisual />
        </div>

        <Stagger className="mx-auto mt-24 grid max-w-4xl gap-4 sm:grid-cols-3" delay={0.15}>
          {stats.map((stat, i) => (
            <StaggerItem key={i} className="h-full">
              <div className="gradient-border flex h-full items-center gap-4 rounded-2xl p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
                  <stat.icon className="size-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold">{stat.value}</p>
                  <p className="text-xs leading-snug text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
