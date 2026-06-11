import Image from "next/image";
import { Clock, Mailbox, MapPin, Phone } from "lucide-react";

const sites = [
  {
    nom: "Site principal — Transfo",
    adresse:
      "Quartier Transfo, à quelques mètres de l'église Bethany, Port-Gentil",
    cycles: "Pré-primaire · Primaire · Collège · Lycée",
    photo: "/photos/portail-entree.jpg",
    alt: "L'entrée du site principal, quartier Transfo",
  },
  {
    nom: "Annexe — Carrefour SEG",
    adresse: "Carrefour de la SEG (bac aviation), Port-Gentil",
    cycles: "Pré-primaire · Primaire",
    photo: "/photos/panneau-annexe.jpg",
    alt: "Le panneau officiel de l'annexe du C.S.O",
  },
];

export function VitrineContact() {
  return (
    <section id="contact" className="scroll-mt-20 bg-muted/50 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Contact
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Deux sites au cœur de Port-Gentil
          </h2>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {sites.map((site) => (
            <div
              key={site.nom}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-44 overflow-hidden">
                <Image
                  src={site.photo}
                  alt={site.alt}
                  fill
                  sizes="(min-width: 1024px) 360px, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
                />
                <div className="absolute bottom-3 left-3 flex size-10 items-center justify-center rounded-xl bg-card/90 text-primary shadow-md backdrop-blur-sm">
                  <MapPin className="size-5" />
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-base font-bold">{site.nom}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {site.adresse}
                </p>
                <p className="mt-3 text-xs font-medium text-primary-700 dark:text-primary-500">
                  {site.cycles}
                </p>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
              <Phone className="size-5" />
            </div>
            <h3 className="font-display text-base font-bold">Nous joindre</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-primary" />
                <span>
                  <a href="tel:+24107955851" className="hover:text-foreground">
                    07 95 58 51
                  </a>
                  {" · "}
                  <a href="tel:+24105826521" className="hover:text-foreground">
                    05 82 65 21
                  </a>
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mailbox className="size-4 shrink-0 text-primary" />
                BP 2110, Port-Gentil, Gabon
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="size-4 shrink-0 text-primary" />
                Jours ouvrables, 8h — 13h
              </li>
            </ul>
            <p className="mt-5 rounded-xl bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              Les inscriptions se font sur place, au site principal ou à
              l&apos;annexe, tous les jours ouvrables de 8h à 13h.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
