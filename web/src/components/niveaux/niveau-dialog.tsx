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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createNiveau, updateNiveau } from "@/lib/actions/niveaux";
import type { NiveauItem } from "@/lib/queries/niveaux";

const CYCLES = [
  { value: "prescolaire", label: "Préprimaire" },
  { value: "primaire", label: "Primaire" },
  { value: "college", label: "Collège" },
  { value: "lycee", label: "Lycée" },
] as const;

const Schema = z.object({
  etablissement_id: z.string().uuid("Établissement requis"),
  code: z.string().min(1, "Code requis").max(20),
  libelle: z.string().min(1, "Libellé requis").max(80),
  cycle: z.enum(["prescolaire", "primaire", "college", "lycee"]),
  ordre: z.number().int().min(0),
});
type FormValues = z.infer<typeof Schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  niveau?: NiveauItem;
  etablissements: { id: string; nom: string }[];
  defaultEtablissementId?: string;
};

export function NiveauDialog({
  open,
  onOpenChange,
  niveau,
  etablissements,
  defaultEtablissementId,
}: Props) {
  const isEdit = !!niveau;
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      etablissement_id: defaultEtablissementId ?? etablissements[0]?.id ?? "",
      code: "",
      libelle: "",
      cycle: "primaire",
      ordre: 0,
    },
  });

  React.useEffect(() => {
    if (open) {
      if (niveau) {
        form.reset({
          etablissement_id: niveau.etablissement_id,
          code: niveau.code,
          libelle: niveau.libelle,
          cycle: niveau.cycle,
          ordre: niveau.ordre,
        });
      } else {
        form.reset({
          etablissement_id: defaultEtablissementId ?? etablissements[0]?.id ?? "",
          code: "",
          libelle: "",
          cycle: "primaire",
          ordre: 0,
        });
      }
    }
  }, [open, niveau, etablissements, defaultEtablissementId, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const res = isEdit ? await updateNiveau(niveau!.id, values) : await createNiveau(values);
    setSubmitting(false);
    if (res.ok) {
      toast.success(isEdit ? "Niveau mis à jour" : "Niveau créé");
      onOpenChange(false);
    } else toast.error(res.error);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le niveau" : "Nouveau niveau"}</DialogTitle>
          <DialogDescription>
            Ex : CP (primaire), 6ème (collège), Terminale (lycée).
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
                <SelectValue placeholder="Choisir un site" />
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

          <div className="space-y-1.5">
            <Label>Cycle *</Label>
            <Select
              value={form.watch("cycle")}
              onValueChange={(v) =>
                form.setValue("cycle", v as FormValues["cycle"], { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CYCLES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="CP"
                className="font-mono uppercase"
                {...form.register("code")}
              />
              {form.formState.errors.code && (
                <p className="text-[11px] text-danger">{form.formState.errors.code.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ordre">Ordre</Label>
              <Input
                id="ordre"
                type="number"
                min={0}
                {...form.register("ordre", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="libelle">Libellé *</Label>
            <Input
              id="libelle"
              placeholder="Cours préparatoire"
              {...form.register("libelle")}
            />
            {form.formState.errors.libelle && (
              <p className="text-[11px] text-danger">{form.formState.errors.libelle.message}</p>
            )}
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
