"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Building2, Printer } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  annees: { id: string; libelle: string; active: boolean; archivee: boolean }[];
  etablissements: { id: string; nom: string }[];
  currentAnneeId: string;
  currentEtabId: string | null;
};

export function RapportSelector({ annees, etablissements, currentAnneeId, currentEtabId }: Props) {
  const router = useRouter();
  const search = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(search.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/rapport-annuel?${params.toString()}`);
  }

  return (
    <div className="print:hidden flex flex-col sm:flex-row gap-2 mb-4">
      <div className="flex-1 flex items-center gap-2">
        <Calendar className="size-4 text-muted-foreground shrink-0" />
        <Select value={currentAnneeId} onValueChange={(v) => updateParam("annee", v)}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Année scolaire" />
          </SelectTrigger>
          <SelectContent>
            {annees.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.libelle}
                {a.active && " (active)"}
                {a.archivee && " · archivée"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 flex items-center gap-2">
        <Building2 className="size-4 text-muted-foreground shrink-0" />
        <Select
          value={currentEtabId ?? "all"}
          onValueChange={(v) => updateParam("etab", v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Tous les établissements" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les établissements</SelectItem>
            {etablissements.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-r from-primary via-primary-500 to-accent text-white font-semibold text-sm shadow-md hover:shadow-lg transition-shadow"
    >
      <Printer className="size-4" /> Imprimer / PDF
    </button>
  );
}
