"use client";

import * as React from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  X,
  Upload,
  Heart,
  Shield,
  Frown,
  AlertTriangle,
  BookOpen,
  MessageSquare,
  Bell,
  BellOff,
  Search,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";
import {
  createIncident,
  updateIncident,
  uploadIncidentPhoto,
} from "@/lib/actions/incidents";
import type { IncidentItem } from "@/lib/queries/incidents";

const Schema = z.object({
  eleve_id: z.string().uuid("Sélectionnez un élève"),
  type: z.enum(["sante", "comportement", "securite", "materiel", "academique", "autre"]),
  gravite: z.enum(["info", "mineur", "moyen", "grave"]),
  statut: z.enum(["signale", "en_cours", "traite", "clos"]),
  titre: z.string().min(2, "Titre requis"),
  description: z.string().min(1, "Description requise"),
  date_incident: z.string().min(10),
  lieu: z.string().optional().or(z.literal("")),
  photos: z.array(z.string().url()).default([]),
  action_prise: z.string().optional().or(z.literal("")),
  notifie_parent: z.boolean(),
});
type FormValues = z.infer<typeof Schema>;

const TYPES: { value: FormValues["type"]; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: "sante", label: "Santé", icon: Heart, color: "text-rose-500" },
  { value: "comportement", label: "Comportement", icon: Frown, color: "text-amber-500" },
  { value: "securite", label: "Sécurité", icon: Shield, color: "text-red-500" },
  { value: "materiel", label: "Matériel", icon: AlertTriangle, color: "text-orange-500" },
  { value: "academique", label: "Académique", icon: BookOpen, color: "text-blue-500" },
  { value: "autre", label: "Autre", icon: MessageSquare, color: "text-slate-500" },
];

const GRAVITES: { value: FormValues["gravite"]; label: string; className: string }[] = [
  { value: "info", label: "Info", className: "bg-accent/10 text-accent border-accent/30" },
  { value: "mineur", label: "Mineur", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  { value: "moyen", label: "Moyen", className: "bg-warning/10 text-warning border-warning/30" },
  { value: "grave", label: "Grave", className: "bg-danger/10 text-danger border-danger/30" },
];

type Eleve = {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  etablissement_nom: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident?: IncidentItem;
  eleves: Eleve[];
  defaultEleveId?: string;
};

export function IncidentDialog({ open, onOpenChange, incident, eleves, defaultEleveId }: Props) {
  const isEdit = !!incident;
  const [submitting, setSubmitting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [eleveSearch, setEleveSearch] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      eleve_id: defaultEleveId ?? "",
      type: "autre",
      gravite: "mineur",
      statut: "signale",
      titre: "",
      description: "",
      date_incident: new Date().toISOString().slice(0, 16),
      lieu: "",
      photos: [],
      action_prise: "",
      notifie_parent: true,
    },
  });

  React.useEffect(() => {
    if (open) {
      if (incident) {
        form.reset({
          eleve_id: incident.eleve_id,
          type: incident.type,
          gravite: incident.gravite,
          statut: incident.statut,
          titre: incident.titre,
          description: incident.description,
          date_incident: new Date(incident.date_incident).toISOString().slice(0, 16),
          lieu: incident.lieu ?? "",
          photos: incident.photos,
          action_prise: incident.action_prise ?? "",
          notifie_parent: incident.notifie_parent,
        });
      } else {
        form.reset({
          eleve_id: defaultEleveId ?? "",
          type: "autre",
          gravite: "mineur",
          statut: "signale",
          titre: "",
          description: "",
          date_incident: new Date().toISOString().slice(0, 16),
          lieu: "",
          photos: [],
          action_prise: "",
          notifie_parent: true,
        });
      }
      setEleveSearch("");
    }
  }, [open, incident, defaultEleveId, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const res = isEdit
      ? await updateIncident(incident!.id, values)
      : await createIncident(values);
    setSubmitting(false);
    if (res.ok) {
      toast.success(
        isEdit
          ? "Incident mis à jour"
          : values.notifie_parent
          ? "Incident signalé · parent notifié"
          : "Incident signalé"
      );
      onOpenChange(false);
    } else toast.error(res.error);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadIncidentPhoto(fd);
      if (res.ok) newUrls.push(res.url);
      else toast.error(`${file.name} : ${res.error}`);
    }
    form.setValue("photos", [...(form.watch("photos") ?? []), ...newUrls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(url: string) {
    form.setValue(
      "photos",
      (form.watch("photos") ?? []).filter((u) => u !== url)
    );
  }

  const selectedEleveId = form.watch("eleve_id");
  const selectedEleve = eleves.find((e) => e.id === selectedEleveId);
  const filteredEleves = eleves
    .filter((e) => {
      const s = eleveSearch.toLowerCase().trim();
      if (!s) return true;
      return (
        e.nom.toLowerCase().includes(s) ||
        e.prenom.toLowerCase().includes(s) ||
        e.matricule.toLowerCase().includes(s)
      );
    })
    .slice(0, 8);

  const currentType = form.watch("type");
  const currentGravite = form.watch("gravite");
  const notifie = form.watch("notifie_parent");
  const photos = form.watch("photos") ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le signalement" : "Nouveau signalement d'incident"}
          </DialogTitle>
          <DialogDescription>
            Signalez un incident concernant un élève (santé, comportement, sécurité, matériel…).
            Les parents peuvent être notifiés automatiquement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Élève picker */}
          <div className="space-y-1.5">
            <Label>Élève *</Label>
            {selectedEleve ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-[10px]">
                      {initials(selectedEleve.nom, selectedEleve.prenom)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedEleve.prenom} {selectedEleve.nom}
                    </p>
                    <p className="text-[11px] font-mono text-muted-foreground truncate">
                      {selectedEleve.matricule} · {selectedEleve.etablissement_nom}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => form.setValue("eleve_id", "")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Changer
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un élève…"
                    className="pl-10"
                    value={eleveSearch}
                    onChange={(e) => setEleveSearch(e.target.value)}
                  />
                </div>
                <div className="rounded-lg border border-border max-h-48 overflow-y-auto divide-y divide-border/40">
                  {filteredEleves.length === 0 ? (
                    <div className="p-3 text-xs text-center text-muted-foreground">
                      Aucun élève trouvé.
                    </div>
                  ) : (
                    filteredEleves.map((e) => (
                      <button
                        type="button"
                        key={e.id}
                        onClick={() => form.setValue("eleve_id", e.id, { shouldValidate: true })}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/40 text-left text-sm"
                      >
                        <Avatar className="size-7 shrink-0">
                          <AvatarFallback className="text-[10px]">
                            {initials(e.nom, e.prenom)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {e.prenom} {e.nom}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground truncate">
                            {e.matricule} · {e.etablissement_nom}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {form.formState.errors.eleve_id && (
                  <p className="text-[11px] text-danger">
                    {form.formState.errors.eleve_id.message}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type *</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const active = currentType === t.value;
                return (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => form.setValue("type", t.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-[11px] transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <Icon className={cn("size-4", !active && t.color)} />
                    <span className="font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gravite */}
          <div className="space-y-1.5">
            <Label>Gravité *</Label>
            <div className="grid grid-cols-4 gap-2">
              {GRAVITES.map((g) => {
                const active = currentGravite === g.value;
                return (
                  <button
                    type="button"
                    key={g.value}
                    onClick={() => form.setValue("gravite", g.value)}
                    className={cn(
                      "px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                      active ? g.className : "border-border text-muted-foreground hover:border-foreground/30"
                    )}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              placeholder="Chute à la récréation / Bagarre avec un camarade…"
              {...form.register("titre")}
            />
            {form.formState.errors.titre && (
              <p className="text-[11px] text-danger">{form.formState.errors.titre.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date_incident">Date & heure *</Label>
              <Input
                id="date_incident"
                type="datetime-local"
                {...form.register("date_incident")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lieu">Lieu</Label>
              <Input id="lieu" placeholder="Cour de récréation, salle B12…" {...form.register("lieu")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description détaillée *</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Décrivez précisément ce qui s'est passé…"
              {...form.register("description")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="action_prise">Action prise</Label>
            <Textarea
              id="action_prise"
              rows={2}
              placeholder="Premier soin, isolement, avertissement, …"
              {...form.register("action_prise")}
            />
          </div>

          {isEdit && (
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["signale", "en_cours", "traite", "clos"] as const).map((s) => {
                  const active = form.watch("statut") === s;
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => form.setValue("statut", s)}
                      className={cn(
                        "px-3 py-2 rounded-lg border text-xs font-medium transition-all capitalize",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-foreground/30"
                      )}
                    >
                      {s.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Photos */}
          <div className="space-y-1.5">
            <Label>Photos (optionnel)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {photos.map((url) => (
                <div
                  key={url}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute top-1 right-1 size-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              <label
                className={cn(
                  "aspect-square rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer text-muted-foreground text-[10px] transition-colors",
                  uploading && "pointer-events-none opacity-60"
                )}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="size-4 mb-1" />
                    <span>Ajouter</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <p className="text-[10px] text-muted-foreground">
              JPG / PNG / WEBP / HEIC · max 10 Mo chacune
            </p>
          </div>

          {/* Notif parent */}
          <button
            type="button"
            onClick={() => form.setValue("notifie_parent", !notifie)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all",
              notifie
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-card/40"
            )}
          >
            <div
              className={cn(
                "size-10 rounded-lg flex items-center justify-center",
                notifie ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              )}
            >
              {notifie ? <Bell className="size-4" /> : <BellOff className="size-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {notifie ? "Notifier les parents" : "Ne pas notifier (interne)"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {notifie
                  ? "Le parent recevra une notification push dans l'app mobile."
                  : "Signalement interne uniquement, visible par le staff."}
              </p>
            </div>
          </button>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting || uploading}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Signaler l'incident"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
