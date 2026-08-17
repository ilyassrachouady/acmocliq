"use client";

/* Remote demonstration photography is intentionally rendered without the production image provider. */
/* eslint-disable @next/next/no-img-element */

import { FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { archiveReport, createWorkspace, listReports, loadProfile, loadWorkspace, markReportReady, saveProfile, saveWorkspace, signOut, type AcmReportSummary, type BrokerProfile } from "@/lib/acm-repository";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BadgeDollarSign,
  Bell,
  Building2,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  CircleHelp,
  ContactRound,
  Database,
  Download,
  Eye,
  FileStack,
  FileCheck2,
  Files,
  Grid2X2,
  House,
  LayoutDashboard,
  List,
  LoaderCircle,
  LogOut,
  Map,
  MapPin,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Palette,
  Save,
  Search,
  Settings,
  ShieldCheck,
  ClipboardCheck,
  Copy,
  Keyboard,
  Mail,
  SlidersHorizontal,
  Sparkles,
  SquarePen,
  Target,
  Upload,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { frCA } from "@/lib/fr-ca";
import { prefetchPropertyMedia } from "@/lib/prefetch-media";
import {
  Comparable,
  ComparableSource,
  ComparableStatus,
  formatCAD,
  formatSignedCAD,
  initialComparables,
  initialSubject,
  marketTrend,
  propertyStreetViewUrl,
  propertyMapUrl,
  tenant,
  type SubjectProperty,
} from "@/lib/demo-data";

const navIcons = [
  FileStack,
  Files,
  Settings,
];

const statusOptions: Array<"Toutes" | ComparableStatus> = [
  "Toutes",
  "Vendue",
  "En vigueur",
  "Expirée",
  "Retirée",
];

const stepVisuals = [House, Grid2X2, SlidersHorizontal, Target, Files, ShieldCheck];

const blankSubject: SubjectProperty = { ...initialSubject, address: "", city: "", postalCode: "", owners: "", phone: "", email: "", context: "", year: 0, beds: 0, baths: 0, area: 0, assessment: 0, latitude: undefined, longitude: undefined, image: undefined };

type ResolvedAddress = {
  text: string;
  city?: string;
  postalCode?: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
};

type AddressSuggestion = ResolvedAddress & {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

function AddressAutocomplete({ defaultValue = "", onResolved }: { defaultValue?: string; onResolved: (address: ResolvedAddress) => void }) {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [provider, setProvider] = useState<"google" | "demo">("demo");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState("");
  const [resolvedLocation, setResolvedLocation] = useState<ResolvedAddress | null>(null);
  const sessionToken = useRef("");
  const skipNextSearch = useRef(false);
  const requestId = useRef(0);
  const blurTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!sessionToken.current) sessionToken.current = crypto.randomUUID();
  }, []);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const query = value.trim();
    if (query.length < 3) {
      requestId.current += 1;
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      setError("");
      return;
    }
    const controller = new AbortController();
    const currentRequest = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/places?q=${encodeURIComponent(query)}&sessionToken=${encodeURIComponent(sessionToken.current)}`, { signal: controller.signal });
        const result = await response.json() as { provider?: "google" | "demo"; suggestions?: AddressSuggestion[]; warning?: string };
        if (currentRequest !== requestId.current) return;
        setProvider(result.provider ?? "demo");
        if (response.ok) {
          setSuggestions(result.suggestions ?? []);
          setActiveIndex(-1);
          setOpen(true);
          setError("");
        } else {
          setOpen(true);
          setError(result.warning || "Les suggestions sont momentanément indisponibles. Vous pouvez saisir l’adresse manuellement.");
        }
      } catch (error) {
        if ((error as Error).name === "AbortError" || currentRequest !== requestId.current) return;
        setOpen(true);
        setError("Les suggestions sont momentanément indisponibles. Vous pouvez saisir l’adresse manuellement.");
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    }, 280);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value]);

  const choose = async (suggestion: AddressSuggestion) => {
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
    const postalCode = suggestion.secondaryText.match(/[A-Z]\d[A-Z][ -]?\d[A-Z]\d/i)?.[0]?.toUpperCase();
    const city = suggestion.secondaryText.split(",")[0]?.trim();
    skipNextSearch.current = true;
    requestId.current += 1;
    setValue(suggestion.text);
    setSuggestions([]);
    setOpen(false);
    setError("");
    setLoading(false);
    onResolved({ ...suggestion, city, postalCode });
    try {
      const response = await fetch(`/api/places?placeId=${encodeURIComponent(suggestion.placeId)}&sessionToken=${encodeURIComponent(sessionToken.current)}`);
      if (!response.ok) throw new Error("Détails indisponibles");
      const details = await response.json() as ResolvedAddress;
      if (details.text) {
        skipNextSearch.current = true;
        setValue(details.text);
        setResolvedLocation(details);
        onResolved(details);
      }
    } catch {
      setError("Adresse sélectionnée. La carte est momentanément indisponible, mais vous pouvez poursuivre.");
    } finally {
      sessionToken.current = crypto.randomUUID();
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      void choose(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="address-autocomplete">
      <div className="input-with-icon"><span className="address-field-icon"><MapPin size={17}/></span><input name="address" autoComplete="off" value={value} onChange={(event) => { setValue(event.target.value); setResolvedLocation(null); onResolved({ text: event.target.value }); }} onFocus={() => { if (blurTimer.current) window.clearTimeout(blurTimer.current); if (suggestions.length || error) setOpen(true); }} onBlur={() => { blurTimer.current = window.setTimeout(() => setOpen(false), 220); }} onKeyDown={onKeyDown} placeholder="Commencez à saisir une adresse" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls="address-suggestions" aria-activedescendant={activeIndex >= 0 ? `address-option-${activeIndex}` : undefined} required/>{loading && <LoaderCircle className="address-loader" size={17}/>}</div>
      {open && <div id="address-suggestions" className="address-suggestions" role="listbox">
        <div className="address-suggestions-head"><span className="ocliq-mini-mark">O</span><span><strong>Adresses suggérées</strong><small>Propulsé dans votre espace Ocliq</small></span></div>
        {suggestions.length ? suggestions.map((suggestion, index) => <button id={`address-option-${index}`} type="button" role="option" aria-selected={activeIndex === index} className={activeIndex === index ? "active" : ""} key={suggestion.placeId} onMouseDown={(event) => event.preventDefault()} onClick={() => void choose(suggestion)}><span className="suggestion-pin"><MapPin size={16}/></span><span><strong>{suggestion.mainText}</strong><small>{suggestion.secondaryText}</small></span></button>) : <div className="address-empty">{error || "Aucune adresse trouvée. Vous pouvez continuer la saisie manuellement."}</div>}
        <div className="address-provider">{provider === "google" ? <img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png" alt="Powered by Google"/> : <><span>DÉMO</span> Suggestions locales — Google Places à connecter</>}</div>
      </div>}
      {!open && error && <p className="address-inline-error" role="status">{error}</p>}
      {resolvedLocation?.text && typeof resolvedLocation.latitude === "number" && typeof resolvedLocation.longitude === "number" && <PropertyLocationPreview location={{ text: resolvedLocation.text, placeId: resolvedLocation.placeId, latitude: resolvedLocation.latitude, longitude: resolvedLocation.longitude }}/>} 
    </div>
  );
}

function PropertyLocationPreview({ location }: { location: Required<Pick<ResolvedAddress, "text" | "latitude" | "longitude">> & Pick<ResolvedAddress, "placeId"> }) {
  const [heading, setHeading] = useState<number | null>(null);
  const [mapMode, setMapMode] = useState<"roadmap" | "satellite">("roadmap");
  const [expanded, setExpanded] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [streetFailed, setStreetFailed] = useState(false);
  const coordinates = `${location.latitude.toFixed(6)},${location.longitude.toFixed(6)}`;
  const sharedParams = `lat=${encodeURIComponent(location.latitude)}&lng=${encodeURIComponent(location.longitude)}`;
  const mapSrc = `/api/property-media?type=map&${sharedParams}&mode=${mapMode}`;
  const streetSrc = `/api/property-media?type=streetview&${sharedParams}${heading === null ? "" : `&heading=${heading}`}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}${location.placeId ? `&query_place_id=${encodeURIComponent(location.placeId)}` : ""}`;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(coordinates)}`;

  const rotate = (direction: -1 | 1) => {
    setStreetFailed(false);
    setHeading((current) => ((current ?? 0) + direction * 45 + 360) % 360);
  };

  return (
    <section className={`property-location-preview span-2 ${expanded ? "is-expanded" : ""}`} aria-label="Aperçu cartographique de la propriété">
      <header className="location-preview-heading">
        <div><span className="location-preview-icon"><MapPin size={17}/></span><span><strong>Propriété localisée</strong><small>{location.text}</small></span></div>
        <button type="button" className="preview-expand" onClick={() => setExpanded((value) => !value)}><Eye size={16}/>{expanded ? "Réduire" : "Agrandir"}</button>
      </header>
      <div className="location-visual-grid">
        <article className="location-visual-card">
          <div className="visual-card-heading"><span><Map size={15}/> Carte du secteur</span><div className="map-mode-switch" aria-label="Type de carte"><button type="button" className={mapMode === "roadmap" ? "active" : ""} onClick={() => { setMapFailed(false); setMapMode("roadmap"); }}>Plan</button><button type="button" className={mapMode === "satellite" ? "active" : ""} onClick={() => { setMapFailed(false); setMapMode("satellite"); }}>Satellite</button></div></div>
          <div className="location-media">
            {!mapFailed ? <img src={mapSrc} alt={`Carte de ${location.text}`} onError={() => setMapFailed(true)}/> : <div className="media-unavailable"><Map size={24}/><strong>Carte indisponible</strong><span>Activez Maps Static API dans Google Cloud.</span></div>}
          </div>
        </article>
        <article className="location-visual-card street-view-card">
          <div className="visual-card-heading"><span><Eye size={15}/> Façade · Street View</span><b>360°</b></div>
          <div className="location-media">
            {!streetFailed ? <img key={streetSrc} src={streetSrc} alt={`Vue Street View de ${location.text}`} onError={() => setStreetFailed(true)}/> : <div className="media-unavailable"><Eye size={24}/><strong>Street View indisponible</strong><span>Aucune image publique trouvée ou API non activée.</span></div>}
            {!streetFailed && <div className="street-controls"><button type="button" onClick={() => rotate(-1)} aria-label="Tourner la vue vers la gauche"><ArrowLeft size={17}/></button><span>{heading === null ? "Façade" : `${heading}°`}</span><button type="button" onClick={() => rotate(1)} aria-label="Tourner la vue vers la droite"><ArrowRight size={17}/></button></div>}
          </div>
        </article>
      </div>
      <footer className="location-preview-footer"><span>Images Google selon la couverture disponible.</span><div><a href={googleMapsUrl} target="_blank" rel="noreferrer">Ouvrir la carte ↗</a><a className="immersive-link" href={streetViewUrl} target="_blank" rel="noreferrer">Explorer en 360° ↗</a></div></footer>
      {expanded && <button type="button" className="expanded-close" onClick={() => setExpanded(false)} aria-label="Fermer l’aperçu agrandi"><X size={20}/></button>}
    </section>
  );
}

function PropertyPhoto({
  src,
  latitude,
  longitude,
  alt,
  className = "property-photo",
  priority = false,
}: {
  src?: string;
  latitude?: number;
  longitude?: number;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const mapFallback = typeof latitude === "number" && typeof longitude === "number" ? propertyMapUrl(latitude, longitude) : "";
  const preferred = src || mapFallback;
  const [currentSrc, setCurrentSrc] = useState(preferred);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCurrentSrc(preferred);
    setFailed(false);
    setLoaded(false);
  }, [preferred]);

  useEffect(() => {
    if (loaded || failed || !currentSrc) return;
    const timer = window.setTimeout(() => {
      if (mapFallback && currentSrc !== mapFallback) {
        setCurrentSrc(mapFallback);
      } else {
        setFailed(true);
      }
    }, 7_000);
    return () => window.clearTimeout(timer);
  }, [currentSrc, failed, loaded, mapFallback]);

  if (failed || !currentSrc) {
    return (
      <div className={`${className} property-photo-fallback`} aria-label={alt}>
        <MapPin size={18} />
        <span>Aperçu carte</span>
      </div>
    );
  }

  return (
    <div className={`property-photo-frame ${loaded ? "is-loaded" : "is-loading"}`}>
      {!loaded && <span className="property-photo-skeleton" aria-hidden="true" />}
      <img
        className={`${className} ${loaded ? "is-visible" : ""}`}
        src={currentSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (mapFallback && currentSrc !== mapFallback) {
            setLoaded(false);
            setCurrentSrc(mapFallback);
          } else {
            setFailed(true);
          }
        }}
      />
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  return (
    <span className="score-ring" style={{ "--score": `${value * 3.6}deg` } as React.CSSProperties}>
      <span>{value}</span>
    </span>
  );
}

function ComparableRow({
  comparable,
  view,
  onToggle,
  expanded,
  onExpand,
  onEdit,
  priority = false,
}: {
  comparable: Comparable;
  view: "list" | "cards";
  onToggle: () => void;
  expanded: boolean;
  onExpand: () => void;
  onEdit: () => void;
  priority?: boolean;
}) {
  const deltaClass = comparable.adjustment > 0 ? "positive" : "negative";
  return (
    <article className={`comparable-row ${view} ${!comparable.included ? "excluded" : ""}`}>
      <div className="property-photo-wrap">
        <PropertyPhoto className="property-photo" src={comparable.image} latitude={comparable.latitude} longitude={comparable.longitude} alt={`Façade du ${comparable.address}`} priority={priority} />
        <span className={`status-badge status-${comparable.status.replace(" ", "-").toLowerCase()}`}>
          {comparable.status}
        </span>
        <button className="photo-more" onClick={onEdit} aria-label={`Modifier ${comparable.address}`}>
          <SquarePen size={15} />
        </button>
      </div>

      <div className="property-identity">
        <div className="address-line">
          <div>
            <h3>{comparable.address}</h3>
            <p><MapPin size={13} /> {comparable.city} · {comparable.distance.toLocaleString("fr-CA")} km</p>
          </div>
          <ScoreRing value={comparable.match} />
        </div>
        <div className="fact-row" aria-label="Caractéristiques">
          <span>{comparable.beds} ch.</span>
          <span>{comparable.baths} sdb</span>
          <span>{comparable.area.toLocaleString("fr-CA")} pi²</span>
          <span>{comparable.year}</span>
        </div>
        <button className="why-link" onClick={onExpand} aria-expanded={expanded}>
          {expanded ? "Masquer la justification" : "Pourquoi ce comparable?"}
          <ChevronDown size={14} className={expanded ? "rotate" : ""} />
        </button>
        {expanded && <p className="reason-text">{comparable.reason}</p>}
        <div className="record-meta">
          <span><Database size={12}/>{comparable.source ?? "Saisie manuelle"}</span>
          <span className={(comparable.documents?.length ?? 0) >= 3 ? "verified" : "attention"}><FileCheck2 size={12}/>{comparable.documents?.length ?? 0} preuves</span>
          <button onClick={onEdit}><SquarePen size={12}/> Modifier la fiche</button>
        </div>
      </div>

      <div className="market-facts">
        <div>
          <span className="cell-label">{comparable.status === "Vendue" ? "Prix vendu" : "Prix demandé"}</span>
          <strong>{formatCAD(comparable.price)}</strong>
        </div>
        <div>
          <span className="cell-label">Délai</span>
          <strong>{comparable.days} jours</strong>
          <small>{comparable.soldDate ?? "Sur le marché"}</small>
        </div>
      </div>

      <div className="adjusted-value">
        <span className="cell-label">Ajustement préliminaire</span>
        <span className={`delta ${deltaClass}`}>{formatSignedCAD(comparable.adjustment)}</span>
        <strong>{formatCAD(comparable.adjusted)}</strong>
        <small>valeur ajustée</small>
      </div>

      <div className="include-control">
        <button
          className={`include-toggle ${comparable.included ? "on" : ""}`}
          onClick={onToggle}
          role="switch"
          aria-checked={comparable.included}
          aria-label={`${comparable.included ? "Écarter" : "Retenir"} ${comparable.address}`}
        >
          <span><Check size={12} strokeWidth={3} /></span>
        </button>
        <b>{comparable.included ? "Retenue" : "Écartée"}</b>
      </div>
    </article>
  );
}

function MapView({ comparables, onToggle }: { comparables: Comparable[]; onToggle: (id: string) => void }) {
  const positions = [
    [42, 45], [57, 32], [35, 62], [68, 58], [51, 70], [24, 33], [76, 24],
  ];
  return (
    <div className="map-view" aria-label="Carte schématique des propriétés comparables">
      <div className="map-water map-water-one" />
      <div className="map-water map-water-two" />
      <div className="map-road road-one" />
      <div className="map-road road-two" />
      <div className="subject-pin"><House size={16} /><span>Propriété sujet</span></div>
      {comparables.map((comparable, index) => (
        <button
          key={comparable.id}
          className={`map-pin ${comparable.included ? "selected" : ""}`}
          style={{ left: `${positions[index % positions.length][0]}%`, top: `${positions[index % positions.length][1]}%` }}
          onClick={() => onToggle(comparable.id)}
          aria-label={`${comparable.address}, ${formatCAD(comparable.price)}`}
        >
          {Math.round(comparable.price / 100000)} k
        </button>
      ))}
      <div className="map-legend">
        <span><i className="dot subject" /> Sujet</span>
        <span><i className="dot selected" /> Retenue</span>
        <span><i className="dot muted" /> Écartée</span>
      </div>
    </div>
  );
}

function InsightPanel({ comparables, onContinue }: { comparables: Comparable[]; onContinue: () => void }) {
  const selected = comparables.filter((item) => item.included);
  const selectedCount = selected.length;
  const values = selected.map((item) => item.price + item.adjustment).sort((a, b) => a - b);
  const median = values.length ? values[Math.floor(values.length / 2)] : 0;
  const averageDistance = selectedCount ? selected.reduce((sum, item) => sum + item.distance, 0) / selectedCount : 0;
  const ready = selectedCount >= 3;
  return (
    <aside className="insight-panel">
      <div className="insight-top">
        <span className="insight-eyebrow"><Sparkles size={14} /> {frCA.insight.eyebrow}</span>
        <h2>{ready ? frCA.insight.title : selectedCount ? "Ajoutez encore des comparables" : "Commencez votre sélection"}</h2>
        <p>{ready ? frCA.insight.body : selectedCount ? "Une ACM défendable repose idéalement sur au moins trois ventes réellement comparables." : "Ajoutez une première propriété vendue ou en vigueur pour commencer l’analyse."}</p>
      </div>

      <div className="range-block">
        <span>{frCA.insight.range}</span>
        <strong>{values.length ? `${formatCAD(values[0])} – ${formatCAD(values[values.length - 1])}` : "À calculer"}</strong>
        <div className="range-rail"><i /><b /></div>
        <div className="range-labels"><span>350 k$</span><span>425 k$</span></div>
      </div>

      <div className="mini-metrics">
        <div><span>{frCA.insight.median}</span><strong>{median ? formatCAD(median) : "—"}</strong></div>
        <div><span>{frCA.insight.distance}</span><strong>{selectedCount ? `${averageDistance.toLocaleString("fr-CA", { maximumFractionDigits: 1 })} km` : "—"}</strong></div>
        <div><span>Comparables retenus</span><strong>{selectedCount} / {comparables.length}</strong></div>
        <div><span>{frCA.insight.confidence}</span><strong className={ready ? "quality" : ""}>{ready && <i />} {ready ? "Élevée" : "À bâtir"}</strong></div>
      </div>

      <div className="check-block">
        <h3>{frCA.insight.checks}</h3>
        <p><CheckCircle2 size={16} /> {frCA.insight.check1}</p>
        <p><CheckCircle2 size={16} /> {frCA.insight.check2}</p>
        <p className="warning"><CircleHelp size={16} /> {frCA.insight.warning}</p>
      </div>

      <button className="primary-action full" onClick={onContinue} disabled={!selectedCount}>
        {frCA.common.continue}<ArrowRight size={17} />
      </button>
      <small className="decision-note">Vous pourrez toujours revenir modifier cette sélection.</small>
    </aside>
  );
}

function DossierStep({ subject, onChange }: { subject: SubjectProperty; onChange: (subject: SubjectProperty) => void }) {
  const [editing, setEditing] = useState(!subject.address);
  const [draft, setDraft] = useState(subject);
  const update = (key: keyof SubjectProperty, value: string | number | undefined) => setDraft((current) => ({ ...current, [key]: value }));
  if (editing) return <div className="step-canvas dossier-editor-layout"><section className="editor-card dossier-editor"><div className="section-heading"><div><span className="section-kicker">RENSEIGNEMENTS ESSENTIELS</span><h2>Créer le dossier sujet</h2><p>Commencez par l’adresse, puis complétez seulement ce qui influence le rapport.</p></div></div><div className="settings-fields dossier-fields"><label className="span-2"><span>Adresse complète *</span><AddressAutocomplete defaultValue={draft.address} onResolved={(location) => setDraft((current) => ({ ...current, address: location.text, city: location.city ?? current.city, postalCode: location.postalCode ?? current.postalCode, latitude: location.latitude, longitude: location.longitude, image: typeof location.latitude === "number" && typeof location.longitude === "number" ? propertyStreetViewUrl(location.latitude, location.longitude) : current.image }))}/></label><label><span>Municipalité *</span><input value={draft.city} onChange={(e) => update("city", e.target.value)}/></label><label><span>Code postal</span><input value={draft.postalCode} onChange={(e) => update("postalCode", e.target.value)}/></label><label className="span-2"><span>Propriétaire(s) *</span><input value={draft.owners} onChange={(e) => update("owners", e.target.value)} placeholder="Nom du ou des vendeurs"/></label><label><span>Téléphone</span><input value={draft.phone} onChange={(e) => update("phone", e.target.value)}/></label><label><span>Courriel</span><input value={draft.email} onChange={(e) => update("email", e.target.value)}/></label><label><span>Type de propriété</span><select value={draft.type} onChange={(e) => update("type", e.target.value)}><option>Maison de plain-pied</option><option>Maison à étages</option><option>Condo</option><option>Duplex</option><option>Immeuble à revenus</option></select></label><label><span>Année</span><input inputMode="numeric" value={draft.year || ""} onChange={(e) => update("year", Number(e.target.value))}/></label><label><span>Chambres</span><input inputMode="numeric" value={draft.beds || ""} onChange={(e) => update("beds", Number(e.target.value))}/></label><label><span>Salles de bain</span><input inputMode="numeric" value={draft.baths || ""} onChange={(e) => update("baths", Number(e.target.value))}/></label><label><span>Superficie habitable (pi²)</span><input inputMode="numeric" value={draft.area || ""} onChange={(e) => update("area", Number(e.target.value))}/></label><label><span>Évaluation municipale</span><input inputMode="numeric" value={draft.assessment ? draft.assessment / 100 : ""} onChange={(e) => update("assessment", Number(e.target.value) * 100)}/></label><label className="span-2"><span>Contexte du vendeur</span><textarea value={draft.context} onChange={(e) => update("context", e.target.value)}/></label></div><div className="dossier-editor-actions">{subject.address && <button className="secondary-action" onClick={() => setEditing(false)}>Annuler</button>}<button className="primary-action" disabled={!draft.address || !draft.city || !draft.owners} onClick={() => { onChange(draft); setEditing(false); }}><Check/> Enregistrer le dossier</button></div></section></div>;
  return (
    <div className="step-canvas dossier-overview">
      <section className="editor-card compact-dossier-card">
        <div className="section-heading"><div><span className="section-kicker">Point de départ</span><h2>Le dossier en un coup d’œil</h2><p>Le client et la propriété sujet sont regroupés au même endroit.</p></div><button className="secondary-action" onClick={() => { setDraft(subject); setEditing(true); }}><SquarePen size={16}/> Modifier</button></div>
        <div className="dossier-summary-grid">
          <article><span className="summary-icon"><UsersRound/></span><div><small>Propriétaires</small><h3>{subject.owners}</h3><p>{subject.phone} · {subject.email}</p></div><CheckCircle2/></article>
          <article><span className="summary-icon"><House/></span><div><small>Propriété sujet</small><h3>{subject.address}</h3><p>{subject.city} · {subject.type} · {subject.beds} ch.</p></div><CheckCircle2/></article>
        </div>
        <div className="dossier-facts"><span><b>{subject.area.toLocaleString("fr-CA")}</b> pi² habitables</span><span><b>{subject.year}</b> construction</span><span><b>{formatCAD(subject.assessment)}</b> évaluation municipale</span><span><b>{subject.timeframe}</b> échéancier souhaité</span></div>
        <label className="dossier-note"><span>Contexte du vendeur</span><textarea value={subject.context} onChange={(e) => onChange({ ...subject, context: e.target.value })}/></label>
      </section>
      <aside className="context-card dossier-check"><CheckCircle2/><h3>Prêt pour les comparables</h3><p>Les renseignements essentiels du sujet sont complets. Vous pourrez les modifier en tout temps.</p><span><ShieldCheck size={15}/> Notes privées par défaut</span></aside>
    </div>
  );
}

function AdjustmentsStep({ comparables }: { comparables: Comparable[] }) {
  const selected = comparables.filter((item) => item.included).slice(0, 4);
  const [detailOpen, setDetailOpen] = useState(false);
  const rows = [
    ["Superficie habitable", "+3 500 $", "+7 000 $", "−4 000 $", "+4 500 $"],
    ["État et rénovations", "0 $", "+5 000 $", "−6 000 $", "+3 500 $"],
    ["Salle de bain", "0 $", "0 $", "0 $", "+7 500 $"],
    ["Terrain et localisation", "+1 500 $", "−3 000 $", "+3 000 $", "−1 000 $"],
  ];
  return (
    <div className="step-canvas adjustment-layout">
      <section className="editor-card matrix-card">
        <div className="section-heading"><div><span className="section-kicker">Jugement du courtier</span><h2>Matrice d’ajustements</h2><p>Les principaux facteurs sont regroupés pour une lecture rapide et cohérente.</p></div></div>
        <div className="matrix-scroll"><table className="matrix-table"><thead><tr><th>Facteur</th>{selected.map((item) => <th key={item.id}>{item.address.split(",")[0]}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}><span className={index > 0 && cell.startsWith("+") ? "matrix-positive" : index > 0 && cell.startsWith("−") ? "matrix-negative" : ""}>{cell}</span></td>)}</tr>)}</tbody><tfoot><tr><td>Ajustement total</td>{selected.map((item) => <td key={item.id}>{formatSignedCAD(item.adjustment)}</td>)}</tr></tfoot></table></div>
      </section>
      <aside className="context-card adjustment-context"><Sparkles /><span className="ai-label">Suggestion assistée</span><h3>Un écart mérite votre attention</h3><p>L’ajustement de 12 000 $ au 128, chemin Trémoy représente 2,9 % du prix demandé. Ajoutez une justification avant de valider.</p><button className="text-action" onClick={() => setDetailOpen((open) => !open)}>{detailOpen ? "Masquer le détail" : "Voir le détail"} <ChevronDown className={detailOpen ? "rotate" : ""} size={15}/></button>{detailOpen && <div className="adjustment-detail"><strong>Pourquoi le signal?</strong><p>La propriété est active, plus éloignée et son ajustement dépasse la médiane de l’échantillon. Confirmez la condition et la localisation avant publication.</p></div>}<small>L’assistant ne modifie jamais les montants.</small></aside>
    </div>
  );
}

function MarketStep() {
  return (
    <div className="step-canvas market-layout">
      <section className="editor-card chart-card">
        <div className="section-heading"><div><span className="section-kicker">6 derniers mois</span><h2>Le marché soutient une valeur stable</h2><p>Prix médian des propriétés comparables vendues dans le secteur.</p></div><span className="trend-pill">+6,3 %</span></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={marketTrend} margin={{ top: 18, right: 12, left: -20, bottom: 0 }}><defs><linearGradient id="marketFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#256bff" stopOpacity={0.28}/><stop offset="100%" stopColor="#256bff" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#e5eaf2" strokeDasharray="4 4"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#667085", fontSize: 12 }}/><YAxis domain={[350, 410]} axisLine={false} tickLine={false} tick={{ fill: "#667085", fontSize: 12 }} tickFormatter={(value) => `${value} k$`}/><Tooltip formatter={(value) => [`${value} 000 $`, "Prix médian"]} contentStyle={{ borderRadius: 12, borderColor: "#d9e1ec" }}/><Area type="monotone" dataKey="price" stroke="#256bff" strokeWidth={3} fill="url(#marketFill)" dot={{ r: 4, fill: "#ffffff", stroke: "#256bff", strokeWidth: 2 }}/></AreaChart></ResponsiveContainer></div>
      </section>
      <aside className="market-stats"><div><span>Prix médian vendu</span><strong>386 000 $</strong><small>5 ventes retenues</small></div><div><span>Délai médian</span><strong>24 jours</strong><small>−5 jours depuis mai</small></div><div><span>Ratio vente / demandé</span><strong>98,7 %</strong><small>Marché équilibré</small></div><div><span>Inventaire actif</span><strong>2,8 mois</strong><small>Offre limitée</small></div></aside>
    </div>
  );
}

function StrategyStep() {
  const [selectedScenario, setSelectedScenario] = useState("Positionnement recommandé");
  const scenarios = [
    { name: "Vente accélérée", range: "374 000 $ – 382 000 $", launch: "379 000 $", note: "Maximise l’attention dès les premiers jours.", tone: "fast" },
    { name: "Positionnement recommandé", range: "385 000 $ – 397 000 $", launch: "394 000 $", note: "Le meilleur équilibre entre valeur et réponse du marché.", tone: "recommended" },
    { name: "Positionnement ambitieux", range: "399 000 $ – 412 000 $", launch: "409 000 $", note: "Teste le haut du marché avec un délai potentiellement plus long.", tone: "bold" },
  ];
  return (
    <div className="step-canvas strategy-step">
      <div className="strategy-intro"><span className="section-kicker">Recommandation professionnelle</span><h2>Trois façons de se positionner</h2><p>Présentez des options claires, avec leurs avantages et compromis. Aucun scénario ne garantit un prix ni un délai de vente.</p></div>
      <div className="scenario-grid">{scenarios.map((scenario) => { const selected = selectedScenario === scenario.name; return <article key={scenario.name} className={`scenario-card ${scenario.tone} ${selected ? "selected" : ""}`}><span className="scenario-label">{scenario.name}</span><h3>{scenario.range}</h3><div><span>Prix de lancement suggéré</span><strong>{scenario.launch}</strong></div><p>{scenario.note}</p><button onClick={() => setSelectedScenario(scenario.name)} className={selected ? "primary-action full" : "secondary-action full"}>{selected ? "Scénario retenu" : "Choisir ce scénario"}{selected && <Check size={16}/>}</button></article>; })}</div>
    </div>
  );
}

function PresentationStep({ onPreview }: { onPreview: () => void }) {
  const [sections, setSections] = useState([
    { name: "Couverture", included: true },
    { name: "Message de votre courtier", included: true },
    { name: "Votre propriété", included: true },
    { name: "Aperçu du marché", included: true },
    { name: "Propriétés comparables", included: true },
    { name: "Stratégie recommandée", included: true },
    { name: "Plan de mise en marché", included: true },
    { name: "À propos du courtier", included: true },
    { name: "Prochaines étapes", included: true },
  ]);
  const visibleCount = sections.filter((section) => section.included).length;
  return (
    <div className="step-canvas presentation-layout">
      <section className="editor-card"><div className="section-heading"><div><span className="section-kicker">{visibleCount} sections visibles</span><h2>Construire le récit de la présentation</h2><p>Activez ou masquez les blocs du rapport avant de générer l’aperçu client.</p></div><button className="secondary-action" onClick={onPreview}><Eye size={16}/> Aperçu PDF</button></div><div className="section-list">{sections.map((section, index) => <button type="button" className={`section-row ${section.included ? "" : "section-row-off"}`} key={section.name} onClick={() => setSections((items) => items.map((item) => item.name === section.name ? { ...item, included: !item.included } : item))}><b>{index + 1}</b><strong>{section.name}</strong><span className="visible-pill">{section.included ? <><Check size={14}/> Incluse</> : "Masquée"}</span></button>)}</div></section>
      <aside className="context-card presentation-context"><Eye/><h3>Une expérience pensée pour le vendeur</h3><p>Le rapport s’adapte au téléphone, à la tablette et à l’impression. Les notes privées ne sont jamais incluses.</p><div className="device-preview"><span/><span/><span/></div></aside>
    </div>
  );
}

function ShareStep({ subject, onPreview, onDownload, pdfGenerating, onNotify }: { subject: SubjectProperty; onPreview: () => void; onDownload: () => void; pdfGenerating: boolean; onNotify: (message: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [checks, setChecks] = useState([
    { label: "Renseignements de la propriété révisés", done: true },
    { label: "Comparables sélectionnés par le courtier", done: true },
    { label: "Ajustements et explications validés", done: true },
    { label: "Stratégie de prix confirmée", done: true },
    { label: "Données sensibles révisées", done: true },
    { label: "Avis juridique inclus", done: true },
  ]);
  const copySummary = async () => {
    const text = `ACM Ocliq — ${subject.address || "Nouvelle analyse"}, ${subject.city || "Québec"}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onNotify("Résumé copié dans le presse-papiers");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      onNotify("Impossible de copier le résumé");
    }
  };
  const emailClient = () => {
    const subjectLine = encodeURIComponent(`ACM — ${subject.address || "Analyse comparative"}`);
    const body = encodeURIComponent(`Bonjour,\n\nVoici le résumé de l’analyse comparative pour ${subject.address || "la propriété"}.\nJe vous ferai parvenir le PDF Ocliq en pièce jointe.\n\nCordialement`);
    window.location.href = `mailto:?subject=${subjectLine}&body=${body}`;
  };
  return (
    <div className="step-canvas share-layout">
      <section className="editor-card approval-card"><span className="approval-icon"><ShieldCheck/></span><span className="section-kicker">Version 1 · Prête à produire</span><h2>Votre rapport Ocliq est prêt</h2><p>Une dernière vérification, puis téléchargez ou partagez une copie PDF professionnelle.</p><div className="approval-list">{checks.map((item) => <label key={item.label}><input type="checkbox" checked={item.done} onChange={() => setChecks((items) => items.map((entry) => entry.label === item.label ? { ...entry, done: !entry.done } : entry))}/><span><Check size={13}/></span>{item.label}</label>)}</div><div className="approval-actions"><button className="secondary-action" onClick={onPreview}><Eye size={16}/> Revoir la présentation</button><button type="button" className="secondary-action" onClick={() => void copySummary()}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? "Copié" : "Copier le résumé"}</button><button type="button" className="secondary-action" onClick={emailClient}><Mail size={16}/> Envoyer par courriel</button><button className="primary-action pdf-download-action" onClick={onDownload} disabled={pdfGenerating}>{pdfGenerating ? <LoaderCircle className="pdf-spinner" size={17}/> : <Download size={17}/>} {pdfGenerating ? "Création du PDF…" : "Télécharger le PDF"}</button></div></section>
      <aside className="share-summary"><span>À la finalisation</span><div><Files/><p><strong>PDF professionnel</strong>Généré avec les données actuelles</p></div><div><Database/><p><strong>Dossier sauvegardé</strong>Reprenez-le depuis le tableau de bord</p></div><div><CheckCircle2/><p><strong>Statut prêt</strong>Visible dans votre liste d’analyses</p></div><small>Cette ACM constitue une opinion de valeur et non une évaluation agréée.</small></aside>
    </div>
  );
}

function StepContent({ step, comparables, subject, onSubjectChange, onPreview, onDownload, pdfGenerating, onNotify }: { step: number; comparables: Comparable[]; subject: SubjectProperty; onSubjectChange: (subject: SubjectProperty) => void; onPreview: () => void; onDownload: () => void; pdfGenerating: boolean; onNotify: (message: string) => void }) {
  if (step === 0) return <DossierStep subject={subject} onChange={onSubjectChange}/>;
  if (step === 2) return <AdjustmentsStep comparables={comparables} />;
  if (step === 3) return <StrategyStep />;
  if (step === 4) return <PresentationStep onPreview={onPreview}/>;
  return <ShareStep subject={subject} onPreview={onPreview} onDownload={onDownload} pdfGenerating={pdfGenerating} onNotify={onNotify} />;
}

const moneyInput = (cents?: number) => cents ? String(Math.round(cents / 100)) : "";

function recordCompleteness(item?: Comparable) {
  if (!item) return 0;
  const checks = [item.address, item.city, item.status, item.price, item.propertyType, item.beds, item.baths, item.area, item.year, item.reason];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

function ComparableDrawer({ comparable, onClose, onSave }: { comparable?: Comparable; onClose: () => void; onSave: (comparable: Comparable, continueWorkflow: boolean) => void }) {
  const [status, setStatus] = useState<ComparableStatus>(comparable?.status ?? "Vendue");
  const [city, setCity] = useState(comparable?.city ?? "");
  const [postalCode, setPostalCode] = useState(comparable?.postalCode ?? "");
  const [latitude, setLatitude] = useState<number | undefined>(comparable?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(comparable?.longitude);
  const [image, setImage] = useState(comparable?.image ?? "");
  const completeness = recordCompleteness(comparable);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const continueWorkflow = submitter?.value === "continue";
    const textValue = (name: string) => String(data.get(name) ?? "").trim();
    const numberValue = (name: string, fallback = 0) => Number(textValue(name).replace(/[^0-9.-]/g, "")) || fallback;
    const centsValue = (name: string, fallback = 0) => Math.round(numberValue(name, fallback / 100) * 100);
    const soldPrice = centsValue("soldPrice", comparable?.status === "Vendue" ? comparable.price : 0);
    const askingPrice = centsValue("askingPrice", comparable?.status !== "Vendue" ? comparable?.price : comparable?.originalListPrice);
    const price = status === "Vendue" ? soldPrice : askingPrice;
    const adjustment = centsValue("adjustment", comparable?.adjustment ?? 0);
    const soldDateISO = textValue("soldDate");
    const resolvedImage = image || (typeof latitude === "number" && typeof longitude === "number" ? propertyStreetViewUrl(latitude, longitude) : "");
    onSave({
      ...comparable,
      id: comparable?.id ?? `cmp-${Date.now()}`,
      address: textValue("address"),
      city: textValue("city"),
      postalCode: textValue("postalCode"),
      unit: textValue("unit"),
      lotNumber: textValue("lotNumber"),
      lotDimensions: textValue("lotDimensions"),
      zoning: textValue("zoning"),
      image: resolvedImage,
      latitude,
      longitude,
      status,
      price,
      originalListPrice: centsValue("originalListPrice", askingPrice),
      adjusted: price + adjustment,
      adjustment,
      soldDate: soldDateISO ? new Date(`${soldDateISO}T12:00:00`).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" }) : comparable?.soldDate,
      days: numberValue("days", comparable?.days ?? 0),
      distance: numberValue("distance", comparable?.distance ?? 0),
      beds: numberValue("beds", comparable?.beds ?? 0),
      baths: numberValue("baths", comparable?.baths ?? 0),
      area: numberValue("area", comparable?.area ?? 0),
      year: numberValue("year", comparable?.year ?? new Date().getFullYear()),
      match: Math.min(100, numberValue("match", comparable?.match ?? 70)),
      included: comparable?.included ?? true,
      reason: textValue("reason"),
      source: textValue("source") as ComparableSource,
      sourceReference: textValue("sourceReference"),
      verifiedOn: textValue("verifiedOn"),
      mlsNumber: textValue("mlsNumber"),
      propertyType: textValue("propertyType"),
      propertyStyle: textValue("propertyStyle"),
      listDate: textValue("listDate"),
      soldPricePublished: data.get("soldPricePublished") === "on",
      rooms: numberValue("rooms"),
      powderRooms: numberValue("powderRooms"),
      lotArea: numberValue("lotArea"),
      levels: numberValue("levels"),
      garage: textValue("garage"),
      parking: numberValue("parking"),
      basement: textValue("basement"),
      construction: textValue("construction"),
      exterior: textValue("exterior"),
      heating: textValue("heating"),
      energy: textValue("energy"),
      waterSupply: textValue("waterSupply"),
      sewage: textValue("sewage"),
      landAssessment: centsValue("landAssessment"),
      buildingAssessment: centsValue("buildingAssessment"),
      assessmentYear: numberValue("assessmentYear"),
      municipalTaxes: centsValue("municipalTaxes"),
      schoolTaxes: centsValue("schoolTaxes"),
      condoFees: centsValue("condoFees"),
      legalWarranty: textValue("legalWarranty"),
      condition: textValue("condition"),
      renovations: textValue("renovations"),
      features: textValue("features"),
      inclusions: textValue("inclusions"),
      exclusions: textValue("exclusions"),
      documents: data.getAll("documents").map(String),
      verificationNotes: textValue("verificationNotes"),
    }, continueWorkflow);
  };
  const documentOptions = ["Fiche Centris", "Registre foncier", "Rôle municipal", "Certificat de localisation", "Déclarations du vendeur", "Factures / permis"];
  return (
    <div className="overlay drawer-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="drawer comparable-drawer" role="dialog" aria-modal="true" aria-label={comparable ? "Modifier la fiche comparable" : "Créer une fiche comparable"}>
        <div className="drawer-heading"><div><span className="section-kicker">Propriété comparable</span><h2>{comparable ? "Modifier le comparable" : "Ajouter un comparable"}</h2><p>{comparable?.address ?? "Seulement les renseignements utiles à l’ACM"}</p></div><div className="drawer-heading-actions"><button className="primary-action" type="submit" form="comparable-record-form"><Check size={15}/> Enregistrer</button><button className="icon-button" onClick={onClose} aria-label="Fermer"><X size={20}/></button></div></div>
        <form id="comparable-record-form" onSubmit={submit} className="drawer-form record-form simple-record-form">
          <div className="essential-progress"><span><Sparkles size={16}/> Formulaire essentiel</span><strong>{completeness}%</strong><div><i style={{width:`${completeness}%`}}/></div><p>Environ 2 minutes. Les détails spécialisés sont facultatifs.</p></div>

          <section className="form-section essential-section">
            <div className="simple-section-heading"><span>1</span><div><h3>Quelle propriété?</h3><p>Commencez par l’adresse et le statut.</p></div></div>
            <div className="form-grid">
              <label className="span-2"><span>Adresse complète *</span><AddressAutocomplete defaultValue={comparable?.address} onResolved={(address) => { if (address.city) setCity(address.city); if (address.postalCode) setPostalCode(address.postalCode); if (typeof address.latitude === "number" && typeof address.longitude === "number") { setLatitude(address.latitude); setLongitude(address.longitude); setImage(propertyStreetViewUrl(address.latitude, address.longitude)); } }}/></label>
              <label><span>Municipalité *</span><input name="city" value={city} onChange={(event) => setCity(event.target.value)} required/></label>
              <label><span>Code postal</span><input name="postalCode" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} placeholder="J9X 1A1"/></label>
              <label><span>Statut *</span><select name="status" value={status} onChange={(event) => setStatus(event.target.value as ComparableStatus)}><option>Vendue</option><option>En vigueur</option><option>Expirée</option><option>Retirée</option></select></label>
              <label><span>Type de propriété *</span><select name="propertyType" defaultValue={comparable?.propertyType ?? "Maison de plain-pied"}><option>Maison de plain-pied</option><option>Maison à étages</option><option>Maison à paliers multiples</option><option>Duplex</option><option>Triplex</option><option>Copropriété divise</option><option>Copropriété indivise</option><option>Maison mobile</option><option>Fermette</option></select></label>
            </div>
          </section>

          <section className="form-section essential-section">
            <div className="simple-section-heading"><span>2</span><div><h3>Prix et caractéristiques</h3><p>Les éléments qui influencent directement la comparaison.</p></div></div>
            <div className="form-grid">
              <label><span>Prix demandé *</span><div className="money-input"><input name="askingPrice" inputMode="numeric" defaultValue={moneyInput(comparable?.status === "Vendue" ? comparable?.originalListPrice : comparable?.price)} required/><span>$</span></div></label>
              {status === "Vendue" ? <label><span>Prix vendu *</span><div className="money-input"><input name="soldPrice" inputMode="numeric" defaultValue={moneyInput(comparable?.status === "Vendue" ? comparable?.price : undefined)} required/><span>$</span></div></label> : <label><span>Jours sur le marché</span><input name="days" inputMode="numeric" defaultValue={comparable?.days ?? 0}/></label>}
              <label><span>Chambres *</span><input name="beds" inputMode="numeric" defaultValue={comparable?.beds} required/></label>
              <label><span>Salles de bain *</span><input name="baths" inputMode="numeric" defaultValue={comparable?.baths} required/></label>
              <label><span>Superficie habitable (pi²) *</span><input name="area" inputMode="numeric" defaultValue={comparable?.area} required/></label>
              <label><span>Année de construction *</span><input name="year" inputMode="numeric" defaultValue={comparable?.year} required/></label>
              <label><span>Terrain (pi²)</span><input name="lotArea" inputMode="numeric" defaultValue={comparable?.lotArea}/></label>
              <label><span>État général</span><select name="condition" defaultValue={comparable?.condition ?? "Bonne"}><option>Excellente</option><option>Bonne</option><option>Moyenne</option><option>À moderniser</option><option>À rénover</option></select></label>
            </div>
          </section>

          <section className="form-section essential-section acm-decision-section">
            <div className="simple-section-heading"><span>3</span><div><h3>Votre lecture ACM</h3><p>Expliquez simplement pourquoi cette propriété est comparable.</p></div></div>
            <div className="form-grid">
              <label><span>Distance du sujet (km)</span><input name="distance" inputMode="decimal" defaultValue={comparable?.distance ?? 0}/></label>
              <label><span>Rajustement total</span><div className="money-input"><input name="adjustment" inputMode="numeric" defaultValue={moneyInput(comparable?.adjustment)}/><span>$</span></div></label>
              <label className="span-2"><span>Pourquoi retenir ce comparable? *</span><textarea name="reason" defaultValue={comparable?.reason} required placeholder="Ex. Même secteur et superficie; cuisine plus récente que la propriété sujet."/></label>
            </div>
            <div className="adjusted-preview"><div><Sparkles size={18}/><span>Valeur ajustée</span></div><strong>{comparable ? formatCAD(comparable.adjusted) : "Calculée à l’enregistrement"}</strong><small>Prix de référence ± votre rajustement</small></div>
          </section>

          <details className="advanced-details">
            <summary><span><SlidersHorizontal size={17}/><b>Ajouter des détails facultatifs</b><small>Sources, dates, bâtiment, évaluation et taxes</small></span><ChevronDown size={18}/></summary>
            <div className="advanced-content">
              <section className="advanced-group"><div className="advanced-group-title"><Database/><div><h3>Source et vérification</h3><p>Aucune donnée Centris/MLS n’est récupérée. À compléter avant le rapport final.</p></div></div><div className="form-grid">
                <label><span>Source</span><select name="source" defaultValue={comparable?.source ?? "Saisie manuelle"}><option>Centris / collaboration</option><option>Registre foncier</option><option>Rôle municipal</option><option>Saisie manuelle</option></select></label>
                <label><span>Référence / no Centris</span><input name="sourceReference" defaultValue={comparable?.sourceReference}/></label>
                <label><span>No Centris / MLS</span><input name="mlsNumber" defaultValue={comparable?.mlsNumber}/></label>
                <label><span>Vérifié le</span><input name="verifiedOn" type="date" defaultValue={comparable?.verifiedOn ?? "2026-08-04"}/></label>
              </div><fieldset className="evidence-grid"><legend>Documents consultés</legend>{documentOptions.map((item) => <label key={item}><input type="checkbox" name="documents" value={item} defaultChecked={comparable?.documents?.includes(item)}/><span><Check size={12}/></span>{item}</label>)}</fieldset><label><span>Notes de vérification</span><textarea name="verificationNotes" defaultValue={comparable?.verificationNotes}/></label></section>

              <section className="advanced-group"><div className="advanced-group-title"><Building2/><div><h3>Bâtiment et transaction</h3><p>Seulement si un écart doit être documenté.</p></div></div><div className="form-grid">
                <label><span>Appartement / unité</span><input name="unit" defaultValue={comparable?.unit}/></label><label><span>No de lot / cadastre</span><input name="lotNumber" defaultValue={comparable?.lotNumber}/></label>
                <label><span>Genre</span><select name="propertyStyle" defaultValue={comparable?.propertyStyle ?? "Détachée"}><option>Détachée</option><option>Jumelée</option><option>En rangée</option><option>En copropriété</option></select></label><label><span>Garage</span><input name="garage" defaultValue={comparable?.garage}/></label>
                <label><span>Date d’inscription</span><input name="listDate" type="date" defaultValue={comparable?.listDate}/></label><label><span>Date de vente</span><input name="soldDate" type="date"/></label>
                <label><span>Prix initial demandé</span><div className="money-input"><input name="originalListPrice" inputMode="numeric" defaultValue={moneyInput(comparable?.originalListPrice)}/><span>$</span></div></label><label><span>Jours sur le marché</span><input name="days" inputMode="numeric" defaultValue={comparable?.days ?? 0}/></label>
                <label><span>Pièces</span><input name="rooms" inputMode="numeric" defaultValue={comparable?.rooms}/></label><label><span>Salles d’eau</span><input name="powderRooms" inputMode="numeric" defaultValue={comparable?.powderRooms}/></label>
                <label><span>Stationnements</span><input name="parking" inputMode="numeric" defaultValue={comparable?.parking}/></label><label><span>Sous-sol</span><input name="basement" defaultValue={comparable?.basement}/></label>
                <label className="span-2"><span>Rénovations et particularités</span><textarea name="renovations" defaultValue={comparable?.renovations}/></label>
              </div></section>

              <section className="advanced-group"><div className="advanced-group-title"><FileCheck2/><div><h3>Références financières et légales</h3><p>Information complémentaire, jamais utilisée seule pour conclure la valeur.</p></div></div><div className="assessment-note"><CircleHelp size={16}/>L’évaluation municipale ne remplace pas l’ACM.</div><div className="form-grid">
                <label><span>Évaluation du terrain</span><div className="money-input"><input name="landAssessment" inputMode="numeric" defaultValue={moneyInput(comparable?.landAssessment)}/><span>$</span></div></label><label><span>Évaluation du bâtiment</span><div className="money-input"><input name="buildingAssessment" inputMode="numeric" defaultValue={moneyInput(comparable?.buildingAssessment)}/><span>$</span></div></label>
                <label><span>Année du rôle</span><input name="assessmentYear" inputMode="numeric" defaultValue={comparable?.assessmentYear}/></label><label><span>Taxes municipales</span><div className="money-input"><input name="municipalTaxes" inputMode="numeric" defaultValue={moneyInput(comparable?.municipalTaxes)}/><span>$</span></div></label>
                <label><span>Taxes scolaires</span><div className="money-input"><input name="schoolTaxes" inputMode="numeric" defaultValue={moneyInput(comparable?.schoolTaxes)}/><span>$</span></div></label><label><span>Garantie légale</span><select name="legalWarranty" defaultValue={comparable?.legalWarranty ?? "Avec garantie légale"}><option>Avec garantie légale</option><option>Sans garantie légale</option><option>À vérifier</option></select></label>
                <label className="span-2"><span>Atouts / nuisances</span><textarea name="features" defaultValue={comparable?.features}/></label>
              </div><label className="inline-check"><input type="checkbox" name="soldPricePublished" defaultChecked={comparable?.soldPricePublished}/><span><Check size={12}/></span><p><strong>Prix vendu publié au Registre foncier</strong><small>À confirmer avant la présentation client.</small></p></label></section>
              <input type="hidden" name="match" value={comparable?.match ?? 75}/><input type="hidden" name="lotDimensions" value={comparable?.lotDimensions ?? ""}/><input type="hidden" name="zoning" value={comparable?.zoning ?? ""}/><input type="hidden" name="levels" value={comparable?.levels ?? ""}/><input type="hidden" name="construction" value={comparable?.construction ?? ""}/><input type="hidden" name="exterior" value={comparable?.exterior ?? ""}/><input type="hidden" name="heating" value={comparable?.heating ?? ""}/><input type="hidden" name="energy" value={comparable?.energy ?? ""}/><input type="hidden" name="waterSupply" value={comparable?.waterSupply ?? ""}/><input type="hidden" name="sewage" value={comparable?.sewage ?? ""}/><input type="hidden" name="condoFees" value={moneyInput(comparable?.condoFees)}/><input type="hidden" name="inclusions" value={comparable?.inclusions ?? ""}/><input type="hidden" name="exclusions" value={comparable?.exclusions ?? ""}/>
            </div>
          </details>

          <div className="record-form-footer"><button type="button" className="secondary-action" onClick={onClose}>Annuler</button><div><small>Enregistrez, puis passez directement à l’analyse.</small><button className="primary-action" type="submit" name="intent" value="continue"><ArrowRight size={16}/>Enregistrer et continuer</button></div></div>
        </form>
      </aside>
    </div>
  );
}

function PdfPreview({ onClose, url, loading, onDownload }: { onClose: () => void; url: string | null; loading: boolean; onDownload: () => void }) {
  return (
    <div className="overlay pdf-preview-overlay" role="dialog" aria-modal="true" aria-label="Aperçu PDF de l’analyse">
      <div className="pdf-preview-window">
        <div className="pdf-preview-toolbar"><div><img src="/ocliq-logo.png" alt="Ocliq"/><span><strong>Aperçu du rapport</strong><small>Généré avec les données actuelles de cette ACM</small></span></div><div><button className="secondary-action" onClick={onDownload} disabled={loading}><Download size={16}/> Télécharger</button><button className="icon-button" onClick={onClose} aria-label={frCA.common.close}><X size={19}/></button></div></div>
        <div className="pdf-preview-canvas">{loading ? <div className="pdf-preview-loading"><LoaderCircle className="pdf-spinner"/><h3>Création de votre aperçu</h3><p>Photos, comparables et recommandations sont assemblés.</p></div> : url ? <iframe src={`${url}#view=FitH&toolbar=0`} title="Rapport ACM Ocliq"/> : <div className="pdf-preview-loading"><FileStack/><h3>Aperçu indisponible</h3><p>Réessayez dans quelques instants.</p></div>}</div>
      </div>
    </div>
  );
}

function DashboardPage({ reports, loading, query, onQuery, onCreate, onOpen, onArchive }: { reports: AcmReportSummary[]; loading: boolean; query: string; onQuery: (query: string) => void; onCreate: () => void; onOpen: (id: string) => void; onArchive: (id: string) => void }) {
  const ready = reports.filter((report) => report.status === "ready").length;
  const drafts = reports.filter((report) => report.status === "draft").length;
  const visibleReports = reports.filter((report) => `${report.title} ${report.subjectAddress} ${report.subjectCity}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="dashboard-page">
    <header className="dashboard-hero"><div><span className="section-kicker">VOTRE PORTEFEUILLE ACM</span><h1>Analyses comparatives</h1><p>Créez, reprenez et livrez chaque dossier depuis un espace unique.</p></div><button className="primary-action dashboard-create" onClick={onCreate} disabled={loading}>{loading ? <LoaderCircle className="pdf-spinner"/> : <Plus/>} Nouvelle ACM</button></header>
    <div className="dashboard-metrics"><article><span><FileStack/></span><div><small>Dossiers actifs</small><strong>{reports.length}</strong></div></article><article><span><SquarePen/></span><div><small>En préparation</small><strong>{drafts}</strong></div></article><article><span><CheckCircle2/></span><div><small>Prêts à présenter</small><strong>{ready}</strong></div></article></div>
    <section className="dashboard-list-card"><div className="dashboard-list-heading"><div><h2>Vos analyses</h2><p>La progression est sauvegardée automatiquement.</p></div><label className="compact-search"><Search/><input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Rechercher un dossier"/></label></div>
      {loading && !reports.length ? <div className="dashboard-empty"><LoaderCircle className="pdf-spinner"/><h3>Chargement de vos analyses</h3></div> : visibleReports.length ? <div className="report-list">{visibleReports.map((report) => <article className="report-row" key={report.id}><button className="report-main" onClick={() => onOpen(report.id)}><span className={`report-icon ${report.status}`}><House/></span><span><strong>{report.subjectAddress}</strong><small>{report.subjectCity} · Modifié {new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "short", timeZone: "America/Toronto" }).format(new Date(report.updatedAt))}</small></span></button><div className="report-progress"><span><i style={{ width: `${Math.max(8, ((report.workflowStep + 1) / 6) * 100)}%` }}/></span><small>Étape {report.workflowStep + 1} sur 6</small></div><span className={`report-status ${report.status}`}>{report.status === "ready" ? "Prêt" : "Brouillon"}</span><button className="secondary-action" onClick={() => onOpen(report.id)}>Ouvrir <ArrowRight/></button><button className="report-archive" onClick={() => onArchive(report.id)} aria-label={`Archiver ${report.subjectAddress}`}><X/></button></article>)}</div> : <div className="dashboard-empty"><span>{query ? <Search/> : <FileStack/>}</span><h3>{query ? "Aucune analyse trouvée" : "Votre première ACM commence ici"}</h3><p>{query ? "Essayez une autre adresse, ville ou nom de dossier." : "Créez un dossier, ajoutez vos comparables et obtenez un rapport Ocliq prêt à présenter."}</p>{query ? <button className="secondary-action" onClick={() => onQuery("")}>Effacer la recherche</button> : <button className="primary-action" onClick={onCreate}><Plus/> Créer une ACM</button>}</div>}
    </section>
  </section>;
}

function initialsFrom(name: string, email: string) {
  const source = name.trim() || email.split("@")[0] || "GA";
  return source.split(/[\s._-]+/).filter(Boolean).map((part) => part[0]?.toUpperCase() ?? "").slice(0, 2).join("") || "GA";
}

function TemplatesPage({ notify }: { notify: (message: string) => void }) {
  const [active, setActive] = useState("Ocliq Signature");
  const choose = (name: string) => { setActive(name); notify(`${name} est maintenant votre modèle actif`); };
  const templates = [
    { name: "Ocliq Signature", kicker: "ANALYSE COMPARATIVE", title: "La valeur expliquée<br/>avec clarté.", tone: "" },
    { name: "Éditorial", kicker: "PRÉSENTATION VENDEUR", title: "Décider avec<br/>confiance.", tone: "light" },
    { name: "Express", kicker: "AVIS DE VALEUR", title: "L’essentiel,<br/>en bref.", tone: "compact" },
  ];
  return (
    <section className="module-page">
      <header><span className="section-kicker">BIBLIOTHÈQUE</span><h1>Modèles de rapport</h1><p>Des récits professionnels, pensés pour différents contextes de mise en marché.</p></header>
      <div className="template-grid">
        {templates.map((template) => (
          <article key={template.name} className={`template-card ${active === template.name ? "selected" : ""}`}>
            <button type="button" className={`template-cover ${template.tone}`} onClick={() => choose(template.name)}>
              {template.tone === "" && <img src="/ocliq-logo.png" alt=""/>}
              <span>{template.kicker}</span>
              <strong dangerouslySetInnerHTML={{ __html: template.title }} />
            </button>
            <div>
              <span>{template.name}</span>
              {active === template.name ? <b><Check/> Modèle actif</b> : <button type="button" onClick={() => choose(template.name)}>Utiliser</button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsPage({
  userEmail,
  notify,
  profile,
  onProfileChange,
  section,
  onSection,
  demoMode,
}: {
  userEmail: string;
  notify: (message: string) => void;
  profile: BrokerProfile;
  onProfileChange: (profile: BrokerProfile) => void;
  section: "profile" | "branding" | "security";
  onSection: (section: "profile" | "branding" | "security") => void;
  demoMode?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const update = (key: keyof BrokerProfile, value: string) => onProfileChange({ ...profile, [key]: value });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (!demoMode) await saveProfile(profile);
      notify("Profil professionnel enregistré");
    } catch {
      notify("Impossible d’enregistrer le profil");
    } finally {
      setSaving(false);
    }
  };
  const go = (next: "profile" | "branding" | "security") => {
    onSection(next);
    window.requestAnimationFrame(() => document.getElementById(next)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  return (
    <section className="settings-page">
      <header className="settings-hero">
        <div><span className="section-kicker">VOTRE ESPACE</span><h1>Paramètres</h1><p>Personnalisez votre identité professionnelle, vos rapports et la sécurité du compte.</p></div>
        <span className="settings-avatar">{initialsFrom(profile.full_name, userEmail)}</span>
      </header>
      <div className="settings-layout">
        <nav className="settings-nav">
          <button type="button" className={section === "profile" ? "active" : ""} onClick={() => go("profile")}><UserRound/> Profil professionnel</button>
          <button type="button" className={section === "branding" ? "active" : ""} onClick={() => go("branding")}><Palette/> Identité des rapports</button>
          <button type="button" className={section === "security" ? "active" : ""} onClick={() => go("security")}><ShieldCheck/> Compte et sécurité</button>
        </nav>
        <form className="settings-content" onSubmit={submit}>
          <section id="profile" className="settings-card">
            <div className="settings-card-title"><span><UserRound/></span><div><h2>Profil professionnel</h2><p>Ces renseignements apparaissent dans vos rapports et présentations.</p></div></div>
            <div className="settings-fields">
              <label><span>Nom complet</span><input value={profile.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Gabriel Arseneault"/></label>
              <label><span>Adresse courriel</span><input value={profile.email || userEmail} readOnly/></label>
              <label><span>Agence ou bannière</span><input value={profile.brokerage_name} onChange={(e) => update("brokerage_name", e.target.value)} placeholder="Nom de l’agence"/></label>
              <label><span>Téléphone</span><input value={profile.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(819) 555-0182"/></label>
            </div>
            <button className="primary-action settings-save" disabled={saving}>{saving ? <LoaderCircle className="pdf-spinner"/> : <Save/>}{saving ? "Enregistrement…" : "Enregistrer le profil"}</button>
          </section>
          <section id="branding" className="settings-card">
            <div className="settings-card-title"><span><Palette/></span><div><h2>Identité des rapports</h2><p>Le thème Ocliq est appliqué automatiquement à chaque ACM.</p></div></div>
            <div className="brand-setting"><div className="brand-preview"><img src="/ocliq-logo.png" alt="Ocliq"/></div><div><strong>Ocliq Signature</strong><small>Bleu profond · Typographie claire · Logo complet</small></div><span className="active-setting"><Check/> Actif</span></div>
          </section>
          <section id="security" className="settings-card">
            <div className="settings-card-title"><span><ShieldCheck/></span><div><h2>Compte et sécurité</h2><p>Gérez la session de ce courtier et quittez l’espace sécurisé.</p></div></div>
            <div className="security-row">
              <div><strong>{profile.email || userEmail || "Session locale"}</strong><small>{profile.full_name ? `${profile.full_name} · compte connecté` : "Compte actuellement connecté"}</small></div>
              <button type="button" className="danger-action" onClick={() => void signOut()}><LogOut/> Se déconnecter</button>
            </div>
          </section>
        </form>
      </div>
    </section>
  );
}

type SettingsSection = "profile" | "branding" | "security";

function ChromeMenu({ children, onClose, className }: { children: ReactNode; onClose: () => void; className?: string }) {
  return (
    <>
      <button type="button" className="chrome-scrim" onClick={onClose} aria-label="Fermer le menu"/>
      <div className={`chrome-menu ${className ?? ""}`} role="menu">{children}</div>
    </>
  );
}

function HelpPanel({ onClose, onOpenSettings }: { onClose: () => void; onOpenSettings: () => void }) {
  return (
    <div className="overlay help-overlay">
      <button type="button" className="help-overlay-scrim" onClick={onClose} aria-label="Fermer l’aide"/>
      <section className="help-panel" role="dialog" aria-labelledby="help-title">
        <header>
          <div><span className="section-kicker">ASSISTANCE</span><h2 id="help-title">Centre d’aide Ocliq</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fermer"><X size={18}/></button>
        </header>
        <div className="help-grid">
          <article>
            <CircleHelp size={18}/>
            <div>
              <strong>Créer une ACM</strong>
              <p>Utilisez « Créer une ACM », complétez le dossier sujet, retenez au moins un comparable, puis générez le PDF.</p>
            </div>
          </article>
          <article>
            <Keyboard size={18}/>
            <div>
              <strong>Raccourcis</strong>
              <p><kbd>⌘ K</kbd> recherche globale · <kbd>Esc</kbd> ferme les panneaux, menus et aperçus.</p>
            </div>
          </article>
          <article>
            <UserRound size={18}/>
            <div>
              <strong>Profil et déconnexion</strong>
              <p>Cliquez votre avatar ou la tuile en bas de la barre latérale pour ouvrir le profil, les paramètres ou quitter la session.</p>
            </div>
          </article>
        </div>
        <footer className="help-actions">
          <a className="secondary-action" href="mailto:assistance@ocliq.ca"><Mail size={16}/> assistance@ocliq.ca</a>
          <button type="button" className="primary-action" onClick={onOpenSettings}><Settings size={16}/> Ouvrir les paramètres</button>
        </footer>
      </section>
    </div>
  );
}

export default function StudioApp({ userEmail, demoMode = false }: { userEmail: string; demoMode?: boolean }) {
  const [comparables, setComparables] = useState(initialComparables);
  const [subject, setSubject] = useState<SubjectProperty>(initialSubject);
  const [activeStep, setActiveStep] = useState(1);
  const [activeNav, setActiveNav] = useState(0);
  const [screen, setScreen] = useState<"dashboard" | "editor">("dashboard");
  const [reports, setReports] = useState<AcmReportSummary[]>(demoMode ? [{ id: "demo-report", title: "ACM - 218, rue des Pins", status: "draft", workflowStep: 1, subjectAddress: "218, rue des Pins", subjectCity: "Rouyn-Noranda", updatedAt: "2026-08-11T16:00:00.000Z" }] : []);
  const [workspaceLoading, setWorkspaceLoading] = useState(!demoMode);
  const [view, setView] = useState<"list" | "cards" | "map">("list");
  const [filter, setFilter] = useState<"Toutes" | ComparableStatus>("Toutes");
  const [query, setQuery] = useState("");
  const [dashboardQuery, setDashboardQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingComparableId, setEditingComparableId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [databaseReady, setDatabaseReady] = useState(false);
  const [saveState, setSaveState] = useState<"loading" | "saved" | "saving" | "error">("loading");
  const [brokerProfile, setBrokerProfile] = useState<BrokerProfile>({ full_name: demoMode ? tenant.name : "", brokerage_name: demoMode ? tenant.descriptor : "", phone: "", email: userEmail });
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("profile");
  const [accountMenu, setAccountMenu] = useState<"sidebar" | "top" | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(true);
  const globalSearchRef = useRef<HTMLInputElement>(null);
  const previewSignature = useRef("");

  useEffect(() => {
    if (demoMode) { setWorkspaceLoading(false); setSaveState("saved"); return; }
    let current = true;
    listReports().then((items) => { if (current) setReports(items); }).catch(() => { if (current) setSaveState("error"); }).finally(() => { if (current) setWorkspaceLoading(false); });
    loadProfile().then((profile) => { if (current) setBrokerProfile(profile); }).catch(() => undefined);
    return () => { current = false; };
  }, [demoMode]);

  useEffect(() => {
    if (screen !== "editor" && !demoMode) return;
    const nextSubject = demoMode && screen === "dashboard" ? initialSubject : subject;
    const nextComparables = demoMode && screen === "dashboard" ? initialComparables : comparables;
    void prefetchPropertyMedia(nextSubject, nextComparables);
  }, [screen, subject, comparables, demoMode]);

  useEffect(() => {
    if (screen !== "editor" || activeStep < 3) return;
    void import("@/lib/generate-acm-pdf");
  }, [screen, activeStep]);

  useEffect(() => {
    if (demoMode || !databaseReady || !reportId) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      saveWorkspace(reportId, activeStep, comparables, subject)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [activeStep, comparables, subject, databaseReady, reportId, demoMode]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        globalSearchRef.current?.focus();
        globalSearchRef.current?.select();
      }
      if (event.key === "Escape") {
        if (accountMenu) setAccountMenu(null);
        else if (notificationsOpen) setNotificationsOpen(false);
        else if (helpOpen) setHelpOpen(false);
        else if (previewOpen) setPreviewOpen(false);
        else if (drawerOpen) setDrawerOpen(false);
        else if (mobileOpen) setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [accountMenu, notificationsOpen, helpOpen, drawerOpen, mobileOpen, previewOpen]);

  useEffect(() => {
    if (!drawerOpen && !previewOpen && !helpOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [drawerOpen, previewOpen, helpOpen]);

  const filtered = useMemo(() => comparables.filter((item) => {
    const statusMatch = filter === "Toutes" || item.status === filter;
    const queryMatch = `${item.address} ${item.city}`.toLowerCase().includes(query.toLowerCase());
    return statusMatch && queryMatch;
  }), [comparables, filter, query]);
  const selectedCount = comparables.filter((item) => item.included).length;
  const selectedAdjustedValues = comparables.filter((item) => item.included).map((item) => item.price + item.adjustment).sort((a, b) => a - b);
  const selectedRange = selectedAdjustedValues.length ? `${formatCAD(selectedAdjustedValues[0])} à ${formatCAD(selectedAdjustedValues[selectedAdjustedValues.length - 1])}` : "À calculer après la première sélection";

  const toggleComparable = (id: string) => {
    setComparables((items) => items.map((item) => item.id === id ? { ...item, included: !item.included } : item));
  };

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const fillDummyData = async () => {
    const filledSubject = { ...initialSubject };
    const filledComparables = initialComparables.map((item) => ({ ...item, included: true }));
    setWorkspaceLoading(true);
    try {
      let nextComparables = filledComparables;
      let nextSubject = filledSubject;
      if (demoMode) {
        const id = reportId ?? crypto.randomUUID();
        const report: AcmReportSummary = {
          id,
          title: `ACM - ${filledSubject.address}`,
          status: "draft",
          workflowStep: 1,
          subjectAddress: filledSubject.address,
          subjectCity: filledSubject.city,
          updatedAt: new Date().toISOString(),
        };
        nextComparables = filledComparables.map((item) => ({ ...item, id: crypto.randomUUID() }));
        setReports((items) => {
          const without = items.filter((item) => item.id !== id);
          return [report, ...without];
        });
        setReportId(id);
        setSubject(nextSubject);
        setComparables(nextComparables);
      } else if (reportId) {
        nextComparables = filledComparables.map((item) => ({ ...item, id: crypto.randomUUID() }));
        setSubject(nextSubject);
        setComparables(nextComparables);
        setDatabaseReady(true);
        await saveWorkspace(reportId, 1, nextComparables, nextSubject);
        await refreshReports();
      } else {
        const workspace = await createWorkspace(filledComparables, filledSubject);
        await refreshReports();
        setReportId(workspace.reportId);
        nextSubject = workspace.subject ?? filledSubject;
        nextComparables = workspace.comparables;
        setSubject(nextSubject);
        setComparables(nextComparables);
        setDatabaseReady(true);
        await saveWorkspace(workspace.reportId, 1, nextComparables, nextSubject);
      }
      void prefetchPropertyMedia(nextSubject, nextComparables);
      void import("@/lib/generate-acm-pdf");
      setActiveNav(0);
      setScreen("editor");
      setActiveStep(1);
      setDrawerOpen(false);
      setSaveState("saved");
      flash("Données prêtes — les médias continuent de charger en arrière-plan.");
    } catch {
      flash("Impossible de charger les données de test");
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const refreshReports = async () => {
    if (demoMode) return;
    setReports(await listReports());
  };

  const openReport = async (id: string) => {
    setWorkspaceLoading(true);
    try {
      const workspace = demoMode
        ? { reportId: id, workflowStep: reports.find((report) => report.id === id)?.workflowStep ?? 1, comparables: initialComparables, subject: initialSubject }
        : await loadWorkspace(id);
      const nextComparables = workspace.comparables;
      const nextSubject = workspace.subject?.address ? workspace.subject : { ...blankSubject, ...(workspace.subject ?? {}) };
      setReportId(workspace.reportId);
      setComparables(nextComparables);
      setSubject(nextSubject);
      setActiveStep(workspace.workflowStep);
      setDatabaseReady(!demoMode);
      setScreen("editor");
      setActiveNav(0);
      setSaveState("saved");
      await prefetchPropertyMedia(nextSubject, nextComparables);
    } catch { flash("Impossible d’ouvrir cette analyse"); }
    finally { setWorkspaceLoading(false); }
  };

  const startNewReport = async () => {
    setWorkspaceLoading(true);
    try {
      if (demoMode) {
        const id = crypto.randomUUID();
        const report = { id, title: "Nouvelle analyse comparative", status: "draft" as const, workflowStep: 0, subjectAddress: "Adresse à compléter", subjectCity: "Municipalité à compléter", updatedAt: new Date().toISOString() };
        setReports((items) => [report, ...items]);
        setReportId(id); setSubject(blankSubject); setComparables([]); setActiveStep(0); setScreen("editor"); setActiveNav(0); setSaveState("saved");
      } else {
        const workspace = await createWorkspace([], blankSubject);
        await refreshReports();
        setReportId(workspace.reportId); setSubject(blankSubject); setComparables(workspace.comparables); setActiveStep(0); setDatabaseReady(true); setScreen("editor"); setActiveNav(0); setSaveState("saved");
      }
      flash("Nouvelle analyse créée");
    } catch { flash("Impossible de créer une nouvelle analyse"); }
    finally { setWorkspaceLoading(false); }
  };

  const returnToDashboard = async () => {
    setScreen("dashboard"); setActiveNav(0); setDrawerOpen(false); setPreviewOpen(false);
    try { await refreshReports(); } catch { flash("La liste sera actualisée à la prochaine connexion"); }
  };

  const removeReport = async (id: string) => {
    try { if (!demoMode) await archiveReport(id); setReports((items) => items.filter((item) => item.id !== id)); flash("Analyse archivée"); } catch { flash("Impossible d’archiver cette analyse"); }
  };

  const finishReview = async () => {
    if (reportId) {
      try { if (!demoMode) await markReportReady(reportId); setReports((items) => items.map((item) => item.id === reportId ? { ...item, status: "ready", workflowStep: 5, updatedAt: new Date().toISOString() } : item)); }
      catch { flash("Impossible de finaliser le statut du rapport"); return; }
    }
    await returnToDashboard();
    flash("ACM finalisée et prête à présenter");
  };

  const handleStep = (step: number) => {
    if (step > 0 && !subject.address) {
      flash("Enregistrez d’abord la propriété sujet");
      return;
    }
    if (step > 1 && selectedCount === 0) {
      flash("Ajoutez et retenez au moins un comparable avant de poursuivre");
      return;
    }
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateSubject = (next: SubjectProperty) => {
    setSubject(next);
    if (reportId) setReports((items) => items.map((item) => item.id === reportId ? { ...item, title: `ACM - ${next.address}`, subjectAddress: next.address || "Adresse à compléter", subjectCity: next.city || "Municipalité à compléter", updatedAt: new Date().toISOString() } : item));
  };

  const downloadPdf = async () => {
    if (pdfGenerating) return;
    if (!subject.address || selectedCount === 0) {
      flash("Complétez le dossier et retenez au moins un comparable avant de créer le PDF");
      return;
    }
    setPdfGenerating(true);
    try {
      const { generateAcmPdf } = await import("@/lib/generate-acm-pdf");
      await generateAcmPdf(comparables, subject);
      if (reportId) {
        if (!demoMode) await markReportReady(reportId);
        setReports((items) => items.map((item) => item.id === reportId ? { ...item, status: "ready", workflowStep: 5, updatedAt: new Date().toISOString() } : item));
      }
      flash("Rapport PDF Ocliq téléchargé");
    } catch {
      flash("Impossible de créer le PDF pour le moment");
    } finally {
      setPdfGenerating(false);
    }
  };

  const reviewPdf = async () => {
    if (!subject.address || selectedCount === 0) {
      flash("Complétez le dossier et retenez au moins un comparable avant l’aperçu");
      return;
    }
    const signature = JSON.stringify([subject, comparables]);
    setPreviewOpen(true);
    if (previewUrl && previewSignature.current === signature) return;
    setPdfGenerating(true);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    try {
      const { createAcmPdfPreviewUrl } = await import("@/lib/generate-acm-pdf");
      const nextUrl = await createAcmPdfPreviewUrl(comparables, subject);
      previewSignature.current = signature;
      setPreviewUrl(nextUrl);
    } catch {
      flash("Impossible de générer l’aperçu pour le moment");
    } finally {
      setPdfGenerating(false);
    }
  };

  const displayName = brokerProfile.full_name.trim() || userEmail.split("@")[0] || tenant.name;
  const displayInitials = initialsFrom(brokerProfile.full_name, userEmail);
  const displayRole = brokerProfile.brokerage_name.trim() || tenant.descriptor;
  const closeChrome = () => {
    setAccountMenu(null);
    setNotificationsOpen(false);
    setHelpOpen(false);
  };
  const openSettings = (section: SettingsSection = "profile") => {
    setSettingsSection(section);
    setActiveNav(2);
    setMobileOpen(false);
    closeChrome();
  };
  const toggleAccountMenu = (anchor: "sidebar" | "top") => {
    setNotificationsOpen(false);
    setHelpOpen(false);
    setAccountMenu((current) => current === anchor ? null : anchor);
  };
  const accountMenuItems = (
    <>
      <div className="chrome-menu-head">
        <span className="tenant-avatar">{displayInitials}</span>
        <span><strong>{displayName}</strong><small>{userEmail || displayRole}</small></span>
      </div>
      <button type="button" role="menuitem" onClick={() => openSettings("profile")}><UserRound size={16}/> Profil professionnel</button>
      <button type="button" role="menuitem" onClick={() => openSettings("branding")}><Palette size={16}/> Identité des rapports</button>
      <button type="button" role="menuitem" onClick={() => openSettings("security")}><ShieldCheck size={16}/> Compte et sécurité</button>
      <button type="button" role="menuitem" className="chrome-menu-danger" onClick={() => void signOut()}><LogOut size={16}/> Se déconnecter</button>
    </>
  );

  return (
    <div
      className={`studio-shell ${collapsed ? "sidebar-collapsed" : ""}`}
      style={{
        "--tenant": tenant.theme.primary,
        "--tenant-deep": tenant.theme.primaryDeep,
        "--tenant-accent": tenant.theme.accent,
        "--ocliq": tenant.theme.ocliq,
      } as React.CSSProperties}
    >
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""} ${accountMenu === "sidebar" ? "chrome-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-identity"><img src="/ocliq-logo.png" alt="Ocliq"/><span>{frCA.brand.product}</span></div>
          <span className="brand-symbol" aria-hidden="true"><img src="/ocliq-logo.png" alt=""/></span>
          <button className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Agrandir la navigation" : "Réduire la navigation"}><ChevronsLeft size={17}/></button>
          <button className="mobile-sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Fermer la navigation"><X size={19}/></button>
        </div>
        <button className="tenant-switcher" onClick={() => openSettings("branding")}><span className="tenant-avatar">{displayInitials}</span><span className="tenant-copy"><strong>{displayName}</strong><small>{displayRole}</small></span><ChevronRight size={15}/></button>
        <button className="quick-create" onClick={() => { setMobileOpen(false); void startNewReport(); }} disabled={workspaceLoading}><Plus size={18}/><span>Créer une ACM</span></button>
        <nav>{frCA.nav.map((item, index) => { const Icon = navIcons[index]; return <button key={item} className={activeNav === index ? "active" : ""} onClick={() => { setActiveNav(index); if (index === 0) setScreen("dashboard"); if (index === 2) setSettingsSection("profile"); setMobileOpen(false); closeChrome(); }}><Icon size={18}/><span>{item}</span></button>; })}</nav>
        <div className="sidebar-bottom">
          <button type="button" onClick={() => { setHelpOpen(true); setAccountMenu(null); setNotificationsOpen(false); setMobileOpen(false); }}><CircleHelp size={18}/><span>Centre d’aide</span></button>
          <div className="account-anchor">
            <button type="button" className="user-tile" onClick={() => toggleAccountMenu("sidebar")} aria-haspopup="menu" aria-expanded={accountMenu === "sidebar"}>
              <span className="tenant-avatar muted">{displayInitials}</span>
              <span><strong>{displayName}</strong><small>{displayRole}</small></span>
              <MoreHorizontal size={17}/>
            </button>
            {accountMenu === "sidebar" && <ChromeMenu className="chrome-menu-up" onClose={() => setAccountMenu(null)}>{accountMenuItems}</ChromeMenu>}
          </div>
        </div>
      </aside>

      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu"/>}

      <div className="app-column">
        <header className={`topbar ${accountMenu === "top" || notificationsOpen ? "chrome-open" : ""}`}>
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu"><Menu size={21}/></button>
          <div className="breadcrumbs"><button onClick={() => void returnToDashboard()}>Analyses</button>{activeNav === 0 && screen === "editor" && <><ChevronRight size={13}/><strong>{subject.address || "Nouvelle ACM"}</strong></>}</div>
          <label className="global-search"><Search size={17}/><input ref={globalSearchRef} value={dashboardQuery} onChange={(event) => { setDashboardQuery(event.target.value); setActiveNav(0); setScreen("dashboard"); }} placeholder={frCA.common.search}/><kbd>⌘ K</kbd></label>
          <div className="top-actions">
            {(demoMode || process.env.NODE_ENV !== "production") && <button type="button" className="secondary-action test-fill-button" onClick={() => void fillDummyData()} disabled={workspaceLoading} title="Remplit le dossier et les comparables pour un test PDF de bout en bout"><Sparkles size={15}/> Remplir données test</button>}
            <span className={`saved-status save-${saveState}`}>{saveState === "saving" ? <LoaderCircle className="pdf-spinner" size={14}/> : saveState === "error" ? <Database size={14}/> : <Check size={14}/>} {saveState === "loading" ? "Connexion…" : saveState === "saving" ? "Sauvegarde…" : saveState === "error" ? "Supabase à configurer" : "Sauvegardé"}</span>
            <span className="demo-pill"><span/> En ligne</span>
            <div className="account-anchor">
              <button type="button" className={`icon-button ${unreadNotifications ? "has-dot" : ""}`} aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((open) => !open); setUnreadNotifications(false); setAccountMenu(null); setHelpOpen(false); }}>
                <Bell size={19}/>
              </button>
              {notificationsOpen && (
                <ChromeMenu className="chrome-menu-down chrome-menu-wide" onClose={() => setNotificationsOpen(false)}>
                  <div className="chrome-menu-head"><Bell size={16}/><span><strong>Notifications</strong><small>Activité de votre espace courtier</small></span></div>
                  <div className="notification-item"><CheckCircle2 size={16}/><span><strong>Espace prêt</strong><small>Vos analyses et votre profil sont accessibles depuis cette barre.</small></span></div>
                  <div className="notification-item"><ShieldCheck size={16}/><span><strong>{saveState === "error" ? "Sauvegarde à configurer" : "Session active"}</strong><small>{saveState === "error" ? "Vérifiez la connexion Supabase dans les paramètres." : "Les modifications sont enregistrées automatiquement."}</small></span></div>
                  <button type="button" role="menuitem" onClick={() => { setNotificationsOpen(false); flash("Toutes les notifications ont été lues"); }}>Tout marquer comme lu</button>
                </ChromeMenu>
              )}
            </div>
            <div className="account-anchor">
              <button type="button" className="avatar-button" onClick={() => toggleAccountMenu("top")} title={displayName} aria-label="Menu du compte" aria-haspopup="menu" aria-expanded={accountMenu === "top"}>{displayInitials}</button>
              {accountMenu === "top" && <ChromeMenu className="chrome-menu-down" onClose={() => setAccountMenu(null)}>{accountMenuItems}</ChromeMenu>}
            </div>
          </div>
        </header>

        <main>
          {activeNav === 0 && screen === "dashboard" ? <DashboardPage reports={reports} loading={workspaceLoading} query={dashboardQuery} onQuery={setDashboardQuery} onCreate={() => void startNewReport()} onOpen={(id) => void openReport(id)} onArchive={(id) => void removeReport(id)}/> : activeNav === 0 ? (
            <>
              <section className="analysis-heading">
                <div><span className="analysis-eyebrow">{frCA.analysis.eyebrow}<i/></span><div className="analysis-title-line"><h1>{subject.address || "Nouvelle analyse"}</h1><button aria-label="Modifier le dossier" onClick={() => handleStep(0)}><SquarePen size={16}/></button></div><p>{subject.city || "Municipalité à compléter"}<span/> {subject.owners ? `Pour ${subject.owners}` : "Client à compléter"}</p></div>
                <div className="analysis-heading-actions"><button className="secondary-action dashboard-return" onClick={() => void returnToDashboard()}><LayoutDashboard size={17}/> Tableau de bord</button>{activeStep < 4 && <button className="secondary-action" onClick={() => void reviewPdf()}><Eye size={17}/>{frCA.common.preview}</button>}{activeStep < 5 && <button className="primary-action report-shortcut" onClick={() => handleStep(5)}><Download size={17}/> Finaliser le rapport</button>}</div>
              </section>

              <section className="workflow-stepper" aria-label="Progression de l’analyse" style={{ gridTemplateColumns: `repeat(${frCA.steps.length}, minmax(0, 1fr))` }}>
                {frCA.steps.map((step, index) => { const Icon = stepVisuals[index]; const complete = index < activeStep; const locked = (index > 0 && !subject.address) || (index > 1 && selectedCount === 0); return <button key={step.title} type="button" onClick={() => handleStep(index)} className={`${index === activeStep ? "current" : ""} ${complete ? "complete" : ""} ${locked ? "locked" : ""}`} aria-current={index === activeStep ? "step" : undefined} aria-disabled={locked}><span className="step-icon">{complete ? <Check size={15} strokeWidth={3}/> : <Icon size={16}/>}</span><span className="step-text"><small>{String(index + 1).padStart(2, "0")}</small><strong>{step.short}</strong></span>{index < frCA.steps.length - 1 && <i/>}</button>; })}
              </section>

              <div key={`${screen}-${activeStep}`} className="step-stage">
              {activeStep === 1 ? (
                <div className="workflow-layout">
                  <section className="comparables-panel">
                    <div className="panel-heading"><div><span className="section-kicker">{frCA.comparables.eyebrow}</span><h2>{frCA.comparables.title}</h2><p>{frCA.comparables.intro}</p></div><button className="primary-action" onClick={() => { setEditingComparableId(null); setDrawerOpen(true); }}><Plus size={17}/>{frCA.comparables.add}</button></div>
                    <div className="selection-summary"><div className="summary-avatars">{comparables.filter((item) => item.included).slice(0, 4).map((item) => <PropertyPhoto key={item.id} className="summary-avatar-photo" src={item.image} latitude={item.latitude} longitude={item.longitude} alt="" priority/>)}{selectedCount > 4 && <span>+{selectedCount - 4}</span>}</div><p><strong>{selectedCount} propriétés {frCA.comparables.selected}</strong><span>Fourchette ajustée : {selectedRange}</span></p><div className="selection-score">{selectedCount ? <ScoreRing value={Math.min(95, 55 + selectedCount * 7)}/> : <span className="selection-empty-icon"><Plus size={17}/></span>}<span><strong>{selectedCount >= 3 ? "Sélection exploitable" : "Sélection à compléter"}</strong><small>{selectedCount ? "selon la proximité et la similarité" : "ajoutez votre premier comparable"}</small></span></div></div>
                    <div className="filter-bar">
                      <div className="status-tabs">{statusOptions.map((status) => { const label = status === "Toutes" ? frCA.comparables.filterAll : status; const count = status === "Toutes" ? comparables.length : comparables.filter((item) => item.status === status).length; return <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}>{label}<span>{count}</span></button>; })}</div>
                      <div className="filter-actions"><label className="compact-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher" aria-label={frCA.comparables.query}/></label><div className="view-switcher"><button className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="Vue liste"><List size={16}/></button><button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")} aria-label="Vue cartes"><Grid2X2 size={16}/></button><button className={view === "map" ? "active" : ""} onClick={() => setView("map")} aria-label="Vue carte"><Map size={16}/></button></div></div>
                    </div>
                    <div className="source-note"><ShieldCheck size={14}/><span>{frCA.comparables.source} · {frCA.comparables.noIntegration}</span></div>
                    {view === "map" ? <MapView comparables={filtered} onToggle={toggleComparable}/> : (
                      <div className={`comparables-list ${view}`}>{filtered.length ? filtered.map((comparable, index) => <ComparableRow key={comparable.id} comparable={comparable} view={view} priority={index < 4} onToggle={() => toggleComparable(comparable.id)} expanded={expandedId === comparable.id} onExpand={() => setExpandedId(expandedId === comparable.id ? null : comparable.id)} onEdit={() => { setEditingComparableId(comparable.id); setDrawerOpen(true); }}/>) : <div className="empty-state"><Search/><h3>Aucun comparable trouvé</h3><p>Essayez un autre mot-clé ou retirez un filtre.</p><button className="text-action" onClick={() => { setFilter("Toutes"); setQuery(""); }}>Réinitialiser les filtres</button></div>}</div>
                    )}
                  </section>
                  <InsightPanel comparables={comparables} onContinue={() => handleStep(2)}/>
                </div>
              ) : <StepContent step={activeStep} comparables={comparables} subject={subject} onSubjectChange={updateSubject} onPreview={() => void reviewPdf()} onDownload={() => void downloadPdf()} pdfGenerating={pdfGenerating} onNotify={flash}/>} 

              {activeStep !== 1 && (
                <div className="step-footer"><button className="secondary-action" onClick={() => handleStep(Math.max(activeStep - 1, 0))}><ArrowLeft size={16}/>{frCA.common.back}</button><span><Check size={14}/>{frCA.analysis.updated}</span><button className="primary-action" onClick={() => activeStep < 5 ? handleStep(activeStep + 1) : void finishReview()}>{activeStep < 5 ? "Continuer" : "Finaliser et retourner au tableau de bord"}<ArrowRight size={16}/></button></div>
              )}
              </div>
            </>
          ) : activeNav === 1 ? <TemplatesPage notify={flash}/> : <SettingsPage userEmail={userEmail} notify={flash} profile={brokerProfile} onProfileChange={setBrokerProfile} section={settingsSection} onSection={setSettingsSection} demoMode={demoMode}/>} 
        </main>
      </div>

      {drawerOpen && <ComparableDrawer comparable={comparables.find((item) => item.id === editingComparableId)} onClose={() => setDrawerOpen(false)} onSave={(item, continueWorkflow) => { setComparables((items) => items.some((existing) => existing.id === item.id) ? items.map((existing) => existing.id === item.id ? item : existing) : [item, ...items]); setDrawerOpen(false); if (continueWorkflow) handleStep(2); flash(continueWorkflow ? "Comparable enregistré - poursuivez avec les ajustements" : editingComparableId ? "Fiche comparable mise à jour" : "Comparable ajouté à l’analyse"); }}/>} 
      {previewOpen && <PdfPreview onClose={() => setPreviewOpen(false)} url={previewUrl} loading={pdfGenerating} onDownload={() => void downloadPdf()}/>} 
      {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} onOpenSettings={() => openSettings("profile")}/>}
      {toast && <div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
    </div>
  );
}
