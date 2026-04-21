import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 size-[36rem] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 size-[30rem] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute inset-0 dot-pattern opacity-40" />
      </div>

      <main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center">
        <div className="mb-8 flex items-center gap-2 rounded-full border border-border/60 bg-card/60 backdrop-blur-lg px-3 py-1 text-[11px] font-medium">
          <Sparkles className="size-3 text-primary" />
          <span>Plateforme Orety · Version bêta</span>
        </div>

        <div className="mb-6 relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl" />
          <div className="relative size-20 rounded-3xl bg-gradient-to-br from-primary via-primary-500 to-accent shadow-xl shadow-primary/20 flex items-center justify-center">
            <Image src="/logo-neutre.png" alt="Orety" width={56} height={56} className="size-14 object-contain invert" priority />
          </div>
        </div>

        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4">
          <span className="bg-gradient-to-r from-primary via-primary-500 to-accent bg-clip-text text-transparent">
            Complexe Scolaire Orety
          </span>
        </h1>
        <p className="max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed mb-10">
          Persévérance · Excellence · La référence.<br />
          Une plateforme unifiée pour piloter primaire, collège et lycée — à Port-Gentil et au-delà.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/admin"
            className="group inline-flex items-center gap-2 h-12 px-8 rounded-full bg-gradient-to-r from-primary via-primary-500 to-accent text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all bg-[length:200%_100%] bg-left hover:bg-right duration-500"
          >
            Accéder au dashboard
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
