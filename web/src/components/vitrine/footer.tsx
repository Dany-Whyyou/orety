import Link from "next/link";
import Image from "next/image";
import { Reveal } from "./motion";

export function VitrineFooter() {
  return (
    <footer className="overflow-hidden border-t border-border bg-card">
      <div aria-hidden className="pointer-events-none select-none">
        <Reveal direction="up">
          <p
            className="-mb-[0.18em] whitespace-nowrap text-center font-display font-black leading-none tracking-tight text-transparent"
            style={{
              WebkitTextStroke: "1.5px hsl(var(--border))",
              fontSize: "clamp(4.5rem, 15vw, 12rem)",
            }}
          >
            C.S.O ORETY
          </p>
        </Reveal>
      </div>
      <div className="mx-auto max-w-6xl border-t border-border px-4 py-12 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-neutre.png"
                alt="Complexe Scolaire Orety"
                width={36}
                height={36}
                className="size-9 object-contain"
              />
              <span className="font-display text-sm font-bold leading-tight">
                Complexe Scolaire
                <span className="block text-primary">Orety · C.S.O</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Persévérance · Excellence · La référence. Du pré-primaire au
              lycée, à Port-Gentil.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold">L&apos;école</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#cycles" className="hover:text-foreground">Nos cycles</a>
                </li>
                <li>
                  <a href="#atouts" className="hover:text-foreground">Pourquoi nous</a>
                </li>
                <li>
                  <a href="#admissions" className="hover:text-foreground">Admissions</a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-foreground">Contact</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Plateforme</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/login" className="hover:text-foreground">
                    Espace personnel
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-foreground">
                    Administration
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Complexe Scolaire Orety — BP 2110,
          Port-Gentil, Gabon. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
