---
phase: 2
phase_name: Domain Model, Zustand Store & Seed Data
status: ready_for_planning
mode: auto-generated
gathered: 2026-05-04
---

# Phase 2: Domain Model, Zustand Store & Seed Data - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via `workflow.skip_discuss`)

<domain>
## Phase Boundary

Foundational phase — no user-facing screens beyond completing the reset button behavior stubbed in Phase 1. Lays the entire data substrate that phases 3–9 read and write.

In scope:
- Type definitions for the six domain entities exactly as specified in PRD §3: `RawMaterial`, `Recipe`, `ProductionOrder`, `FinishedProduct`, `Customer`, `Delivery`. No additions, no renames — preserve the French field names verbatim (e.g., `quantiteRecue`, `numeroLotFournisseur`, `dlc`).
- A single Zustand store containing arrays for each entity plus actions to add/update/delete. Use the `persist` middleware with `localStorage` as the storage backend.
- Auto-seed on first load (empty `localStorage`): 5 raw materials, 3 recipes, 8 customers, 2 prior production orders (with their broches), 1 prior delivery. Mirror PRD §4 exactly.
- Replace Phase 1's reset button stub: clicking now opens a confirmation dialog ("Réinitialiser les données démo?" + body + "Confirmer" / "Annuler"); on confirm, wipe localStorage, re-seed, show success toast.
- Helper utilities:
  - `generateLotNumber(date: Date, sequence: number): string` → `TK-AAAA-MMJJ-NNN`
  - `computeBrocheDlc(dateProduction: string): string` → ISO date (production + 5 days)
  - `dlcColor(dlcDate: string, today: Date): "green"|"orange"|"red"|"grey"` per PRD §6 thresholds (>5d / 2-5d / <2d / past)

Out of scope (deferred):
- Any read or write of the store from screens (Phases 3–8).
- The visual design of `<DlcBadge />` (Phase 3 first uses it; Phase 9 sweeps for consistency).
- Production-order business logic beyond the seed fixtures (Phase 4).

</domain>

<decisions>
## Implementation Decisions

All decisions inherit from PROJECT.md locked decisions. Specifically:
- Zustand + `persist` middleware → `localStorage` — locked
- TypeScript strict — locked
- Internal lot format `TK-AAAA-MMJJ-NNN` — locked
- DLC default for finished broches = production + 5 days — locked
- DLC color thresholds (>5d green / 2–5d orange / <2d red / past grey) — locked
- 5 RM / 3 recipes / 8 clients / 2 orders / 1 delivery seed fixture — locked
- French exclusively (entity field names, seed data values, copy) — locked
- File-size cap 300 lines — locked

### Claude's Discretion
- Store organization: a single `useTraceabilityStore` (or similarly named) with all six arrays + actions, OR slice the store by entity. Recommendation: single store for POC simplicity (≤300 lines once seed data is in a separate file).
- File layout:
  - `lib/types.ts` — domain types
  - `lib/store.ts` — Zustand store with actions
  - `lib/seed.ts` — seed fixture data
  - `lib/dlc.ts` — DLC helpers (color, computation)
  - `lib/lot-number.ts` — lot number generator
- Reset confirmation dialog: use shadcn/ui `<AlertDialog>` (install in this phase).
- Seed strategy: invoked from store's first-mount effect when arrays are empty; alternative is a dedicated seed action called from the root layout. Recommendation: store hydration check (Zustand persist's `onRehydrateStorage` callback or a `seedIfEmpty` action invoked in a top-level client effect).
- Use uuid generation: import `crypto.randomUUID()` (Node/browser native, no extra dep).
- Date strings: store as ISO 8601 (`new Date().toISOString()` or `YYYY-MM-DD` for date-only fields like `dlc`); choose one format and document.
- Lot sequence number: per-day counter, reset at midnight, persisted alongside the seed counter or derived from the day's existing broches.

</decisions>

<code_context>
## Existing Code Insights

After Phase 1, the repo has:
- Next.js 14 App Router scaffold with `app/`, `components/`, `lib/`.
- `lib/utils.ts` (shadcn `cn` helper).
- `lib/nav.ts` (sidebar nav data).
- shadcn/ui components installed: Button, Sonner. AlertDialog must be added in this phase via `npx shadcn@2.10.0 add alert-dialog`.
- Reset button at `components/layout/reset-button.tsx` currently fires `toast.info("Disponible en Phase 2")` — Phase 2 amends (not replaces) this file to wire the real behavior.
- `<Toaster />` mounted globally in `app/layout.tsx`.

</code_context>

<specifics>
## Specific Ideas from PRD §3 / §4 / §6

PRD §3 type definitions are canonical — copy them verbatim into `lib/types.ts`. Keep the union literals intact (`type: "boeuf" | "agneau" | "poulet" | "epices" | "marinade" | "autre"` for RawMaterial; `statut: "en_stock" | "livree"` for FinishedProduct; `statut: "preparee" | "livree"` for Delivery).

Seed fixtures (PRD §4):
- 5 raw materials across 3 suppliers, dates within last 7 days. Suggest: 2× boeuf + 1× agneau + 1× poulet + 1× epices, suppliers like "Boucherie Müller SA", "Élevage Romand", "Épicerie Dubois Lausanne".
- 3 recipes (read-only):
  - "Broche standard 25 kg" — 60% boeuf + 30% agneau + 10% mélange épices A
  - "Broche poulet 20 kg" — 80% poulet + 15% marinade + 5% epices
  - "Broche premium agneau 15 kg" — 85% agneau + 10% marinade + 5% epices
- 8 fictitious Swiss-Romand restaurants: realistic French names, addresses in Lausanne / Yverdon / Geneva / Fribourg / Sion etc.
- 2 prior production orders consuming a portion of the seeded raw materials; broches produced with internal lot numbers `TK-AAAA-MMJJ-001`, `-002`, etc.
- 1 prior delivery referencing a subset of the produced broches, marked `livree`.

Reset confirmation dialog copy (formal French B2B):
- Title: "Réinitialiser les données démo ?"
- Body: "Cette action efface l'intégralité des données de démonstration et restaure le jeu de données initial. Cette opération est irréversible."
- Confirm: "Réinitialiser"
- Cancel: "Annuler"
- On success toast: "Données démo réinitialisées."

DLC helper thresholds (PRD §6):
- `> 5 days remaining` → green
- `2–5 days remaining` → orange
- `< 2 days remaining` → red
- `dlc < today` → grey

</specifics>

<deferred>
## Deferred Ideas

- A separate per-entity slice store — defer until/unless `lib/store.ts` exceeds the 300-line cap.
- Optimistic UI patterns / undo — out of scope (POC).
- Migration logic for store schema changes — out of scope (single-version POC).
- Server-side rendering of seeded data — out of scope (no backend, all client-side).

</deferred>
