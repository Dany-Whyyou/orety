import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { BulletinDetail } from "@/lib/queries/bulletins";
import type { BulletinBranding } from "@/components/bulletins/bulletin-detail";

const VERT: [number, number, number] = [27, 122, 67];
const VERT_FONCE: [number, number, number] = [16, 74, 41];
const GRIS: [number, number, number] = [100, 116, 139];

function hexToRgb(hex: string | null | undefined): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function assombrir([r, g, b]: [number, number, number]): [number, number, number] {
  return [Math.round(r * 0.6), Math.round(g * 0.6), Math.round(b * 0.6)];
}

function mention(m: number | null): string {
  if (m === null) return "—";
  if (m >= 16) return "Très bien";
  if (m >= 14) return "Bien";
  if (m >= 12) return "Assez bien";
  if (m >= 10) return "Passable";
  return "Insuffisant";
}

/** Génère le PDF A4 du bulletin et le retourne en base64 (sans préfixe data:). */
export function genererBulletinPdf(
  bulletin: BulletinDetail,
  branding: BulletinBranding & { couleur_primaire?: string | null }
): {
  base64: string;
  filename: string;
} {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largeur = doc.internal.pageSize.getWidth();
  const couleur = hexToRgb(branding.couleur_primaire) ?? VERT;
  const couleurFoncee = hexToRgb(branding.couleur_primaire) ? assombrir(couleur) : VERT_FONCE;

  // ─── En-tête ───
  doc.setFillColor(...couleurFoncee);
  doc.rect(0, 0, largeur, 34, "F");
  doc.setFillColor(...couleur);
  doc.rect(0, 30, largeur, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(branding.nom.toUpperCase(), 14, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${branding.devise} — ${branding.adresse}`, 14, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const titre = bulletin.est_annuel
    ? "BULLETIN ANNUEL"
    : `BULLETIN — ${(bulletin.periode_libelle ?? "").toUpperCase()}`;
  doc.text(titre, largeur - 14, 12, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Année scolaire ${bulletin.annee_libelle}`, largeur - 14, 18, { align: "right" });

  // ─── Élève ───
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${bulletin.eleve_prenom} ${bulletin.eleve_nom}`, 14, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  doc.text(
    `Matricule : ${bulletin.matricule}   ·   Classe : ${bulletin.classe_nom} (${bulletin.niveau_libelle})   ·   Effectif : ${bulletin.effectif_classe ?? "—"}`,
    14,
    50
  );

  // ─── Tableau des matières ───
  autoTable(doc, {
    startY: 56,
    head: [["Matière", "Coef", "Moy. classe", "Moyenne /20", "Appréciation", "Professeur"]],
    body: bulletin.matieres.map((m) => [
      m.matiere_nom,
      String(m.coefficient),
      m.moyenne_classe !== null ? m.moyenne_classe.toFixed(2) : "—",
      m.moyenne !== null ? m.moyenne.toFixed(2) : "—",
      m.appreciation ?? "",
      m.prof_nom ? `${m.prof_prenom ? m.prof_prenom[0] + ". " : ""}${m.prof_nom}` : "—",
    ]),
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [30, 41, 59] },
    headStyles: { fillColor: couleur, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [244, 250, 246] },
    columnStyles: {
      1: { halign: "center", cellWidth: 14 },
      2: { halign: "center", cellWidth: 22 },
      3: { halign: "center", cellWidth: 24, fontStyle: "bold" },
    },
  });

  let y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ─── Synthèse ───
  doc.setFillColor(244, 250, 246);
  doc.roundedRect(14, y, largeur - 28, 18, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...couleurFoncee);
  doc.text(
    `Moyenne générale : ${bulletin.moyenne_generale !== null ? bulletin.moyenne_generale.toFixed(2) + " / 20" : "—"}`,
    18,
    y + 7
  );
  doc.text(
    `Rang : ${bulletin.rang ?? "—"}${bulletin.effectif_classe ? ` / ${bulletin.effectif_classe}` : ""}`,
    largeur / 2,
    y + 7
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Mention : ${mention(bulletin.moyenne_generale)}`, 18, y + 13.5);
  if (bulletin.moyenne_classe !== null) {
    doc.text(`Moyenne de la classe : ${bulletin.moyenne_classe.toFixed(2)}`, largeur / 2, y + 13.5);
  }
  y += 26;

  // ─── Appréciation & décision ───
  doc.setTextColor(30, 41, 59);
  if (bulletin.appreciation_generale) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Appréciation générale", 14, y);
    doc.setFont("helvetica", "italic");
    const lignes = doc.splitTextToSize(bulletin.appreciation_generale, largeur - 28);
    doc.text(lignes, 14, y + 5);
    y += 5 + lignes.length * 4.5 + 5;
  }
  if (bulletin.decision_conseil) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...couleurFoncee);
    doc.text(`Décision du conseil : ${bulletin.decision_conseil}`, 14, y);
    y += 8;
  }

  // ─── Signature ───
  const bas = doc.internal.pageSize.getHeight() - 30;
  const ySign = Math.max(y + 6, bas - 8);
  doc.setTextColor(...GRIS);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Édité le ${new Date(bulletin.cree_le).toLocaleDateString("fr-FR")}`, 14, ySign + 10);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(30, 41, 59);
  doc.text(`« ${branding.devise} »`, largeur - 14, ySign, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRIS);
  doc.text("Signature du chef d'établissement", largeur - 14, ySign + 5, { align: "right" });
  doc.setDrawColor(180, 190, 200);
  doc.line(largeur - 74, ySign + 16, largeur - 14, ySign + 16);

  const base64 = doc.output("datauristring").split(",")[1];
  const filename = `bulletin-${bulletin.matricule}-${(bulletin.periode_libelle ?? "annuel")
    .toLowerCase()
    .replace(/\s+/g, "-")}.pdf`;
  return { base64, filename };
}
