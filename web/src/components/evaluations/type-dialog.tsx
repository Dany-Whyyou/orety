"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Palette } from "lucide-react";
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
import { createTypeEvaluation, updateTypeEvaluation } from "@/lib/actions/evaluations";
import type { TypeEvaluationItem } from "@/lib/queries/evaluations";

const Schema = z.object({
  etablissement_id: z.string().uuid("Établissement requis"),
  code: z.string().min(1, "Code requis"),
  libelle: z.string().min(1, "Libellé requis"),
  poids_defaut: z.number().min(0).max(20),
  couleur: z.string().optional().or(z.literal("")),
  ordre: z.number().int().min(0),
});
type FormValues = z.infer<typeof Schema>;

const PRESET_COLORS = ["#1F7A3A", "#2563EB", "#F59E0B", "#EF4444", "#8B5CF6", "#0EA5E9", "#EC4899"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: TypeEvaluationItem;
  etablissements: { id: string; nom: string }[];
  defaultEtablissementId?: string;
};

export function TypeEvaluationDialog({
  open,
  onOpenChange,
  type,
  etablissements,
  defaultEtablissementId,
}: Props) {
  const isEdit = !!type;
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      etablissement_id: defaultEtablissementId ?? etablissements[0]?.id ?? "",
      code: "",
      libelle: "",
      poids_defaut: 1,
      couleur: "",
      ordre: 0,
    },
  });

  React.useEffect(() => {
    if (open) {
      if (type) {
        form.reset({
          etablissement_id: type.etablissement_id,
          code: type.code,
          libelle: type.libelle,
          poids_defaut: type.poids_defaut,
          couleur: type.couleur ?? "",
          ordre: type.ordre,
        });
      } else {
        form.reset({
          etablissement_id: defaultEtablissementId ?? etablissements[0]?.id ?? "",
          code: "",
          libelle: "",
          poids_defaut: 1,
          couleur: "",
          ordre: 0,
        });
      }
    }
  }, [open, type, etablissements, defaultEtablissementId, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const res = isEdit
      ? await updateTypeEvaluation(type!.id, values)
      : await createTypeEvaluation(values);
    setSubmitting(false);
    if (res.ok) {
      toast.success(isEdit ? "Type mis à jour" : "Type créé");
      onOpenChange(false);
    } else toast.error(res.error);
  }

  const couleur = form.watch("couleur");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le type" : "Nouveau type d'évaluation"}
          </DialogTitle>
          <DialogDescription>
            Ex : Interrogation (poids 1), Devoir surveillé (poids 2), Composition (poids 3).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Établissement *</Label>
            <Select
              value={form.watch("etablissement_id")}
              onValueChange={(v) => form.setValue("etablissement_id", v, { shouldValidate: true })}
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue />
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

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="libelle">Libellé *</Label>
              <Input id="libelle" placeholder="Devoir surveillé" {...form.register("libelle")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Code *</Label>
              <Input id="code" placeholder="DEVOIR" className="font-mono uppercase" {...form.register("code")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Poids par défaut</Label>
              <Input
                type="number"
                min={0}
                max={20}
                step={0.5}
                {...form.register("poids_defaut", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ordre</Label>
              <Input type="number" min={0} {...form.register("ordre", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Couleur</Label>
              <div className="relative">
                <Palette className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input placeholder="#1F7A3A" className="pl-8 font-mono text-xs" {...form.register("couleur")} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {couleur && (
              <div
                className="size-10 rounded-lg border border-border shrink-0"
                style={{ backgroundColor: couleur }}
              />
            )}
            <div className="flex gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => form.setValue("couleur", c, { shouldValidate: true })}
                  className="size-6 rounded-md border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
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
