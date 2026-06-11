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
import { createMatiere, updateMatiere } from "@/lib/actions/matieres";
import type { MatiereItem } from "@/lib/queries/matieres";

const Schema = z.object({
  etablissement_id: z.string().uuid("Établissement requis"),
  code: z.string().min(1, "Code requis").max(20),
  nom: z.string().min(1, "Nom requis").max(80),
  couleur: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$|^$/, "Format hexa (#RRGGBB)")
    .optional()
    .or(z.literal("")),
  ordre: z.number().int().min(0),
});
type FormValues = z.infer<typeof Schema>;

const PRESET_COLORS = ["#1F7A3A", "#2563EB", "#F59E0B", "#EF4444", "#8B5CF6", "#0EA5E9", "#EC4899"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matiere?: MatiereItem;
  etablissements: { id: string; nom: string }[];
  defaultEtablissementId?: string;
};

export function MatiereDialog({
  open,
  onOpenChange,
  matiere,
  etablissements,
  defaultEtablissementId,
}: Props) {
  const isEdit = !!matiere;
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      etablissement_id: defaultEtablissementId ?? etablissements[0]?.id ?? "",
      code: "",
      nom: "",
      couleur: "",
      ordre: 0,
    },
  });

  React.useEffect(() => {
    if (open) {
      if (matiere) {
        form.reset({
          etablissement_id: matiere.etablissement_id,
          code: matiere.code,
          nom: matiere.nom,
          couleur: matiere.couleur ?? "",
          ordre: matiere.ordre,
        });
      } else {
        form.reset({
          etablissement_id: defaultEtablissementId ?? etablissements[0]?.id ?? "",
          code: "",
          nom: "",
          couleur: "",
          ordre: 0,
        });
      }
    }
  }, [open, matiere, etablissements, defaultEtablissementId, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const res = isEdit ? await updateMatiere(matiere!.id, values) : await createMatiere(values);
    setSubmitting(false);
    if (res.ok) {
      toast.success(isEdit ? "Matière mise à jour" : "Matière créée");
      onOpenChange(false);
    } else toast.error(res.error);
  }

  const currentColor = form.watch("couleur");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la matière" : "Nouvelle matière"}</DialogTitle>
          <DialogDescription>
            Ex : Mathématiques (MATH), Français (FR), Histoire-Géo (HG).
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
              <Label htmlFor="nom">Nom *</Label>
              <Input id="nom" placeholder="Mathématiques" {...form.register("nom")} />
              {form.formState.errors.nom && (
                <p className="text-[11px] text-danger">{form.formState.errors.nom.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Code *</Label>
              <Input id="code" placeholder="MATH" className="font-mono uppercase" {...form.register("code")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Couleur</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Palette className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="#1F7A3A"
                  className="pl-9 font-mono text-xs"
                  {...form.register("couleur")}
                />
              </div>
              {currentColor && (
                <div
                  className="size-10 rounded-lg border border-border shrink-0"
                  style={{ backgroundColor: currentColor }}
                />
              )}
            </div>
            <div className="flex gap-1.5 mt-2">
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

          <div className="space-y-1.5">
            <Label htmlFor="ordre">Ordre d&apos;affichage</Label>
            <Input
              id="ordre"
              type="number"
              min={0}
              {...form.register("ordre", { valueAsNumber: true })}
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
