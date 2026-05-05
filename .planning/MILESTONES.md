# Milestones

## v0.1 v0.1 (Shipped: 2026-05-05)

**Phases completed:** 9 phases, 21 plans, 37 tasks

**Key accomplishments:**

- 1. [Rule 3 - Blocking] `create-next-app` rejected `.nextapp-bootstrap` as project name
- Built the entire Phase 2 data substrate end-to-end: six PRD §3 entity types verbatim, a single Zustand store with localStorage persistence and 18 typed CRUD actions, three pure helpers (lot-number generator, DLC date helper, DLC color verdict), a deterministic Suisse-Romand seed (5 RM / 3 recipes / 8 customers / 2 production orders with 6 broches / 1 delivery), an SSR-safe `<SeedProvider>` that gates `seedIfEmpty()` on Zustand's `hasHydrated` flag, and an amended `<ResetButton />` wrapping a shadcn `<AlertDialog>` with locked French copy. The Phase 1 shell (Sidebar, Header, six route placeholders, Toaster, `pl-60` wrapper, `lang="fr"`) is preserved verbatim — `app/layout.tsx` only changes to wrap `{children}` with `<SeedProvider>`. Every file stays well under the 300-line cap.
- 1. [Bookkeeping] Did NOT mark REQ-raw-materials-list / REQ-raw-material-receive complete in REQUIREMENTS.md
- `RawMaterialsTable({ rows: RawMaterial[] }): JSX.Element`
- shadcn Tabs primitive (2.10.0) installed and pure FIFO lot-allocation helpers shipped in lib/production.ts for Wave 2/3 consumption.
- /production route wired with Recettes read-only cards and Ordres de fabrication 5-column table behind a two-tab layout with hydration guard and CTA state hand-off for Wave 3 wizard.
- 3-step production wizard with FIFO lot allocation editor, full store mutation (RM decrement + ProductionOrder + N FinishedProducts), TK lot numbering, and DLC+5j computation wired end-to-end in /production.
- Three shadcn primitives installed (checkbox, textarea, scroll-area) plus `lib/deliveries.ts` with 6 pure exports for the Livraisons screen.
- `/livraisons` route page with hydration guard + 6-column deliveries table with amber/emerald statut badges and AlertDialog "Marquer comme livrée" mutation flow.
- `<NewDeliveryDialog>` single-step delivery creation form with customer combobox + date picker + broches en stock checkbox list + notes textarea, wired to `addDelivery` store action with `statut: "preparee"`.
- `lib/clients.ts`
- `/clients/[id]` detail page with two-level inline expansion — delivery → broches (DlcBadge + lot numbers) → upstream raw material lots — completing the full traçabilité chain from client to supplier
- 1. [Rule 1 - Bug] Map iteration TypeScript error with strict mode
- Full-stack traceability UI: bidirectional lot search with URL sync, three-section upstream/downstream result views, and PDF export via useReactToPrint — the killer feature of the POC is now live.
- Two surgical link integrations completing the Phase 7 cross-screen traceability navigation story: BrochesExpansion lot numbers are now clickable links to /tracabilite, and the production wizard success toast has a "Voir la traçabilité" action button.
- Full operational dashboard at `/` — 4 KPI cards with French locked labels, DLC alert badge, severity-dot Alertes column, and clickable-Link Activité récente column, all driven by Zustand store subscriptions with hydration guard.
- Full-app UX compliance audit (DLC, toasts, confirmations, empty states, pagination) with five deferred STATE.md CSS/component fixes applied (nav indicator, reset button, pressed state, destructive HSL, sonner/AlertDialog shadows).
- §9 5-step demo flow traced clean at code level (no blockers), tsc exits 0, npm run build exits 0, and README.md updated with French milestone narrative.

---
