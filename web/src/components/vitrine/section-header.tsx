import { Reveal } from "./motion";
import { cn } from "@/lib/utils";

type Props = {
  kicker: string;
  titre: string;
  description?: string;
  align?: "center" | "left";
};

export function SectionHeader({ kicker, titre, description, align = "center" }: Props) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left"
      )}
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700">
        <span aria-hidden className="size-1.5 rounded-full bg-primary" />
        {kicker}
      </span>
      <h2 className="mt-5 text-balance font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.75rem]">
        {titre}
      </h2>
      {description && (
        <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </Reveal>
  );
}
