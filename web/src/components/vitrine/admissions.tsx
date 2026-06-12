import { CalendarCheck, Clock, FileText, Phone } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion";
import { SectionHeader } from "./section-header";

const etapes = [
  {
    icon: Clock,
    titre: "1. Venez nous rencontrer",
    description:
      "Les inscriptions se déroulent sur place, tous les jours ouvrables de 8h à 13h, au site principal (quartier Transfo) ou à l'annexe (carrefour SEG).",
  },
  {
    icon: FileText,
    titre: "2. Constituez le dossier",
    description:
      "Pièces d'état civil de l'enfant, bulletins ou livret de l'année précédente le cas échéant, et photos d'identité.",
  },
  {
    icon: CalendarCheck,
    titre: "3. Confirmez l'inscription",
    description:
      "Après validation du dossier et règlement des frais, la place de votre enfant est réservée pour la rentrée 2026-2027.",
  },
];

export function VitrineAdmissions() {
  return (
    <section id="admissions" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          kicker="Admissions"
          titre="Inscriptions ouvertes pour 2026-2027"
          description="Les inscriptions ont débuté et se poursuivent tous les jours ouvrables, de 8h à 13h. Rejoignez-nous afin d'offrir à vos enfants l'opportunité de s'épanouir dans un cadre accueillant et bienveillant."
        />

        <Stagger className="mt-14 grid gap-5 md:grid-cols-3">
          {etapes.map((etape) => (
            <StaggerItem
              key={etape.titre}
              className="gradient-border h-full rounded-2xl p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
                <etape.icon className="size-5" />
              </div>
              <h3 className="font-display text-base font-bold">{etape.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {etape.description}
              </p>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal>
        <div className="relative mt-10 flex flex-col items-center justify-between gap-5 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 via-primary to-primary-500 p-8 text-white sm:flex-row">
          <div aria-hidden className="animate-blob absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
          <div>
            <h3 className="font-display text-xl font-bold">
              Une question ? Appelez l&apos;infoline
            </h3>
            <p className="mt-1 text-sm text-white/80">
              Nos équipes vous renseignent les jours ouvrables, de 8h à 13h.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href="tel:+24177955851"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 font-semibold text-primary-700 shadow-sm transition-transform hover:scale-[1.02]"
            >
              <Phone className="size-4" />
              077 95 58 51
            </a>
            <a
              href="tel:+24165826521"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/40 px-5 font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Phone className="size-4" />
              065 82 65 21
            </a>
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
