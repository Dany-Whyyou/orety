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
import { createClasse, updateClasse } from "@/lib/actions/classes";
import type { ClasseItem } from "@/lib/queries/classes";

const Schema = z.object({
  annee_scolaire_id: z.string().uuid("Année requise"),
  niveau_id: z.string().uuid("Niveau requis"),
  nom: z.string().min(1, "Nom requis"),
  code: z.string().optional().or(z.literal("")),
  salle: z.string().optional().or(z.literal("")),
  capacite_max: z
    .union([z.number(), z.string()])
    .transform((v) => (v === "" || v === null ? null : Number(v)))
    .nullable(),
  titulaire_utilisateur_id: z.string().optional().or(z.literal("")).nullable(),
});
type FormValues = z.infer<typeof Schema>;

type Niveau = { id: string; libelle: string; code: string; cycle: string };
type Annee = { id: string; libelle: string; active: boolean };
type Prof = { id: string; pseudo: string; nom: string | null; prenom: string | null };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classe?: ClasseItem;
  niveaux: Niveau[];
  annees: Annee[];
  profs: Prof[];
};

export function ClasseDialog({
  open,
  onOpenChange,
  classe,
  niveaux,
  annees,
  profs,
}: Props) {
  const isEdit = !!classe;
  const [submitting, setSubmitting] = React.useState(false);
  const activeAnnee = annees.find((a) => a.active);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      annee_scolaire_id: activeAnnee?.id ?? annees[0]?.id ?? "",
      niveau_id: "",
      nom: "",
      code: "",
      salle: "",
      capacite_max: null,
      titulaire_utilisateur_id: null,
    },
  });

  React.useEffect(() => {
    if (open) {
      if (classe) {
        form.reset({
          annee_scolaire_id: classe.annee_scolaire_id,
          niveau_id: classe.niveau_id,
          nom: classe.nom,
          code: classe.code ?? "",
          salle: classe.salle ?? "",
          capacite_max: classe.capacite_max,
          titulaire_utilisateur_id: classe.titulaire_utilisateur_id,
        });
      } else {
        form.reset({
          annee_scolaire_id: activeAnnee?.id ?? annees[0]?.id ?? "",
          niveau_id: "",
          nom: "",
          code: "",
          salle: "",
          capacite_max: null,
          titulaire_utilisateur_id: null,
        });
      }
    }
  }, [open, classe, activeAnnee, annees, form]);

  const niveauId = form.watch("niveau_id");
  const selectedNiveau = niveaux.find((n) => n.id === niveauId);
  const isPrimaire = selectedNiveau && (selectedNiveau.cycle === "primaire" || selectedNiveau.cycle === "prescolaire");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const payload = {
      ...values,
      titulaire_utilisateur_id: values.titulaire_utilisateur_id || null,
    };
    const res = isEdit ? await updateClasse(classe!.id, payload) : await createClasse(payload);
    setSubmitting(false);
    if (res.ok) {
      toast.success(isEdit ? "Classe mise à jour" : "Classe créée");
      onOpenChange(false);
    } else toast.error(res.error);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la classe" : "Nouvelle classe"}</DialogTitle>
          <DialogDescription>
            Les affectations matière × prof se gèrent dans l&apos;onglet Affectations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-1.5">
              <Label>Niveau *</Label>
              <Select
                value={form.watch("niveau_id")}
                onValueChange={(v) => form.setValue("niveau_id", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {niveaux.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nom">Nom *</Label>
              <Input id="nom" placeholder="6ème A" {...form.register("nom")} />
              {form.formState.errors.nom && (
                <p className="text-[11px] text-danger">{form.formState.errors.nom.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Code</Label>
              <Input id="code" placeholder="6A" className="font-mono" {...form.register("code")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="salle">Salle</Label>
              <Input id="salle" placeholder="Salle B12" {...form.register("salle")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacite_max">Capacité max</Label>
              <Input
                id="capacite_max"
                type="number"
                min={1}
                max={500}
                placeholder="30"
                {...form.register("capacite_max")}
              />
            </div>
          </div>

          {isPrimaire && (
            <div className="space-y-1.5">
              <Label>Titulaire (primaire)</Label>
              <Select
                value={form.watch("titulaire_utilisateur_id") ?? "none"}
                onValueChange={(v) =>
                  form.setValue("titulaire_utilisateur_id", v === "none" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucun titulaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun titulaire</SelectItem>
                  {profs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.prenom} {p.nom} · {p.pseudo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground flex items-start gap-1">
                <Info className="size-3 mt-0.5 shrink-0" />
                Au primaire, le titulaire enseigne toutes les matières par défaut.
              </p>
            </div>
          )}
        </form>

        <DialogFooter className="pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="gradient"
            disabled={submitting}
            onClick={form.handleSubmit(onSubmit)}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
