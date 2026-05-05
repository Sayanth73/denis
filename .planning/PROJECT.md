# TraceKebab

## What This Is

TraceKebab is a clickable Proof of Concept for a small Swiss kebab meat transformer. It demonstrates an end-to-end traceability flow — raw material reception, production of finished kebab spits ("broches"), delivery to restaurant clients, and a bidirectional traceability search — in a single Next.js application running entirely client-side. The product is being shown to a real prospect to validate the concept before any production build.

## Core Value

Given a supplier lot number or an internal broche lot number, the user can in one click visualize the entire chain (supplier → production → client) and export it as a PDF dossier suitable for an OSAV (Swiss Federal Food Safety and Veterinary Office) sanitary control. This single capability is the killer feature; everything else exists to support it.

## Current Milestone: v0.4 — Usabilité et exports

**Goal:** Rendre l'application utilisable au quotidien — dates au format suisse, confirmations avant suppression, recherche dans les listes, CRUD complet des recettes, export PDF de facture, et sauvegarde/restauration JSON des données.

**Target features:**
- Format de date suisse (DD.MM.YYYY) dans toute l'app
- Confirmations avant suppression d'un client ou d'une matière première
- Recherche/filtre dans les listes (livraisons, clients, matières premières)
- CRUD complet des recettes (créer, éditer, supprimer)
- Export PDF d'une facture depuis la page détail
- Export et import JSON pour sauvegarder et restaurer les données localStorage

## Requirements

### Validated

<!-- Shipped and confirmed valuable. v0.1 completed 2026-05-05. v0.2 completed 2026-05-05. -->

- [x] REQ-layout-shell — Application shell with sidebar navigation
- [x] REQ-dashboard — Dashboard with KPI cards, alerts, and recent activity
- [x] REQ-raw-materials-list — Sortable raw materials table
- [x] REQ-raw-material-receive — Receive a new raw material lot
- [x] REQ-recipes-readonly — Recipes tab listing seeded recipes
- [x] REQ-production-orders-list — Production orders table
- [x] REQ-production-wizard — 3-step production order wizard with FIFO lot allocation
- [x] REQ-deliveries-list — Deliveries table
- [x] REQ-delivery-create — Create a new delivery from broches in stock
- [x] REQ-clients-crud — Clients list with basic CRUD
- [x] REQ-client-detail-history — Client detail with delivery history and full upstream trace
- [x] REQ-tracabilite-search — Traçabilité search bar with example shortcuts
- [x] REQ-tracabilite-upstream — Trace from raw material lot to clients (Cas 1)
- [x] REQ-tracabilite-downstream — Trace from broche to raw materials (Cas 2)
- [x] REQ-tracabilite-pdf-export — Export traçabilité dossier as PDF
- [x] REQ-dlc-color-coding — DLC badge colors (green/orange/red/grey)
- [x] REQ-toasts-on-mutations — Toasts on every create/modify action
- [x] REQ-confirmations-on-critical-actions — Confirmation prompts for critical actions
- [x] REQ-empty-states — Polished empty states on every table
- [x] REQ-no-pagination — No pagination, capped data volume (20-30 rows max)
- [x] REQ-success-criteria-demo-flow — End-to-end 5-minute demo flow per §9 of PRD

- [x] REQ-v2-broche-recipe-display — Recipe name visible wherever a broche appears
- [x] REQ-v2-stock-broches-screen — /stock-broches inventory screen for finished products
- [x] REQ-v2-factures — Auto-generate facture on delivery, /factures list and detail screens
- [x] REQ-v2-suivi-paiements — Payment lifecycle tracking on invoices, dashboard KPI, paramètre délai

- [x] REQ-v3-prix-recette-defaut — Default price per kg configurable per recipe in Paramètres
- [x] REQ-v3-prix-client-override — Per-client price override per recipe on client detail page
- [x] REQ-v3-facture-prix-auto — Factures auto-generated with correct per-recipe, per-client price

### Active

<!-- Current scope. Building toward these. v0.4 — usabilite-et-exports. -->

- [ ] REQ-v4-dates-suisses — All dates displayed in DD.MM.YYYY Swiss format throughout the app
- [ ] REQ-v4-delete-confirmation-client — Confirmation dialog before deleting a client
- [ ] REQ-v4-delete-confirmation-mp — Confirmation dialog before deleting a matière première
- [ ] REQ-v4-search-livraisons — Filter livraisons list by client name or date
- [ ] REQ-v4-search-clients — Filter clients list by name
- [ ] REQ-v4-search-matieres — Filter matières premières list by name or supplier
- [ ] REQ-v4-recettes-create — User can create a new recipe with name and default price
- [ ] REQ-v4-recettes-edit — User can edit an existing recipe's name and default price
- [ ] REQ-v4-recettes-delete — User can delete a recipe not referenced by any production order (with confirmation)
- [ ] REQ-v4-facture-pdf — Export a facture as a formatted PDF from the facture detail page
- [ ] REQ-v4-export-json — Export all application data as a downloadable JSON file from Paramètres
- [ ] REQ-v4-import-json — Import a previously exported JSON backup from Paramètres (with confirmation)

### Out of Scope

<!-- Explicit boundaries from PRD §8. Includes reasoning to prevent re-adding. -->

- Authentication / user accounts / roles — POC is a single-user demo; auth would consume time without informing the concept.
- Backend / Next.js API routes / database — explicitly imposed: client-only architecture via Zustand + localStorage.
- Multi-language UI — French exclusively; the prospect is in Suisse romande.
- Mobile / responsive layouts — demo is shown on a laptop; responsive engineering is wasted effort.
- Dark mode — adds visual complexity without informing the value prop.
- Recipe creation/editing — the 3 seeded recipes are read-only in v0.1.
- Invoicing (QR-bill, email delivery, credit notes) — basic facture auto-generated in v0.2; advanced features deferred.
- Email / SMS notifications — out of scope for a demo.
- Unit / integration / e2e tests — POC quality bar is "the demo runs", not "regression-safe".
- Real-time updates / multi-user collaboration — single-tab, single-user demo.

## Context

**Business domain.** The user is a small Swiss meat transformer specializing in kebab spits. The business operates in three stages: (1) purchase raw materials (bœuf, agneau, poulet, épices, marinades, sel) from suppliers, each delivery carrying a supplier lot number, sanitary certificate, reception temperature, and DLC; (2) produce finished broches by mixing those raw materials according to recipes (e.g., "broche standard 25 kg = 60% bœuf + 30% agneau + 10% épices"); (3) deliver those broches to recurring kebab-restaurant clients across Suisse romande.

**Regulatory driver.** OSAV (Office fédéral de la sécurité alimentaire et des affaires vétérinaires) sanitary controls require bidirectional traceability: forward (from any delivered broche, retrieve the supplier lots that composed it) and reverse (from any supplier lot, retrieve every client that received a broche containing it). This bidirectional chain is the regulatory pain point the product solves, and the §5.7 traçabilité screen is explicitly called out in the PRD as "L'écran qui fait vendre".

**Project intent.** This is a clickable demo, not a production v1. Success is judged on whether a 5-minute walkthrough convinces the prospect — not on test coverage, not on hardening, not on scale. The §9 demo flow is the acceptance contract: receive a raw material lot → produce 4 broches → deliver 2 broches to a client → search the supplier lot in traçabilité → export the PDF.

**Geography & language.** Suisse romande. UI is French exclusively. Seed data uses realistic Swiss-romand kebab restaurant names ("Kebab Royal Lausanne", "Snack Istanbul Yverdon", etc.).

**Visual identity.** Sober, professional B2B SaaS aesthetic. References: Linear, Notion, Vercel dashboard. Neutral shadcn palette (gris/blanc/noir) with blue accents for primary CTAs. Semantic colors (green/orange/red) reserved for DLC badges and alert statuses. Dense tables, 14px text. No emojis except navigation icons and the two example-shortcut buttons in §5.7.

**Build environment.** Local laptop, `npm run dev`. No deployment. Demo is shown live from the developer's machine.

## Constraints

- **Tech stack (imposed)**: Next.js 14+ with App Router, TypeScript strict, Tailwind CSS, shadcn/ui, lucide-react, Zustand + persist middleware to localStorage, sonner for toasts. — PRD §2 declares the stack "imposée".
- **Architecture**: No backend. No Next.js API routes. No database (real or mocked server-side). All data lives in `localStorage` via Zustand persist. — Explicit rule from §2/§8.
- **Persistence**: Application state must survive a browser refresh. — §2.
- **Auto-seed**: On first load with empty `localStorage`, the application seeds 5 raw materials across 3 suppliers, 3 recipes, 8 fictitious Suisse-romand kebab restaurant clients, 2 prior production orders with their broches, and 1 prior delivery. A "Réinitialiser les données démo" button in the header resets `localStorage` to seed state. — §4.
- **Domain model (verbatim)**: The TypeScript types in §3 of the PRD (`RawMaterial`, `Recipe`, `ProductionOrder`, `FinishedProduct`, `Customer`, `Delivery`) must be honored as-is. Recipe composition percentages must sum to 100. — §3.
- **Internal lot format**: Finished broches use `TK-AAAA-MMJJ-NNN` (e.g., `TK-2026-0815-001`). — §6.
- **DLC defaulting**: A finished broche's `dlc` is auto-calculated as production date + 5 days by default. — §3.
- **DLC color coding**: Green if >5 days remain, orange 2-5 days, red <2 days, grey if expired. — §6.
- **FIFO allocation**: When allocating raw material lots in the production wizard, available lots are sorted by DLC ascending and the user may split required quantity across one or more lots. — §5.4.
- **Localization**: French exclusively. Every label, message, toast, error, copy string is French. — §2/§8.
- **Platform**: Desktop only. No responsive. Demo will be shown on a laptop. — §6/§8.
- **Recipes**: Initially 3 seeded read-only recipes (v0.1–v0.3). Full CRUD unlocked in v0.4. — §5.4/§8 (constraint lifted in v0.4).
- **PDF export**: `react-to-print` or `jsPDF`. Output need not be polished — must simply work. — §5.7.
- **No tests**: No unit/integration/e2e tests in the POC. — §8.
- **File size cap**: No source file exceeds 300 lines. — §10.
- **No leftover TODOs in code**. — §10.
- **README**: Repository must include a README with `npm run dev` instructions. — §10.
- **Boots via `npm run dev`**: After install, the app must run end-to-end with no additional setup. — §10.
- **No emojis in UI** except the navigation icons in §5.1 and the two example-shortcut buttons in §5.7. — §7.
- **Table density**: 14px text, moderate cell padding. References: Linear, Notion, Vercel dashboard. — §7.
- **Color palette**: shadcn neutrals + blue primary CTAs; green/orange/red reserved for DLC and alerts (no decorative semantic colors). — §7.
- **No pagination**: tables render the full dataset; expected size 20-30 rows max. — §6.
- **Visual style**: sober B2B SaaS aesthetic. — §7.

## Key Decisions

<!-- Locked decisions from intel/decisions.md (PRD §2, §3, §4, §5, §6, §7, §8, §10). 18 locked. -->

| ID | Decision | Rationale | Outcome |
|----|----------|-----------|---------|
| <decisions id="DEC-stack-framework" status="locked">DEC-stack-framework</decisions> | Next.js 14+ with App Router (no Pages Router) | Stack imposée by PRD §2 | — Pending |
| <decisions id="DEC-stack-language" status="locked">DEC-stack-language</decisions> | TypeScript strict; honor §3 domain types verbatim | Stack imposée by PRD §2 | — Pending |
| <decisions id="DEC-stack-styling" status="locked">DEC-stack-styling</decisions> | Tailwind CSS only (no CSS modules, no styled-components) | Stack imposée by PRD §2 | — Pending |
| <decisions id="DEC-stack-ui-components" status="locked">DEC-stack-ui-components</decisions> | shadcn/ui (Button, Card, Table, Dialog, Input, Select, Badge, Tabs) | Stack imposée by PRD §2 | — Pending |
| <decisions id="DEC-stack-icons" status="locked">DEC-stack-icons</decisions> | lucide-react for iconography | Stack imposée by PRD §2 | — Pending |
| <decisions id="DEC-stack-state" status="locked">DEC-stack-state</decisions> | Zustand + persist middleware → localStorage; no Redux/Jotai/Context-as-store | Stack imposée by PRD §2; survives refresh | — Pending |
| <decisions id="DEC-architecture-no-backend" status="locked">DEC-architecture-no-backend</decisions> | No backend, no API routes, no DB (real or mocked server-side) | Explicit rule in §2/§8 | — Pending |
| <decisions id="DEC-locale-french-only" status="locked">DEC-locale-french-only</decisions> | French-only UI; multi-language out of scope | §2/§8; prospect is Suisse romande | — Pending |
| <decisions id="DEC-platform-desktop-only" status="locked">DEC-platform-desktop-only</decisions> | Desktop-only; no responsive/mobile | §6/§8; demo on laptop | — Pending |
| <decisions id="DEC-seed-data" status="locked">DEC-seed-data</decisions> | Auto-seed on empty localStorage with 5 RM / 3 recipes / 8 clients / 2 orders / 1 delivery; reset button | §4 | — Pending |
| <decisions id="DEC-internal-lot-format" status="locked">DEC-internal-lot-format</decisions> | Internal lot format `TK-AAAA-MMJJ-NNN` | §6 | — Pending |
| <decisions id="DEC-dlc-defaulting" status="locked">DEC-dlc-defaulting</decisions> | Broche DLC = production date + 5 days by default | §3 | — Pending |
| <decisions id="DEC-recipe-readonly" status="superseded">DEC-recipe-readonly</decisions> | 3 seeded recipes were read-only in POC (v0.1–v0.3). Full CRUD added in v0.4. | §5.4/§8 constraint lifted | Superseded by v0.4 |
| <decisions id="DEC-fifo-allocation" status="locked">DEC-fifo-allocation</decisions> | FIFO suggestion (lots sorted by DLC asc) in production wizard, splittable | §5.4 step 2 | — Pending |
| <decisions id="DEC-pdf-export-library" status="locked">DEC-pdf-export-library</decisions> | `react-to-print` or `jsPDF` for traçabilité PDF dossier | §5.7 | — Pending |
| <decisions id="DEC-visual-style" status="locked">DEC-visual-style</decisions> | Sober B2B SaaS aesthetic; shadcn neutrals + blue CTA + semantic green/orange/red for DLC/alerts only | §7 | — Pending |
| <decisions id="DEC-file-size-cap" status="locked">DEC-file-size-cap</decisions> | Max 300 lines per source file | §10 | — Pending |
| <decisions id="DEC-no-tests" status="locked">DEC-no-tests</decisions> | No unit/integration/e2e tests in POC | §8 | — Pending |

---
*Last updated: 2026-05-05 — v0.3 completed, v0.4 milestone started (usabilite-et-exports)*
