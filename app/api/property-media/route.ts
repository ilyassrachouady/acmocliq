import { NextRequest, NextResponse } from "next/server";

const canadaBounds = {
  minLatitude: 41.5,
  maxLatitude: 83.2,
  minLongitude: -141.1,
  maxLongitude: -52.5,
};

function validCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= canadaBounds.minLatitude
    && latitude <= canadaBounds.maxLatitude
    && longitude >= canadaBounds.minLongitude
    && longitude <= canadaBounds.maxLongitude;
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Aucune clé Google Maps configurée." }, { status: 503 });

  const type = request.nextUrl.searchParams.get("type");
  const latitude = Number(request.nextUrl.searchParams.get("lat"));
  const longitude = Number(request.nextUrl.searchParams.get("lng"));
  if (!validCoordinate(latitude, longitude)) {
    return NextResponse.json({ error: "Coordonnées invalides." }, { status: 400 });
  }

  const coordinates = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  const upstream = new URL(type === "streetview"
    ? "https://maps.googleapis.com/maps/api/streetview"
    : "https://maps.googleapis.com/maps/api/staticmap");

  if (type === "streetview") {
    upstream.searchParams.set("size", "640x420");
    upstream.searchParams.set("location", coordinates);
    upstream.searchParams.set("fov", "88");
    upstream.searchParams.set("pitch", "4");
    upstream.searchParams.set("source", "outdoor");
    const heading = request.nextUrl.searchParams.get("heading");
    if (heading !== null && Number.isFinite(Number(heading))) {
      upstream.searchParams.set("heading", String(((Number(heading) % 360) + 360) % 360));
    }
  } else if (type === "map") {
    const mapType = request.nextUrl.searchParams.get("mode") === "satellite" ? "satellite" : "roadmap";
    upstream.searchParams.set("size", "640x420");
    upstream.searchParams.set("scale", "2");
    upstream.searchParams.set("center", coordinates);
    upstream.searchParams.set("zoom", mapType === "satellite" ? "19" : "17");
    upstream.searchParams.set("maptype", mapType);
    upstream.searchParams.set("language", "fr");
    upstream.searchParams.set("region", "ca");
    upstream.searchParams.set("markers", `color:0x246BFD|${coordinates}`);
  } else {
    return NextResponse.json({ error: "Type de média invalide." }, { status: 400 });
  }

  upstream.searchParams.set("key", apiKey);

  try {
    const response = await fetch(upstream, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      return NextResponse.json({ error: "Aperçu Google temporairement indisponible." }, { status: response.status });
    }
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Google Maps ne répond pas pour le moment." }, { status: 504 });
  }
}
