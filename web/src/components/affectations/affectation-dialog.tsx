"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Info } from "lucide-react";
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
import { createAffectation, updateAffectation } from "@/lib/actions/affectations";
import type { AffectationItem } from "@/lib/queries/affectations";

const Schema = z.object({
  utilisateur_id: z.string().uuid("Prof requis"),
  classe_id: z.string().uuid("Classe requise"),
  annee_scolaire_id: z.string().uuid(),
  matiere_id: z.string().optional().or(z.literal("")).nullable(),
  heures_semaine: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" || v === null ? null : Number(v)))
    .nullable(),
});
type FormValues = z.infer<typeof Schema>;

type Prof = {
  id: string;
  pseudo: string;
  nom: string | null;
  prenom: string | null;
  matiere_ids: string[];
  etablissement_ids: string[];
};
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
type Matiere = { id: string; nom: string; code: string; couleur: string | null; etablissement_id: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affectation?: AffectationItem;
  profs: Prof[];
  classes: Classe[];
  matieres: Matiere[];
  annees: { id: string; libelle: string; active: boolean }[];
  defaults?: { utilisateur_id?: string; classe_id?: string };
};

export function AffectationDialog({
  open,
  onOpenChange,
  affectation,
  profs,
  classes,
  matieres,
  annees,
  defaults,
}: Props) {
  const isEdit = !!affectation;
  const [submitting, setSubmitting] = React.useState(false);
  const activeAnnee = annees.find((a) => a.active);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      utilisateur_id: "",
      classe_id: "",
      annee_scolaire_id: activeAnnee?.id ?? annees[0]?.id ?? "",
      matiere_id: null,
      heures_semaine: null,
    },
  });

  React.useEffect(() => {
    if (open) {
      if (affectation) {
        form.reset({
          utilisateur_id: affectation.utilisateur_id,
          classe_id: affectation.classe_id,
          annee_scolaire_id: affectation.annee_scolaire_id,
          matiere_id: affectation.matiere_id,
          heures_semaine: affectation.heures_semaine,
        });
      } else {
        form.reset({
          utilisateur_id: defaults?.utilisateur_id ?? "",
          classe_id: defaults?.classe_id ?? "",
          annee_scolaire_id: activeAnnee?.id ?? annees[0]?.id ?? "",
          matiere_id: null,
          heures_semaine: null,
        });
      }
    }
  }, [open, affectation, defaults, activeAnnee, annees, form]);

  const anneeId = form.watch("annee_scolaire_id");
  const profId = form.watch("utilisateur_id");
  const classeId = form.watch("classe_id");

  const selectedClasse = classes.find((c) => c.id === classeId);
  const selectedProf = profs.find((p) => p.id === profId);
  const isPrimaire = selectedClasse?.cycle === "primaire" || selectedClasse?.cycle === "prescolaire";

  // Classes pour l'année et éventuellement filtrées sur les sites du prof
  const availableClasses = classes
    .filter((c) => c.annee_scolaire_id === anneeId)
    .filter((c) =>
      selectedProf ? selectedProf.etablissement_ids.includes(c.etablissement_id) : true
    );

  // Matieres enseignables par le prof et du site de la classe
  const availableMatieres = matieres
    .filter((m) => !selectedClasse || m.etablissement_id === selectedClasse.etablissement_id)
    .filter((m) => !selectedProf || selectedProf.matiere_ids.includes(m.id));

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const payload = {
      ...values,
      matiere_id: values.matiere_id || null,
      heures_semaine: values.heures_semaine,
    };
    const res = isEdit
      ? await updateAffectation(affectation!.id, payload)
      : await createAffectation(payload);
    setSubmitting(false);
    if (res.ok) {
      toast.success(isEdit ? "Affectation mise à jour" : "Affectation créée");
      onOpenChange(false);
    } else toast.error(res.error);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'affectation" : "Nouvelle affectation"}</DialogTitle>
          <DialogDescription>
            Au primaire : laisser la matière vide = titulaire (toutes matières).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Année scolaire *</Label>
            <Select
              value={form.watch("annee_scolaire_id")}
              onValueChange={(v) => form.setValue("annee_scolaire_id", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {annees.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.libelle} {a.active && "(active)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Professeur *</Label>
              <Select
                value={profId}
                onValueChange={(v) => form.setValue("utilisateur_id", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {profs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.prenom} {p.nom} · {p.pseudo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Classe *</Label>
              <Select
                value={classeId}
                onValueChange={(v) => form.setValue("classe_id", v, { shouldValidate: true })}
                disabled={!anneeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      Aucune classe disponible
                    </div>
                  ) : (
                    availableClasses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nom} · {c.niveau_libelle}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Matière {isPrimaire ? "(vide = titulaire)" : "*"}
            </Label>
            <Select
              value={form.watch("matiere_id") ?? "none"}
              onValueChange={(v) => form.setValue("matiere_id", v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une matière" />
              </SelectTrigger>
              <SelectContent>
                {isPrimaire && (
                  <SelectItem value="none">— Aucune (titulaire) —</SelectItem>
                )}
                {availableMatieres.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    Aucune matière disponible (vérifiez les matières enseignables du prof)
                  </div>
                ) : (
                  availableMatieres.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.code} — {m.nom}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!isPrimaire && selectedProf && selectedProf.matiere_ids.length === 0 && (
              <p className="text-[11px] text-warning flex items-start gap-1">
                <Info className="size-3 mt-0.5 shrink-0" />
                Ce prof n&apos;a aucune matière enseignable définie. Modifiez son profil d&apos;abord.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="heures_semaine">Heures / semaine</Label>
            <Input
              id="heures_semaine"
              type="number"
              min={0}
              max={50}
              step={0.5}
              placeholder="Ex: 4.5"
              {...form.register("heures_semaine")}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
