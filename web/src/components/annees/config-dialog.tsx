"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, Calculator, Info } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveConfigBulletin } from "@/lib/actions/annees";
import type { ConfigBulletinItem, FrequenceBulletin } from "@/lib/queries/annees";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anneeId: string;
  anneeLibelle: string;
  etablissements: { id: string; nom: string }[];
  config?: ConfigBulletinItem;
};

const DEFAULT_NB = { mensuel: 10, trimestriel: 3, semestriel: 2 };

export function ConfigDialog({
  open,
  onOpenChange,
  anneeId,
  anneeLibelle,
  etablissements,
  config,
}: Props) {
  const isEdit = !!config;
  const [submitting, setSubmitting] = React.useState(false);
  const [etablissementId, setEtablissementId] = React.useState<string>("");
  const [frequence, setFrequence] = React.useState<FrequenceBulletin>("trimestriel");
  const [nbPeriodes, setNbPeriodes] = React.useState<number>(3);
  const [poids, setPoids] = React.useState<number[]>([1, 2, 2]);
  const [diviseur, setDiviseur] = React.useState<number>(5);
  const [noteMax, setNoteMax] = React.useState<number>(20);
  const [notePassage, setNotePassage] = React.useState<number>(10);

  React.useEffect(() => {
    if (!open) return;
    if (config) {
      setEtablissementId(config.etablissement_id);
      setFrequence(config.frequence);
      setNbPeriodes(config.nb_periodes);
      setPoids(config.formule_annuelle_json?.poids ?? Array(config.nb_periodes).fill(1));
      setDiviseur(config.formule_annuelle_json?.diviseur ?? config.nb_periodes);
      setNoteMax(config.note_maximale);
      setNotePassage(config.note_passage);
    } else {
      setEtablissementId(etablissements[0]?.id ?? "");
      setFrequence("trimestriel");
      setNbPeriodes(3);
      setPoids([1, 2, 2]);
      setDiviseur(5);
      setNoteMax(20);
      setNotePassage(10);
    }
  }, [open, config, etablissements]);

  function onFrequenceChange(f: FrequenceBulletin) {
    setFrequence(f);
    const n = DEFAULT_NB[f];
    setNbPeriodes(n);
    const p = f === "trimestriel" ? [1, 2, 2] : Array(n).fill(1);
    setPoids(p);
    setDiviseur(p.reduce((a, b) => a + b, 0));
  }

  function onNbChange(n: number) {
    const clamped = Math.max(1, Math.min(12, n));
    setNbPeriodes(clamped);
    const newPoids = Array.from({ length: clamped }, (_, i) => poids[i] ?? 1);
    setPoids(newPoids);
    setDiviseur(newPoids.reduce((a, b) => a + b, 0));
  }

  function updatePoids(i: number, v: number) {
    const next = [...poids];
    next[i] = Math.max(0, v);
    setPoids(next);
    setDiviseur(next.reduce((a, b) => a + b, 0));
  }

  const formulaPreview =
    "(" +
    poids
      .map((p, i) => (p === 0 ? null : p === 1 ? `P${i + 1}` : `P${i + 1}×${p}`))
      .filter(Boolean)
      .join(" + ") +
    `) ÷ ${diviseur}`;

  async function onSubmit() {
    if (!etablissementId) {
      toast.error("Sélectionnez un établissement");
      return;
    }
    setSubmitting(true);
    const res = await saveConfigBulletin(anneeId, {
      etablissement_id: etablissementId,
      frequence,
      nb_periodes: nbPeriodes,
      poids,
      diviseur,
      note_maximale: noteMax,
      note_passage: notePassage,
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success(isEdit ? "Configuration mise à jour" : "Configuration créée");
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la configuration" : "Configurer le bulletin"} · {anneeLibelle}
          </DialogTitle>
          <DialogDescription>
            Fréquence et formule du bulletin annuel. Les périodes sont générées automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="space-y-1.5">
            <Label>Établissement *</Label>
            <Select
              value={etablissementId}
              onValueChange={setEtablissementId}
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un site" />
              </SelectTrigger>
              <SelectContent>
                {etablissements.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fréquence *</Label>
              <Select value={frequence} onValueChange={(v) => onFrequenceChange(v as FrequenceBulletin)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trimestriel">Trimestrielle</SelectItem>
                  <SelectItem value="semestriel">Semestrielle</SelectItem>
                  <SelectItem value="mensuel">Mensuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nombre de périodes</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={nbPeriodes}
                onChange={(e) => onNbChange(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="size-4 text-primary" />
              <h4 className="font-semibold text-sm">Formule du bulletin annuel</h4>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3 flex items-start gap-1.5">
              <Info className="size-3 mt-0.5 shrink-0" />
              Attribuez un poids à chaque période (0 pour l&apos;ignorer). Le diviseur est la somme des poids par défaut — ajustez si nécessaire.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
              {poids.map((p, i) => (
                <div key={i} className="space-y-1">
                  <Label className="text-[10px]">Poids P{i + 1}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={p}
                    onChange={(e) => updatePoids(i, parseFloat(e.target.value) || 0)}
                    className="text-center font-mono text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 space-y-1">
                <Label className="text-[10px]">Diviseur</Label>
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={diviseur}
                  onChange={(e) => setDiviseur(parseFloat(e.target.value) || 1)}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <motion.div
              key={formulaPreview}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
            >
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Aperçu
              </p>
              <code className="font-mono text-sm font-semibold text-primary">{formulaPreview}</code>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Note maximale</Label>
              <Input
                type="number"
                min={1}
                value={noteMax}
                onChange={(e) => setNoteMax(parseFloat(e.target.value) || 20)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Note de passage</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={notePassage}
                onChange={(e) => setNotePassage(parseFloat(e.target.value) || 10)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" variant="gradient" onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer la configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
