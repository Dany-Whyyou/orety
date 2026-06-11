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
import { setCoefficient } from "@/lib/actions/matieres";
import type { MatiereItem } from "@/lib/queries/matieres";

const cycleLabels: Record<string, string> = {
  prescolaire: "Préprimaire",
  primaire: "Primaire",
  college: "Collège",
  lycee: "Lycée",
};

type Niveau = { id: string; libelle: string; cycle: string; ordre: number };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matiere: MatiereItem | null;
  niveaux: Niveau[];
};

export function CoefficientsDialog({ open, onOpenChange, matiere, niveaux }: Props) {
  const [values, setValues] = React.useState<Record<string, number>>({});
  const [saving, setSaving] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (matiere) {
      const map: Record<string, number> = {};
      matiere.coefficients.forEach((c) => (map[c.niveau_id] = c.coefficient));
      setValues(map);
    }
  }, [matiere]);

  async function saveCoef(niveauId: string, value: number) {
    if (!matiere) return;
    setSaving(niveauId);
    const res = await setCoefficient({
      matiere_id: matiere.id,
      niveau_id: niveauId,
      coefficient: value,
    });
    setSaving(null);
    if (res.ok) {
      setValues((v) => ({ ...v, [niveauId]: value }));
      if (value === 0) toast.success("Coefficient retiré");
    } else toast.error(res.error);
  }

  // Group niveaux by cycle
  const byCycle = React.useMemo(() => {
    const g: Record<string, Niveau[]> = {};
    [...niveaux].sort((a, b) => a.ordre - b.ordre).forEach((n) => {
      if (!g[n.cycle]) g[n.cycle] = [];
      g[n.cycle].push(n);
    });
    return g;
  }, [niveaux]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Coefficients · {matiere?.nom ?? ""}
            {matiere?.code && (
              <span className="ml-2 text-sm font-mono text-muted-foreground">{matiere.code}</span>
            )}
          </DialogTitle>
          <DialogDescription>
            Définissez le coefficient de cette matière pour chaque niveau. 0 = pas enseignée dans ce niveau.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 flex items-start gap-2 text-xs text-muted-foreground mb-2">
          <Info className="size-3.5 text-primary mt-0.5 shrink-0" />
          <span>
            Le coefficient multiplie les notes lors du calcul des moyennes. Ex : maths coef 4 en
            terminale, coef 2 en 6ème. Modifications sauvegardées automatiquement au blur.
          </span>
        </div>

        <div className="space-y-4 mt-2">
          {niveaux.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun niveau défini pour cet établissement. Créez d&apos;abord des niveaux.
            </p>
          ) : (
            Object.entries(byCycle).map(([cycle, list]) => (
              <div key={cycle}>
                <h4 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  <Calculator className="size-3.5" />
                  {cycleLabels[cycle] ?? cycle}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {list.map((n) => {
                    const val = values[n.id] ?? 0;
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded-lg border border-border/60 bg-background/40 px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-xs font-semibold">{n.libelle}</span>
                          {saving === n.id && (
                            <Loader2 className="size-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={20}
                          step={0.5}
                          defaultValue={val || ""}
                          placeholder="0"
                          className="h-8 text-center font-mono text-sm"
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value) || 0;
                            if (v !== val) saveCoef(n.id, v);
                          }}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="pt-3">
          <Button type="button" variant="default" onClick={() => onOpenChange(false)}>
            Terminer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
