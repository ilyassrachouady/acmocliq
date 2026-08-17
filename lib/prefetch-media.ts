import { propertyMapUrl, propertyStreetViewUrl, type Comparable, type SubjectProperty } from "@/lib/demo-data";

const warmed = new Set<string>();

function collectUrls(subject?: SubjectProperty | null, comparables: Comparable[] = []) {
  const urls = new Set<string>();
  if (typeof subject?.latitude === "number" && typeof subject?.longitude === "number") {
    urls.add(propertyStreetViewUrl(subject.latitude, subject.longitude));
    urls.add(propertyMapUrl(subject.latitude, subject.longitude));
    urls.add(propertyMapUrl(subject.latitude, subject.longitude, "satellite"));
  } else if (subject?.image) {
    urls.add(subject.image);
  }
  for (const item of comparables) {
    if (item.image) urls.add(item.image);
    if (typeof item.latitude === "number" && typeof item.longitude === "number") {
      urls.add(propertyStreetViewUrl(item.latitude, item.longitude));
      urls.add(propertyMapUrl(item.latitude, item.longitude));
    }
  }
  return [...urls].filter(Boolean);
}

function warmUrl(url: string) {
  if (!url || warmed.has(url) || typeof window === "undefined") return Promise.resolve(false);
  warmed.add(url);
  return new Promise<boolean>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(true);
    image.onerror = () => {
      warmed.delete(url);
      resolve(false);
    };
    image.src = url;
  });
}

/** Prefetch Street View / map assets so the next step paints with images already ready. */
export async function prefetchPropertyMedia(subject?: SubjectProperty | null, comparables: Comparable[] = [], concurrency = 4) {
  const urls = collectUrls(subject, comparables).filter((url) => !warmed.has(url));
  if (!urls.length) return;
  for (let index = 0; index < urls.length; index += concurrency) {
    await Promise.all(urls.slice(index, index + concurrency).map(warmUrl));
  }
}

export function mediaUrlsFor(subject?: SubjectProperty | null, comparables: Comparable[] = []) {
  return collectUrls(subject, comparables);
}
