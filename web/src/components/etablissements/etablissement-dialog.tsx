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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  createEtablissement,
  updateEtablissement,
} from "@/lib/actions/etablissements";
import type { EtablissementListItem, Cycle } from "@/lib/queries/etablissements";

const CYCLES: { value: Cycle; label: string }[] = [
  { value: "prescolaire", label: "Préprimaire" },
  { value: "primaire", label: "Primaire" },
  { value: "college", label: "Collège" },
  { value: "lycee", label: "Lycée" },
];

const FormSchema = z.object({
  nom: z.string().min(2, "Nom trop court"),
  cycle_principal: z.enum(["prescolaire", "primaire", "college", "lycee"]),
  cycles_couverts: z.array(z.enum(["prescolaire", "primaire", "college", "lycee"])).min(1, "Sélectionnez au moins un cycle"),
  adresse: z.string().optional().or(z.literal("")),
  telephone: z.string().optional().or(z.literal("")),
  email: z.string().optional().or(z.literal("")),
  slogan: z.string().optional().or(z.literal("")),
  couleur_primaire: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$|^$/, "Format hexa (ex: #1F7A3A)")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof FormSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etablissement?: EtablissementListItem;
};

export function EtablissementDialog({ open, onOpenChange, etablissement }: Props) {
  const isEdit = !!etablissement;
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      nom: "",
      cycle_principal: "primaire",
      cycles_couverts: ["primaire"],
      adresse: "",
      telephone: "",
      email: "",
      slogan: "",
      couleur_primaire: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      if (etablissement) {
        form.reset({
          nom: etablissement.nom,
          cycle_principal: etablissement.cycle_principal,
          cycles_couverts: etablissement.cycles_couverts,
          adresse: etablissement.adresse ?? "",
          telephone: etablissement.telephone ?? "",
          email: etablissement.email ?? "",
          slogan: etablissement.slogan ?? "",
          couleur_primaire: etablissement.couleur_primaire ?? "",
        });
      } else {
        form.reset({
          nom: "",
          cycle_principal: "primaire",
          cycles_couverts: ["primaire"],
          adresse: "",
          telephone: "",
          email: "",
          slogan: "",
          couleur_primaire: "",
        });
      }
    }
  }, [open, etablissement, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const action = isEdit
      ? updateEtablissement(etablissement!.id, values)
      : createEtablissement(values);
    const res = await action;
    setSubmitting(false);
    if (res.ok) {
      toast.success(isEdit ? "Établissement mis à jour" : "Établissement créé");
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
  }

  const cyclesCouverts = form.watch("cycles_couverts");
  const cyclePrincipal = form.watch("cycle_principal");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'établissement" : "Nouvel établissement"}
          </DialogTitle>
          <DialogDescription>
            Site rattaché à l&apos;organisation Orety.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom *</Label>
            <Input
              id="nom"
              placeholder="ex: Orety Collège et Lycée"
              {...form.register("nom")}
            />
            {form.formState.errors.nom && (
              <p className="text-[11px] text-danger">{form.formState.errors.nom.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cycle_principal">Cycle principal *</Label>
              <Select
                value={cyclePrincipal}
                onValueChange={(v) =>
                  form.setValue("cycle_principal", v as Cycle, { shouldValidate: true })
                }
              >
                <SelectTrigger id="cycle_principal">
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

            <div className="space-y-1.5">
              <Label>Couleur primaire</Label>
              <div className="relative">
                <Palette className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="#1F7A3A"
                  className="pl-9 font-mono text-xs"
                  {...form.register("couleur_primaire")}
                />
              </div>
              {form.formState.errors.couleur_primaire && (
                <p className="text-[11px] text-danger">
                  {form.formState.errors.couleur_primaire.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Cycles couverts *</Label>
            <div className="flex flex-wrap gap-2">
              {CYCLES.map((c) => {
                const selected = cyclesCouverts.includes(c.value);
                return (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => {
                      const next = selected
                        ? cyclesCouverts.filter((v) => v !== c.value)
                        : [...cyclesCouverts, c.value];
                      form.setValue("cycles_couverts", next, { shouldValidate: true });
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      selected
                        ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
            {form.formState.errors.cycles_couverts && (
              <p className="text-[11px] text-danger">
                {form.formState.errors.cycles_couverts.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slogan">Slogan</Label>
            <Input
              id="slogan"
              placeholder="Persévérance — Excellence"
              {...form.register("slogan")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                placeholder="+241 07 95 58 51"
                {...form.register("telephone")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@orety.ga"
                {...form.register("email")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adresse">Adresse</Label>
            <Textarea
              id="adresse"
              rows={2}
              placeholder="Port-Gentil, BP 2110, quartier Transfo…"
              {...form.register("adresse")}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
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
