# Sécurité et feuille de route

## Hypothèses de sécurité

Le prototype ne doit recevoir aucune donnée réelle. Avant une utilisation en production, les contrôles suivants sont obligatoires :

- authentification Supabase et autorisation serveur pour chaque mutation;
- RLS fondée sur `tenant_memberships`, avec tests négatifs inter-locataires;
- clés de service, CRM, courriel et IA limitées au serveur;
- URL de rapport à jeton aléatoire haché, expiration, révocation et PIN haché optionnel;
- validation Zod des entrées, limites MIME/taille et URL signées pour les fichiers;
- journal d’audit append-only pour approbation, publication, redaction et intégrations;
- limitation de débit sur les rapports publics et traitement idempotent des webhooks;
- aucune publication automatique d’un contenu suggéré par IA;
- instantanés approuvés immuables et exportations respectant les champs privés.

## Feuille de route

1. **Fondation serveur** — Supabase, migrations, RLS, authentification, rôles et données de démonstration isolées.
2. **Persistance du parcours** — formulaires validés, autosauvegarde, médias, versions et calculs monétaires testés.
3. **Rapport privé** — instantané approuvé, jeton sécurisé, événement d’engagement et réponse du vendeur.
4. **PDF et cycle CRM** — tâche asynchrone, historique PDF, courriel, opportunité et relances idempotentes.
5. **Durcissement** — Playwright multi-locataire, accessibilité, performance, redaction et revue de sécurité.

## Critères de sortie de production

Une version ne peut être publiée que si un courtier autorisé confirme la propriété, les comparables, les ajustements, le commentaire de marché, la stratégie, les données sensibles et l’avis juridique configurable. Une réponse du vendeur reste une intention et non une signature électronique.
