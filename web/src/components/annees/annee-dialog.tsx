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
import { Switch } from "@/components/ui/switch";
import { createAnnee, updateAnnee } from "@/lib/actions/annees";
import type { AnneeListItem } from "@/lib/queries/annees";

const Schema = z.object({
  libelle: z.string().min(4, "Libellé trop court (ex: 2026-2027)"),
  date_debut: z.string().min(10, "Date requise"),
  date_fin: z.string().min(10, "Date requise"),
  active: z.boolean().optional(),
});
type FormValues = z.infer<typeof Schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  annee?: AnneeListItem;
};

export function AnneeDialog({ open, onOpenChange, annee }: Props) {
  const isEdit = !!annee;
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      libelle: "",
      date_debut: "",
      date_fin: "",
      active: false,
    },
  });

  React.useEffect(() => {
    if (open) {
      if (annee) {
        form.reset({
          libelle: annee.libelle,
          date_debut: annee.date_debut,
          date_fin: annee.date_fin,
          active: annee.active,
        });
      } else {
        const thisYear = new Date().getFullYear();
        form.reset({
          libelle: `${thisYear}-${thisYear + 1}`,
          date_debut: `${thisYear}-09-01`,
          date_fin: `${thisYear + 1}-07-15`,
          active: false,
        });
      }
    }
  }, [open, annee, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const res = isEdit ? await updateAnnee(annee!.id, values) : await createAnnee(values);
    setSubmitting(false);
    if (res.ok) {
      toast.success(isEdit ? "Année mise à jour" : "Année créée");
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'année scolaire" : "Nouvelle année scolaire"}
          </DialogTitle>
          <DialogDescription>
            Après création, configurez la fréquence de bulletin par établissement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="libelle">Libellé *</Label>
            <Input
              id="libelle"
              placeholder="2026-2027"
              className="font-mono"
              {...form.register("libelle")}
            />
            {form.formState.errors.libelle && (
              <p className="text-[11px] text-danger">{form.formState.errors.libelle.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date_debut">Date de début *</Label>
              <Input
                id="date_debut"
                type="date"
                {...form.register("date_debut")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date_fin">Date de fin *</Label>
              <Input
                id="date_fin"
                type="date"
                {...form.register("date_fin")}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-4 py-3">
            <Switch
              id="active"
              checked={form.watch("active")}
              onCheckedChange={(v) => form.setValue("active", v)}
            />
            <Label htmlFor="active" className="normal-case text-sm font-medium text-foreground">
              Année active
            </Label>
            <span className="ml-auto text-[10px] text-muted-foreground">
              Rendra les autres inactives
            </span>
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
