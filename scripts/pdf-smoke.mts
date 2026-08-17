/**
 * Node smoke test for the ACM PDF builder.
 * Verifies the report renders end-to-end without image assets (the worst case in
 * production, where Google media may be unavailable) and with broker branding.
 * Run: npx tsx scripts/pdf-smoke.mts
 */
import { writeFileSync } from "node:fs";
import { buildAcmPdf } from "../lib/generate-acm-pdf";
import { initialComparables, initialSubject } from "../lib/demo-data";
import { defaultBranding } from "../lib/acm-repository";

function report(label: string, doc: ReturnType<typeof buildAcmPdf>, out: string) {
  const bytes = doc.output("arraybuffer") as ArrayBuffer;
  writeFileSync(out, Buffer.from(bytes));
  console.log(`${label}: pages=${doc.getNumberOfPages()} size=${(bytes.byteLength / 1024).toFixed(1)}KB -> ${out}`);
}

const branding = {
  ...defaultBranding,
  brokerName: "Marie-Ève Tremblay",
  brokerTitle: "Courtière immobilière résidentielle",
  agencyName: "Groupe Sutton Excellence",
  slogan: "Vendre au juste prix, sans compromis.",
};

report("no assets, no branding", buildAcmPdf(initialComparables, {}, initialSubject), "/tmp/acm-plain.pdf");
report("no assets, branded    ", buildAcmPdf(initialComparables, { branding }, initialSubject), "/tmp/acm-branded.pdf");

const emptySubject = { ...initialSubject, annexes: [], introduction: "", brokerNote: "", priceOffensive: 0, priceRealistic: 0, priceOptimistic: 0 };
report("empty optional fields ", buildAcmPdf(initialComparables, { branding }, emptySubject), "/tmp/acm-empty.pdf");

const noneIncluded = initialComparables.map((item) => ({ ...item, included: false }));
report("nothing retained      ", buildAcmPdf(noneIncluded, { branding }, initialSubject), "/tmp/acm-none.pdf");

report("single comparable     ", buildAcmPdf([{ ...initialComparables[0], included: true }], { branding }, initialSubject), "/tmp/acm-one.pdf");
