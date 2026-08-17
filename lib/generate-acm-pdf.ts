import { jsPDF } from "jspdf";
import { initialSubject, propertyMapUrl, propertyStreetViewUrl, type Comparable, type SubjectProperty } from "@/lib/demo-data";
import type { BrokerBranding } from "@/lib/acm-repository";

type ReportAssets = {
  logo?: string;
  subjectImage?: string;
  subjectMap?: string;
  subjectStreetView?: string;
  comparableImages?: Record<string, string>;
  branding?: BrokerBranding & { brokerName?: string };
};

const PAGE_W = 215.9;
const PAGE_H = 279.4;
const MARGIN = 17;
const NAVY: [number, number, number] = [7, 21, 46];
const BLUE: [number, number, number] = [37, 107, 255];
const BLUE_DARK: [number, number, number] = [19, 77, 190];
const BLUE_PALE: [number, number, number] = [236, 243, 255];
const INK: [number, number, number] = [25, 36, 57];
const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [220, 227, 238];
const PALE: [number, number, number] = [247, 249, 252];

const cad = (cents: number) => new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
}).format(cents / 100).replace("$", "$").replace(/\u00a0/g, " ");

const number = (value: number) => new Intl.NumberFormat("fr-CA").format(value).replace(/\u00a0/g, " ");

const clean = (value: string) => value
  .replace(/[–—−]/g, "-")
  .replace(/\u2011/g, "-")
  .replace(/\u00a0/g, " ");

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

const percent = (value: number) => `${new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 1 }).format(value * 100)} %`;

function setText(doc: jsPDF, color: [number, number, number], size: number, weight: "normal" | "bold" = "normal") {
  doc.setTextColor(...color);
  doc.setFont("helvetica", weight);
  doc.setFontSize(size);
}

function brandMark(doc: jsPDF, x: number, y: number, dark = false) {
  doc.setFillColor(...BLUE);
  doc.roundedRect(x, y, 10, 10, 2.2, 2.2, "F");
  setText(doc, [255, 255, 255], 8.5, "bold");
  doc.text("Q", x + 5, y + 7.1, { align: "center" });
  setText(doc, dark ? [255, 255, 255] : NAVY, 13, "bold");
  doc.text("Ocliq", x + 13, y + 7.6);
}

function header(doc: jsPDF, title: string, section: string, logo?: string, customLogo?: string) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, 19, "F");
  const headerLogo = customLogo || logo;
  if (headerLogo) {
    try {
      doc.addImage(headerLogo, "PNG", MARGIN, 3.1, 30.6, 13);
    } catch {
      brandMark(doc, MARGIN, 4.5, true);
    }
  } else {
    brandMark(doc, MARGIN, 4.5, true);
  }
  setText(doc, [183, 207, 255], 7, "bold");
  doc.text(clean(section.toUpperCase()), PAGE_W - MARGIN, 10.6, { align: "right" });
  setText(doc, INK, 21, "bold");
  doc.text(clean(title), MARGIN, 37);
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(1.2);
  doc.line(MARGIN, 43, MARGIN + 24, 43);
}

function addFooter(doc: jsPDF, pageNumber: number, total: number, footerLabel?: string) {
  doc.setDrawColor(...LINE);
  doc.setLineWidth(.25);
  doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
  setText(doc, MUTED, 7);
  doc.text(footerLabel || "Analyse comparative de marché - Document confidentiel", MARGIN, PAGE_H - 8.7);
  doc.text(`${pageNumber} / ${total}`, PAGE_W - MARGIN, PAGE_H - 8.7, { align: "right" });
}

function paragraph(doc: jsPDF, text: string, x: number, y: number, width: number, size = 9, color = MUTED, lineHeight = 1.45) {
  setText(doc, color, size);
  const lines = doc.splitTextToSize(clean(text), width) as string[];
  doc.text(lines, x, y, { lineHeightFactor: lineHeight });
  return y + lines.length * size * .3528 * lineHeight;
}

function imageContain(doc: jsPDF, data: string | undefined, x: number, y: number, w: number, h: number) {
  doc.setFillColor(226, 233, 244);
  doc.roundedRect(x, y, w, h, 3, 3, "F");
  if (!data) return;
  try {
    const props = doc.getImageProperties(data);
    const scale = Math.min(w / props.width, h / props.height);
    const drawW = props.width * scale;
    const drawH = props.height * scale;
    doc.addImage(data, props.fileType, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH, undefined, "FAST");
  } catch {
    // A report remains complete even when a remote image cannot be embedded.
  }
}

function metric(doc: jsPDF, x: number, y: number, w: number, label: string, value: string, accent = false) {
  doc.setFillColor(...(accent ? BLUE_PALE : PALE));
  doc.roundedRect(x, y, w, 24, 3, 3, "F");
  setText(doc, accent ? BLUE_DARK : MUTED, 7, "bold");
  doc.text(clean(label.toUpperCase()), x + 5, y + 7);
  setText(doc, accent ? BLUE_DARK : INK, 13.5, "bold");
  doc.text(clean(value), x + 5, y + 17.5);
}

function drawCover(doc: jsPDF, included: Comparable[], assets: ReportAssets, subject: SubjectProperty) {
  const adjusted = included.filter((item) => item.adjusted > 0).map((item) => item.adjusted);
  const central = median(adjusted);
  const low = adjusted.length ? Math.min(...adjusted) : 38150000;
  const high = adjusted.length ? Math.max(...adjusted) : 39700000;

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setFillColor(...BLUE);
  doc.circle(PAGE_W + 18, 26, 58, "F");
  doc.setFillColor(18, 57, 124);
  doc.circle(-22, PAGE_H - 4, 62, "F");

  const brand = assets.branding;
  const coverLogo = brand?.logoDataUrl || assets.logo;
  if (coverLogo) {
    try { doc.addImage(coverLogo, "PNG", MARGIN, 16, 47, 20); } catch { brandMark(doc, MARGIN, 19, true); }
  } else {
    brandMark(doc, MARGIN, 19, true);
  }
  if (brand?.agencyName) {
    setText(doc, [205, 218, 242], 8);
    doc.text(clean(brand.agencyName), MARGIN, 42);
  }

  setText(doc, [145, 181, 255], 8, "bold");
  doc.text("ANALYSE COMPARATIVE DE MARCHÉ", MARGIN, 64);
  const sloganLines = (brand?.slogan || "La valeur expliquée avec clarté.").split("\n").slice(0, 2);
  setText(doc, [255, 255, 255], 28, "bold");
  doc.text(sloganLines, MARGIN, 82, { lineHeightFactor: 1.05 });
  setText(doc, [205, 218, 242], 11);
  doc.text(clean(subject.address), MARGIN, 106);
  doc.text(clean(subject.city), MARGIN, 113);

  imageContain(doc, assets.subjectImage, MARGIN, 126, PAGE_W - MARGIN * 2, 72);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(MARGIN, 211, PAGE_W - MARGIN * 2, 37, 4, 4, "F");
  setText(doc, BLUE_DARK, 7.5, "bold");
  doc.text("FOURCHETTE DE VALEUR OBSERVÉE", MARGIN + 7, 220);
  setText(doc, NAVY, 18, "bold");
  doc.text(`${cad(low)} - ${cad(high)}`, MARGIN + 7, 234);
  setText(doc, MUTED, 8);
  doc.text(`Point central des comparables ajustés : ${cad(central)}`, PAGE_W - MARGIN - 7, 241, { align: "right" });

  setText(doc, [255, 255, 255], 9, "bold");
  doc.text("Préparée pour", MARGIN, 258);
  setText(doc, [205, 218, 242], 8.5);
  doc.text(subject.owners, MARGIN, 264);

  const brokerName = brand?.brokerName || "Courtier";
  const brokerTitle = brand?.brokerTitle || "Courtier immobilier résidentiel";
  setText(doc, [255, 255, 255], 9, "bold");
  doc.text(clean(brokerName), PAGE_W - MARGIN, 258, { align: "right" });
  setText(doc, [205, 218, 242], 8.5);
  doc.text(clean(brokerTitle), PAGE_W - MARGIN, 264, { align: "right" });
  if (brand?.agencyName) {
    setText(doc, [205, 218, 242], 7.5);
    doc.text(clean(brand.agencyName), PAGE_W - MARGIN, 270, { align: "right" });
  }
}

function drawSummary(doc: jsPDF, included: Comparable[], assets: ReportAssets, subject: SubjectProperty) {
  header(doc, "Votre analyse en bref", "01 - Décision", assets.logo, assets.branding?.logoDataUrl);
  const sold = included.filter((item) => item.status === "Vendue");
  const adjusted = (sold.length ? sold : included).map((item) => item.adjusted).filter(Boolean);
  const rangeLow = adjusted.length ? Math.min(...adjusted) : 0;
  const rangeHigh = adjusted.length ? Math.max(...adjusted) : 0;
  const midpoint = median(adjusted);
  const avgDays = sold.length ? Math.round(sold.reduce((sum, item) => sum + item.days, 0) / sold.length) : 0;

  paragraph(doc, subject.introduction?.trim() || "L'ACM transforme les ventes récentes et les inscriptions concurrentes en une lecture simple du marché. La recommandation finale demeure un jugement professionnel, appuyé par les données ci-dessous.", MARGIN, 53, PAGE_W - MARGIN * 2, 10, MUTED);
  setText(doc, BLUE_DARK, 7.2, "bold");
  const analysisDate = subject.analysisDate ? new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Toronto" }).format(new Date(`${subject.analysisDate}T12:00:00`)) : "date à confirmer";
  doc.text(clean(`ANALYSE DU ${analysisDate.toUpperCase()} - PÉRIODE OBSERVÉE : ${subject.analysisPeriodMonths || 6} MOIS - ${included.length} PROPRIÉTÉS RETENUES`), MARGIN, 69);

  metric(doc, MARGIN, 76, 55, "Fourchette ajustée", `${cad(rangeLow)} à ${cad(rangeHigh)}`, true);
  metric(doc, MARGIN + 61, 76, 55, "Point central", cad(midpoint), true);
  metric(doc, MARGIN + 122, 76, 59, "Délai moyen vendu", `${avgDays} jours`);

  setText(doc, INK, 13, "bold");
  doc.text("La propriété sujet", MARGIN, 119);
  doc.setFillColor(...PALE);
  doc.roundedRect(MARGIN, 127, PAGE_W - MARGIN * 2, 61, 4, 4, "F");
  setText(doc, NAVY, 15, "bold");
  doc.text(subject.address, MARGIN + 7, 140);
  setText(doc, MUTED, 8.5);
  doc.text(subject.city, MARGIN + 7, 147);
  const subjectFacts = [
    ["Type", subject.type],
    ["Habitable", `${number(subject.area)} pi²`],
    ["Chambres", String(subject.beds)],
    ["Salles de bain", String(subject.baths)],
    ["Construction", String(subject.year)],
    ["Évaluation", cad(subject.assessment)],
  ];
  subjectFacts.forEach(([label, value], index) => {
    const x = MARGIN + 7 + (index % 3) * 58;
    const y = 159 + Math.floor(index / 3) * 15;
    setText(doc, MUTED, 6.7, "bold");
    doc.text(label.toUpperCase(), x, y);
    setText(doc, INK, 9.3, "bold");
    doc.text(value, x, y + 5.4);
  });

  setText(doc, INK, 13, "bold");
  doc.text("Lecture professionnelle", MARGIN, 207);
  doc.setFillColor(...BLUE_PALE);
  doc.roundedRect(MARGIN, 215, 87, 37, 4, 4, "F");
  setText(doc, BLUE_DARK, 7, "bold");
  doc.text("ATOUTS DISTINCTIFS", MARGIN + 6, 224);
  paragraph(doc, subject.strengths, MARGIN + 6, 232, 75, 8, INK, 1.3);
  doc.setFillColor(252, 248, 241);
  doc.roundedRect(MARGIN + 94, 215, 87, 37, 4, 4, "F");
  setText(doc, [139, 94, 23], 7, "bold");
  doc.text("POINTS À CONSIDÉRER", MARGIN + 100, 224);
  paragraph(doc, subject.considerations, MARGIN + 100, 232, 75, 8, INK, 1.3);
}

function drawMarketRatios(doc: jsPDF, included: Comparable[], assets: ReportAssets) {
  doc.addPage();
  header(doc, "Les ratios qui racontent le marché", "03 - Ratios de marché", assets.logo, assets.branding?.logoDataUrl);
  const sold = included.filter((item) => item.status === "Vendue");
  const saleListRatios = sold.filter((item) => item.originalListPrice).map((item) => item.price / (item.originalListPrice || item.price));
  const pricePerLiving = sold.filter((item) => item.area).map((item) => item.price / item.area);
  const pricePerLot = sold.filter((item) => item.lotArea).map((item) => item.price / (item.lotArea || 1));
  const active = included.filter((item) => item.status === "En vigueur");
  const activePerLiving = active.filter((item) => item.area).map((item) => item.price / item.area);
  const ratio = saleListRatios.length ? saleListRatios.reduce((sum, value) => sum + value, 0) / saleListRatios.length : 0;

  paragraph(doc, "Ces ratios décrivent le comportement réel des ventes retenues. Ils permettent de lire la négociation, la vélocité et le niveau de prix indépendamment de la taille des propriétés.", MARGIN, 53, PAGE_W - MARGIN * 2, 9.5, MUTED);

  doc.setFillColor(...NAVY);
  doc.roundedRect(MARGIN, 71, PAGE_W - MARGIN * 2, 48, 5, 5, "F");
  setText(doc, [155, 190, 255], 7.5, "bold");
  doc.text("RATIO PRIX VENDU / PRIX INITIAL", MARGIN + 8, 83);
  setText(doc, [255, 255, 255], 25, "bold");
  doc.text(percent(ratio), MARGIN + 8, 101);
  setText(doc, [205, 218, 242], 8);
  doc.text(`${saleListRatios.length} ventes documentées`, MARGIN + 8, 111);
  const barX = MARGIN + 84;
  const barW = 88;
  doc.setFillColor(42, 65, 103);
  doc.roundedRect(barX, 91, barW, 6, 3, 3, "F");
  doc.setFillColor(...BLUE);
  doc.roundedRect(barX, 91, Math.min(barW, barW * ratio), 6, 3, 3, "F");
  setText(doc, [205, 218, 242], 7);
  doc.text("0 %", barX, 106);
  doc.text("100 % du prix initial", barX + barW, 106, { align: "right" });

  metric(doc, MARGIN, 132, 55, "Vendu / pi² habitable", cad(average(pricePerLiving)), true);
  metric(doc, MARGIN + 61, 132, 55, "Vendu / pi² terrain", cad(average(pricePerLot)));
  metric(doc, MARGIN + 122, 132, 59, "Délai moyen", `${average(sold.map((item) => item.days))} jours`);

  setText(doc, INK, 12.5, "bold");
  doc.text("Prix vendu par pied carré habitable", MARGIN, 176);
  const maxValue = Math.max(...pricePerLiving, 1);
  sold.forEach((item, index) => {
    const value = item.price / Math.max(item.area, 1);
    const y = 188 + index * 14;
    setText(doc, MUTED, 7.1, "bold");
    doc.text(clean(item.address.split(",")[0]), MARGIN, y + 4);
    doc.setFillColor(229, 235, 245);
    doc.roundedRect(MARGIN + 35, y, 112, 6, 3, 3, "F");
    doc.setFillColor(...BLUE);
    doc.roundedRect(MARGIN + 35, y, 112 * value / maxValue, 6, 3, 3, "F");
    setText(doc, INK, 7.5, "bold");
    doc.text(`${cad(Math.round(value))} / pi²`, PAGE_W - MARGIN, y + 4.5, { align: "right" });
  });

  doc.setFillColor(...BLUE_PALE);
  doc.roundedRect(MARGIN, 246, PAGE_W - MARGIN * 2, 16, 3, 3, "F");
  setText(doc, BLUE_DARK, 7.7, "bold");
  doc.text(`CONCURRENCE ACTIVE : ${active.length} PROPRIÉTÉ - ${cad(average(activePerLiving))} / PI² DEMANDÉ`, MARGIN + 6, 255.5);
}

function drawValuationMethods(doc: jsPDF, included: Comparable[], assets: ReportAssets, subject: SubjectProperty) {
  doc.addPage();
  header(doc, "La valeur sous plusieurs angles", "04 - Méthodes de valeur", assets.logo, assets.branding?.logoDataUrl);
  const sold = included.filter((item) => item.status === "Vendue");
  const adjusted = sold.map((item) => item.adjusted).filter(Boolean);
  const meanSale = average(sold.map((item) => item.price));
  const meanPerSqft = average(sold.filter((item) => item.area).map((item) => item.price / item.area));
  const assessed = sold.filter((item) => item.landAssessment && item.buildingAssessment);
  const assessmentRatios = assessed.map((item) => item.price / ((item.landAssessment || 0) + (item.buildingAssessment || 0)));
  const assessmentIndication = assessmentRatios.length
    ? Math.round(subject.assessment * assessmentRatios.reduce((sum, value) => sum + value, 0) / assessmentRatios.length)
    : 0;
  const methods = [
    ["Médiane ajustée", median(adjusted), "Différences entre propriétés prises en compte"],
    ["Prix vendu moyen", meanSale, `${sold.length} transactions réalisées`],
    ["Prix / pi²", Math.round(meanPerSqft * subject.area), `${cad(meanPerSqft)} × ${number(subject.area)} pi²`],
    ["Ratio d'évaluation", assessmentIndication, `${assessed.length} comparable documenté - couverture limitée`],
  ] as const;

  paragraph(doc, "Aucune méthode ne décide seule de la valeur. Leur convergence aide le courtier à tester la robustesse de sa recommandation et à expliquer les écarts au vendeur.", MARGIN, 53, PAGE_W - MARGIN * 2, 9.5, MUTED);
  setText(doc, INK, 12.5, "bold");
  doc.text("Évaluation municipale du sujet", MARGIN, 78);
  const totalW = PAGE_W - MARGIN * 2;
  const landW = totalW * subject.landAssessment / subject.assessment;
  doc.setFillColor(109, 167, 255);
  doc.roundedRect(MARGIN, 88, landW, 13, 3, 3, "F");
  doc.setFillColor(...BLUE_DARK);
  doc.roundedRect(MARGIN + landW, 88, totalW - landW, 13, 3, 3, "F");
  setText(doc, INK, 8, "bold");
  doc.text(`Terrain ${cad(subject.landAssessment)}`, MARGIN, 110);
  doc.text(`Bâtiment ${cad(subject.buildingAssessment)}`, MARGIN + 64, 110);
  doc.text(`Total ${cad(subject.assessment)}`, PAGE_W - MARGIN, 110, { align: "right" });

  setText(doc, INK, 12.5, "bold");
  doc.text("Indications de valeur", MARGIN, 132);
  methods.forEach(([label, value, note], index) => {
    const y = 141 + index * 25;
    doc.setFillColor(...(index === 0 ? BLUE_PALE : PALE));
    doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 19, 3, 3, "F");
    setText(doc, index === 0 ? BLUE_DARK : NAVY, 8.5, "bold");
    doc.text(label, MARGIN + 6, y + 8);
    setText(doc, MUTED, 6.8);
    doc.text(note, MARGIN + 6, y + 14);
    setText(doc, index === 0 ? BLUE_DARK : INK, 13, "bold");
    doc.text(value ? cad(value) : "Non disponible", PAGE_W - MARGIN - 6, y + 12, { align: "right" });
  });

  doc.setFillColor(...NAVY);
  doc.roundedRect(MARGIN, 246, PAGE_W - MARGIN * 2, 17, 3, 3, "F");
  setText(doc, [255, 255, 255], 7.7, "bold");
  doc.text("LECTURE DU COURTIER", MARGIN + 6, 254);
  setText(doc, [205, 218, 242], 7.2);
  doc.text("Les ventes ajustées demeurent l'ancrage principal; les autres méthodes servent de tests de cohérence.", MARGIN + 6, 260);
}

function drawValueContext(doc: jsPDF, included: Comparable[], assets: ReportAssets) {
  doc.addPage();
  header(doc, "La fourchette en un regard", "02 - Valeur et localisation", assets.logo, assets.branding?.logoDataUrl);
  const values = included.map((item) => item.adjusted).filter((value) => value > 0);
  const low = values.length ? Math.min(...values) : 0;
  const high = values.length ? Math.max(...values) : 0;
  const central = median(values);
  const spread = Math.max(high - low, 2000000);
  const axisMin = low - spread * .12;
  const axisMax = high + spread * .12;
  const chartX = MARGIN + 8;
  const chartW = PAGE_W - MARGIN * 2 - 16;
  const chartY = 92;
  const plot = (value: number) => chartX + ((value - axisMin) / (axisMax - axisMin)) * chartW;

  paragraph(doc, "Chaque point représente la valeur ajustée d'un comparable retenu. Cette vue montre immédiatement la dispersion de l'échantillon et la zone où les données convergent.", MARGIN, 53, PAGE_W - MARGIN * 2, 9.5, MUTED);
  doc.setFillColor(...PALE);
  doc.roundedRect(MARGIN, 70, PAGE_W - MARGIN * 2, 62, 5, 5, "F");
  setText(doc, MUTED, 7, "bold");
  doc.text("VALEURS AJUSTÉES DES COMPARABLES", MARGIN + 7, 80);
  doc.setDrawColor(184, 198, 221);
  doc.setLineWidth(1.4);
  doc.line(chartX, chartY, chartX + chartW, chartY);
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(4.2);
  doc.line(plot(low), chartY, plot(high), chartY);

  included.forEach((item, index) => {
    const x = plot(item.adjusted);
    const upper = index % 2 === 0;
    doc.setFillColor(...(item.status === "Vendue" ? BLUE : [89, 104, 133] as [number, number, number]));
    doc.circle(x, chartY, 2.6, "F");
    doc.setDrawColor(...LINE);
    doc.setLineWidth(.3);
    doc.line(x, upper ? chartY - 3 : chartY + 3, x, upper ? chartY - 10 : chartY + 10);
    setText(doc, INK, 6.4, "bold");
    doc.text(clean(item.address.split(",")[0]), x, upper ? chartY - 13 : chartY + 15, { align: "center" });
    setText(doc, MUTED, 6.2);
    doc.text(cad(item.adjusted), x, upper ? chartY - 9 : chartY + 19, { align: "center" });
  });

  doc.setFillColor(...NAVY);
  doc.roundedRect(MARGIN + 55, 112, 71, 13, 3, 3, "F");
  setText(doc, [255, 255, 255], 9.5, "bold");
  doc.text(`Point central : ${cad(central)}`, MARGIN + 90.5, 120.5, { align: "center" });

  setText(doc, INK, 12.5, "bold");
  doc.text("Le bien dans son environnement", MARGIN, 149);
  setText(doc, MUTED, 7, "bold");
  doc.text("CARTE DU SECTEUR", MARGIN, 159);
  doc.text("FAÇADE ET ENVIRONNEMENT IMMÉDIAT", MARGIN + 94, 159);
  imageContain(doc, assets.subjectMap, MARGIN, 164, 87, 58);
  imageContain(doc, assets.subjectStreetView, MARGIN + 94, 164, 87, 58);

  doc.setFillColor(...BLUE_PALE);
  doc.roundedRect(MARGIN, 232, 87, 25, 4, 4, "F");
  setText(doc, BLUE_DARK, 7, "bold");
  doc.text("LECTURE CARTOGRAPHIQUE", MARGIN + 6, 241);
  paragraph(doc, "Confirme la cohérence géographique de l'échantillon retenu.", MARGIN + 6, 248, 75, 7.5, INK, 1.25);
  doc.setFillColor(...PALE);
  doc.roundedRect(MARGIN + 94, 232, 87, 25, 4, 4, "F");
  setText(doc, NAVY, 7, "bold");
  doc.text("LECTURE QUALITATIVE", MARGIN + 100, 241);
  paragraph(doc, "Situe la façade, l'implantation et le voisinage immédiat.", MARGIN + 100, 248, 75, 7.5, INK, 1.25);
}

function drawComparison(doc: jsPDF, included: Comparable[], assets: ReportAssets) {
  header(doc, "Les propriétés qui fondent la valeur", "05 - Comparables", assets.logo, assets.branding?.logoDataUrl);
  paragraph(doc, `${included.length} propriétés ont été retenues pour leur proximité, leur récence et leur similarité avec le sujet. Les prix actifs sont présentés comme contexte et non comme preuve d'une vente réalisée.`, MARGIN, 53, PAGE_W - MARGIN * 2, 9.5, MUTED);

  const rows = included.slice(0, 7);
  const cols = [55, 22, 19, 27, 27, 31];
  const labels = ["Adresse", "Statut", "Distance", "Prix", "Ajustement", "Ajusté"];
  let y = 75;
  doc.setFillColor(...NAVY);
  doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 12, 2, 2, "F");
  let x = MARGIN;
  labels.forEach((label, index) => {
    setText(doc, [255, 255, 255], 6.7, "bold");
    doc.text(label.toUpperCase(), x + 3, y + 7.5);
    x += cols[index];
  });
  y += 12;
  rows.forEach((item, rowIndex) => {
    const rowH = 22;
    doc.setFillColor(...(rowIndex % 2 ? PALE : [255, 255, 255] as [number, number, number]));
    doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, rowH, "F");
    x = MARGIN;
    const cells = [
      `${item.address}\n${item.city}`,
      item.status,
      `${item.distance.toLocaleString("fr-CA")} km`,
      cad(item.price),
      `${item.adjustment >= 0 ? "+" : ""}${cad(item.adjustment)}`,
      cad(item.adjusted),
    ];
    cells.forEach((cell, index) => {
      setText(doc, index === 5 ? BLUE_DARK : INK, index === 0 ? 7.3 : 7, index === 0 || index === 5 ? "bold" : "normal");
      const lines = doc.splitTextToSize(clean(cell), cols[index] - 6) as string[];
      doc.text(lines.slice(0, 2), x + 3, y + 8, { lineHeightFactor: 1.25 });
      x += cols[index];
    });
    doc.setDrawColor(...LINE);
    doc.line(MARGIN, y + rowH, PAGE_W - MARGIN, y + rowH);
    y += rowH;
  });

  const sold = included.filter((item) => item.status === "Vendue");
  const average = sold.length ? Math.round(sold.reduce((sum, item) => sum + item.price, 0) / sold.length) : 0;
  setText(doc, INK, 12, "bold");
  doc.text("Repères de marché", MARGIN, y + 18);
  metric(doc, MARGIN, y + 25, 55, "Prix vendu moyen", cad(average));
  metric(doc, MARGIN + 61, y + 25, 55, "Ventes retenues", String(sold.length));
  metric(doc, MARGIN + 122, y + 25, 59, "Comparables actifs", String(included.filter((item) => item.status === "En vigueur").length));
}

function drawComparablePages(doc: jsPDF, included: Comparable[], assets: ReportAssets) {
  const pages: Comparable[][] = [];
  for (let index = 0; index < included.length; index += 2) pages.push(included.slice(index, index + 2));
  pages.forEach((items, pageIndex) => {
    doc.addPage();
    header(doc, "Détail des comparables", `06 - Lecture détaillée ${pageIndex + 1}/${pages.length}`, assets.logo, assets.branding?.logoDataUrl);
    items.forEach((item, itemIndex) => {
      const y = 52 + itemIndex * 102;
      const image = assets.comparableImages?.[item.id];
      imageContain(doc, image, MARGIN, y, 64, 43);
      setText(doc, BLUE_DARK, 7, "bold");
      doc.text(item.status.toUpperCase(), MARGIN + 70, y + 4);
      setText(doc, NAVY, 14, "bold");
      doc.text(clean(item.address), MARGIN + 70, y + 13);
      setText(doc, MUTED, 8);
      doc.text(clean(`${item.city}${item.postalCode ? `, ${item.postalCode}` : ""} - ${item.distance.toLocaleString("fr-CA")} km du sujet`), MARGIN + 70, y + 20);

      metric(doc, MARGIN + 70, y + 27, 33, item.status === "Vendue" ? "Prix vendu" : "Prix demandé", cad(item.price));
      metric(doc, MARGIN + 107, y + 27, 33, "Ajustement", `${item.adjustment >= 0 ? "+" : ""}${cad(item.adjustment)}`);
      metric(doc, MARGIN + 144, y + 27, 37, "Valeur ajustée", cad(item.adjusted), true);

      const facts = [
        `${item.beds} ch.`, `${item.baths} sdb`, `${number(item.area)} pi²`, String(item.year), `${item.days} jours`, `${item.match}% similarité`,
      ];
      facts.forEach((fact, index) => {
        const fx = MARGIN + (index % 3) * 61;
        const fy = y + 55 + Math.floor(index / 3) * 10;
        setText(doc, INK, 8.2, "bold");
        doc.text(fact, fx, fy);
      });

      setText(doc, MUTED, 6.5, "bold");
      doc.text(clean(`${item.propertyType || "Type non précisé"} - Terrain ${item.lotArea ? `${number(item.lotArea)} pi²` : "n/d"} - Garage : ${item.garage || "n/d"}`), MARGIN, y + 72, { maxWidth: 178 });

      setText(doc, INK, 8, "bold");
      doc.text("Pourquoi ce comparable", MARGIN, y + 81);
      paragraph(doc, item.reason || "Comparable retenu selon le jugement professionnel du courtier.", MARGIN, y + 88, 117, 7.4, MUTED, 1.2);
      setText(doc, MUTED, 6.8);
      doc.text(clean(`Source : ${item.sourceReference || item.source || "Saisie vérifiée"}${item.verifiedOn ? ` - Vérifiée le ${item.verifiedOn}` : ""}`), PAGE_W - MARGIN, y + 91, { align: "right", maxWidth: 55 });

      if (itemIndex === 0 && items.length > 1) {
        doc.setDrawColor(...LINE);
        doc.line(MARGIN, y + 96, PAGE_W - MARGIN, y + 96);
      }
    });
  });
}

function drawRecommendation(doc: jsPDF, included: Comparable[], assets: ReportAssets, subject: SubjectProperty) {
  doc.addPage();
  header(doc, "Positionnement recommandé", "07 - Stratégie", assets.logo, assets.branding?.logoDataUrl);
  const soldAdjusted = included.filter((item) => item.status === "Vendue").map((item) => item.adjusted);
  const base = median(soldAdjusted.length ? soldAdjusted : included.map((item) => item.adjusted));
  const low = subject.priceOffensive || Math.round(base * .977 / 100000) * 100000;
  const high = subject.priceOptimistic || Math.round(base * 1.03 / 100000) * 100000;
  const launch = subject.priceRealistic || Math.round(base * 1.01 / 100000) * 100000;

  doc.setFillColor(...NAVY);
  doc.roundedRect(MARGIN, 53, PAGE_W - MARGIN * 2, 58, 5, 5, "F");
  setText(doc, [155, 190, 255], 8, "bold");
  doc.text("FOURCHETTE DE POSITIONNEMENT", MARGIN + 9, 67);
  setText(doc, [255, 255, 255], 24, "bold");
  doc.text(`${cad(low)} - ${cad(high)}`, MARGIN + 9, 84);
  setText(doc, [205, 218, 242], 9);
  doc.text(`Prix de lancement suggéré : ${cad(launch)}`, MARGIN + 9, 99);

  const scenarios = [
    { title: "Offensif", price: low, text: "Accélère les visites et réduit le risque de stagnation, avec plus de pression sur le prix." },
    { title: "Réaliste", price: launch, text: "Équilibre la valeur démontrée, la concurrence actuelle et le comportement des acheteurs." },
    { title: "Optimiste", price: high, text: "Teste le haut du marché avec un délai potentiel plus long et moins de visites." },
  ];
  scenarios.forEach((scenario, index) => {
    const x = MARGIN + index * 61;
    doc.setFillColor(...(index === 1 ? BLUE_PALE : PALE));
    doc.roundedRect(x, 125, 55, 63, 4, 4, "F");
    setText(doc, index === 1 ? BLUE_DARK : MUTED, 7.5, "bold");
    doc.text(scenario.title.toUpperCase(), x + 5, 136);
    setText(doc, index === 1 ? BLUE_DARK : INK, 14, "bold");
    doc.text(cad(scenario.price), x + 5, 150);
    paragraph(doc, scenario.text, x + 5, 160, 45, 7.4, MUTED, 1.3);
  });

  setText(doc, INK, 13, "bold");
  doc.text("Ce que cette recommandation signifie", MARGIN, 211);
  paragraph(doc, "Le prix de lancement n'est pas une promesse de prix de vente. Il s'agit d'un positionnement stratégique qui devra être réévalué selon les nouvelles inscriptions, les visites, les offres reçues et l'évolution du marché local.", MARGIN, 221, PAGE_W - MARGIN * 2, 9.3, MUTED, 1.5);
  doc.setFillColor(...BLUE_PALE);
  doc.roundedRect(MARGIN, 246, PAGE_W - MARGIN * 2, 15, 3, 3, "F");
  setText(doc, BLUE_DARK, 8.2, "bold");
  doc.text("Prochaine étape : valider ensemble le scénario qui correspond à votre échéancier.", MARGIN + 6, 255.5);
}

function drawMethod(doc: jsPDF, included: Comparable[], assets: ReportAssets, subject: SubjectProperty) {
  doc.addPage();
  header(doc, "Une conclusion traçable", "08 - Méthodologie", assets.logo, assets.branding?.logoDataUrl);
  const blocks = [
    ["1. Sélection", `${included.length} propriétés retenues selon la proximité, la date, le type, la superficie et l'état général.`],
    ["2. Vérification", "Les renseignements proviennent des sources indiquées dans chaque fiche. Les prix vendus doivent être confirmés avant diffusion."],
    ["3. Ajustements", "Les différences significatives sont traduites en ajustements documentés par le courtier. Aucun ajustement n'est automatique."],
    ["4. Recommandation", "La fourchette combine les valeurs ajustées, la concurrence active et le jugement professionnel appliqué au contexte du vendeur."],
  ];
  blocks.forEach(([title, body], index) => {
    const y = 54 + index * 34;
    doc.setFillColor(...(index % 2 ? PALE : BLUE_PALE));
    doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 27, 4, 4, "F");
    setText(doc, index % 2 ? NAVY : BLUE_DARK, 10, "bold");
    doc.text(title, MARGIN + 7, y + 10);
    paragraph(doc, body, MARGIN + 48, y + 9, PAGE_W - MARGIN * 2 - 55, 8, MUTED, 1.35);
  });

  const documents = [...new Set(included.flatMap((item) => item.documents || []))];
  setText(doc, INK, 10.5, "bold");
  doc.text("Sources et pièces consultées", MARGIN, 196);
  paragraph(doc, documents.join(" - ") || "Sources indiquées dans les fiches comparables.", MARGIN, 203, PAGE_W - MARGIN * 2, 7.4, MUTED, 1.25);
  setText(doc, INK, 10.5, "bold");
  doc.text("Notes du courtier", MARGIN, 220);
  paragraph(doc, subject.includeBrokerNote === false ? "Note du courtier non incluse à la demande de l'auteur." : (subject.brokerNote?.trim() || "La fourchette recommandée repose principalement sur les ventes ajustées. L'inscription active mesure la concurrence sans être traitée comme une vente réalisée."), MARGIN, 227, PAGE_W - MARGIN * 2, 7.4, MUTED, 1.25);
  setText(doc, INK, 10.5, "bold");
  doc.text("Avis important", MARGIN, 244);
  paragraph(doc, "Cette ACM est une opinion de valeur pour la mise en marché. Elle ne constitue pas une évaluation agréée, une garantie de prix ou un avis juridique.", MARGIN, 251, 130, 7.1, MUTED, 1.2);

  const sigLogo = assets.branding?.logoDataUrl || assets.logo;
  if (sigLogo) {
    try {
      doc.setFillColor(...NAVY);
      doc.roundedRect(155, 245, 37, 18, 2.5, 2.5, "F");
      doc.addImage(sigLogo, "PNG", 158, 247, 31, 14);
    } catch {
      // Leave the signature area clean when the full logo cannot be embedded.
    }
  }
  const sigName = assets.branding?.brokerName || "";
  const sigTitle = assets.branding?.brokerTitle || "";
  const sigAgency = assets.branding?.agencyName || "";
  if (sigName || sigTitle || sigAgency) {
    setText(doc, INK, 7.5, "bold");
    doc.text(clean(sigName), 173.5, 266, { align: "center" });
    setText(doc, MUTED, 6.5);
    if (sigTitle) doc.text(clean(sigTitle), 173.5, 270, { align: "center" });
    if (sigAgency) doc.text(clean(sigAgency), 173.5, 274, { align: "center" });
  } else {
    setText(doc, MUTED, 6.8);
    doc.text("ACM Studio par Ocliq", 173.5, 266, { align: "center" });
  }
}

function drawAnnexes(doc: jsPDF, assets: ReportAssets, subject: SubjectProperty) {
  const annexes = (subject.annexes ?? []).filter((item) => item.title.trim() || item.note.trim());
  if (!annexes.length) return;
  doc.addPage();
  header(doc, "Annexes du dossier", "09 - Annexes", assets.logo, assets.branding?.logoDataUrl);
  paragraph(doc, "Les pièces suivantes accompagnent l'analyse. Elles documentent le rôle municipal, la localisation et tout élément que le courtier juge utile à la décision du vendeur.", MARGIN, 53, PAGE_W - MARGIN * 2, 9.3, MUTED, 1.4);
  annexes.slice(0, 6).forEach((annexe, index) => {
    const y = 72 + index * 28;
    doc.setFillColor(...(index % 2 ? PALE : BLUE_PALE));
    doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 24, 4, 4, "F");
    setText(doc, BLUE_DARK, 7, "bold");
    doc.text(`${String(index + 1).padStart(2, "0")}  ${clean(annexe.kind).toUpperCase()}`, MARGIN + 6, y + 8);
    setText(doc, INK, 11, "bold");
    doc.text(clean(annexe.title || annexe.kind), MARGIN + 6, y + 15.5);
    if (annexe.note) {
      setText(doc, MUTED, 8);
      doc.text(clean(annexe.note).slice(0, 110), MARGIN + 6, y + 21);
    }
  });
}

export function buildAcmPdf(comparables: Comparable[], assets: ReportAssets = {}, subject: SubjectProperty = initialSubject) {
  const included = comparables.filter((item) => item.included);
  const reportComparables = included.length ? included : comparables.slice(0, 5);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter", compress: true });
  const brandInfo = assets.branding;
  const pdfAuthor = brandInfo?.brokerName || "Courtier";
  const pdfCreator = brandInfo?.agencyName ? `ACM Studio · ${brandInfo.agencyName}` : "ACM Studio par Ocliq";
  doc.setProperties({
    title: `Analyse comparative de marché - ${subject.address}`,
    subject: "Analyse comparative de marché",
    author: pdfAuthor,
    creator: pdfCreator,
  });
  drawCover(doc, reportComparables, assets, subject);
  doc.addPage();
  drawSummary(doc, reportComparables, assets, subject);
  drawValueContext(doc, reportComparables, assets);
  drawMarketRatios(doc, reportComparables, assets);
  drawValuationMethods(doc, reportComparables, assets, subject);
  doc.addPage();
  drawComparison(doc, reportComparables, assets);
  drawComparablePages(doc, reportComparables, assets);
  drawRecommendation(doc, reportComparables, assets, subject);
  drawAnnexes(doc, assets, subject);
  drawMethod(doc, reportComparables, assets, subject);
  const footerLabel = brandInfo?.agencyName
    ? `ACM · ${brandInfo.agencyName} - Document confidentiel`
    : "Analyse comparative de marché - Document confidentiel";
  const total = doc.getNumberOfPages();
  for (let page = 2; page <= total; page += 1) {
    doc.setPage(page);
    addFooter(doc, page, total, footerLabel);
  }
  return doc;
}

async function loadImage(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(6_500) });
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

async function createAcmPdf(comparables: Comparable[], subject: SubjectProperty = initialSubject, branding?: BrokerBranding & { brokerName?: string }) {
  const included = comparables.filter((item) => item.included).slice(0, 7);
  const hasCoordinates = typeof subject.latitude === "number" && typeof subject.longitude === "number";
  const subjectPhoto = hasCoordinates
    ? propertyStreetViewUrl(subject.latitude!, subject.longitude!)
    : (subject.image || "");
  const [logo, subjectImage, subjectMap, subjectStreetView, images] = await Promise.all([
    loadImage("/ocliq-logo.png"),
    loadImage(subjectPhoto),
    hasCoordinates ? loadImage(propertyMapUrl(subject.latitude!, subject.longitude!, "roadmap")) : Promise.resolve(undefined),
    hasCoordinates ? loadImage(propertyStreetViewUrl(subject.latitude!, subject.longitude!)) : Promise.resolve(undefined),
    Promise.all(included.map(async (item) => {
      const photo = typeof item.latitude === "number" && typeof item.longitude === "number"
        ? propertyStreetViewUrl(item.latitude, item.longitude)
        : item.image;
      return [item.id, await loadImage(photo)] as const;
    })),
  ]);
  const comparableImages = Object.fromEntries(images.filter((entry): entry is readonly [string, string] => Boolean(entry[1])));
  return buildAcmPdf(comparables, { logo, subjectImage, subjectMap, subjectStreetView, comparableImages, branding }, subject);
}

export async function generateAcmPdf(comparables: Comparable[], subject: SubjectProperty = initialSubject, branding?: BrokerBranding & { brokerName?: string }) {
  const doc = await createAcmPdf(comparables, subject, branding);
  const slug = branding?.agencyName || "Ocliq";
  doc.save(`ACM-${slug}-${subject.address || "nouvelle-analyse"}.pdf`);
}

export async function createAcmPdfPreviewUrl(comparables: Comparable[], subject: SubjectProperty = initialSubject, branding?: BrokerBranding & { brokerName?: string }) {
  const doc = await createAcmPdf(comparables, subject, branding);
  return URL.createObjectURL(doc.output("blob"));
}
