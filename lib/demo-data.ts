export type ComparableStatus = "Vendue" | "En vigueur" | "Expirée" | "Retirée";

export type ComparableSource = "Centris / collaboration" | "Registre foncier" | "Rôle municipal" | "Saisie manuelle";

export type SubjectProperty = {
  address: string; city: string; postalCode: string; owners: string; phone: string; email: string;
  type: string; beds: number; baths: number; area: number; year: number; assessment: number; landAssessment: number; buildingAssessment: number;
  timeframe: string; context: string; strengths: string; considerations: string;
  latitude?: number; longitude?: number; image?: string;
};

export function propertyStreetViewUrl(latitude: number, longitude: number) {
  return `/api/property-media?type=streetview&lat=${latitude}&lng=${longitude}`;
}

export function propertyMapUrl(latitude: number, longitude: number, mode: "roadmap" | "satellite" = "roadmap") {
  return `/api/property-media?type=map&lat=${latitude}&lng=${longitude}&mode=${mode}`;
}

export const initialSubject: SubjectProperty = {
  address: "218, rue des Pins", city: "Rouyn-Noranda", postalCode: "J9X 5M2",
  owners: "Marianne Lavoie et Simon Beaudry", phone: "819 555-0142", email: "marianne.lavoie@exemple.ca",
  type: "Maison de plain-pied", beds: 4, baths: 2, area: 1472, year: 1989, assessment: 32680000, landAssessment: 7450000, buildingAssessment: 25230000,
  timeframe: "3 mois", context: "Les propriétaires souhaitent acheter dans la région de Québec après la vente. Ils priorisent une transition simple et prévisible.",
  strengths: "Cuisine rénovée, grande cour intime, sous-sol aménagé et garage attaché.", considerations: "Toiture de 2012 et salle de bain principale à moderniser.",
  latitude: 48.2248634, longitude: -79.0284795,
  image: propertyStreetViewUrl(48.2248634, -79.0284795),
};

export type Comparable = {
  id: string;
  address: string;
  city: string;
  image: string;
  status: ComparableStatus;
  price: number;
  adjusted: number;
  adjustment: number;
  soldDate?: string;
  days: number;
  distance: number;
  beds: number;
  baths: number;
  area: number;
  year: number;
  match: number;
  included: boolean;
  reason: string;
  source?: ComparableSource;
  sourceReference?: string;
  verifiedOn?: string;
  mlsNumber?: string;
  postalCode?: string;
  unit?: string;
  lotNumber?: string;
  lotDimensions?: string;
  zoning?: string;
  propertyType?: string;
  propertyStyle?: string;
  listDate?: string;
  originalListPrice?: number;
  soldPricePublished?: boolean;
  rooms?: number;
  powderRooms?: number;
  lotArea?: number;
  levels?: number;
  garage?: string;
  parking?: number;
  basement?: string;
  construction?: string;
  exterior?: string;
  heating?: string;
  energy?: string;
  waterSupply?: string;
  sewage?: string;
  landAssessment?: number;
  buildingAssessment?: number;
  assessmentYear?: number;
  municipalTaxes?: number;
  schoolTaxes?: number;
  condoFees?: number;
  legalWarranty?: string;
  condition?: string;
  renovations?: string;
  features?: string;
  inclusions?: string;
  exclusions?: string;
  documents?: string[];
  verificationNotes?: string;
  latitude?: number;
  longitude?: number;
};

export const tenant = {
  id: "tenant-demo-gabriel",
  name: "Gabriel Arseneault",
  descriptor: "Courtier indépendant",
  initials: "GA",
  region: "Abitibi-Témiscamingue",
  theme: {
    primary: "#256bff",
    primaryDeep: "#0b2f73",
    accent: "#69a7ff",
    ocliq: "#07152e",
  },
};

export const initialComparables: Comparable[] = [
  {
    id: "cmp-1",
    address: "94, avenue Champlain",
    city: "Rouyn-Noranda",
    latitude: 48.23912, longitude: -79.01984,
    image: propertyStreetViewUrl(48.23912, -79.01984),
    status: "Vendue",
    price: 38600000,
    adjusted: 39100000,
    adjustment: 500000,
    soldDate: "18 juin 2026",
    days: 21,
    distance: 0.8,
    beds: 4,
    baths: 2,
    area: 1480,
    year: 1988,
    match: 94,
    included: true,
    reason: "Même secteur, superficie et niveau de finition très comparables.",
    source: "Centris / collaboration",
    sourceReference: "Centris 14732984",
    verifiedOn: "2026-08-03",
    mlsNumber: "14732984",
    postalCode: "J9X 2K4",
    propertyType: "Maison de plain-pied",
    propertyStyle: "Détachée",
    listDate: "2026-05-28",
    originalListPrice: 39900000,
    soldPricePublished: true,
    rooms: 12,
    powderRooms: 0,
    lotArea: 6690,
    levels: 1,
    garage: "Attaché, simple largeur",
    parking: 4,
    basement: "6 pieds et plus, aménagé",
    construction: "Bois",
    exterior: "Brique et vinyle",
    heating: "Plinthes électriques",
    energy: "Électricité",
    waterSupply: "Municipalité",
    sewage: "Municipalité",
    landAssessment: 7450000,
    buildingAssessment: 24730000,
    assessmentYear: 2025,
    municipalTaxes: 318400,
    schoolTaxes: 27800,
    legalWarranty: "Avec garantie légale",
    condition: "Bonne",
    renovations: "Cuisine 2021, fenêtres 2019",
    features: "Cour intime, garage attaché",
    documents: ["Fiche Centris", "Rôle municipal", "Registre foncier", "Certificat de localisation"],
    verificationNotes: "Prix de vente publié au Registre foncier; superficie recoupée avec le certificat de localisation.",
  },
  {
    id: "cmp-2",
    address: "317, rue Perreault Est",
    city: "Rouyn-Noranda",
    latitude: 48.24671, longitude: -79.01622,
    image: propertyStreetViewUrl(48.24671, -79.01622),
    status: "Vendue",
    price: 37250000,
    adjusted: 38150000,
    adjustment: 900000,
    soldDate: "2 juillet 2026",
    days: 14,
    distance: 1.4,
    beds: 3,
    baths: 2,
    area: 1395,
    year: 1992,
    match: 91,
    included: true,
    reason: "Vente récente; cuisine plus datée et garage simple.",
    source: "Centris / collaboration", sourceReference: "Centris 23981744", verifiedOn: "2026-08-02", mlsNumber: "23981744", postalCode: "J9X 3M8", propertyType: "Maison de plain-pied", propertyStyle: "Détachée", listDate: "2026-06-10", originalListPrice: 37900000, soldPricePublished: true, rooms: 11, powderRooms: 0, lotArea: 6210, levels: 1, garage: "Détaché, simple largeur", parking: 3, basement: "Aménagé", condition: "Moyenne", renovations: "Toiture 2018", legalWarranty: "Avec garantie légale", documents: ["Fiche Centris", "Registre foncier", "Rôle municipal"], verificationNotes: "Vente publiée et adresse caviardée dans la présentation client.",
  },
  {
    id: "cmp-3",
    address: "42, rue du Cardinal",
    city: "Rouyn-Noranda",
    latitude: 48.21455, longitude: -79.04112,
    image: propertyStreetViewUrl(48.21455, -79.04112),
    status: "Vendue",
    price: 40100000,
    adjusted: 39400000,
    adjustment: -700000,
    soldDate: "27 mai 2026",
    days: 33,
    distance: 2.1,
    beds: 4,
    baths: 2,
    area: 1560,
    year: 1985,
    match: 88,
    included: true,
    reason: "Terrain plus grand; localisation légèrement moins recherchée.",
    source: "Centris / collaboration", sourceReference: "Centris 19855203", verifiedOn: "2026-07-30", mlsNumber: "19855203", postalCode: "J9Y 1R7", propertyType: "Maison à étages", propertyStyle: "Détachée", listDate: "2026-04-18", originalListPrice: 40900000, soldPricePublished: true, rooms: 13, powderRooms: 1, lotArea: 8120, levels: 2, garage: "Aucun", parking: 4, basement: "Partiellement aménagé", condition: "Bonne", renovations: "Salle de bain 2020", legalWarranty: "Avec garantie légale", documents: ["Fiche Centris", "Registre foncier"], verificationNotes: "Terrain plus grand; facteur de localisation documenté par le courtier.",
  },
  {
    id: "cmp-4",
    address: "755, boulevard Rideau",
    city: "Rouyn-Noranda",
    latitude: 48.25208, longitude: -79.03341,
    image: propertyStreetViewUrl(48.25208, -79.03341),
    status: "Vendue",
    price: 37900000,
    adjusted: 38700000,
    adjustment: 800000,
    soldDate: "11 avril 2026",
    days: 29,
    distance: 2.7,
    beds: 3,
    baths: 1,
    area: 1420,
    year: 1990,
    match: 84,
    included: true,
    reason: "Bonne proximité; une salle de bain de moins que la propriété sujet.",
    source: "Centris / collaboration", sourceReference: "Centris 11245891", verifiedOn: "2026-07-29", mlsNumber: "11245891", postalCode: "J9X 5B2", propertyType: "Maison de plain-pied", propertyStyle: "Détachée", listDate: "2026-03-13", originalListPrice: 38900000, soldPricePublished: true, rooms: 10, powderRooms: 1, lotArea: 5980, levels: 1, garage: "Aucun", parking: 3, basement: "Aménagé", condition: "Bonne", renovations: "Sous-sol 2019", legalWarranty: "Avec garantie légale", documents: ["Fiche Centris", "Registre foncier"], verificationNotes: "Écart de salle de bain conservé dans la matrice d'ajustement.",
  },
  {
    id: "cmp-5",
    address: "128, chemin Trémoy",
    city: "Rouyn-Noranda",
    latitude: 48.23094, longitude: -79.00687,
    image: propertyStreetViewUrl(48.23094, -79.00687),
    status: "En vigueur",
    price: 40900000,
    adjusted: 39700000,
    adjustment: -1200000,
    days: 18,
    distance: 1.9,
    beds: 4,
    baths: 2,
    area: 1525,
    year: 1987,
    match: 82,
    included: true,
    reason: "Concurrence directe; prix demandé, non un prix de vente observé.",
    source: "Centris / collaboration", sourceReference: "Centris 26790118", verifiedOn: "2026-08-04", mlsNumber: "26790118", postalCode: "J9X 4H9", propertyType: "Maison de plain-pied", propertyStyle: "Détachée", listDate: "2026-07-17", originalListPrice: 41900000, soldPricePublished: false, rooms: 12, powderRooms: 0, lotArea: 7010, levels: 1, garage: "Attaché, simple largeur", parking: 4, basement: "Aménagé", condition: "Excellente", renovations: "Cuisine 2024", legalWarranty: "Avec garantie légale", documents: ["Fiche Centris", "Rôle municipal"], verificationNotes: "Inscription active : le prix demandé ne constitue pas une preuve de valeur vendue.",
  },
  {
    id: "cmp-6",
    address: "603, rue Frédéric-Hébert",
    city: "Rouyn-Noranda",
    latitude: 48.20833, longitude: -79.01255,
    image: propertyStreetViewUrl(48.20833, -79.01255),
    status: "Expirée",
    price: 42900000,
    adjusted: 40500000,
    adjustment: -2400000,
    days: 116,
    distance: 3.8,
    beds: 5,
    baths: 3,
    area: 1810,
    year: 1979,
    match: 58,
    included: false,
    reason: "Superficie et délai de mise en marché trop éloignés du sujet.",
    source: "Centris / collaboration", sourceReference: "Centris 21590837", verifiedOn: "2026-07-18", mlsNumber: "21590837", postalCode: "J9X 5E6", propertyType: "Maison à étages", propertyStyle: "Détachée", listDate: "2026-03-24", originalListPrice: 44900000, soldPricePublished: false, rooms: 15, powderRooms: 1, lotArea: 9200, levels: 2, garage: "Attaché, double largeur", parking: 6, basement: "Aménagé", condition: "Moyenne", legalWarranty: "Sans garantie légale", documents: ["Fiche Centris"], verificationNotes: "Inscription expirée; utile pour documenter la résistance du marché seulement.",
  },
  {
    id: "cmp-7",
    address: "22, rue Montrose",
    city: "Évain",
    latitude: 48.27418, longitude: -79.11462,
    image: propertyStreetViewUrl(48.27418, -79.11462),
    status: "En vigueur",
    price: 35900000,
    adjusted: 37400000,
    adjustment: 1500000,
    days: 62,
    distance: 7.2,
    beds: 3,
    baths: 1,
    area: 1280,
    year: 1976,
    match: 51,
    included: false,
    reason: "Marché local et profil de propriété moins comparables.",
    source: "Centris / collaboration", sourceReference: "Centris 28412670", verifiedOn: "2026-08-01", mlsNumber: "28412670", postalCode: "J0Z 1Y0", propertyType: "Maison de plain-pied", propertyStyle: "Détachée", listDate: "2026-06-03", originalListPrice: 36900000, soldPricePublished: false, rooms: 9, powderRooms: 0, lotArea: 10800, levels: 1, garage: "Détaché", parking: 5, basement: "Non aménagé", condition: "À moderniser", legalWarranty: "Avec garantie légale", documents: ["Fiche Centris"], verificationNotes: "Secteur secondaire; écart géographique clairement signalé.",
  },
];

export const formatCAD = (cents: number) =>
  new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export const formatSignedCAD = (cents: number) => {
  if (cents === 0) return "0 $";
  const formatted = formatCAD(Math.abs(cents));
  return `${cents > 0 ? "+" : "−"}${formatted}`;
};

export const marketTrend = [
  { month: "Fév.", price: 366 },
  { month: "Mars", price: 372 },
  { month: "Avr.", price: 378 },
  { month: "Mai", price: 383 },
  { month: "Juin", price: 386 },
  { month: "Juill.", price: 389 },
];
