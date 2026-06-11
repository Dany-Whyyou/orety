"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEvaluation, updateEvaluation } from "@/lib/actions/evaluations";
import type { EvaluationItem } from "@/lib/queries/evaluations";

const Schema = z.object({
  affectation_id: z.string().uuid("Affectation requise"),
  type_evaluation_id: z.string().uuid("Type requis"),
  periode_id: z.string().uuid("Période requise"),
  titre: z.string().min(1, "Titre requis"),
  description: z.string().optional().or(z.literal("")),
  date_evaluation: z.string().min(10, "Date requise"),
  bareme: z.number().min(1).max(100),
  poids: z.number().min(0).max(20),
  autorise_bonus: z.boolean(),
  bonus_max: z
    .union([z.number(), z.string()])
    .transform((v) => (v === "" || v === null ? null : Number(v)))
    .nullable(),
});
type FormValues = z.infer<typeof Schema>;

type Type = {
  id: string;
  libelle: string;
  code: string;
  poids_defaut: number;
  couleur: string | null;
  etablissement_id: string;
};

type Affectation = {
  id: string;
  utilisateur_id: string;
  classe_id: string;
  matiere_id: string | null;
  annee_scolaire_id: string;
  classe_nom: string;
  niveau_libelle: string;
  etablissement_id: string;
  matiere_nom: string | null;
  matiere_code: string | null;
  matiere_couleur: string | null;
  prof_pseudo: string;
  prof_nom: string | null;
  prof_prenom: string | null;
  annee_libelle: string;
  annee_active: boolean;
};

type Periode = {
  id: string;
  libelle: string;
  numero: number;
  date_debut: string;
  date_fin: string;
  etablissement_id: string;
  annee_scolaire_id: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation?: EvaluationItem;
  types: Type[];
  affectations: Affectation[];
  periodes: Periode[];
};

export function EvaluationDialog({
  open,
  onOpenChange,
  evaluation,
  types,
  affectations,
  periodes,
}: Props) {
  const isEdit = !!evaluation;
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      affectation_id: "",
      type_evaluation_id: "",
      periode_id: "",
      titre: "",
      description: "",
      date_evaluation: new Date().toISOString().slice(0, 10),
      bareme: 20,
      poids: 1,
      autorise_bonus: false,
      bonus_max: null,
    },
  });

  React.useEffect(() => {
    if (open) {
      if (evaluation) {
        form.reset({
          affectation_id: evaluation.affectation_id,
          type_evaluation_id: evaluation.type_id,
          periode_id: evaluation.periode_id,
          titre: evaluation.titre,
          description: evaluation.description ?? "",
          date_evaluation: evaluation.date_evaluation,
          bareme: evaluation.bareme,
          poids: evaluation.poids,
          autorise_bonus: evaluation.autorise_bonus,
          bonus_max: evaluation.bonus_max,
        });
      } else {
        form.reset({
          affectation_id: "",
          type_evaluation_id: "",
          periode_id: "",
          titre: "",
          description: "",
          date_evaluation: new Date().toISOString().slice(0, 10),
          bareme: 20,
          poids: 1,
          autorise_bonus: false,
          bonus_max: null,
        });
      }
    }
  }, [open, evaluation, form]);

  const affectationId = form.watch("affectation_id");
  const selectedAff = affectations.find((a) => a.id === affectationId);

  // Filter types and periodes to the same établissement + année
  const availableTypes = types.filter((t) =>
    selectedAff ? t.etablissement_id === selectedAff.etablissement_id : true
  );
  const availablePeriodes = selectedAff
    ? periodes
        .filter(
          (p) =>
            p.etablissement_id === selectedAff.etablissement_id &&
            p.annee_scolaire_id === selectedAff.annee_scolaire_id
        )
        .sort((a, b) => a.numero - b.numero)
    : [];

  // Auto-fill poids quand on change le type
  function onTypeChange(id: string) {
    form.setValue("type_evaluation_id", id, { shouldValidate: true });
    const t = types.find((x) => x.id === id);
    if (t && !isEdit) form.setValue("poids", t.poids_defaut);
  }

  const autoriseBonus = form.watch("autorise_bonus");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const res = isEdit
      ? await updateEvaluation(evaluation!.id, values)
      : await createEvaluation(values);
    setSubmitting(false);
    if (res.ok) {
      toast.success(isEdit ? "Évaluation mise à jour" : "Évaluation créée");
      onOpenChange(false);
    } else toast.error(res.error);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'évaluation" : "Nouvelle évaluation"}</DialogTitle>
          <DialogDescription>
            Une évaluation appartient à une affectation (prof × classe × matière) et à une
            période.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Affectation *</Label>
            <Select
              value={affectationId}
              onValueChange={(v) => form.setValue("affectation_id", v, { shouldValidate: true })}
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner prof × classe × matière" />
              </SelectTrigger>
              <SelectContent>
                {affectations.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    Aucune affectation. Créez-en d&apos;abord.
                  </div>
                ) : (
                  affectations.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.classe_nom} · {a.matiere_code ? `${a.matiere_code} (${a.matiere_nom})` : "Titulaire"}{" "}
                      · {a.prof_prenom} {a.prof_nom} · {a.annee_libelle}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select
                value={form.watch("type_evaluation_id")}
                onValueChange={onTypeChange}
                disabled={!affectationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: t.couleur ?? "hsl(var(--primary))" }}
                        />
                        {t.libelle} (poids {t.poids_defaut})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Période *</Label>
              <Select
                value={form.watch("periode_id")}
                onValueChange={(v) => form.setValue("periode_id", v, { shouldValidate: true })}
                disabled={!affectationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriodes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="titre">Titre *</Label>
            <Input id="titre" placeholder="Contrôle sur les nombres entiers" {...form.register("titre")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} placeholder="Optionnel" {...form.register("description")} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" {...form.register("date_evaluation")} />
            </div>
            <div className="space-y-1.5">
              <Label>Barème *</Label>
              <Input
                type="number"
                min={1}
                max={100}
                placeholder="20"
                {...form.register("bareme", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Poids</Label>
              <Input
                type="number"
                min={0}
                max={20}
                step={0.5}
                {...form.register("poids", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-4 py-3">
            <div>
              <Label className="normal-case text-sm font-medium text-foreground">
                Autoriser les points bonus
              </Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Le prof peut ajouter des points bonus lors de la saisie.
              </p>
            </div>
            <Switch
              checked={autoriseBonus}
              onCheckedChange={(v) => form.setValue("autorise_bonus", v)}
            />
          </div>

          {autoriseBonus && (
            <div className="space-y-1.5">
              <Label>Bonus maximum (optionnel)</Label>
              <Input
                type="number"
                min={0}
                max={50}
                step={0.5}
                placeholder="Sans limite si vide"
                {...form.register("bonus_max")}
              />
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer l'évaluation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
