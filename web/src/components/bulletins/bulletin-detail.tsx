"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Printer,
  Eye,
  EyeOff,
  Award,
  TrendingUp,
  Users,
  Edit3,
  Save,
  Loader2,
  FileDown,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  togglePublieBulletin,
  updateBulletinAppreciation,
  updateBulletinMatiere,
  enregistrerBulletinPdf,
} from "@/lib/actions/bulletins";
import type { BulletinDetail } from "@/lib/queries/bulletins";

type Props = {
  bulletin: BulletinDetail;
};

function gradeColor(m: number | null): string {
  if (m === null) return "text-muted-foreground";
  if (m >= 16) return "text-emerald-600";
  if (m >= 10) return "text-foreground";
  return "text-danger";
}

function gradeLetter(m: number | null): string {
  if (m === null) return "—";
  if (m >= 16) return "Bien";
  if (m >= 14) return "Assez bien";
  if (m >= 12) return "Passable";
  if (m >= 10) return "Admis";
  return "Insuffisant";
}

export function BulletinDetailView({ bulletin }: Props) {
  const [editMode, setEditMode] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [appreciation, setAppreciation] = React.useState(bulletin.appreciation_generale ?? "");
  const [decision, setDecision] = React.useState(bulletin.decision_conseil ?? "");
  const [matAppreciations, setMatAppreciations] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(bulletin.matieres.map((m) => [m.id, m.appreciation ?? ""]))
  );

  async function onSave() {
    setSaving(true);
    const res = await updateBulletinAppreciation(bulletin.id, {
      moyenne_generale: bulletin.moyenne_generale,
      rang: bulletin.rang,
      effectif_classe: bulletin.effectif_classe,
      appreciation_generale: appreciation,
      decision_conseil: decision,
    });
    // Save each matière appreciation
    await Promise.all(
      bulletin.matieres.map((m) =>
        updateBulletinMatiere(m.id, {
          moyenne: m.moyenne,
          rang: m.rang,
          appreciation: matAppreciations[m.id] ?? null,
        })
      )
    );
    setSaving(false);
    if (res.ok) {
      toast.success("Appréciations enregistrées");
      setEditMode(false);
    } else toast.error(res.error);
  }

  async function onTogglePublie() {
    const res = await togglePublieBulletin(bulletin.id, !bulletin.publie);
    if (res.ok) toast.success(bulletin.publie ? "Dépublié" : "Publié aux parents");
    else toast.error(res.error);
  }

  function onPrint() {
    window.print();
  }

  const [pdfBusy, setPdfBusy] = React.useState(false);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(bulletin.pdf_url);

  async function onGenererPdf() {
    setPdfBusy(true);
    try {
      const { genererBulletinPdf } = await import("@/lib/bulletin/pdf");
      const { base64, filename } = genererBulletinPdf(bulletin);
      const res = await enregistrerBulletinPdf(bulletin.id, base64, filename);
      if (res.ok && res.url) {
        setPdfUrl(res.url);
        toast.success("PDF généré et archivé");
        window.open(res.url, "_blank", "noopener");
      } else if (!res.ok) {
        toast.error(res.error);
      }
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toolbar (hidden when printing) */}
      <div className="print:hidden flex items-center justify-between gap-3 mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/bulletins">
            <ArrowLeft /> Retour
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button variant="ghost" onClick={() => setEditMode(false)}>
                Annuler
              </Button>
              <Button variant="gradient" onClick={onSave} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save />}
                Enregistrer
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={onTogglePublie}>
                {bulletin.publie ? <EyeOff /> : <Eye />}
                {bulletin.publie ? "Dépublier" : "Publier aux parents"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                <Edit3 /> Modifier les appréciations
              </Button>
              <Button variant="outline" size="sm" onClick={onPrint}>
                <Printer /> Imprimer
              </Button>
              {pdfUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <FileText /> Voir le PDF
                  </a>
                </Button>
              )}
              <Button variant="gradient" size="sm" onClick={onGenererPdf} disabled={pdfBusy}>
                {pdfBusy ? <Loader2 className="size-4 animate-spin" /> : <FileDown />}
                {pdfUrl ? "Regénérer le PDF" : "Générer le PDF"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Bulletin printable */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-white print:border-none print:rounded-none print:shadow-none shadow-sm print:bg-white"
      >
        {/* Header with branding */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-500 to-accent text-white p-8 print:bg-primary print:text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20 dot-pattern"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold opacity-80">
                Complexe Scolaire Orety
              </p>
              <h1 className="font-display text-2xl md:text-3xl font-bold mt-1">
                {bulletin.est_annuel ? "Bulletin annuel" : `Bulletin · ${bulletin.periode_libelle}`}
              </h1>
              <p className="text-sm opacity-90 mt-1">Année scolaire {bulletin.annee_libelle}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide opacity-70">Port-Gentil · Gabon</p>
              <p className="text-[10px] opacity-70 mt-0.5">BP 2110</p>
            </div>
          </div>
        </div>

        {/* Élève info + moyenne générale */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border">
          <div className="md:col-span-2 p-6 border-r border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Élève
            </p>
            <h2 className="font-display text-2xl font-bold">
              {bulletin.eleve_prenom} {bulletin.eleve_nom}
            </h2>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-mono">{bulletin.matricule}</span>
              <span>·</span>
              <span className="font-medium">{bulletin.classe_nom}</span>
              <span>·</span>
              <span>{bulletin.niveau_libelle}</span>
            </div>
          </div>
          <div className="p-6 bg-primary/[0.03] flex flex-col justify-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Moyenne générale
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={cn(
                  "font-display text-5xl font-bold",
                  gradeColor(bulletin.moyenne_generale)
                )}
              >
                {bulletin.moyenne_generale !== null ? bulletin.moyenne_generale.toFixed(2) : "—"}
              </span>
              <span className="text-sm text-muted-foreground">/20</span>
            </div>
            <div className="mt-2 flex items-center gap-3 flex-wrap text-[11px]">
              {bulletin.rang !== null && (
                <span className="inline-flex items-center gap-1">
                  <Award className="size-3 text-amber-500" />
                  Rang <strong>{bulletin.rang}</strong>
                  {bulletin.effectif_classe && ` / ${bulletin.effectif_classe}`}
                </span>
              )}
              {bulletin.moyenne_classe !== null && (
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3 text-muted-foreground" />
                  Moy. classe <strong>{bulletin.moyenne_classe.toFixed(2)}</strong>
                </span>
              )}
              {bulletin.moyenne_generale !== null && (
                <Badge variant="outline" className="text-[10px]">
                  {gradeLetter(bulletin.moyenne_generale)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Matières table */}
        <div className="p-6">
          <h3 className="font-display font-semibold text-sm mb-3">Résultats par matière</h3>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2">
                    Matière
                  </th>
                  <th className="text-right font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2 w-16">
                    Coef.
                  </th>
                  <th className="text-right font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2 w-20">
                    Moy. /20
                  </th>
                  <th className="text-right font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2 w-20">
                    Rang
                  </th>
                  <th className="text-right font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2 w-20">
                    Moy. classe
                  </th>
                  <th className="text-left font-medium text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-2">
                    Appréciation
                  </th>
                </tr>
              </thead>
              <tbody>
                {bulletin.matieres.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2.5">
                      <div>
                        <p className="font-medium text-sm">{m.matiere_nom}</p>
                        {m.prof_nom && (
                          <p className="text-[10px] text-muted-foreground">
                            {m.prof_prenom} {m.prof_nom}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm">{m.coefficient}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={cn("font-mono font-semibold text-sm", gradeColor(m.moyenne))}
                      >
                        {m.moyenne !== null ? m.moyenne.toFixed(2) : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm text-muted-foreground">
                      {m.rang !== null ? m.rang : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm text-muted-foreground font-mono">
                      {m.moyenne_classe !== null ? m.moyenne_classe.toFixed(2) : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {editMode ? (
                        <Textarea
                          rows={1}
                          value={matAppreciations[m.id] ?? ""}
                          onChange={(e) =>
                            setMatAppreciations((prev) => ({ ...prev, [m.id]: e.target.value }))
                          }
                          placeholder="Appréciation…"
                          className="min-h-[36px] text-xs"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          {m.appreciation ?? "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {bulletin.matieres.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-sm text-muted-foreground"
                    >
                      Aucune matière enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
              {bulletin.matieres.length > 0 && (
                <tfoot className="bg-muted/20 border-t-2 border-border">
                  <tr>
                    <td className="px-3 py-2.5 font-semibold text-sm" colSpan={2}>
                      Moyenne générale
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={cn(
                          "font-mono font-bold text-base",
                          gradeColor(bulletin.moyenne_generale)
                        )}
                      >
                        {bulletin.moyenne_generale !== null
                          ? bulletin.moyenne_generale.toFixed(2)
                          : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm text-muted-foreground">
                      {bulletin.rang ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm text-muted-foreground font-mono">
                      {bulletin.moyenne_classe?.toFixed(2) ?? "—"}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Appreciation générale & décision */}
        <div className="px-6 pb-6 space-y-4">
          <div>
            {editMode ? (
              <>
                <Label className="mb-2 block">Appréciation générale</Label>
                <Textarea
                  rows={3}
                  value={appreciation}
                  onChange={(e) => setAppreciation(e.target.value)}
                  placeholder="Observations du conseil de classe…"
                />
              </>
            ) : bulletin.appreciation_generale ? (
              <div className="rounded-lg border border-border bg-muted/10 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Appréciation générale
                </p>
                <p className="text-sm italic">{bulletin.appreciation_generale}</p>
              </div>
            ) : null}
          </div>

          <div>
            {editMode ? (
              <>
                <Label className="mb-2 block">Décision du conseil</Label>
                <Textarea
                  rows={2}
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  placeholder="Ex: Félicitations, Tableau d'honneur, Avertissement…"
                />
              </>
            ) : bulletin.decision_conseil ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1.5 flex items-center gap-1">
                  <TrendingUp className="size-3" />
                  Décision du conseil
                </p>
                <p className="text-sm font-medium">{bulletin.decision_conseil}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] text-muted-foreground">
          <div>
            <p>Édité le {new Date(bulletin.cree_le).toLocaleDateString("fr-FR")}</p>
            {bulletin.publie && bulletin.publie_le && (
              <p>Publié le {new Date(bulletin.publie_le).toLocaleDateString("fr-FR")}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold text-foreground italic">
              &laquo; Persévérance — Excellence &raquo;
            </p>
            <p className="mt-1">Signature du chef d&apos;établissement</p>
            <div className="mt-8 w-40 h-px bg-border ml-auto"></div>
          </div>
        </div>
      </motion.div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          aside,
          header,
          nav,
          footer {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
