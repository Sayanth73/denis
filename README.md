# TraceKebab

POC de traçabilité kebab — application Next.js client-only démontrant le suivi de la chaîne réception → production → livraison pour un atelier de transformation de viande en Suisse romande.

## Démarrage

```bash
npm install
npm run dev
```

L'application démarre sur http://localhost:3000.

## Stack

- Next.js 14 App Router
- TypeScript strict
- Tailwind CSS
- shadcn/ui (New York style, base neutre)
- lucide-react (iconographie)
- Zustand + persist middleware (localStorage)
- sonner (toasts)
- geist (Geist Sans + Geist Mono)

## Structure

```
app/                  Routes App Router (layout, page.tsx, route stubs)
components/           Composants UI partagés (sidebar, header, ui/)
lib/                  Utilitaires (cn, mappings de navigation, store Zustand)
.planning/            Planification GSD (PROJECT, ROADMAP, phases, intel)
```

## Contraintes clés

- Client-only (aucun backend, aucune route API).
- Persistance via `localStorage`.
- Interface française uniquement, desktop only.
- Plafond de 300 lignes par fichier source.

## Démo rapide — 5 étapes en moins de 5 minutes

Ce flux démonstration couvre le cycle complet : réception matière première → production → livraison → traçabilité → export PDF.

### Pré-requis

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000

### Étapes

**Étape 1 — Réceptionner un lot**
Aller sur "Matières premières" → cliquer "+ Réceptionner un lot" → saisir un lot de viande de bœuf (ex : fournisseur "Boucherie Test SA", n° lot "BT-2026-DEMO", 100 kg, DLC dans 8 jours) → confirmer → badge DLC vert visible dans le tableau.

**Étape 2 — Lancer une production**
Aller sur "Production" → onglet "Ordres de fabrication" → cliquer "+ Nouvel ordre de fabrication" → choisir la recette "Broche standard 25 kg" et 4 broches → allouer le lot BT-2026-DEMO → confirmer → 4 broches apparaissent en stock.

**Étape 3 — Livrer 2 broches**
Aller sur "Livraisons" → cliquer "+ Nouvelle livraison" → choisir un client → cocher 2 des 4 broches → "Préparer la livraison" → "Marquer comme livrée" → confirmer → statut passe à "Livrée".

**Étape 4 — Rechercher la traçabilité**
Aller sur "Traçabilité" → saisir "BT-2026-DEMO" dans la barre de recherche → 3 sections s'affichent : la matière première (Boucherie Test SA), l'ordre de fabrication, et les clients ayant reçu les broches issues de ce lot.

**Étape 5 — Exporter le dossier PDF**
Depuis la vue de résultat → cliquer "Exporter dossier traçabilité (PDF)" → la fenêtre d'impression du navigateur s'ouvre avec le dossier complet.

### Réinitialiser la démo

Cliquer "Réinitialiser démo" en haut à droite → confirmer → toutes les données reviennent au jeu initial de démonstration.
