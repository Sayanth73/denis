# Roadmap: TraceKebab

**Milestone:** v0.1 — POC traceability demo
**Granularity:** standard (calibrated to 9 phases — vertical-slice screen-by-screen build matches PRD §5 structure and lets each phase be demoed independently)
**Coverage:** 21/21 v0.1 requirements mapped, plus 1 foundational phase (Phase 2) that enables every subsequent phase.

## Overview

TraceKebab is built as a sequence of vertical slices, each delivering one demoable screen of the §5 PRD. Phase 1 stands up the Next.js + Tailwind + shadcn/ui shell with sidebar navigation. Phase 2 lays the data foundation (TypeScript domain types, Zustand store with persist, seed data on empty localStorage) so every later phase has something real to read and write. Phases 3-8 each deliver one screen of the application in build order — Matières premières, Production, Livraisons, Clients, Traçabilité (the killer feature, given the most polish), Dashboard. Phase 9 is a polish + dry-run pass that explicitly verifies the §9 5-minute demo flow end-to-end and sweeps cross-cutting UX (DLC colors, toasts, confirmations, empty states) for consistency. Each phase is independently demoable on a developer laptop via `npm run dev`.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Scaffolding & Application Shell** — Next.js 14 App Router + Tailwind + shadcn/ui + sidebar/header layout with French navigation and reset button.
- [ ] **Phase 2: Domain Model, Zustand Store & Seed Data** — TypeScript types per PRD §3, Zustand store with persist→localStorage, auto-seed on empty storage.
- [ ] **Phase 3: Matières Premières Screen** — Sortable raw materials table at `/matieres-premieres` with reception dialog.
- [ ] **Phase 4: Production Screen** — `/production` with read-only Recettes tab and Ordres de fabrication tab driven by a 3-step FIFO-allocation wizard.
- [ ] **Phase 5: Livraisons Screen** — `/livraisons` table and two-state "préparer → marquer livrée" delivery dialog.
- [ ] **Phase 6: Clients Screen** — `/clients` CRUD plus client detail with delivery history and upstream traçabilité drill-down.
- [ ] **Phase 7: Traçabilité Screen (killer feature)** — `/tracabilite` search with two example shortcuts, Cas 1 (upstream) and Cas 2 (downstream) result views, PDF export.
- [ ] **Phase 8: Dashboard** — `/` with 4 KPI cards, alerts column, and 5-item recent activity timeline.
- [ ] **Phase 9: Polish & Demo Dry-Run** — Cross-cutting UX sweep (DLC colors, toasts, confirmations, empty states, no-pagination check) and explicit §9 5-minute demo dry-run.

## Phase Details

### Phase 1: Scaffolding & Application Shell
**Goal**: A developer can `npm run dev` and see a French-language Next.js application with a working sidebar, header, and route placeholders for all six screens.
**Depends on**: Nothing (first phase)
**Requirements**: REQ-layout-shell
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` from a fresh clone boots the app on localhost with no additional setup.
  2. The user sees a fixed left sidebar listing Tableau de bord, Matières premières, Production, Livraisons, Clients, Traçabilité (with the lucide icons listed in §5.1), in French.
  3. The user can click any sidebar entry and the active route is visually indicated; the header shows the current page title.
  4. The header carries a discrete "Réinitialiser démo" button in the top-right (wired to a no-op stub at this phase; full reset behavior arrives in Phase 2).
  5. The visual aesthetic matches a sober B2B SaaS look (shadcn neutrals, blue primary CTAs) — no emojis except navigation icons.
**Plans**: 2 plans
- [ ] 01-01-PLAN.md — Bootstrap Next.js 14 + Tailwind + shadcn (New York / neutral) + Button & Sonner + Geist fonts + theme tokens (no shell UI yet).
- [ ] 01-02-PLAN.md — Build Sidebar / Header / ResetButton / PlaceholderPage + lib/nav.ts, wire shell into root layout, create six route stubs, human-verify checkpoint.
**UI hint**: yes

### Phase 2: Domain Model, Zustand Store & Seed Data
**Goal**: Every subsequent phase can read and write the PRD §3 domain model from a single Zustand store, persisted to localStorage, with realistic seed data populated on empty storage.
**Depends on**: Phase 1
**Requirements**: (foundational — no direct REQ-*; implements constraints CON-data-model, CON-internal-lot-format, CON-dlc-default-rule, CON-state-persistence, CON-no-backend, CON-seed-on-empty-storage)
**Success Criteria** (what must be TRUE):
  1. The TypeScript domain types `RawMaterial`, `Recipe`, `ProductionOrder`, `FinishedProduct`, `Customer`, `Delivery` exist exactly as specified in PRD §3 and compile under strict mode.
  2. On first load with empty `localStorage`, the app auto-seeds 5 raw materials across 3 suppliers (reception dates within the last 7 days), 3 read-only recipes ("Broche standard 25 kg", "Broche poulet 20 kg", "Broche premium agneau 15 kg") with composition summing to 100%, 8 fictitious Suisse-romand kebab restaurant clients, 2 prior production orders with their broches, and 1 prior delivery.
  3. After any browser refresh, the previously visible state is intact (Zustand persist → localStorage works).
  4. Clicking the header "Réinitialiser démo" button (with confirmation) wipes localStorage and re-seeds, and a toast confirms the reset.
  5. Helper functions exist for: generating internal lot numbers in format `TK-AAAA-MMJJ-NNN`, computing broche DLC as `dateProduction + 5 days`, and computing DLC color (green/orange/red/grey).
**Plans**: 1 plan
- [ ] 02-01-PLAN.md — Domain types + seed fixtures + Zustand persist store + SeedProvider lifecycle + amended ResetButton with shadcn AlertDialog destructive flow.

### Phase 3: Matières Premières Screen
**Goal**: The user can view all raw material lots in stock and receive new lots via a validated dialog.
**Depends on**: Phase 2
**Requirements**: REQ-raw-materials-list, REQ-raw-material-receive
**Success Criteria** (what must be TRUE):
  1. Navigating to `/matieres-premieres` shows a sortable table with columns Type, Nom, Fournisseur, N° lot fournisseur, Quantité restante / reçue, DLC (color badge), Statut.
  2. The user can sort the table by clicking any column header.
  3. Clicking "+ Réceptionner un lot" opens a Dialog with all required fields (Type select, Nom, Fournisseur with auto-complete, N° lot fournisseur, Quantité reçue en kg, Date de réception defaulting to today, DLC, Température °C) and an optional Certificat sanitaire field; the form rejects submission unless DLC is strictly later than Date de réception.
  4. On confirm, the new RawMaterial appears in the table without a refresh, the dialog closes, and a sonner toast confirms the reception.
  5. With localStorage cleared after seeding, removing all rows shows the empty state "Aucune matière première en stock — réceptionnez votre premier lot".
**Plans**: 2 plans
- [x] 03-01-PLAN.md — Install shadcn primitives (table, dialog, input, select, label, form, badge, calendar, popover, command) + react-hook-form/zod/date-fns peer-deps; build reusable DlcBadge, EmptyState, DatePicker, Combobox + lib/raw-materials.ts helpers.
- [x] 03-02-PLAN.md — Build sortable RawMaterialsTable + ReceptionDialog (9-field react-hook-form + zod schema with locked French validation) + wire app/matieres-premieres/page.tsx with header CTA and empty-state fallback; human-verify checkpoint.
**UI hint**: yes

### Phase 4: Production Screen
**Goal**: The user can view recipes and production orders, and create a new production order through a 3-step wizard that proposes FIFO lot allocation and produces broches with valid internal lot numbers.
**Depends on**: Phase 3
**Requirements**: REQ-recipes-readonly, REQ-production-orders-list, REQ-production-wizard
**Success Criteria** (what must be TRUE):
  1. Navigating to `/production` shows two tabs: "Recettes" listing the 3 seeded recipes with their composition rows summing to 100% (no create/edit/delete affordances anywhere), and "Ordres de fabrication" listing every production order with columns Date, Recette, Nombre de broches, Poids total, Lots consommés.
  2. Starting a new production order opens Step 1 (recipe + number of broches) → Step 2 (per-ingredient lot allocation, lots sorted by DLC ascending, splittable across multiple lots, with a real-time "manquant : X kg" indicator when allocation is short) → Step 3 (récapitulatif with "Confirmer la production").
  3. On confirmation, the consumed lots' `quantiteRestante` decrements correctly, N FinishedProduct broches are created with internal lot numbers in format `TK-AAAA-MMJJ-NNN` and `dlc = production date + 5 days`, and a ProductionOrder linking inputs to outputs is persisted.
  4. A success toast appears with a link that navigates the user to the new production's traçabilité view (link target may be a placeholder until Phase 7).
  5. Re-opening `/production` after a refresh shows the new production order in the Ordres de fabrication tab, and the matières premières table reflects the decremented quantities.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Livraisons Screen
**Goal**: The user can view all deliveries and create a new delivery by selecting in-stock broches for a customer through a two-state "préparer → marquer livrée" flow.
**Depends on**: Phase 4
**Requirements**: REQ-deliveries-list, REQ-delivery-create
**Success Criteria** (what must be TRUE):
  1. Navigating to `/livraisons` shows a table with columns Date, Client, Nombre de broches, Poids total, Statut.
  2. Clicking "+ Nouvelle livraison" opens a Dialog with Client (searchable select over seeded customers), Date de livraison, a Broches en stock multi-select with checkboxes showing n° lot interne / poids / DLC, and an optional Notes textarea.
  3. The dialog has two distinct action states: "Préparer la livraison" (creates a `preparee` Delivery) and "Marquer comme livrée" (transitions broches `en_stock` → `livree` and the Delivery `preparee` → `livree`, requiring an explicit user click).
  4. On "Marquer comme livrée", broches gain a `livraisonId` reference, the table updates, and a toast confirms the delivery.
  5. Refreshing the browser preserves the new delivery and its broche references.
**Plans**: TBD
**UI hint**: yes

### Phase 6: Clients Screen
**Goal**: The user can manage restaurant clients via CRUD and drill into any client to see their delivery history with full upstream traçabilité.
**Depends on**: Phase 5
**Requirements**: REQ-clients-crud, REQ-client-detail-history
**Success Criteria** (what must be TRUE):
  1. Navigating to `/clients` shows a table of clients with "+ Nouveau client" creation and edit/delete affordances on each row; mutations show sonner toasts.
  2. Clicking any client row opens a detail view listing every Delivery for that client.
  3. Each delivery row in the detail view is expandable to reveal its broches (n° lot interne, poids, DLC).
  4. From any broche in the expansion, the user can reach the upstream raw material lots that contributed to it (link or inline expansion exposing fournisseur lot numbers).
  5. Deleting a client requires confirmation and shows a success toast on completion.
**Plans**: TBD
**UI hint**: yes

### Phase 7: Traçabilité Screen (killer feature)
**Goal**: The user can search by either a supplier lot number or an internal broche lot number and immediately see the entire upstream-or-downstream chain in a polished three-section view, exportable as PDF. This is the screen the demo sells on; it gets the highest UX polish.
**Depends on**: Phase 6
**Requirements**: REQ-tracabilite-search, REQ-tracabilite-upstream, REQ-tracabilite-downstream, REQ-tracabilite-pdf-export
**Success Criteria** (what must be TRUE):
  1. Navigating to `/tracabilite` shows a prominent search bar with placeholder "Rechercher un numéro de lot (matière première ou broche finie)..." plus two example shortcut buttons that pre-fill a seeded supplier lot number and a seeded internal broche lot number respectively.
  2. Submitting a supplier lot number renders Cas 1: three vertically stacked sections with visual connectors — (1) Matière première card showing fournisseur, certificat sanitaire, dates, température; (2) Ordres de fabrication concernés with quantity used; (3) Clients impactés with delivery date and internal broche lot number.
  3. Submitting an internal broche lot number renders Cas 2: three vertically stacked sections — (1) Broche finie card with n° lot interne, date production, poids, DLC, client livré + date livraison; (2) Ordre de fabrication with the recipe used; (3) Matières premières utilisées listing every contributing supplier lot.
  4. Both result views display an "Exporter dossier traçabilité (PDF)" button in the top-right that, when clicked, generates a PDF (via react-to-print or jsPDF) containing the same information as the on-screen view.
  5. Searching for an unknown lot number renders a contextual empty state ("Aucun lot trouvé pour ce numéro") rather than a blank page.
**Plans**: TBD
**UI hint**: yes

### Phase 8: Dashboard
**Goal**: The user lands on `/` and immediately sees the operational health of the business — current stock levels, alerts that need attention, and what happened recently.
**Depends on**: Phase 7
**Requirements**: REQ-dashboard
**Success Criteria** (what must be TRUE):
  1. Navigating to `/` shows 4 KPI cards across the top: "Matières premières en stock" (count of active lots, with a red alert if any DLC <3 days), "Broches en stock" (count + total weight), "Production cette semaine" (count of broches produced this week), "Livraisons cette semaine" (count + estimated value).
  2. An "Alertes" column lists raw materials approaching DLC, low-stock conditions, and broches not delivered for more than 3 days, each with a one-line label.
  3. A "Recent activity" column shows the 5 most recent actions (réceptions, productions, livraisons) in a vertical timeline with timestamps.
  4. With an empty-seeded state where no activity has occurred yet, the activity column shows a contextual empty state.
  5. KPI counts update without manual refresh after performing actions in other screens (e.g., receiving a new raw material increments the matières premières KPI).
**Plans**: TBD
**UI hint**: yes

### Phase 9: Polish & Demo Dry-Run
**Goal**: Every cross-cutting UX rule is consistently applied across the whole app and the §9 5-minute demo flow runs cleanly end-to-end on a fresh seed.
**Depends on**: Phase 8
**Requirements**: REQ-dlc-color-coding, REQ-toasts-on-mutations, REQ-confirmations-on-critical-actions, REQ-empty-states, REQ-no-pagination, REQ-success-criteria-demo-flow
**Success Criteria** (what must be TRUE):
  1. Every DLC badge across the app uses the correct color (green >5d, orange 2-5d, red <2d, grey expired) — verified by inspecting matières premières, broches, livraisons, dashboard alerts, and traçabilité views.
  2. Every create/modify action across the app shows a sonner toast (raw material reception, production order creation, delivery creation, "Marquer comme livrée", client CRUD, démo reset) — verified by walking through each action.
  3. Every critical action (production order confirmation, "Marquer comme livrée", démo reset) requires explicit user confirmation; no destructive action happens silently.
  4. Every list/table renders a contextual empty state when emptied (matières premières, ordres de fabrication, livraisons, clients, traçabilité no-result, dashboard activity) — no blank grids anywhere; no pagination controls anywhere.
  5. Starting from a fresh `Réinitialiser démo` state, the §9 5-minute demo flow runs cleanly: receive a viande de bœuf lot → run a production order consuming it that produces 4 broches → deliver 2 broches to a kebab restaurant client → search the original supplier lot number in `/tracabilite` and visually see fournisseur → production → client final → export the PDF dossier. The flow completes in under 5 minutes by a second-time user.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffolding & Application Shell | 0/2 | Planned | - |
| 2. Domain Model, Zustand Store & Seed Data | 0/1 | Planned | - |
| 3. Matières Premières Screen | 1/2 | In progress | - |
| 4. Production Screen | 0/TBD | Not started | - |
| 5. Livraisons Screen | 0/TBD | Not started | - |
| 6. Clients Screen | 0/TBD | Not started | - |
| 7. Traçabilité Screen (killer feature) | 0/TBD | Not started | - |
| 8. Dashboard | 0/TBD | Not started | - |
| 9. Polish & Demo Dry-Run | 0/TBD | Not started | - |
