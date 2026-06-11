"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Info,
  UserPlus,
  Users,
  Search,
  Sparkles,
} from "lucide-react";
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
import { createEleve, updateEleve } from "@/lib/actions/eleves";
import type { EleveListItem } from "@/lib/queries/eleves";

const BaseSchema = z.object({
  etablissement_id: z.string().uuid("Établissement requis"),
  matricule: z.string().optional().or(z.literal("")),
  nom: z.string().min(1, "Nom requis"),
  prenom: z.string().min(1, "Prénom requis"),
  date_naissance: z.string().optional().or(z.literal("")),
  lieu_naissance: z.string().optional().or(z.literal("")),
  sexe: z.enum(["m", "f", "autre"]).nullable().optional(),
  nationalite: z.string().optional().or(z.literal("")),
  adresse: z.string().optional().or(z.literal("")),
  tel_urgence: z.string().optional().or(z.literal("")),
  personne_urgence: z.string().optional().or(z.literal("")),
  infos_medicales: z.string().optional().or(z.literal("")),
  infos_allergies: z.string().optional().or(z.literal("")),
  annee_scolaire_id: z.string().optional().or(z.literal("")),
  classe_id: z.string().optional().or(z.literal("")),
});

const CreateSchema = BaseSchema.extend({
  parent_mode: z.enum(["existing", "new"]),
  parent_utilisateur_id: z.string().optional().or(z.literal("")),
  parent_nom: z.string().optional().or(z.literal("")),
  parent_prenom: z.string().optional().or(z.literal("")),
  parent_email: z.string().email("Email invalide").optional().or(z.literal("")),
  parent_telephone: z.string().optional().or(z.literal("")),
  parent_pseudo_custom: z.string().optional().or(z.literal("")),
}).refine(
  (data) => data.parent_mode === "new" || !!data.parent_utilisateur_id,
  {
    message: "Sélectionnez un parent existant",
    path: ["parent_utilisateur_id"],
  }
);
type CreateFormValues = z.infer<typeof CreateSchema>;

const UpdateSchema = BaseSchema.extend({
  parent_utilisateur_id: z.string().uuid("Parent requis"),
});
type UpdateFormValues = z.infer<typeof UpdateSchema>;

type Parent = {
  utilisateur_id: string;
  pseudo: string;
  nom: string | null;
  prenom: string | null;
  nb_enfants: number;
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eleve?: EleveListItem;
  etablissements: { id: string; nom: string }[];
  classes: Classe[];
  annees: { id: string; libelle: string; active: boolean }[];
  parents: Parent[];
  onCredentialsGenerated?: (data: { pseudo: string; password: string; eleveName: string }) => void;
};

export function EleveDialog({
  open,
  onOpenChange,
  eleve,
  etablissements,
  classes,
  annees,
  parents,
  onCredentialsGenerated,
}: Props) {
  const isEdit = !!eleve;
  const activeAnnee = annees.find((a) => a.active);
  const [submitting, setSubmitting] = React.useState(false);
  const [parentSearch, setParentSearch] = React.useState("");

  type FormValues = CreateFormValues & UpdateFormValues;

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver((isEdit ? UpdateSchema : CreateSchema) as any),
    defaultValues: {
      etablissement_id: etablissements[0]?.id ?? "",
      matricule: "",
      nom: "",
      prenom: "",
      date_naissance: "",
      lieu_naissance: "",
      sexe: null,
      nationalite: "",
      adresse: "",
      tel_urgence: "",
      personne_urgence: "",
      infos_medicales: "",
      infos_allergies: "",
      annee_scolaire_id: activeAnnee?.id ?? "",
      classe_id: "",
      parent_mode: "new",
      parent_utilisateur_id: "",
      parent_nom: "",
      parent_prenom: "",
      parent_email: "",
      parent_telephone: "",
      parent_pseudo_custom: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      if (eleve) {
        form.reset({
          etablissement_id: eleve.etablissement_id,
          matricule: eleve.matricule,
          nom: eleve.nom,
          prenom: eleve.prenom,
          date_naissance: eleve.date_naissance ?? "",
          lieu_naissance: eleve.lieu_naissance ?? "",
          sexe: (eleve.sexe as "m" | "f" | "autre" | null) ?? null,
          nationalite: eleve.nationalite ?? "",
          adresse: eleve.adresse ?? "",
          tel_urgence: eleve.tel_urgence ?? "",
          personne_urgence: eleve.personne_urgence ?? "",
          infos_medicales: eleve.infos_medicales ?? "",
          infos_allergies: eleve.infos_allergies ?? "",
          annee_scolaire_id: activeAnnee?.id ?? "",
          classe_id: eleve.classe_id ?? "",
          parent_mode: "existing",
          parent_utilisateur_id: eleve.parent?.utilisateur_id ?? "",
          parent_nom: "",
          parent_prenom: "",
          parent_email: "",
          parent_telephone: "",
          parent_pseudo_custom: "",
        });
      } else {
        form.reset({
          etablissement_id: etablissements[0]?.id ?? "",
          matricule: "",
          nom: "",
          prenom: "",
          date_naissance: "",
          lieu_naissance: "",
          sexe: null,
          nationalite: "",
          adresse: "",
          tel_urgence: "",
          personne_urgence: "",
          infos_medicales: "",
          infos_allergies: "",
          annee_scolaire_id: activeAnnee?.id ?? "",
          classe_id: "",
          parent_mode: parents.length > 0 ? "existing" : "new",
          parent_utilisateur_id: "",
          parent_nom: "",
          parent_prenom: "",
          parent_email: "",
          parent_telephone: "",
          parent_pseudo_custom: "",
        });
      }
      setParentSearch("");
    }
  }, [open, eleve, etablissements, activeAnnee, parents, form]);

  const etablissementId = form.watch("etablissement_id");
  const anneeId = form.watch("annee_scolaire_id");
  const parentMode = form.watch("parent_mode");
  const parentId = form.watch("parent_utilisateur_id");

  const availableClasses = classes.filter(
    (c) => c.etablissement_id === etablissementId && c.annee_scolaire_id === anneeId
  );

  const filteredParents = parents.filter((p) => {
    const s = parentSearch.toLowerCase().trim();
    if (!s) return true;
    return (
      p.pseudo.toLowerCase().includes(s) ||
      (p.nom ?? "").toLowerCase().includes(s) ||
      (p.prenom ?? "").toLowerCase().includes(s)
    );
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const res = isEdit
      ? await updateEleve(eleve!.id, values)
      : await createEleve(values);
    setSubmitting(false);
    if (res.ok) {
      if (!isEdit && res.pseudo && res.password && onCredentialsGenerated) {
        onCredentialsGenerated({
          pseudo: res.pseudo,
          password: res.password,
          eleveName: `${values.prenom} ${values.nom}`,
        });
      } else {
        toast.success(isEdit ? "Élève mis à jour" : "Élève inscrit");
      }
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'élève" : "Inscrire un élève"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mettre à jour les informations, le parent lié et l'inscription de l'année en cours."
              : "Si le parent n'existe pas encore, un compte sera créé automatiquement avec un pseudo mnémonique."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit as (values: FormValues) => Promise<void>)}
          className="space-y-5 mt-2"
        >
          {/* Identité */}
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/50 pb-1">
              Identité
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input id="prenom" {...form.register("prenom")} />
                {form.formState.errors.prenom && (
                  <p className="text-[11px] text-danger">{form.formState.errors.prenom.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom *</Label>
                <Input id="nom" {...form.register("nom")} />
                {form.formState.errors.nom && (
                  <p className="text-[11px] text-danger">{form.formState.errors.nom.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date_naissance">Né(e) le</Label>
                <Input id="date_naissance" type="date" {...form.register("date_naissance")} />
              </div>
              <div className="space-y-1.5">
                <Label>Sexe</Label>
                <Select
                  value={form.watch("sexe") ?? "none"}
                  onValueChange={(v) =>
                    form.setValue("sexe", v === "none" ? null : (v as "m" | "f" | "autre"))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="f">Féminin</SelectItem>
                    <SelectItem value="m">Masculin</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="matricule">Matricule</Label>
                <Input
                  id="matricule"
                  placeholder="Auto si vide"
                  className="font-mono"
                  {...form.register("matricule")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="lieu_naissance">Lieu de naissance</Label>
                <Input id="lieu_naissance" {...form.register("lieu_naissance")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nationalite">Nationalité</Label>
                <Input id="nationalite" {...form.register("nationalite")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adresse">Adresse</Label>
              <Textarea id="adresse" rows={2} {...form.register("adresse")} />
            </div>
          </section>

          {/* Inscription */}
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/50 pb-1">
              Inscription
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Établissement *</Label>
                <Select
                  value={etablissementId}
                  onValueChange={(v) => form.setValue("etablissement_id", v, { shouldValidate: true })}
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
              <div className="space-y-1.5">
                <Label>Année scolaire</Label>
                <Select
                  value={anneeId ?? ""}
                  onValueChange={(v) => form.setValue("annee_scolaire_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="(Aucune inscription)" />
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
            </div>
            <div className="space-y-1.5">
              <Label>Classe</Label>
              <Select
                value={form.watch("classe_id") ?? ""}
                onValueChange={(v) => form.setValue("classe_id", v)}
                disabled={!etablissementId || !anneeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="(Pas de classe)" />
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
              {!anneeId && (
                <p className="text-[10px] text-muted-foreground flex items-start gap-1">
                  <Info className="size-3 mt-0.5 shrink-0" />
                  Choisissez une année puis une classe pour inscrire l&apos;élève.
                </p>
              )}
            </div>
          </section>

          {/* Parent */}
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/50 pb-1">
              {isEdit ? "Parent rattaché" : "Clé parentale"}
            </h4>

            {!isEdit && (
              <div className="flex items-center gap-1 p-1 rounded-lg bg-card border border-border w-fit">
                {(["existing", "new"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => form.setValue("parent_mode", m)}
                    className={cn(
                      "relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                      parentMode === m
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m === "existing" ? <Users className="size-3.5" /> : <UserPlus className="size-3.5" />}
                    {m === "existing" ? "Parent existant" : "Nouveau parent"}
                  </button>
                ))}
              </div>
            )}

            {(isEdit || parentMode === "existing") && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={parentSearch}
                    onChange={(e) => setParentSearch(e.target.value)}
                    placeholder="Rechercher par pseudo ou nom…"
                    className="pl-10"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/40">
                  {filteredParents.length === 0 ? (
                    <div className="p-4 text-xs text-center text-muted-foreground">
                      Aucun parent. Créez-en un d&apos;abord depuis /admin/parents.
                    </div>
                  ) : (
                    filteredParents.map((p) => {
                      const selected = p.utilisateur_id === parentId;
                      return (
                        <button
                          type="button"
                          key={p.utilisateur_id}
                          onClick={() =>
                            form.setValue("parent_utilisateur_id", p.utilisateur_id, {
                              shouldValidate: true,
                            })
                          }
                          className={cn(
                            "w-full text-left px-3 py-2 flex items-center gap-3 text-sm transition-colors",
                            selected
                              ? "bg-primary/10"
                              : "hover:bg-muted/40"
                          )}
                        >
                          <div
                            className={cn(
                              "size-4 rounded-full border flex items-center justify-center shrink-0",
                              selected ? "bg-primary border-primary" : "border-border"
                            )}
                          >
                            {selected && <div className="size-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <code className="font-mono text-xs font-semibold truncate block">
                              {p.pseudo}
                            </code>
                            {(p.prenom || p.nom) && (
                              <span className="text-[11px] text-muted-foreground truncate block">
                                {p.prenom} {p.nom}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {p.nb_enfants} enfant{p.nb_enfants > 1 ? "s" : ""}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                {form.formState.errors.parent_utilisateur_id && (
                  <p className="text-[11px] text-danger">
                    {form.formState.errors.parent_utilisateur_id.message}
                  </p>
                )}
              </>
            )}

            {!isEdit && parentMode === "new" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Prénom parent</Label>
                    <Input placeholder="(optionnel)" {...form.register("parent_prenom")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nom parent</Label>
                    <Input
                      placeholder="(si vide, le nom de l'élève est utilisé)"
                      {...form.register("parent_nom")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" placeholder="(optionnel)" {...form.register("parent_email")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Téléphone</Label>
                    <Input placeholder="(optionnel)" {...form.register("parent_telephone")} />
                  </div>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="size-3.5 text-primary" />
                    <Label className="text-primary">Pseudo personnalisé (optionnel)</Label>
                  </div>
                  <Input
                    placeholder="DOVI-MP-26 (sinon généré auto)"
                    className="font-mono uppercase"
                    {...form.register("parent_pseudo_custom")}
                  />
                </div>
              </>
            )}
          </section>

          {/* Contact urgence & médical */}
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/50 pb-1">
              Contact d&apos;urgence & médical
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Personne à contacter</Label>
                <Input placeholder="Tante Marie" {...form.register("personne_urgence")} />
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone d&apos;urgence</Label>
                <Input placeholder="+241 ..." {...form.register("tel_urgence")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Infos médicales</Label>
                <Textarea rows={2} placeholder="Traitement, etc." {...form.register("infos_medicales")} />
              </div>
              <div className="space-y-1.5">
                <Label>Allergies</Label>
                <Textarea rows={2} placeholder="Arachides, lactose…" {...form.register("infos_allergies")} />
              </div>
            </div>
          </section>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Inscrire l'élève"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
