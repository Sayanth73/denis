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
