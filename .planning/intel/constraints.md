# Constraints (Synthesized)

Source: §3 Modèle de données, §6 Détails UX, §8 Ce qui n'est PAS dans le POC, §10 Livrable attendu.

---

## CON-data-model — TypeScript domain model is fixed

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§3)
- type: schema
- content: |
  The following TypeScript types define the domain model and must be honored verbatim:
  - `RawMaterial { id, type ('boeuf'|'agneau'|'poulet'|'epices'|'marinade'|'autre'), nom, fournisseur, numeroLotFournisseur, quantiteRecue, quantiteRestante, dateReception, dlc, temperatureReception, certificatSanitaire? }`
  - `Recipe { id, nom, poidsTotal, composition[] { typeMatiere, pourcentage } }` — composition percentages must sum to 100.
  - `ProductionOrder { id, date, recipeId, nombreBroches, matieresPremieresUtilisees[] { rawMaterialId, quantiteUtilisee }, brochesProduites[] }`
  - `FinishedProduct { id, numeroLotInterne, productionOrderId, poids, dateProduction, dlc, statut ('en_stock'|'livree'), livraisonId? }`
  - `Customer { id, nom, adresse, telephone, email? }`
  - `Delivery { id, date, customerId, brochesLivrees[] (FinishedProduct ids), statut ('preparee'|'livree'), notes? }`

## CON-internal-lot-format — Internal lot number format

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§6)
- type: schema
- content: |
  Internal lot numbers (`FinishedProduct.numeroLotInterne`) must follow the format `TK-AAAA-MMJJ-NNN`. Example: `TK-2026-0815-001`.

## CON-dlc-default-rule — Broche DLC defaulting

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§3)
- type: nfr
- content: |
  A `FinishedProduct.dlc` is auto-calculated as `dateProduction + 5 days` by default.

## CON-no-backend — No backend, no API, no database

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§2, §8)
- type: nfr
- content: |
  Strict client-only architecture. No Next.js API routes. No Supabase. No database (real or mocked server-side). No external API. All data lives in `localStorage` via Zustand persist.

## CON-state-persistence — State must survive page refresh

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§2)
- type: nfr
- content: |
  Application state is global via Zustand and persisted with the `persist` middleware to `localStorage`. After a browser refresh, all user data must remain.

## CON-french-only-ui — Interface in French only

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§2, §8)
- type: nfr
- content: |
  Every label, message, toast, error, and copy string must be in French. Multi-language is explicitly out of scope.

## CON-desktop-only — Desktop-only, no responsive

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§6, §8)
- type: nfr
- content: |
  Layout targets desktop laptop screens only. Mobile / tablet / responsive layouts are explicitly out of scope. The demo will be shown on a laptop.

## CON-no-tests — No unit tests in the POC

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§8)
- type: nfr
- content: |
  No unit tests, no integration tests, no e2e tests. Test scaffolding is out of scope for the POC.

## CON-out-of-scope-features — Explicit out-of-scope feature set

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§8)
- type: nfr
- content: |
  The following are explicitly OUT of scope and must not be implemented:
  - Authentication, user accounts, roles
  - Invoice generation, QR-bill, accounting
  - Pricing, margins, quotes
  - Email or SMS notifications
  - Multi-language
  - Dark mode
  - Mobile / responsive
  - Recipe creation/editing (the 3 seeded recipes are read-only)
  - Backend, database, external API
  - Unit tests

## CON-file-line-cap — Maximum 300 lines per source file

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§10)
- type: nfr
- content: |
  No source file may exceed 300 lines. Components and modules must be split to honor this cap.

## CON-no-todos — No leftover TODOs in code

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§10)
- type: nfr
- content: |
  No `TODO` markers may remain in the delivered code.

## CON-readme-required — README with launch instructions

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§10)
- type: nfr
- content: |
  The repository must include a README with `npm run dev` instructions and any prerequisites.

## CON-runs-with-npm-run-dev — Must boot via `npm run dev`

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§10)
- type: nfr
- content: |
  After install, the application must boot end-to-end via `npm run dev` with no additional setup beyond standard Node/npm.

## CON-seed-on-empty-storage — Auto-seed on empty localStorage

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§4)
- type: nfr
- content: |
  On first load (or after démo reset), if `localStorage` is empty, the application must automatically seed the dataset described in §4 (5 raw materials, 3 recipes, 8 clients, 2 production orders, 1 delivery).

## CON-no-emojis-in-ui — No emojis in UI except listed nav icons

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§7)
- type: nfr
- content: |
  No emojis anywhere in the UI except for the navigation icons in §5.1 and the example shortcut buttons in §5.7. Domain is regulatory/sanitary and must look serious.

## CON-table-density — Dense tables with 14px text

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§7)
- type: nfr
- content: |
  Tables use 14px text and moderate cell padding (data-oriented density). The visual references are Linear, Notion, and the Vercel dashboard.

## CON-color-palette — Neutral palette + blue CTA + semantic status colors

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§7)
- type: nfr
- content: |
  Default palette: shadcn neutrals (gris/blanc/noir). Primary CTAs use a blue accent. Semantic colors (green/orange/red) are reserved for DLC badges and alert statuses — not for general decoration.
