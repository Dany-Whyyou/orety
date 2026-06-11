const mots = [
  "Persévérance",
  "Excellence",
  "La référence",
  "Travail",
  "Succès",
  "Pré-primaire",
  "Primaire",
  "Collège",
  "Lycée",
];

function Sequence() {
  return (
    <div className="flex shrink-0 items-center">
      {mots.map((mot) => (
        <span key={mot} className="flex items-center">
          <span className="px-6 font-display text-sm font-bold uppercase tracking-[0.18em] text-white sm:text-base">
            {mot}
          </span>
          <span aria-hidden className="text-white/50">
            ✦
          </span>
        </span>
      ))}
    </div>
  );
}

export function VitrineBande() {
  return (
    <section aria-hidden className="relative -my-2 overflow-hidden">
      <div className="-rotate-1 scale-[1.02] bg-gradient-to-r from-primary-700 via-primary to-primary-500 py-3.5 shadow-lg shadow-primary/20">
        <div className="animate-marquee flex w-max">
          <Sequence />
          <Sequence />
          <Sequence />
          <Sequence />
        </div>
      </div>
    </section>
  );
}
