# Architecture et routes

## Décision de première tranche

Le dépôt initial était un squelette sans produit. La première tranche livre le cœur décisionnel d’une ACM sous forme d’un parcours continu, testable avec des données fictives. Cette approche valide la hiérarchie, le vocabulaire, la densité et les interactions avant d’introduire l’authentification et la persistance.

## Routes cibles

| Surface | Route | Rôle |
| --- | --- | --- |
| Authentification | `/connexion`, `/mot-de-passe-oublie`, `/invitation/[token]` | Accès et invitation |
| Tableau de bord | `/app/[tenant]/vue-d-ensemble` | Priorités opérationnelles |
| Analyses | `/app/[tenant]/analyses` | Liste et filtres |
| Parcours ACM | `/app/[tenant]/analyses/[analysisId]/[step]` | Étapes client à partage |
| CRM | `/app/[tenant]/contacts`, `/proprietes`, `/opportunites`, `/taches` | Cycle propriétaire |
| Configuration | `/app/[tenant]/modeles`, `/statistiques`, `/parametres` | Marque, équipe et intégrations |
| Rapport vendeur | `/r/[tenantSlug]/[propertySlug]/[token]` | Présentation privée |
| Rapport indisponible | `/r/indisponible` | Expiration ou révocation |

Le prototype actuel rassemble le parcours sur `/` pour accélérer la validation UX. Chaque étape possède déjà une frontière visuelle et peut être déplacée vers sa route cible sans changer son langage produit.

## Schéma PostgreSQL cible

Toutes les tables métier portent `tenant_id`, un UUID primaire, `created_at`, `updated_at`, `created_by` et, pour les dossiers importants, `deleted_at`.

- identité : `profiles`, `tenants`, `tenant_memberships`, `tenant_branding`, `tenant_settings`, `broker_profiles`;
- CRM : `contacts`, `contact_notes`, `properties`, `property_owners`, `opportunities`, `activities`, `tasks`, `tags`, `entity_tags`;
- ACM : `market_analyses`, `analysis_versions`, `comparables`, `comparable_media`, `comparable_adjustments`, `market_statistics`, `pricing_strategies`, `report_sections`, `report_comments`, `broker_approvals`;
- partage : `report_links`, `report_sessions`, `report_events`, `client_responses`, `report_notifications`;
- infrastructure : `files`, `integration_connections`, `webhook_deliveries`, `audit_logs`.

Les montants utilisent `bigint` en cents. Une version approuvée conserve un instantané JSONB immuable du rapport, son approbateur et l’empreinte du contenu. Les événements publics sont dédoublonnés avec une clé d’idempotence.

## Services remplaçables

```text
Application → services métier → interfaces de fournisseurs → adaptateurs externes
```

Interfaces prévues : `PropertyDataProvider`, `MapProvider`, `EmailProvider`, `CrmProvider`, `AiWritingProvider`, `PdfProvider`, `FileStorageProvider` et `BookingProvider`. Un adaptateur de démonstration doit toujours être nommé et signalé comme tel.

## Localisation

La copie d’interface est centralisée dans `lib/fr-ca.ts`. L’étape suivante consiste à adopter un résolveur `fr-CA`/`en-CA`, sans déplacer la logique de formatage CAD et Québec vers les composants.
