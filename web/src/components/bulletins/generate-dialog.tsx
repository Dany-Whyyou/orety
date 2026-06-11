"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { generateBulletinsClasse } from "@/lib/actions/bulletins";

type Classe = {
  id: string;
  nom: string;
  niveau_libelle: string;
  cycle: string;
  etablissement_id: string;
  annee_scolaire_id: string;
  annee_libelle: string;
  annee_active: boolean;
};

type Periode = {
  id: string;
  libelle: string;
  numero: number;
  etablissement_id: string;
  annee_scolaire_id: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: Classe[];
  periodes: Periode[];
  annees: { id: string; libelle: string; active: boolean }[];
};

export function GenerateBulletinsDialog({ open, onOpenChange, classes, periodes, annees }: Props) {
  const activeAnnee = annees.find((a) => a.active);
  const [submitting, setSubmitting] = React.useState(false);
  const [classeId, setClasseId] = React.useState<string>("");
  const [mode, setMode] = React.useState<"periode" | "annuel">("periode");
  const [periodeId, setPeriodeId] = React.useState<string>("");

  React.useEffect(() => {
    if (open) {
      setClasseId("");
      setMode("periode");
      setPeriodeId("");
    }
  }, [open]);

  const selectedClasse = classes.find((c) => c.id === classeId);
  const availablePeriodes = selectedClasse
    ? periodes.filter(
        (p) =>
          p.etablissement_id === selectedClasse.etablissement_id &&
          p.annee_scolaire_id === selectedClasse.annee_scolaire_id
      )
    : [];

  async function onSubmit() {
    if (!classeId) {
      toast.error("Sélectionnez une classe");
      return;
    }
    if (mode === "periode" && !periodeId) {
      toast.error("Sélectionnez une période");
      return;
    }
    setSubmitting(true);
    const res = await generateBulletinsClasse({
      classe_id: classeId,
      periode_id: mode === "periode" ? periodeId : null,
      est_annuel: mode === "annuel",
      etablissement_id: selectedClasse?.etablissement_id,
      annee_scolaire_id: selectedClasse?.annee_scolaire_id ?? activeAnnee?.id,
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success(`${res.generated} bulletin${(res.generated ?? 0) > 1 ? "s" : ""} générés`);
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="size-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
              <Zap className="size-4" />
            </span>
            Générer les bulletins
          </DialogTitle>
          <DialogDescription>
            Calcule les moyennes à partir des notes saisies. La régénération écrase les bulletins
            existants pour cette classe × période.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Classe *</Label>
            <Select value={classeId} onValueChange={setClasseId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une classe" />
              </SelectTrigger>
              <SelectContent>
                {classes.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    Aucune classe disponible.
                  </div>
                ) : (
                  classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom} · {c.niveau_libelle} · {c.annee_libelle}
                      {c.annee_active && " (active)"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Type de bulletin</Label>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-card border border-border w-fit">
              {(
                [
                  { k: "periode", l: "Par période" },
                  { k: "annuel", l: "Annuel" },
                ] as const
              ).map((m) => {
                const active = mode === m.k;
                return (
                  <button
                    key={m.k}
                    type="button"
                    onClick={() => setMode(m.k as typeof mode)}
                    className={cn(
                      "relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      active ? "text-white" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="gen-mode-pill"
                        className="absolute inset-0 rounded-md bg-gradient-to-r from-primary to-accent"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative">{m.l}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {mode === "periode" && (
            <div className="space-y-1.5">
              <Label>Période *</Label>
              <Select value={periodeId} onValueChange={setPeriodeId} disabled={!classeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriodes.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      Aucune période configurée pour cette classe.
                    </div>
                  ) : (
                    availablePeriodes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.libelle}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="rounded-lg bg-accent/5 border border-accent/20 px-3 py-2.5 flex items-start gap-2 text-xs text-muted-foreground">
            {mode === "annuel" ? (
              <>
                <Zap className="size-3.5 text-accent mt-0.5 shrink-0" />
                <span>
                  Le bulletin annuel utilise la <strong>formule configurée</strong> (ex:{" "}
                  <code className="text-accent">(P1 + P2×2 + P3×2) ÷ 5</code>) pour pondérer les
                  périodes.
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5 text-primary mt-0.5 shrink-0" />
                <span>
                  Formule : <code>(note + bonus) ÷ barème × 20</code>, pondérée par
                  <code> poids × coefficient matière</code>.
                </span>
              </>
            )}
          </div>

          <div className="rounded-lg bg-warning/5 border border-warning/20 px-3 py-2.5 flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="size-3.5 text-warning mt-0.5 shrink-0" />
            <span>
              Les bulletins existants pour cette classe × {mode === "annuel" ? "année" : "période"}{" "}
              seront remplacés. Les appréciations manuelles seront perdues.
            </span>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="gradient"
            disabled={submitting || !classeId || (mode === "periode" && !periodeId)}
            onClick={onSubmit}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            <Zap className={submitting ? "hidden" : ""} />
            {submitting ? "Génération…" : "Lancer la génération"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
