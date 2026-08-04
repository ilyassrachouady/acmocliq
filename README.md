# ACM Studio par Ocliq

ACM Studio est un espace de travail en français canadien pour créer, expliquer et partager une analyse comparative du marché immobilier. Cette première tranche verticale transforme le flux de comparables en une expérience guidée complète, de la fiche client jusqu’à l’approbation du rapport.

## Ce qui est fonctionnel

- navigation responsive et identité de locataire configurable;
- parcours ACM en huit étapes avec retour libre entre les étapes;
- fiche client et propriété sujet;
- comparables en vue liste, cartes et carte schématique;
- recherche, filtres, inclusion/exclusion et ajout manuel;
- justification visible et distinction entre prix observé, ajustement et valeur calculée;
- matrice d’ajustements, aperçu du marché et scénarios de prix;
- constructeur de présentation, validation et aperçu vendeur;
- indicateurs explicites pour les données de démonstration et l’absence d’intégration Centris/MLS;
- mise en page desktop, tablette et mobile, navigation clavier et réduction des animations;
- carte sociale Open Graph propre à ACM Studio.

Les données et les propriétés de ce prototype sont fictives. Les interactions restent en mémoire dans le navigateur et ne représentent pas encore une connexion Supabase.

## Démarrage local

Pré-requis : Node.js 22.13 ou plus récent.

```bash
npm install
npm run dev
```

Vérifications :

```bash
npm run build
npm run lint
npm test
```

## Architecture

L’interface est séparée en quatre couches simples :

- `app/` : route, métadonnées et styles globaux;
- `components/` : expérience produit interactive;
- `lib/fr-ca.ts` : copie d’interface centralisée;
- `lib/demo-data.ts` : contrat de données et démonstration remplaçable.

Le thème du courtier est injecté par le locataire et non codé dans les composants partagés. Les services Supabase, cartographie, courriel, CRM, IA et PDF doivent être ajoutés derrière des interfaces serveur avant une mise en production avec de vraies données.

Voir [Architecture et routes](docs/architecture.md) et [Sécurité et feuille de route](docs/security-and-roadmap.md).

## Variables d’environnement prévues

Copier `.env.example` vers `.env.local` uniquement lorsque les fournisseurs correspondants sont réellement branchés. Ne jamais exposer la clé de service Supabase dans le navigateur.

## Limites connues de cette tranche

- pas encore d’authentification, de persistance ou de RLS Supabase;
- les photos de démonstration sont distantes et seront remplacées par le stockage signé du locataire;
- la carte est une visualisation locale, sans géocodage externe;
- le PDF, l’envoi de courriel, le CRM et le lien privé sont représentés dans le flux mais pas reliés à des fournisseurs;
- aucune donnée Centris/MLS n’est récupérée ou sous-entendue.
