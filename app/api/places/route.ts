import { NextRequest, NextResponse } from "next/server";

type AddressSuggestion = {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
  city?: string;
  postalCode?: string;
};

const demoAddresses: AddressSuggestion[] = [
  { placeId: "demo-gougeon", text: "689, rue Gougeon, Laval, QC H7X 4C5", mainText: "689, rue Gougeon", secondaryText: "Laval, QC H7X 4C5", city: "Laval", postalCode: "H7X 4C5" },
  { placeId: "demo-pins", text: "218, rue des Pins, Rouyn-Noranda, QC J9X 4N7", mainText: "218, rue des Pins", secondaryText: "Rouyn-Noranda, QC J9X 4N7", city: "Rouyn-Noranda", postalCode: "J9X 4N7" },
  { placeId: "demo-champlain", text: "94, avenue Champlain, Rouyn-Noranda, QC J9X 2K4", mainText: "94, avenue Champlain", secondaryText: "Rouyn-Noranda, QC J9X 2K4", city: "Rouyn-Noranda", postalCode: "J9X 2K4" },
  { placeId: "demo-saint-urbain", text: "4240, rue Saint-Urbain, Montréal, QC H2W 1V5", mainText: "4240, rue Saint-Urbain", secondaryText: "Montréal, QC H2W 1V5", city: "Montréal", postalCode: "H2W 1V5" },
  { placeId: "demo-guilford", text: "1682, rue Guilford, Montréal, QC H2J 1S4", mainText: "1682, rue Guilford", secondaryText: "Montréal, QC H2J 1S4", city: "Montréal", postalCode: "H2J 1S4" },
  { placeId: "demo-gohier", text: "935, rue Gohier, Montréal, QC H4L 3J2", mainText: "935, rue Gohier", secondaryText: "Saint-Laurent, QC H4L 3J2", city: "Montréal", postalCode: "H4L 3J2" },
];

function demoSuggestions(query: string) {
  const normalize = (value: string) => value.toLocaleLowerCase("fr-CA").replace(/[^a-z0-9à-ÿ]+/g, " ").trim();
  const normalized = normalize(query);
  const matches = demoAddresses.filter((item) => normalize(item.text).includes(normalized));
  return matches.length ? matches.slice(0, 5) : demoAddresses.filter((item) => /rouyn|laval|montréal/i.test(item.text)).slice(0, 4);
}

function addressComponent(components: Array<{ longText?: string; shortText?: string; types?: string[] }>, types: string[]) {
  return components.find((component) => component.types?.some((type) => types.includes(type)));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const placeId = request.nextUrl.searchParams.get("placeId")?.trim() ?? "";
  const sessionToken = request.nextUrl.searchParams.get("sessionToken")?.trim() ?? "";
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (placeId.startsWith("demo-")) {
    const match = demoAddresses.find((item) => item.placeId === placeId);
    return NextResponse.json(match ?? null);
  }

  if (placeId && apiKey) {
    const resourceId = placeId.startsWith("places/") ? placeId.slice("places/".length) : placeId;
    let response: Response;
    try {
      response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(resourceId)}?languageCode=fr&regionCode=ca${sessionToken ? `&sessionToken=${encodeURIComponent(sessionToken)}` : ""}`, {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "formattedAddress,addressComponents,location",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      return NextResponse.json({ error: "Google Places ne répond pas pour le moment." }, { status: 504 });
    }
    if (!response.ok) return NextResponse.json({ error: "Impossible de récupérer cette adresse." }, { status: response.status });
    const place = await response.json() as { formattedAddress?: string; addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>; location?: { latitude?: number; longitude?: number } };
    const components = place.addressComponents ?? [];
    const city = addressComponent(components, ["locality", "postal_town", "administrative_area_level_3"])?.longText ?? "";
    const postalCode = addressComponent(components, ["postal_code"])?.longText ?? "";
    return NextResponse.json({
      text: place.formattedAddress ?? "",
      city,
      postalCode,
      placeId: resourceId,
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
    });
  }

  if (query.length < 3) return NextResponse.json({ provider: apiKey ? "google" : "demo", suggestions: [] });
  if (!apiKey) return NextResponse.json({ provider: "demo", suggestions: demoSuggestions(query) });

  let response: Response | null = null;
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.place,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
        },
        body: JSON.stringify({
          input: query,
          includedRegionCodes: ["ca"],
          languageCode: "fr",
          regionCode: "ca",
          sessionToken: sessionToken || undefined,
          locationBias: {
            rectangle: {
              low: { latitude: 44.9, longitude: -79.8 },
              high: { latitude: 62.6, longitude: -57.1 },
            },
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(attempt === 0 ? 5_000 : 8_000),
      });
      if (response.ok) break;
      lastError = `HTTP ${response.status}`;
      response = null;
    } catch {
      lastError = "timeout";
      response = null;
    }
  }
  if (!response) {
    return NextResponse.json({
      provider: "google",
      suggestions: [],
      warning: lastError === "timeout"
        ? "Google Places ne répond pas pour le moment."
        : "Les suggestions Google sont temporairement indisponibles.",
    }, { status: 503 });
  }
  const result = await response.json() as {
    suggestions?: Array<{ placePrediction?: { placeId?: string; place?: string; text?: { text?: string }; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } } } }>;
  };
  const suggestions = (result.suggestions ?? []).flatMap<AddressSuggestion>((item) => {
    const prediction = item.placePrediction;
    const rawId = prediction?.placeId || prediction?.place || "";
    const normalizedId = rawId.startsWith("places/") ? rawId.slice("places/".length) : rawId;
    if (!normalizedId || !prediction?.text?.text) return [];
    return [{
      placeId: normalizedId,
      text: prediction.text.text,
      mainText: prediction.structuredFormat?.mainText?.text ?? prediction.text.text,
      secondaryText: prediction.structuredFormat?.secondaryText?.text ?? "Québec, Canada",
    }];
  });
  return NextResponse.json({ provider: "google", suggestions: suggestions.slice(0, 5) });
}
