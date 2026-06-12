import Link from "next/link";
import Image from "next/image";
import { Reveal } from "./motion";

export function VitrineFooter() {
  return (
    <footer className="relative overflow-hidden bg-primary-900 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.25),transparent_60%)]"
      />

      <div aria-hidden className="pointer-events-none select-none">
        <Reveal direction="up">
          <p
            className="-mb-[0.18em] whitespace-nowrap text-center font-display font-black leading-none tracking-tight text-transparent"
            style={{
              WebkitTextStroke: "1.5px rgba(255,255,255,0.12)",
              fontSize: "clamp(4.5rem, 15vw, 12rem)",
            }}
          >
            C.S.O ORETY
          </p>
        </Reveal>
      </div>

      <div className="relative mx-auto max-w-6xl border-t border-white/10 px-4 py-14 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-10 sm:flex-row">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 p-1.5 backdrop-blur">
                <Image
                  src="/logo-neutre.png"
                  alt="Complexe Scolaire Orety"
                  width={36}
                  height={36}
                  className="size-8 object-contain invert"
                />
              </div>
              <span className="font-display text-sm font-bold leading-tight">
                Complexe Scolaire
                <span className="block text-primary-200">Orety · C.S.O</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Persévérance · Excellence · La référence. Du pré-primaire au
              lycée, à Port-Gentil.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                L&apos;école
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-white/70">
                <li>
                  <a href="#cycles" className="transition-colors hover:text-white">Nos cycles</a>
                </li>
                <li>
                  <a href="#atouts" className="transition-colors hover:text-white">Pourquoi nous</a>
                </li>
                <li>
                  <a href="#admissions" className="transition-colors hover:text-white">Admissions</a>
                </li>
                <li>
                  <a href="#contact" className="transition-colors hover:text-white">Contact</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                Plateforme
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-white/70">
                <li>
                  <Link href="/login" className="transition-colors hover:text-white">
                    Espace personnel
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="transition-colors hover:text-white">
                    Administration
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Complexe Scolaire Orety — BP 2110,
            Port-Gentil, Gabon.
          </p>
          <p>Travail · Persévérance · Succès</p>
        </div>
      </div>
    </footer>
  );
}
