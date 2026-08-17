/** Workflow indices; the order must match frCA.steps. */
export const WORKFLOW = {
  subject: 0,
  active: 1,
  sold: 2,
  annexes: 3,
  report: 4,
} as const;

export const STEP_COUNT = 5;
export const LAST_STEP = WORKFLOW.report;

export const PROPERTY_TYPES = [
  "Maison unifamiliale isolée",
  "Maison de plain-pied",
  "Maison à étages",
  "Cottage",
  "Jumelé",
  "En rangée",
  "Copropriété divise (condo)",
  "Duplex",
  "Triplex",
  "Immeuble à revenus",
  "Terrain",
] as const;

export const BUILDING_TYPES = [
  "Détaché",
  "Jumelé",
  "En rangée",
  "Copropriété",
  "Autre",
] as const;

export const ANALYSIS_PURPOSES = [
  "Établir le prix de mise en marché",
  "Révision de prix en cours de mandat",
  "Avis de valeur pour un achat",
  "Préparation d’une offre",
  "Autre",
] as const;

export const ANNEXE_KINDS = [
  "Rôle d’évaluation",
  "Certificat de localisation",
  "Déclaration du vendeur",
  "Photos supplémentaires",
  "Plan et superficies",
  "Taxes et charges",
  "Autre",
] as const;

export type AnnexeKind = (typeof ANNEXE_KINDS)[number];

export type AcmAnnexe = {
  id: string;
  kind: AnnexeKind;
  title: string;
  note: string;
};

export type SubjectSection =
  | "address"
  | "dates"
  | "features"
  | "assessments"
  | "pricing"
  | "highlights"
  | "introduction"
  | "notes";

export const SUBJECT_SECTIONS: { id: SubjectSection; label: string; hint: string }[] = [
  { id: "address", label: "Adresse", hint: "Localisation et visuels" },
  { id: "dates", label: "Dates et but", hint: "Cadre de l’analyse" },
  { id: "features", label: "Caractéristiques", hint: "Fiche physique" },
  { id: "assessments", label: "Évaluations", hint: "Rôle municipal" },
  { id: "pricing", label: "Prix suggéré", hint: "Trois positionnements" },
  { id: "highlights", label: "Faits saillants", hint: "Atouts et vigilance" },
  { id: "introduction", label: "Introduction", hint: "Texte client" },
  { id: "notes", label: "Note du courtier", hint: "Personnalisable" },
];

export const defaultIntroduction = (owners = "vous", city = "votre secteur") =>
  `Cette analyse comparative de marché a été préparée spécialement pour ${owners || "vous"}, afin de déterminer le meilleur prix de mise en marché à la lumière des propriétés comparables récemment vendues et actuellement en vigueur ${city ? `à ${city}` : "dans le secteur"}.\n\nElle s’appuie sur le jugement professionnel de votre courtier et sur des données vérifiées manuellement. Elle ne constitue pas une évaluation agréée, une garantie de prix ni un avis juridique.`;

export const defaultBrokerNote =
  "La fourchette recommandée repose principalement sur les ventes ajustées. Les inscriptions en vigueur mesurent la concurrence, sans être traitées comme des ventes réalisées.";

export const COUNT_OPTIONS = Array.from({ length: 16 }, (_, index) => index);

export const YEAR_OPTIONS = Array.from({ length: 127 }, (_, index) => 2026 - index);

export function dollarsInput(cents?: number) {
  return cents ? String(Math.round(cents / 100)) : "";
}

export function parseDollars(raw: string) {
  const value = Number(raw.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

export function parseAddressParts(text: string) {
  const first = text.split(",")[0]?.trim() ?? "";
  const match = first.match(/^(\d+[A-Za-z]?)\s*,?\s*(.+)$/);
  return match ? { civicNumber: match[1], street: match[2] } : { civicNumber: "", street: first };
}

export function emptyAnnexe(): AcmAnnexe {
  return { id: crypto.randomUUID(), kind: "Autre", title: "", note: "" };
}
