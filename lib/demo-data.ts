export type ComparableStatus = "Vendue" | "En vigueur" | "Expirée";

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
};

export const tenant = {
  id: "tenant-demo-gabriel",
  name: "Gabriel Arseneault",
  descriptor: "Courtier indépendant",
  initials: "GA",
  region: "Abitibi-Témiscamingue",
  theme: {
    primary: "#244c3d",
    primaryDeep: "#17372d",
    accent: "#d4ab63",
    ocliq: "#355764",
  },
};

export const initialComparables: Comparable[] = [
  {
    id: "cmp-1",
    address: "94, avenue Champlain",
    city: "Rouyn-Noranda",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85",
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
  },
  {
    id: "cmp-2",
    address: "317, rue Perreault Est",
    city: "Rouyn-Noranda",
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=900&q=85",
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
  },
  {
    id: "cmp-3",
    address: "42, rue du Cardinal",
    city: "Rouyn-Noranda",
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=85",
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
  },
  {
    id: "cmp-4",
    address: "755, boulevard Rideau",
    city: "Rouyn-Noranda",
    image: "https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=900&q=85",
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
  },
  {
    id: "cmp-5",
    address: "128, chemin Trémoy",
    city: "Rouyn-Noranda",
    image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=900&q=85",
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
  },
  {
    id: "cmp-6",
    address: "603, rue Frédéric-Hébert",
    city: "Rouyn-Noranda",
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=900&q=85",
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
  },
  {
    id: "cmp-7",
    address: "22, rue Montrose",
    city: "Évain",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=85",
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
