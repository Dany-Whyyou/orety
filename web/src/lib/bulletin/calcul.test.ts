import { describe, expect, it } from "vitest";
import {
  appreciationAuto,
  calculerRangs,
  moyenneAnnuelle,
  moyenneDeClasse,
  moyenneGenerale,
  moyenneMatiere,
} from "./calcul";

describe("moyenneMatiere", () => {
  it("normalise sur 20 quel que soit le barème", () => {
    // 8/10 → 16/20 ; 30/40 → 15/20 ; poids égaux → (16 + 15) / 2 = 15,5
    const { moyenne } = moyenneMatiere(
      [
        { id: "e1", bareme: 10, poids: 1 },
        { id: "e2", bareme: 40, poids: 1 },
      ],
      [
        { evaluation_id: "e1", note: 8, bonus: 0, absent: false },
        { evaluation_id: "e2", note: 30, bonus: 0, absent: false },
      ]
    );
    expect(moyenne).toBeCloseTo(15.5, 6);
  });

  it("pondère par le poids de l'évaluation", () => {
    // interro 10/20 (poids 1), composition 16/20 (poids 3) → (10 + 48) / 4 = 14,5
    const { moyenne } = moyenneMatiere(
      [
        { id: "interro", bareme: 20, poids: 1 },
        { id: "compo", bareme: 20, poids: 3 },
      ],
      [
        { evaluation_id: "interro", note: 10, bonus: 0, absent: false },
        { evaluation_id: "compo", note: 16, bonus: 0, absent: false },
      ]
    );
    expect(moyenne).toBeCloseTo(14.5, 6);
  });

  it("ajoute le bonus avant normalisation", () => {
    // (14 + 2) / 20 × 20 = 16
    const { moyenne } = moyenneMatiere(
      [{ id: "e1", bareme: 20, poids: 1 }],
      [{ evaluation_id: "e1", note: 14, bonus: 2, absent: false }]
    );
    expect(moyenne).toBe(16);
  });

  it("exclut les absences (elles ne valent pas zéro)", () => {
    const { moyenne, nbEvaluations } = moyenneMatiere(
      [
        { id: "e1", bareme: 20, poids: 1 },
        { id: "e2", bareme: 20, poids: 1 },
      ],
      [
        { evaluation_id: "e1", note: 15, bonus: 0, absent: false },
        { evaluation_id: "e2", note: null, bonus: 0, absent: true },
      ]
    );
    expect(moyenne).toBe(15); // et non 7,5
    expect(nbEvaluations).toBe(1);
  });

  it("renvoie null quand aucune note n'est saisie", () => {
    const { moyenne } = moyenneMatiere([{ id: "e1", bareme: 20, poids: 1 }], []);
    expect(moyenne).toBeNull();
  });

  it("ignore une évaluation au barème nul (pas de division par zéro)", () => {
    const { moyenne } = moyenneMatiere(
      [{ id: "e1", bareme: 0, poids: 1 }],
      [{ evaluation_id: "e1", note: 5, bonus: 0, absent: false }]
    );
    expect(moyenne).toBeNull();
  });

  it("respecte une note maximale différente de 20", () => {
    // école notant sur 10 : 15/20 → 7,5/10
    const { moyenne } = moyenneMatiere(
      [{ id: "e1", bareme: 20, poids: 1 }],
      [{ evaluation_id: "e1", note: 15, bonus: 0, absent: false }],
      10
    );
    expect(moyenne).toBe(7.5);
  });
});

describe("moyenneGenerale", () => {
  it("pondère les matières par leur coefficient", () => {
    // maths 16 (coef 4), sport 10 (coef 1) → (64 + 10) / 5 = 14,8
    expect(
      moyenneGenerale([
        { moyenne: 16, coefficient: 4 },
        { moyenne: 10, coefficient: 1 },
      ])
    ).toBeCloseTo(14.8, 6);
  });

  it("neutralise une matière au coefficient 0", () => {
    // la matière à coef 0 ne doit pas compter (bug historique : elle comptait pour 1)
    expect(
      moyenneGenerale([
        { moyenne: 16, coefficient: 2 },
        { moyenne: 4, coefficient: 0 },
      ])
    ).toBe(16);
  });

  it("ignore les matières sans note", () => {
    expect(
      moyenneGenerale([
        { moyenne: 12, coefficient: 2 },
        { moyenne: null, coefficient: 3 },
      ])
    ).toBe(12);
  });

  it("renvoie null si aucune matière notée", () => {
    expect(moyenneGenerale([{ moyenne: null, coefficient: 2 }])).toBeNull();
  });
});

describe("moyenneAnnuelle", () => {
  it("applique le DIVISEUR configuré, pas la somme des poids", () => {
    // Formule (P1 + P2×2 + P3×2) / 6 — diviseur volontairement pénalisant.
    // Somme pondérée : 12 + 14×2 + 16×2 = 72. 72 / 6 = 12 (et non 72/5 = 14,4).
    expect(moyenneAnnuelle([12, 14, 16], [1, 2, 2], 6)).toBeCloseTo(12, 6);
  });

  it("formule standard (P1 + P2×2 + P3×2) / 5", () => {
    expect(moyenneAnnuelle([12, 14, 16], [1, 2, 2], 5)).toBeCloseTo(14.4, 6);
  });

  it("retombe sur la somme des poids notés si une période manque", () => {
    // P3 non notée : on ne pénalise pas l'élève en divisant par 5.
    // (12 + 28) / 3 = 13,33
    expect(moyenneAnnuelle([12, 14, null], [1, 2, 2], 5)).toBeCloseTo(13.333333, 5);
  });

  it("ignore les périodes de poids 0", () => {
    expect(moyenneAnnuelle([20, 10], [0, 1], 1)).toBe(10);
  });

  it("renvoie null si aucune période notée", () => {
    expect(moyenneAnnuelle([null, null], [1, 1], 2)).toBeNull();
  });
});

describe("calculerRangs", () => {
  it("classe par moyenne décroissante", () => {
    const rangs = calculerRangs([
      { id: "a", moyenne: 12 },
      { id: "b", moyenne: 16 },
      { id: "c", moyenne: 14 },
    ]);
    expect(rangs.get("b")).toBe(1);
    expect(rangs.get("c")).toBe(2);
    expect(rangs.get("a")).toBe(3);
  });

  it("gère les ex æquo : deux 3e, puis un 5e", () => {
    const rangs = calculerRangs([
      { id: "a", moyenne: 18 },
      { id: "b", moyenne: 16 },
      { id: "c", moyenne: 15 },
      { id: "d", moyenne: 15 },
      { id: "e", moyenne: 12 },
    ]);
    expect(rangs.get("a")).toBe(1);
    expect(rangs.get("b")).toBe(2);
    expect(rangs.get("c")).toBe(3);
    expect(rangs.get("d")).toBe(3); // ex æquo
    expect(rangs.get("e")).toBe(5); // et non 4
  });

  it("n'attribue aucun rang aux élèves sans moyenne", () => {
    const rangs = calculerRangs([
      { id: "a", moyenne: 14 },
      { id: "b", moyenne: null },
    ]);
    expect(rangs.get("a")).toBe(1);
    expect(rangs.has("b")).toBe(false);
  });
});

describe("moyenneDeClasse", () => {
  it("moyenne des élèves notés uniquement", () => {
    expect(moyenneDeClasse([10, 20, null])).toBe(15);
  });

  it("null si personne n'est noté", () => {
    expect(moyenneDeClasse([null, null])).toBeNull();
  });
});

describe("appreciationAuto", () => {
  it("suit les paliers sur 20", () => {
    expect(appreciationAuto(17)).toContain("Excellent");
    expect(appreciationAuto(14.5)).toContain("Très bons");
    expect(appreciationAuto(12.5)).toContain("Bon travail");
    expect(appreciationAuto(10.5)).toContain("corrects");
    expect(appreciationAuto(8.5)).toContain("insuffisants");
    expect(appreciationAuto(5)).toContain("difficile");
  });

  it("les seuils suivent la note maximale (école notant sur 10)", () => {
    // 8,5/10 = 85 % → même palier que 17/20, et non « en difficulté »
    expect(appreciationAuto(8.5, 10)).toContain("Excellent");
    expect(appreciationAuto(5.5, 10)).toContain("corrects");
  });

  it("gère l'absence de note", () => {
    expect(appreciationAuto(null)).toContain("Pas de note");
  });
});
