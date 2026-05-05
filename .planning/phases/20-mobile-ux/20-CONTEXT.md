---
phase: 20-mobile-ux
status: ready
discuss_mode: smart
gathered: 2026-05-05
---

# Phase 20: Mobile UX — iPhone Responsive — Context

**Status:** Ready for planning
**Source:** Smart discuss — autonomous, all decisions auto-accepted

<domain>
## Phase Boundary

Make every page of TraceKebab usable on iPhone Safari (390px viewport). Currently the app is desktop-only:
- `app/layout.tsx` hardcodes `pl-60` (240px offset) — on 390px iPhone only 150px of usable content remains
- Sidebar is a fixed `w-60` element with no mobile variant
- All data tables use `overflow-hidden` — table content is clipped, no horizontal scroll
- Dialogs use `sm:max-w-[Xpx]` which is fine but need to be verified for < 640px

Out of scope: redesigning the UI, new features, any backend/store changes.
</domain>

<decisions>
## Implementation Decisions

### D-01: Mobile Navigation Pattern — Sheet Drawer
**LOCKED**: On mobile (< 768px), sidebar is hidden (`hidden md:flex`). A hamburger button in the header opens a `Sheet` component (shadcn/ui) with the full nav items list. On desktop (≥ 768px), sidebar remains as-is (`hidden md:flex flex-col`). Sheet slides in from the left.

### D-02: Install shadcn Sheet
**LOCKED**: `npx shadcn@latest add sheet` — required for the mobile drawer. Sheet is not currently installed.

### D-03: Layout Offset — Responsive `pl-60`
**LOCKED**: In `app/layout.tsx`, change `pl-60` → `md:pl-60`. On mobile, no left offset. Content fills 100% width.

### D-04: Header — Mobile Hamburger Button
**LOCKED**: In `components/layout/header.tsx`, add a `<Button variant="ghost" size="icon">` with `Menu` icon (lucide-react) on the left side, visible only on mobile (`md:hidden`). Clicking it triggers the Sheet open state. The Sheet state is managed in the header (or a shared client wrapper if needed).

### D-05: Tables — `overflow-x-auto` Wrapper
**LOCKED**: Every table wrapper using `rounded-md border bg-background overflow-hidden` must add `overflow-x-auto` so tables scroll horizontally on mobile. Fix these files:
- `components/clients/clients-table.tsx`
- `components/production/ordre-fabrication-table.tsx`
- `components/livraisons/deliveries-table.tsx`
- `components/matieres/raw-materials-table.tsx`
- Also check: `components/production/recettes-tab.tsx` (cards, not table — likely fine)
- Also check: `app/factures/page.tsx`, `app/stock-broches/page.tsx`, `app/tracabilite/page.tsx`

### D-06: Dialogs — Mobile Width
**LOCKED**: Default shadcn DialogContent has `w-full max-w-lg` — on 390px screen the dialog is full-width (touching edges). Add `mx-4 w-[calc(100%-2rem)]` to the `sm:max-w-[X]` override in each dialog that currently uses `sm:max-w-[480px]`, `sm:max-w-[560px]`, or `sm:max-w-[640px]` so there's 16px margin on each side on mobile. Affected files:
- `components/clients/client-dialog.tsx`
- `components/production/recette-dialog.tsx`
- `components/production/production-wizard.tsx`
- `components/livraisons/new-delivery-dialog.tsx`
- `components/matieres/reception-dialog.tsx`

### D-07: Production Wizard — Special Care
**LOCKED**: The production wizard uses `sm:max-w-[640px] max-h-[90vh] overflow-y-auto` — it's multi-step and content-heavy. On mobile, wrap each step's content with `min-w-0` to prevent flex overflow. No structural changes.

### D-08: Sidebar Shared State — Sheet Trigger
**DECISION**: The Sheet open state lives in a new client wrapper component `components/layout/mobile-nav.tsx` that renders both the hamburger trigger and the Sheet content with nav items. Header imports MobileNav. This avoids prop-drilling between header and sidebar.

### D-09: No Bottom Nav Bar
**DECISION**: Skip bottom navigation bar pattern (common in mobile apps). The Sheet drawer is sufficient for 9 nav items — it's a B2B tool, not a consumer app. Users accept drawer navigation.

### D-10: Breakpoint
**DECISION**: Use Tailwind `md:` prefix (768px) as the mobile/desktop boundary — aligns with standard tablet breakpoint and avoids the iPhone 390px → iPad 768px gray zone.

### Claude's Discretion
- Exact Sheet animation/style (left slide-in, standard shadcn defaults acceptable)
- Whether to show page title in Sheet header or not (keep it simple, just nav items)
- `min-w` values for table columns (preserve existing, don't add artificial widths)
</decisions>

<canonical_refs>
## Canonical References

### Layout (MUST READ before planning)
- `app/layout.tsx` — current hardcoded `pl-60`, `<Sidebar />`, `<Header />`
- `components/layout/sidebar.tsx` — current `fixed left-0 top-0 h-screen w-60` desktop sidebar
- `components/layout/header.tsx` — current header, needs hamburger button
- `components/layout/nav-item.tsx` — NavItem component used in sidebar (reuse in Sheet)
- `lib/nav.ts` — NAV_ITEMS array (9 items), NAV_ICONS

### Tables (MUST READ before fixing overflow)
- `components/clients/clients-table.tsx`
- `components/production/ordre-fabrication-table.tsx`
- `components/livraisons/deliveries-table.tsx`
- `components/matieres/raw-materials-table.tsx`

### Dialogs (MUST READ before fixing mobile widths)
- `components/clients/client-dialog.tsx`
- `components/production/recette-dialog.tsx`
- `components/production/production-wizard.tsx`
- `components/livraisons/new-delivery-dialog.tsx`
- `components/matieres/reception-dialog.tsx`

### Existing patterns (reuse)
- `components/ui/alert-dialog.tsx` — AlertDialog pattern
- `components/ui/button.tsx` — Button component
- shadcn Sheet (to be installed): `npx shadcn@latest add sheet`
</canonical_refs>

<specifics>
## Specific Requirements

### iPhone 390px viewport
Primary target: iPhone 14/15 Pro (390×844px, Safari). All 4 success criteria must hold at this width.

### No regression on desktop
Desktop layout (≥768px) must be pixel-identical to current — same sidebar, same `pl-60` offset. Use `md:` prefix throughout, never touch desktop-only styles.

### File size cap: 300 lines
DEC-file-size-cap: max 300 lines per source file. `mobile-nav.tsx` should be <= 80 lines. Layout changes are small enough to stay within cap.

### TypeScript: zero errors
`npx tsc --noEmit` must exit clean after all changes.

### Estimated files changed
- `app/layout.tsx` (1-line change)
- `components/layout/sidebar.tsx` (add `hidden md:flex`)
- `components/layout/header.tsx` (add hamburger, import MobileNav)
- `components/layout/mobile-nav.tsx` (new — Sheet with nav items, ~70 lines)
- `components/clients/clients-table.tsx` (1-line overflow fix)
- `components/production/ordre-fabrication-table.tsx` (1-line overflow fix)
- `components/livraisons/deliveries-table.tsx` (1-line overflow fix)
- `components/matieres/raw-materials-table.tsx` (1-line overflow fix)
- `components/clients/client-dialog.tsx` (1-line dialog width fix)
- `components/production/recette-dialog.tsx` (1-line dialog width fix)
- `components/production/production-wizard.tsx` (1-line dialog width fix)
- `components/livraisons/new-delivery-dialog.tsx` (1-line dialog width fix)
- `components/matieres/reception-dialog.tsx` (1-line dialog width fix)
Total: ~13 files, mostly 1-2 line changes each.
</specifics>

<deferred>
## Deferred Ideas

- Bottom navigation bar (D-09 — skip, Sheet is sufficient)
- Touch gesture swipe to open/close the drawer (future enhancement)
- Font size adjustments for readability on small screens (no visible issues with current 14px/text-sm)
- Pinch-to-zoom disable (not needed — current viewport meta should handle it)
</deferred>

---
*Phase: 20-mobile-ux*
*Context gathered: 2026-05-05 via smart discuss (autonomous)*
