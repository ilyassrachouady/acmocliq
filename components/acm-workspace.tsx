"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  ANALYSIS_PURPOSES,
  ANNEXE_KINDS,
  BUILDING_TYPES,
  COUNT_OPTIONS,
  PROPERTY_TYPES,
  SUBJECT_SECTIONS,
  YEAR_OPTIONS,
  defaultBrokerNote,
  defaultIntroduction,
  dollarsInput,
  emptyAnnexe,
  parseDollars,
  type SubjectSection,
} from "@/lib/quebec-acm";
import type { SubjectProperty } from "@/lib/demo-data";
import { formatCAD } from "@/lib/demo-data";
import {
  CalendarRange,
  Check,
  FileStack,
  House,
  Landmark,
  MapPin,
  Paperclip,
  Plus,
  Sparkles,
  StickyNote,
  Target,
  Trash2,
  Upload,
  UsersRound,
} from "lucide-react";

const sectionIcons: Record<SubjectSection, typeof House> = {
  address: MapPin,
  dates: CalendarRange,
  features: House,
  assessments: Landmark,
  pricing: Target,
  highlights: Sparkles,
  introduction: FileStack,
  notes: StickyNote,
};

function CountSelect({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
      {COUNT_OPTIONS.map((count) => <option key={count} value={count}>{count}</option>)}
    </select>
  );
}

export function AcmSubjectEditor({
  subject,
  onChange,
  addressField,
  soldAverage,
  onNotify,
}: {
  subject: SubjectProperty;
  onChange: (subject: SubjectProperty) => void;
  addressField: ReactNode;
  soldAverage: number;
  onNotify: (message: string) => void;
}) {
  const [section, setSection] = useState<SubjectSection>("address");
  const update = <K extends keyof SubjectProperty>(key: K, value: SubjectProperty[K]) => onChange({ ...subject, [key]: value });
  const totalAssessment = (subject.landAssessment || 0) + (subject.buildingAssessment || 0);
  const computedAverage = subject.soldAverageOverride || soldAverage;

  const completeness = useMemo(() => {
    const checks = {
      address: Boolean(subject.address && subject.city && subject.owners),
      dates: Boolean(subject.analysisDate && subject.analysisPurpose),
      features: Boolean(subject.type && subject.area && subject.year),
      assessments: Boolean(subject.assessmentYear && (subject.landAssessment || subject.assessment)),
      pricing: Boolean(subject.priceRealistic),
      highlights: Boolean(subject.strengths),
      introduction: Boolean(subject.introduction?.trim()),
      notes: Boolean(subject.brokerNote?.trim() || subject.context?.trim()),
    };
    return checks;
  }, [subject]);

  const uploadPhoto = (file?: File) => {
    if (!file) return;
    if (file.size > 2_000_000) {
      onNotify("Image trop lourde — maximum 2 Mo");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update("image", String(reader.result));
      onNotify("Photo du sujet enregistrée");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="quebec-workspace">
      <nav className="quebec-nav" aria-label="Sections du sujet">
        {SUBJECT_SECTIONS.map((item) => {
          const Icon = sectionIcons[item.id];
          return (
            <button type="button" key={item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)}>
              <Icon size={16}/>
              <span>
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
              {completeness[item.id] && <Check size={14}/>}
            </button>
          );
        })}
      </nav>

      <section className="editor-card quebec-panel">
        {section === "address" && (
          <>
            <header className="quebec-panel-head">
              <div><span className="section-kicker">PROPRIÉTÉ SUJET</span><h2>Adresse et visuels</h2><p>Localisez d’abord le bien. La carte et Street View se remplissent automatiquement.</p></div>
              <span className="quebec-autosave">Sauvegarde automatique</span>
            </header>
            <div className="settings-fields dossier-fields">
              <label className="span-2"><span>Adresse complète *</span>{addressField}</label>
              <label><span>Numéro civique</span><input value={subject.civicNumber ?? ""} onChange={(event) => update("civicNumber", event.target.value)} placeholder="218"/></label>
              <label><span>Appartement</span><input value={subject.unit ?? ""} onChange={(event) => update("unit", event.target.value)} placeholder="Optionnel"/></label>
              <label><span>Rue *</span><input value={subject.street ?? ""} onChange={(event) => update("street", event.target.value)} placeholder="rue des Pins"/></label>
              <label><span>Ville *</span><input value={subject.city} onChange={(event) => update("city", event.target.value)} placeholder="Rouyn-Noranda"/></label>
              <label><span>Province</span><input value={subject.province ?? "Québec"} onChange={(event) => update("province", event.target.value)}/></label>
              <label><span>Code postal</span><input value={subject.postalCode} onChange={(event) => update("postalCode", event.target.value)} placeholder="J9X 5M2"/></label>
              <label className="span-2"><span>Propriétaire(s) *</span><input value={subject.owners} onChange={(event) => update("owners", event.target.value)} placeholder="Nom du ou des vendeurs"/></label>
              <label><span>Téléphone</span><input value={subject.phone} onChange={(event) => update("phone", event.target.value)}/></label>
              <label><span>Courriel</span><input value={subject.email} onChange={(event) => update("email", event.target.value)}/></label>
            </div>
            <div className="quebec-upload-row">
              <label className="secondary-action quebec-upload">
                <Upload size={16}/> Télécharger une photo
                <input type="file" accept="image/*" hidden onChange={(event) => uploadPhoto(event.target.files?.[0])}/>
              </label>
              <small>Street View reste utilisé si aucune photo n’est téléversée.</small>
            </div>
          </>
        )}

        {section === "dates" && (
          <>
            <header className="quebec-panel-head"><div><span className="section-kicker">CADRE DE L’ANALYSE</span><h2>Dates et but</h2><p>Ces éléments apparaissent en tête du rapport client.</p></div></header>
            <div className="settings-fields">
              <label><span>Date de l’analyse *</span><input type="date" value={subject.analysisDate ?? ""} onChange={(event) => update("analysisDate", event.target.value)}/></label>
              <label><span>Période observée (mois) *</span><input inputMode="numeric" value={subject.analysisPeriodMonths || ""} onChange={(event) => update("analysisPeriodMonths", Number(event.target.value) || 0)}/></label>
              <label className="span-2"><span>But de l’analyse *</span>
                <select value={subject.analysisPurpose ?? ANALYSIS_PURPOSES[0]} onChange={(event) => update("analysisPurpose", event.target.value)}>
                  {ANALYSIS_PURPOSES.map((purpose) => <option key={purpose}>{purpose}</option>)}
                </select>
              </label>
              <label><span>Échéancier souhaité</span><input value={subject.timeframe} onChange={(event) => update("timeframe", event.target.value)} placeholder="3 mois"/></label>
              <label className="span-2"><span>Contexte privé du vendeur</span><textarea value={subject.context} onChange={(event) => update("context", event.target.value)} placeholder="Ne sera pas imprimé dans le PDF client."/></label>
            </div>
          </>
        )}

        {section === "features" && (
          <>
            <header className="quebec-panel-head"><div><span className="section-kicker">FICHE PHYSIQUE</span><h2>Caractéristiques</h2><p>Les champs utiles à une ACM québécoise, sans le bruit d’une fiche MLS complète.</p></div></header>
            <div className="settings-fields">
              <label><span>Type de propriété</span>
                <select value={subject.type} onChange={(event) => update("type", event.target.value)}>
                  {PROPERTY_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label><span>Type de bâtiment</span>
                <select value={subject.buildingType ?? "Détaché"} onChange={(event) => update("buildingType", event.target.value)}>
                  {BUILDING_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label><span>Année de construction</span>
                <select value={subject.year || ""} onChange={(event) => update("year", Number(event.target.value))}>
                  <option value="">—</option>
                  {YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
              <label><span>Nombre d’étages</span><CountSelect value={subject.levels ?? 0} onChange={(value) => update("levels", value)}/></label>
              <label><span>Superficie du terrain (pi²) *</span><input inputMode="numeric" value={subject.lotArea || ""} onChange={(event) => update("lotArea", Number(event.target.value) || 0)}/></label>
              <label><span>Superficie habitable (pi²) *</span><input inputMode="numeric" value={subject.area || ""} onChange={(event) => update("area", Number(event.target.value) || 0)}/></label>
              <label><span>Stationnements</span><CountSelect value={subject.parkingCount ?? 0} onChange={(value) => update("parkingCount", value)}/></label>
              <label><span>Garages</span><CountSelect value={subject.garageCount ?? 0} onChange={(value) => update("garageCount", value)}/></label>
              <label><span>Pièces</span><CountSelect value={subject.rooms ?? 0} onChange={(value) => update("rooms", value)}/></label>
              <label><span>Chambres</span><CountSelect value={subject.beds} onChange={(value) => update("beds", value)}/></label>
              <label><span>Salles de bain</span><CountSelect value={subject.baths} onChange={(value) => update("baths", value)}/></label>
              <label><span>Salles d’eau</span><CountSelect value={subject.powderRooms ?? 0} onChange={(value) => update("powderRooms", value)}/></label>
            </div>
          </>
        )}

        {section === "assessments" && (
          <>
            <header className="quebec-panel-head"><div><span className="section-kicker">RÔLE D’ÉVALUATION</span><h2>Évaluations</h2><p>Les trois piliers du rôle municipal québécois.</p></div></header>
            <div className="settings-fields">
              <label><span>Année du rôle</span>
                <select value={subject.assessmentYear || 2026} onChange={(event) => update("assessmentYear", Number(event.target.value))}>
                  {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
              <label><span>Évaluation du terrain *</span><input inputMode="numeric" value={dollarsInput(subject.landAssessment)} onChange={(event) => { const land = parseDollars(event.target.value); onChange({ ...subject, landAssessment: land, assessment: land + (subject.buildingAssessment || 0) }); }}/></label>
              <label><span>Évaluation du bâtiment *</span><input inputMode="numeric" value={dollarsInput(subject.buildingAssessment)} onChange={(event) => { const building = parseDollars(event.target.value); onChange({ ...subject, buildingAssessment: building, assessment: (subject.landAssessment || 0) + building }); }}/></label>
            </div>
            <div className="quebec-total"><UsersRound size={16}/><span>Total au rôle : <strong>{formatCAD(totalAssessment || subject.assessment)}</strong></span></div>
          </>
        )}

        {section === "pricing" && (
          <>
            <header className="quebec-panel-head"><div><span className="section-kicker">POSITIONNEMENT</span><h2>Prix suggéré</h2><p>Trois lectures pour le vendeur. Le prix réaliste est celui retenu dans le rapport.</p></div></header>
            <div className="quebec-price-grid">
              <label className="price-card offensive"><span>Prix offensif</span><input inputMode="numeric" value={dollarsInput(subject.priceOffensive)} onChange={(event) => update("priceOffensive", parseDollars(event.target.value))}/><small>Accélère les visites, plus de risque de laisser de la valeur.</small></label>
              <label className="price-card realistic"><span>Prix réaliste</span><input inputMode="numeric" value={dollarsInput(subject.priceRealistic)} onChange={(event) => update("priceRealistic", parseDollars(event.target.value))}/><small>Équilibre valeur démontrée et concurrence actuelle.</small></label>
              <label className="price-card optimistic"><span>Prix optimiste</span><input inputMode="numeric" value={dollarsInput(subject.priceOptimistic)} onChange={(event) => update("priceOptimistic", parseDollars(event.target.value))}/><small>Teste le haut du marché, délai potentiellement plus long.</small></label>
            </div>
            <div className="settings-fields" style={{ marginTop: 18 }}>
              <label><span>Moyenne des vendues (calculée)</span><input readOnly value={soldAverage ? formatCAD(soldAverage) : "Ajoutez des ventes retenues"}/></label>
              <label><span>Remplacer la moyenne (optionnel)</span><input inputMode="numeric" value={dollarsInput(subject.soldAverageOverride)} onChange={(event) => update("soldAverageOverride", parseDollars(event.target.value))} placeholder="Laisser vide pour le calcul automatique"/></label>
            </div>
            {computedAverage ? <p className="quebec-hint">Moyenne retenue dans le rapport : {formatCAD(computedAverage)}</p> : null}
          </>
        )}

        {section === "highlights" && (
          <>
            <header className="quebec-panel-head"><div><span className="section-kicker">LECTURE DU COURTIER</span><h2>Faits saillants</h2><p>Ce que le vendeur doit retenir, sans jargon.</p></div></header>
            <div className="settings-fields">
              <label className="span-2"><span>Atouts distinctifs</span><textarea value={subject.strengths} onChange={(event) => update("strengths", event.target.value)} placeholder="Cuisine, cour, garage, rénovations…"/></label>
              <label className="span-2"><span>Points à considérer</span><textarea value={subject.considerations} onChange={(event) => update("considerations", event.target.value)} placeholder="Toiture, salle de bain, proximité d’une artère…"/></label>
            </div>
          </>
        )}

        {section === "introduction" && (
          <>
            <header className="quebec-panel-head">
              <div><span className="section-kicker">TEXTE CLIENT</span><h2>Introduction</h2><p>Personnalisez l’ouverture du rapport. Un modèle québécois est proposé.</p></div>
              <button type="button" className="secondary-action" onClick={() => update("introduction", defaultIntroduction(subject.owners, subject.city))}>Insérer le modèle</button>
            </header>
            <textarea className="quebec-editor" value={subject.introduction ?? ""} onChange={(event) => update("introduction", event.target.value)} placeholder="Présentez l’analyse au vendeur…"/>
            <small className="quebec-count">{(subject.introduction ?? "").trim().length} caractères · inclus au PDF</small>
          </>
        )}

        {section === "notes" && (
          <>
            <header className="quebec-panel-head">
              <div><span className="section-kicker">JUGEMENT PROFESSIONNEL</span><h2>Note du courtier</h2><p>Optionnelle. Cochez pour l’imprimer dans le PDF client.</p></div>
              <button type="button" className="secondary-action" onClick={() => update("brokerNote", defaultBrokerNote)}>Insérer le modèle</button>
            </header>
            <textarea className="quebec-editor" value={subject.brokerNote ?? ""} onChange={(event) => update("brokerNote", event.target.value)} placeholder="Précisez votre lecture du marché, les limites de l’échantillon, ou un conseil de mise en marché…"/>
            <label className="quebec-check">
              <input type="checkbox" checked={subject.includeBrokerNote !== false} onChange={(event) => update("includeBrokerNote", event.target.checked)}/>
              Inclure cette note dans le rapport client
            </label>
            <label className="dossier-note" style={{ marginTop: 16 }}><span>Notes privées (jamais imprimées)</span><textarea value={subject.context} onChange={(event) => update("context", event.target.value)}/></label>
          </>
        )}
      </section>
    </div>
  );
}

export function AnnexesPanel({
  subject,
  onChange,
}: {
  subject: SubjectProperty;
  onChange: (subject: SubjectProperty) => void;
}) {
  const annexes = subject.annexes ?? [];
  const add = () => onChange({ ...subject, annexes: [...annexes, emptyAnnexe()] });
  const update = (id: string, patch: Partial<(typeof annexes)[number]>) => onChange({ ...subject, annexes: annexes.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const remove = (id: string) => onChange({ ...subject, annexes: annexes.filter((item) => item.id !== id) });

  return (
    <section className="editor-card annexes-panel">
      <header className="quebec-panel-head">
        <div><span className="section-kicker">PIÈCES DU DOSSIER</span><h2>Annexes</h2><p>Ajoutez les documents que vous voulez lister au rapport : rôle, certificat, photos, taxes.</p></div>
        <button type="button" className="primary-action" onClick={add}><Plus size={16}/> Ajouter une annexe</button>
      </header>
      {annexes.length ? (
        <div className="annexe-list">
          {annexes.map((annexe, index) => (
            <article key={annexe.id} className="annexe-card">
              <span className="annexe-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="settings-fields">
                <label><span>Type</span>
                  <select value={annexe.kind} onChange={(event) => update(annexe.id, { kind: event.target.value as typeof annexe.kind })}>
                    {ANNEXE_KINDS.map((kind) => <option key={kind}>{kind}</option>)}
                  </select>
                </label>
                <label><span>Titre</span><input value={annexe.title} onChange={(event) => update(annexe.id, { title: event.target.value })} placeholder="Ex. Rôle municipal 2025"/></label>
                <label className="span-2"><span>Note pour le client</span><textarea value={annexe.note} onChange={(event) => update(annexe.id, { note: event.target.value })} placeholder="Précisez ce que le document confirme."/></label>
              </div>
              <button type="button" className="annexe-remove" onClick={() => remove(annexe.id)} aria-label="Retirer l’annexe"><Trash2 size={16}/></button>
            </article>
          ))}
        </div>
      ) : (
        <div className="dashboard-empty">
          <Paperclip/>
          <h3>Aucune annexe pour le moment</h3>
          <p>Ajoutez le rôle d’évaluation, le certificat de localisation ou toute pièce utile au vendeur.</p>
          <button type="button" className="primary-action" onClick={add}><Plus/> Ajouter une annexe</button>
        </div>
      )}
    </section>
  );
}
