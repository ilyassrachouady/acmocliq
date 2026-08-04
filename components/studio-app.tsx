"use client";

/* Remote demonstration photography is intentionally rendered without the production image provider. */
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  CircleHelp,
  ContactRound,
  Eye,
  FileStack,
  Files,
  Grid2X2,
  House,
  LayoutDashboard,
  List,
  Map,
  MapPin,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  SquarePen,
  Target,
  Upload,
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
import {
  Comparable,
  ComparableStatus,
  formatCAD,
  formatSignedCAD,
  initialComparables,
  marketTrend,
  tenant,
} from "@/lib/demo-data";

const navIcons = [
  LayoutDashboard,
  FileStack,
  House,
  ContactRound,
  BriefcaseBusiness,
  CheckCircle2,
  Files,
  BarChart3,
  Settings,
];

const statusOptions: Array<"Toutes" | ComparableStatus> = [
  "Toutes",
  "Vendue",
  "En vigueur",
  "Expirée",
];

const stepVisuals = [UsersRound, House, Grid2X2, SlidersHorizontal, BarChart3, Target, Files, ShieldCheck];

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
}: {
  comparable: Comparable;
  view: "list" | "cards";
  onToggle: () => void;
  expanded: boolean;
  onExpand: () => void;
}) {
  const deltaClass = comparable.adjustment > 0 ? "positive" : "negative";
  return (
    <article className={`comparable-row ${view} ${!comparable.included ? "excluded" : ""}`}>
      <div className="property-photo-wrap">
        <img className="property-photo" src={comparable.image} alt={`Façade du ${comparable.address}`} />
        <span className={`status-badge status-${comparable.status.replace(" ", "-").toLowerCase()}`}>
          {comparable.status}
        </span>
        <button className="photo-more" aria-label={`Plus d’options pour ${comparable.address}`}>
          <MoreHorizontal size={17} />
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

function InsightPanel({ selectedCount, onContinue }: { selectedCount: number; onContinue: () => void }) {
  return (
    <aside className="insight-panel">
      <div className="insight-top">
        <span className="insight-eyebrow"><Sparkles size={14} /> {frCA.insight.eyebrow}</span>
        <h2>{frCA.insight.title}</h2>
        <p>{frCA.insight.body}</p>
      </div>

      <div className="range-block">
        <span>{frCA.insight.range}</span>
        <strong>378 000 $ – 397 000 $</strong>
        <div className="range-rail"><i /><b /></div>
        <div className="range-labels"><span>350 k$</span><span>425 k$</span></div>
      </div>

      <div className="mini-metrics">
        <div><span>{frCA.insight.median}</span><strong>386 000 $</strong></div>
        <div><span>{frCA.insight.distance}</span><strong>1,8 km</strong></div>
        <div><span>Comparables retenus</span><strong>{selectedCount} / 7</strong></div>
        <div><span>{frCA.insight.confidence}</span><strong className="quality"><i /> Élevée</strong></div>
      </div>

      <div className="check-block">
        <h3>{frCA.insight.checks}</h3>
        <p><CheckCircle2 size={16} /> {frCA.insight.check1}</p>
        <p><CheckCircle2 size={16} /> {frCA.insight.check2}</p>
        <p className="warning"><CircleHelp size={16} /> {frCA.insight.warning}</p>
      </div>

      <button className="primary-action full" onClick={onContinue}>
        {frCA.common.continue}<ArrowRight size={17} />
      </button>
      <small className="decision-note">Vous pourrez toujours revenir modifier cette sélection.</small>
    </aside>
  );
}

function ClientStep() {
  return (
    <div className="step-canvas two-column-step">
      <section className="editor-card">
        <div className="section-heading">
          <div><span className="section-kicker">Propriétaires</span><h2>Qui accompagnerons-nous?</h2></div>
          <button className="secondary-action"><Plus size={16} /> Ajouter un propriétaire</button>
        </div>
        <div className="owner-grid">
          <div className="owner-card selected-owner"><span className="owner-avatar">ML</span><div><strong>Marianne Lavoie</strong><p>marianne.lavoie@exemple.ca</p><p>819 555-0142 · Texto préféré</p></div><CheckCircle2 size={20} /></div>
          <div className="owner-card"><span className="owner-avatar second">SB</span><div><strong>Simon Beaudry</strong><p>simon.beaudry@exemple.ca</p><p>819 555-0177 · Courriel préféré</p></div><SquarePen size={18} /></div>
        </div>
        <div className="field-grid">
          <label><span>Motivation de vente</span><select defaultValue="move"><option value="move">Rapprochement de la famille</option></select></label>
          <label><span>Échéancier souhaité</span><select defaultValue="3months"><option value="3months">Dans les 3 prochains mois</option></select></label>
          <label className="field-wide"><span>Contexte à garder en tête</span><textarea defaultValue="Les propriétaires souhaitent acheter dans la région de Québec après la vente. Ils priorisent une transition simple et prévisible." /></label>
        </div>
      </section>
      <aside className="context-card"><MessageSquareText /><h3>Une analyse plus humaine</h3><p>Ces renseignements personnalisent le ton de la présentation et les prochaines étapes, sans être montrés dans les comparables.</p><span><ShieldCheck size={15} /> Notes privées par défaut</span></aside>
    </div>
  );
}

function PropertyStep() {
  return (
    <div className="step-canvas property-step">
      <section className="subject-card">
        <div className="subject-image"><img src="https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1400&q=88" alt="Maison de démonstration au 218, rue des Pins" /><span><Upload size={15} /> 8 photos</span></div>
        <div className="subject-content"><span className="section-kicker">Propriété sujet</span><h2>218, rue des Pins</h2><p><MapPin size={15} /> Rouyn-Noranda, Québec · J9X 4N7</p><div className="subject-facts"><span><b>4</b> chambres</span><span><b>2</b> salles de bain</span><span><b>1 472</b> pi² habitables</span><span><b>1989</b> construction</span></div><button className="secondary-action"><SquarePen size={16} /> Modifier les renseignements</button></div>
      </section>
      <section className="editor-card condition-card"><div className="section-heading"><div><span className="section-kicker">Lecture professionnelle</span><h2>Ce qui influence la valeur</h2></div><span className="saved-inline"><Check size={14} /> Enregistré</span></div><div className="condition-grid"><div><span>Atouts distinctifs</span><p>Cuisine rénovée, grande cour intime, sous-sol aménagé et garage attaché.</p></div><div><span>Points à considérer</span><p>Toiture de 2012 et salle de bain principale à moderniser.</p></div><div><span>Évaluation municipale</span><strong>326 800 $</strong><small>Terrain 74 500 $ · Bâtiment 252 300 $</small></div></div></section>
    </div>
  );
}

function AdjustmentsStep({ comparables }: { comparables: Comparable[] }) {
  const selected = comparables.filter((item) => item.included).slice(0, 4);
  const rows = [
    ["Superficie habitable", "+3 500 $", "+7 000 $", "−4 000 $", "+4 500 $"],
    ["État et rénovations", "0 $", "+5 000 $", "−6 000 $", "+3 500 $"],
    ["Salle de bain", "0 $", "0 $", "0 $", "+7 500 $"],
    ["Terrain et localisation", "+1 500 $", "−3 000 $", "+3 000 $", "−1 000 $"],
  ];
  return (
    <div className="step-canvas adjustment-layout">
      <section className="editor-card matrix-card">
        <div className="section-heading"><div><span className="section-kicker">Jugement du courtier</span><h2>Matrice d’ajustements</h2><p>Chaque montant reste modifiable et doit être validé avant publication.</p></div><button className="secondary-action"><Plus size={16} /> Ajouter un facteur</button></div>
        <div className="matrix-scroll"><table className="matrix-table"><thead><tr><th>Facteur</th>{selected.map((item) => <th key={item.id}>{item.address.split(",")[0]}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={cell}><span className={index > 0 && cell.startsWith("+") ? "matrix-positive" : index > 0 && cell.startsWith("−") ? "matrix-negative" : ""}>{cell}</span>{index > 0 && <SquarePen size={12} />}</td>)}</tr>)}</tbody><tfoot><tr><td>Ajustement total</td>{selected.map((item) => <td key={item.id}>{formatSignedCAD(item.adjustment)}</td>)}</tr></tfoot></table></div>
      </section>
      <aside className="context-card adjustment-context"><Sparkles /><span className="ai-label">Suggestion assistée</span><h3>Un écart mérite votre attention</h3><p>L’ajustement de 12 000 $ au 128, chemin Trémoy représente 2,9 % du prix demandé. Ajoutez une justification avant de valider.</p><button className="text-action">Voir le détail <ArrowRight size={15} /></button><small>L’assistant ne modifie jamais les montants.</small></aside>
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
  const scenarios = [
    { name: "Vente accélérée", range: "374 000 $ – 382 000 $", launch: "379 000 $", note: "Maximise l’attention dès les premiers jours.", tone: "fast" },
    { name: "Positionnement recommandé", range: "385 000 $ – 397 000 $", launch: "394 000 $", note: "Le meilleur équilibre entre valeur et réponse du marché.", tone: "recommended" },
    { name: "Positionnement ambitieux", range: "399 000 $ – 412 000 $", launch: "409 000 $", note: "Teste le haut du marché avec un délai potentiellement plus long.", tone: "bold" },
  ];
  return (
    <div className="step-canvas strategy-step">
      <div className="strategy-intro"><span className="section-kicker">Recommandation professionnelle</span><h2>Trois façons de se positionner</h2><p>Présentez des options claires, avec leurs avantages et compromis. Aucun scénario ne garantit un prix ni un délai de vente.</p></div>
      <div className="scenario-grid">{scenarios.map((scenario) => <article key={scenario.name} className={`scenario-card ${scenario.tone}`}><span className="scenario-label">{scenario.name}</span><h3>{scenario.range}</h3><div><span>Prix de lancement suggéré</span><strong>{scenario.launch}</strong></div><p>{scenario.note}</p><button className={scenario.tone === "recommended" ? "primary-action full" : "secondary-action full"}>{scenario.tone === "recommended" ? "Recommandation retenue" : "Choisir ce scénario"}{scenario.tone === "recommended" && <Check size={16}/>}</button></article>)}</div>
    </div>
  );
}

function PresentationStep() {
  const sections = ["Couverture", "Message de votre courtier", "Votre propriété", "Aperçu du marché", "Propriétés comparables", "Stratégie recommandée", "Plan de mise en marché", "À propos du courtier", "Prochaines étapes"];
  return (
    <div className="step-canvas presentation-layout">
      <section className="editor-card"><div className="section-heading"><div><span className="section-kicker">9 sections visibles</span><h2>Construire le récit de la présentation</h2><p>Glissez les sections pour changer l’ordre. Le contenu reste modifiable.</p></div><button className="secondary-action"><Eye size={16}/> Aperçu</button></div><div className="section-list">{sections.map((section, index) => <div className="section-row" key={section}><span className="drag-handle">⠿</span><b>{index + 1}</b><strong>{section}</strong><span className="visible-pill"><Eye size={14}/> Visible</span><ChevronRight size={16}/></div>)}</div></section>
      <aside className="context-card presentation-context"><Eye/><h3>Une expérience pensée pour le vendeur</h3><p>Le rapport s’adapte au téléphone, à la tablette et à l’impression. Les notes privées ne sont jamais incluses.</p><div className="device-preview"><span/><span/><span/></div></aside>
    </div>
  );
}

function ShareStep({ onPreview }: { onPreview: () => void }) {
  const checks = ["Renseignements de la propriété révisés", "Comparables sélectionnés par le courtier", "Ajustements et explications validés", "Stratégie de prix confirmée", "Données sensibles révisées", "Avis juridique inclus"];
  return (
    <div className="step-canvas share-layout">
      <section className="editor-card approval-card"><span className="approval-icon"><ShieldCheck/></span><span className="section-kicker">Version 1 · Prête à approuver</span><h2>Une dernière vérification avant l’envoi</h2><p>L’approbation fige une copie immuable du rapport et permet de créer le lien privé.</p><div className="approval-list">{checks.map((item) => <label key={item}><input type="checkbox" defaultChecked/><span><Check size={13}/></span>{item}</label>)}</div><div className="approval-actions"><button className="secondary-action" onClick={onPreview}><Eye size={16}/> Revoir la présentation</button><button className="primary-action"><ShieldCheck size={17}/> Approuver et créer le lien</button></div></section>
      <aside className="share-summary"><span>Après l’approbation</span><div><Files/><p><strong>PDF professionnel</strong>Généré automatiquement</p></div><div><ShieldCheck/><p><strong>Lien privé sécurisé</strong>Expire dans 30 jours</p></div><div><CalendarDays/><p><strong>Relance planifiée</strong>Deux jours après l’envoi</p></div><small>La réponse du client ne constitue pas une signature de contrat de courtage.</small></aside>
    </div>
  );
}

function StepContent({ step, comparables, onPreview }: { step: number; comparables: Comparable[]; onPreview: () => void }) {
  if (step === 0) return <ClientStep />;
  if (step === 1) return <PropertyStep />;
  if (step === 3) return <AdjustmentsStep comparables={comparables} />;
  if (step === 4) return <MarketStep />;
  if (step === 5) return <StrategyStep />;
  if (step === 6) return <PresentationStep />;
  return <ShareStep onPreview={onPreview} />;
}

function AddComparableDrawer({ onClose, onAdd }: { onClose: () => void; onAdd: (comparable: Comparable) => void }) {
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("389000");
  const [status, setStatus] = useState<ComparableStatus>("Vendue");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!address.trim()) return;
    const priceCents = Math.max(0, Number(price.replace(/\D/g, ""))) * 100;
    onAdd({
      id: `cmp-${Date.now()}`,
      address,
      city: "Rouyn-Noranda",
      image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=900&q=85",
      status,
      price: priceCents,
      adjusted: priceCents,
      adjustment: 0,
      days: 1,
      distance: 2.4,
      beds: 3,
      baths: 2,
      area: 1420,
      year: 1991,
      match: 72,
      included: true,
      reason: "Comparable ajouté manuellement; justification à compléter.",
    });
  };
  return (
    <div className="overlay drawer-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="drawer" aria-label="Ajouter un comparable">
        <div className="drawer-heading"><div><span className="section-kicker">Source manuelle</span><h2>Ajouter un comparable</h2></div><button className="icon-button" onClick={onClose} aria-label="Fermer"><X size={20}/></button></div>
        <div className="demo-callout"><ShieldCheck size={18}/><p><strong>Mode démonstration</strong>Aucune donnée Centris/MLS n’est récupérée. Vérifiez la source avant de publier.</p></div>
        <form onSubmit={submit} className="drawer-form">
          <label><span>Adresse complète</span><div className="input-with-icon"><MapPin size={17}/><input autoFocus value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Ex. 145, rue Principale" required/></div></label>
          <label><span>Statut</span><select value={status} onChange={(event) => setStatus(event.target.value as ComparableStatus)}><option>Vendue</option><option>En vigueur</option><option>Expirée</option></select></label>
          <label><span>{status === "Vendue" ? "Prix vendu" : "Prix demandé"}</span><div className="money-input"><input inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)}/><span>$ CAD</span></div></label>
          <div className="drawer-drop"><Upload/><strong>Ajouter des photos</strong><span>JPG ou PNG · 15 Mo maximum</span></div>
          <button className="primary-action full" type="submit">Ajouter à l’analyse <ArrowRight size={17}/></button>
        </form>
      </aside>
    </div>
  );
}

function SellerPreview({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay preview-overlay" role="dialog" aria-modal="true" aria-label="Aperçu de la présentation client">
      <div className="preview-window">
        <div className="preview-toolbar"><div><span className="window-dot red"/><span className="window-dot yellow"/><span className="window-dot green"/></div><span>{frCA.preview.badge}</span><button className="icon-button" onClick={onClose} aria-label={frCA.common.close}><X size={19}/></button></div>
        <div className="seller-report-hero">
          <img src="https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1800&q=90" alt="Propriété analysée"/>
          <div className="seller-shade"/>
          <div className="seller-brand"><span className="seller-monogram">GA</span><div><strong>{frCA.preview.broker}</strong><span>{frCA.preview.role}</span></div></div>
          <div className="seller-copy"><span>{frCA.preview.prepared}</span><h1>{frCA.preview.title}</h1><p>{frCA.preview.address}</p><small>{frCA.preview.date}</small><button>{frCA.preview.start}<ArrowRight size={17}/></button></div>
          <div className="seller-note">{frCA.preview.note}</div>
        </div>
      </div>
    </div>
  );
}

export default function StudioApp() {
  const [comparables, setComparables] = useState(initialComparables);
  const [activeStep, setActiveStep] = useState(2);
  const [activeNav, setActiveNav] = useState(1);
  const [view, setView] = useState<"list" | "cards" | "map">("list");
  const [filter, setFilter] = useState<"Toutes" | ComparableStatus>("Toutes");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => comparables.filter((item) => {
    const statusMatch = filter === "Toutes" || item.status === filter;
    const queryMatch = `${item.address} ${item.city}`.toLowerCase().includes(query.toLowerCase());
    return statusMatch && queryMatch;
  }), [comparables, filter, query]);
  const selectedCount = comparables.filter((item) => item.included).length;

  const toggleComparable = (id: string) => {
    setComparables((items) => items.map((item) => item.id === id ? { ...item, included: !item.included } : item));
  };

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const handleStep = (step: number) => {
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-identity"><img src="/ocliq-logo.png" alt="Ocliq"/><span>{frCA.brand.product}</span></div>
          <span className="brand-symbol" aria-hidden="true"><img src="/ocliq-logo.png" alt=""/></span>
          <button className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label="Réduire la navigation"><ChevronsLeft size={17}/></button>
        </div>
        <button className="tenant-switcher"><span className="tenant-avatar">{tenant.initials}</span><span className="tenant-copy"><strong>{tenant.name}</strong><small>{tenant.descriptor}</small></span><ChevronDown size={15}/></button>
        <button className="quick-create" onClick={() => { setActiveNav(1); setActiveStep(0); setMobileOpen(false); flash("Nouvelle analyse démarrée"); }}><Plus size={18}/><span>Créer une ACM</span></button>
        <nav>{frCA.nav.map((item, index) => { const Icon = navIcons[index]; return <button key={item} className={activeNav === index ? "active" : ""} onClick={() => { setActiveNav(index); setMobileOpen(false); if (index !== 1) flash(`${item} — aperçu du module`); }}><Icon size={18}/><span>{item}</span>{index === 5 && <b>3</b>}</button>; })}</nav>
        <div className="sidebar-bottom"><button><CircleHelp size={18}/><span>Centre d’aide</span></button><div className="user-tile"><span className="tenant-avatar muted">GA</span><span><strong>Gabriel A.</strong><small>Courtier</small></span><MoreHorizontal size={17}/></div></div>
      </aside>

      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu"/>}

      <div className="app-column">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu"><Menu size={21}/></button>
          <div className="breadcrumbs"><span>Analyses</span><ChevronRight size={13}/><strong>{frCA.analysis.title}</strong></div>
          <label className="global-search"><Search size={17}/><input placeholder={frCA.common.search}/><kbd>⌘ K</kbd></label>
          <div className="top-actions"><span className="saved-status"><Check size={14}/>{frCA.common.saved}</span><span className="demo-pill"><span/> {frCA.common.demo}</span><button className="icon-button has-dot" aria-label="Notifications"><Bell size={19}/></button><button className="avatar-button">GA</button></div>
        </header>

        <main>
          {activeNav === 1 ? (
            <>
              <section className="analysis-heading">
                <div><span className="analysis-eyebrow">{frCA.analysis.eyebrow}<i/></span><div className="analysis-title-line"><h1>{frCA.analysis.title}</h1><button aria-label="Modifier le titre"><SquarePen size={16}/></button></div><p>{frCA.analysis.location}<span/> {frCA.analysis.client}</p></div>
                <div className="analysis-heading-actions"><button className="secondary-action" onClick={() => setPreviewOpen(true)}><Eye size={17}/>{frCA.common.preview}</button><button className="more-button" aria-label="Plus d’actions"><MoreHorizontal size={19}/></button></div>
              </section>

              <section className="workflow-stepper" aria-label="Progression de l’analyse">
                {frCA.steps.map((step, index) => { const Icon = stepVisuals[index]; const complete = index < activeStep; return <button key={step.title} onClick={() => handleStep(index)} className={`${index === activeStep ? "current" : ""} ${complete ? "complete" : ""}`}><span className="step-icon">{complete ? <Check size={15} strokeWidth={3}/> : <Icon size={16}/>}</span><span className="step-text"><small>{String(index + 1).padStart(2, "0")}</small><strong>{step.short}</strong></span>{index < frCA.steps.length - 1 && <i/>}</button>; })}
              </section>

              {activeStep === 2 ? (
                <div className="workflow-layout">
                  <section className="comparables-panel">
                    <div className="panel-heading"><div><span className="section-kicker">{frCA.comparables.eyebrow}</span><h2>{frCA.comparables.title}</h2><p>{frCA.comparables.intro}</p></div><button className="primary-action" onClick={() => setDrawerOpen(true)}><Plus size={17}/>{frCA.comparables.add}</button></div>
                    <div className="selection-summary"><div className="summary-avatars">{comparables.filter((item) => item.included).slice(0, 4).map((item) => <img key={item.id} src={item.image} alt=""/>)}<span>+{Math.max(selectedCount - 4, 0)}</span></div><p><strong>{selectedCount} propriétés {frCA.comparables.selected}</strong><span>Fourchette ajustée : 381 500 $ à 397 000 $</span></p><div className="selection-score"><ScoreRing value={88}/><span><strong>Très bonne sélection</strong><small>selon la proximité et la similarité</small></span></div></div>
                    <div className="filter-bar">
                      <div className="status-tabs">{statusOptions.map((status) => { const label = status === "Toutes" ? frCA.comparables.filterAll : status; const count = status === "Toutes" ? comparables.length : comparables.filter((item) => item.status === status).length; return <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}>{label}<span>{count}</span></button>; })}</div>
                      <div className="filter-actions"><label className="compact-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher" aria-label={frCA.comparables.query}/></label><button className="filter-button" aria-label="Filtres avancés"><SlidersHorizontal size={16}/><span>Filtres</span></button><div className="view-switcher"><button className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="Vue liste"><List size={16}/></button><button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")} aria-label="Vue cartes"><Grid2X2 size={16}/></button><button className={view === "map" ? "active" : ""} onClick={() => setView("map")} aria-label="Vue carte"><Map size={16}/></button></div></div>
                    </div>
                    <div className="source-note"><ShieldCheck size={14}/><span>{frCA.comparables.source} · {frCA.comparables.noIntegration}</span></div>
                    {view === "map" ? <MapView comparables={filtered} onToggle={toggleComparable}/> : (
                      <div className={`comparables-list ${view}`}>{filtered.length ? filtered.map((comparable) => <ComparableRow key={comparable.id} comparable={comparable} view={view} onToggle={() => toggleComparable(comparable.id)} expanded={expandedId === comparable.id} onExpand={() => setExpandedId(expandedId === comparable.id ? null : comparable.id)}/>) : <div className="empty-state"><Search/><h3>Aucun comparable trouvé</h3><p>Essayez un autre mot-clé ou retirez un filtre.</p><button className="text-action" onClick={() => { setFilter("Toutes"); setQuery(""); }}>Réinitialiser les filtres</button></div>}</div>
                    )}
                  </section>
                  <InsightPanel selectedCount={selectedCount} onContinue={() => handleStep(3)}/>
                </div>
              ) : <StepContent step={activeStep} comparables={comparables} onPreview={() => setPreviewOpen(true)}/>} 

              {activeStep !== 2 && (
                <div className="step-footer"><button className="secondary-action" onClick={() => handleStep(Math.max(activeStep - 1, 0))}><ArrowLeft size={16}/>{frCA.common.back}</button><span><Check size={14}/>{frCA.analysis.updated}</span><button className="primary-action" onClick={() => activeStep < 7 ? handleStep(activeStep + 1) : flash("Version prête à être approuvée")}>{activeStep < 7 ? "Continuer" : "Terminer la révision"}<ArrowRight size={16}/></button></div>
              )}
            </>
          ) : (
            <section className="module-placeholder"><span className="placeholder-icon">{(() => { const Icon = navIcons[activeNav]; return <Icon/>; })()}</span><span className="section-kicker">Module ACM Studio</span><h1>{frCA.nav[activeNav]}</h1><p>Cette section s’inscrit dans le même système de travail guidé. Revenez aux analyses pour parcourir le flux ACM complet.</p><button className="primary-action" onClick={() => setActiveNav(1)}>Ouvrir l’analyse en cours <ArrowRight size={17}/></button></section>
          )}
        </main>
      </div>

      {drawerOpen && <AddComparableDrawer onClose={() => setDrawerOpen(false)} onAdd={(item) => { setComparables((items) => [item, ...items]); setDrawerOpen(false); flash("Comparable ajouté à l’analyse"); }}/>} 
      {previewOpen && <SellerPreview onClose={() => setPreviewOpen(false)}/>} 
      {toast && <div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
    </div>
  );
}
