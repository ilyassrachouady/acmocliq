import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the French-Canadian ACM workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="fr-CA">/i);
  assert.match(html, /<title>ACM Studio par Ocliq<\/title>/i);
  assert.match(html, /Choisir les bonnes propriétés comparables/);
  assert.match(html, /Données de démonstration/);
  assert.match(html, />Partager</);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("ships the branded metadata and localized product structure", async () => {
  const [layout, page, locale, product, packageJson] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/fr-ca.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/studio-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /locale: "fr_CA"/);
  assert.match(layout, /images: \[\{ url: "\/og\.png"/);
  assert.match(page, /<StudioApp \/>/);
  assert.match(locale, /Analyse comparative du marché/);
  assert.match(product, /role="switch"/);
  assert.match(product, /Aucune donnée Centris\/MLS n’est récupérée/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(new URL("../public/og.png", import.meta.url));
});
