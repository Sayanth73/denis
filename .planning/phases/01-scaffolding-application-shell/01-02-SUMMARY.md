---
phase: 1
plan: 2
plan_name: shell-layout
subsystem: shell
tags: [next.js, app-router, shell, sidebar, header, navigation, placeholder-pages, sonner, lucide, french]
status: complete
completed_at: 2026-05-04
duration_minutes: 8
tasks_completed: 4
tasks_total: 4
requires:
  - 01-01 (Next.js 14 + Tailwind v3 + shadcn New York/neutral + Geist + global Toaster)
provides:
  - lib/nav.ts as single source of truth for the 6 sidebar entries (NAV_ITEMS, NAV_LABELS, NavIconName type, getActiveLabel, isActiveRoute)
  - <Sidebar /> 240px fixed left rail with TraceKebab brand row + 6 lucide-icon nav entries in UI-SPEC order
  - <NavItem /> client component with usePathname()-driven active styling (zinc-100 bg + 2px blue-600 left strip + foreground text)
  - <Header /> 56px sticky header with dynamic page title (getActiveLabel) + right-anchored ResetButton
  - <ResetButton /> Phase 1 stub — ghost variant + RotateCcw + toast.info("Disponible en Phase 2")
  - <PlaceholderPage /> reusable centered-icon-title-description component for all six route stubs
  - app/layout.tsx final shell grid (Sidebar fixed + pl-60 column wrapping Header + main + Toaster)
  - Six route stubs (/, /matieres-premieres, /production, /livraisons, /clients, /tracabilite) each rendering <PlaceholderPage /> with byte-exact UI-SPEC French copy
affects:
  - Phase 2 must amend components/layout/reset-button.tsx (NOT replace it) to swap toast.info for the destructive Dialog flow per UI-SPEC §Layout "Phase 2 amendment"
  - Phase 3+ feature plans replace each placeholder route's body but inherit app/layout.tsx, lib/nav.ts, Sidebar, Header unchanged
  - Future detail routes (e.g., /clients/[id]) will inherit correct active-state highlighting via the prefix-match in isActiveRoute()
tech-stack:
  added: []
  patterns:
    - Name-based icon resolution: lib/nav.ts holds string iconName ("Home" | "Package" | ...); each consumer (Sidebar, PlaceholderPage) keeps its own ICONS map mapping name -> lucide component. Keeps lib/nav.ts a pure data module (server-safe, lucide-react-free) and lets tree-shaking work file-by-file.
    - Active-state styling pattern: NavItem applies zinc-100 bg + foreground text via cn() + a sibling absolutely-positioned 2px-wide blue-600 span (top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-primary) only when active. The strip is aria-hidden so it stays purely decorative.
    - Pathname-driven dynamic header title: Header reads usePathname() and feeds it to getActiveLabel() which uses exact-match-for-"/" / prefix-match-for-the-rest semantics so future detail routes (/clients/123) still resolve to "Clients".
    - Reset toast stub: ResetButton fires toast.info("Disponible en Phase 2") with no confirmation dialog — UI-SPEC §Layout explicitly defers the destructive Dialog flow to Phase 2.
    - Shell layout: <Sidebar /> uses position:fixed; the right column wraps <Header /> + <main> in a pl-60 div to reserve the 240px gutter. Avoids CSS Grid for a one-column layout.
key-files:
  created:
    - lib/nav.ts (46 lines)
    - components/layout/sidebar.tsx (42 lines)
    - components/layout/nav-item.tsx (40 lines)
    - components/layout/header.tsx (18 lines)
    - components/layout/reset-button.tsx (19 lines)
    - components/placeholder-page.tsx (33 lines)
    - app/matieres-premieres/page.tsx (11 lines)
    - app/production/page.tsx (11 lines)
    - app/livraisons/page.tsx (11 lines)
    - app/clients/page.tsx (11 lines)
    - app/tracabilite/page.tsx (11 lines)
  modified:
    - app/layout.tsx (mounts Sidebar + wraps Header + main in pl-60 column; Toaster stays global) — 34 lines
    - app/page.tsx (replaced Plan 01 null-returning stub with PlaceholderPage for Tableau de bord) — 11 lines
  deleted: []
decisions:
  - DEC-icon-resolution-by-name: lib/nav.ts stores iconName as a string-literal type ("Home" | "Package" | ...) rather than holding the React component reference. Keeps lib/nav.ts free of lucide-react imports (pure data, server-safe, ~46 lines), and each consumer (Sidebar, PlaceholderPage) keeps its own small ICONS map. Tree-shaking works file-by-file so duplication is free.
  - DEC-active-strip-as-sibling-span: The 2px blue-600 active strip is an aria-hidden sibling span absolutely positioned inside the Link (top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-primary). Alternative was a left border on the Link itself, but that would shift the icon+label by 2px on active state — noticeable visual jitter on click. The absolute span keeps the content static.
  - DEC-no-grid-for-shell: app/layout.tsx uses pl-60 on the main wrapper rather than CSS Grid. Sidebar is fixed (out of flow), header naturally flows above main inside the right column. Simpler, equivalent rendering, no grid-template tax.
  - DEC-prefix-match-for-non-root-active: isActiveRoute uses exact-match for "/" and pathname.startsWith for everything else. Future /clients/123 detail routes will correctly highlight the Clients sidebar entry without any further code changes in Phase 6+.
  - DEC-reset-button-stub-not-rewrite: ResetButton is a Phase 1 stub (toast.info only); Phase 2 amends THIS file rather than creating a parallel ResetButtonV2. Locked the contract by exporting only ResetButton (no ResetButtonStub) so Phase 2's amendment is API-compatible.
metrics:
  duration_minutes: 8
  task_count: 4
  file_count: 13
  total_lines_authored: 298
  largest_file_lines: 46
  file_size_cap: 300
---

# Phase 1 Plan 2: Shell Layout Summary

Built the application shell on top of the Plan 01 foundation. Shipped `<Sidebar />` (240px fixed, 6 lucide-icon entries in UI-SPEC order), `<NavItem />` (client component with `usePathname()`-driven active styling — zinc-100 background, foreground text, 2px blue-600 left strip), `<Header />` (56px sticky, dynamic page title via `getActiveLabel(pathname)`, right-anchored `<ResetButton />`), `<ResetButton />` (Phase 1 stub firing `toast.info("Disponible en Phase 2")`), and `<PlaceholderPage />` (centered icon + title + description, reused by all six routes). Finalized `app/layout.tsx` to wrap `{children}` in the shell grid, and registered six routes (`/`, `/matieres-premieres`, `/production`, `/livraisons`, `/clients`, `/tracabilite`) each rendering `<PlaceholderPage />` with byte-exact French copy. `npx tsc --noEmit` exits 0; `npx next build` prerenders all six routes statically; all routes return HTTP 200 from the dev server. The human-verify checkpoint was approved by the user on 2026-05-04.

## Tasks Completed

| # | Task | Commit | Key Outputs |
|---|------|--------|-------------|
| 1 | Define nav data + interface contract in lib/nav.ts | `3d9910a` | lib/nav.ts (46 lines): NAV_ITEMS readonly array (6 entries in UI-SPEC order), NAV_LABELS Record<string,string> derived programmatically, NavIconName string-literal type, getActiveLabel(pathname), isActiveRoute(pathname, route) |
| 2 | Build Sidebar, NavItem, Header, ResetButton, PlaceholderPage | `0b0ccc7` | components/layout/sidebar.tsx (42), components/layout/nav-item.tsx (40), components/layout/header.tsx (18), components/layout/reset-button.tsx (19), components/placeholder-page.tsx (33) |
| 3 | Wire shell into app/layout.tsx + create six route stubs | `27a9b93` | app/layout.tsx rewritten (34 lines, mounts Sidebar fixed + pl-60 wrapper + Header + main + global Toaster); app/page.tsx + 5 new route pages, each ~11 lines, each rendering <PlaceholderPage /> with exact UI-SPEC copy |
| 4 | Human verification — visual + interactive walkthrough | (checkpoint) | APPROVED by user 2026-05-04 — all 10 verification items passed: 240px sidebar + 6 entries in order, active-state styling (zinc-100 + 2px blue-600 strip + foreground text), hover state, navigation across all six routes, dynamic header title with diacritics, byte-exact placeholder copy, reset toast fires "Disponible en Phase 2", no horizontal scroll at 1280px, Geist Sans loaded, no console errors, French-only UI, hard-reload persistence |

## Final File Inventory (DEC-file-size-cap compliance)

All thirteen files created or modified by this plan are well under the 300-line cap:

| File | Lines | Cap headroom |
|------|-------|--------------|
| lib/nav.ts | 46 | 254 |
| components/layout/sidebar.tsx | 42 | 258 |
| components/layout/nav-item.tsx | 40 | 260 |
| components/placeholder-page.tsx | 33 | 267 |
| components/layout/reset-button.tsx | 19 | 281 |
| components/layout/header.tsx | 18 | 282 |
| app/layout.tsx | 34 | 266 |
| app/page.tsx | 11 | 289 |
| app/matieres-premieres/page.tsx | 11 | 289 |
| app/production/page.tsx | 11 | 289 |
| app/livraisons/page.tsx | 11 | 289 |
| app/clients/page.tsx | 11 | 289 |
| app/tracabilite/page.tsx | 11 | 289 |
| **Total** | **298** | — |

Largest file is lib/nav.ts at 46 lines. The cap-violation grep contract (`lines > 300`) returns zero matches across all thirteen files.

## Routes Registered (6/6)

| Route | Page Component | iconName | French Title | Description |
|-------|----------------|----------|--------------|-------------|
| `/` | HomePage | `Home` | Tableau de bord | Les indicateurs clés de votre activité s'afficheront ici dès la phase 8. |
| `/matieres-premieres` | MatieresPremieresPage | `Package` | Matières premières | La gestion des lots de matières premières arrive en phase 3. |
| `/production` | ProductionPage | `Factory` | Production | Les recettes et ordres de fabrication arrivent en phase 4. |
| `/livraisons` | LivraisonsPage | `Truck` | Livraisons | Le suivi des livraisons arrive en phase 5. |
| `/clients` | ClientsPage | `Users` | Clients | La gestion des clients arrive en phase 6. |
| `/tracabilite` | TracabilitePage | `Search` | Traçabilité | Le moteur de traçabilité bidirectionnelle arrive en phase 7. |

The route directory uses ASCII (`tracabilite`) while the user-visible label keeps the diacritic (`Traçabilité`); `lib/nav.ts` is the single source of truth for both, and the URL/label divergence is only at the directory boundary.

## Icon Resolution Map

`lib/nav.ts` exports a `NavIconName` string-literal type:

```ts
export type NavIconName = "Home" | "Package" | "Factory" | "Truck" | "Users" | "Search";
```

Two consumers each maintain their own local `ICONS` map (intentional duplication — see DEC-icon-resolution-by-name):

| Consumer | Imports from lucide-react |
|----------|---------------------------|
| `components/layout/sidebar.tsx` | `Home, Package, Factory, Truck, Users, Search` |
| `components/placeholder-page.tsx` | `Home, Package, Factory, Truck, Users, Search` |

Both maps cover all six names. If Phase 2+ adds a seventh nav entry (e.g., `Settings`), update:

1. `NavIconName` union in `lib/nav.ts`
2. `NAV_ITEMS` array in `lib/nav.ts`
3. `ICONS` map in `components/layout/sidebar.tsx`
4. `ICONS` map in `components/placeholder-page.tsx`

The `ResetButton` does not use this resolution pattern — it imports `RotateCcw` directly because it has exactly one icon and isn't part of the nav data contract.

## Active-State Styling Pattern

`<NavItem />` applies styling via `cn()` and a sibling absolutely-positioned span. The pattern:

```tsx
<Link
  href={route}
  className={cn(
    "relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    active
      ? "bg-zinc-100 text-foreground"
      : "text-muted-foreground hover:bg-zinc-100 hover:text-foreground",
  )}
>
  {active && (
    <span
      aria-hidden="true"
      className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary"
    />
  )}
  <Icon size={16} className="shrink-0" />
  <span>{label}</span>
</Link>
```

The 2px-wide blue-600 strip uses `bg-primary` (which is bound to `--primary: 221.2 83.2% 53.3%` = #2563EB blue-600 from Plan 01's `globals.css`). It is `aria-hidden="true"` because it carries no semantic meaning — assistive tech relies on the `<Link>`'s own active state via routing. The active styling honors UI-SPEC §Color "Hover/focus/active interaction states" exactly: zinc-100 (#F4F4F5) background, foreground (#18181B zinc-900) text, and the 2px primary strip.

`getActiveLabel` and `isActiveRoute` share exact-match-for-`"/"` / prefix-match-for-everything-else semantics. This means future detail routes (e.g., `/clients/123` once Phase 6 ships client detail pages) will keep the Clients sidebar entry highlighted and the header title set to "Clients" without any further code changes.

## Reset Toast Pattern (Phase 1 Stub)

`<ResetButton />` is a shadcn ghost Button:

```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => toast.info("Disponible en Phase 2")}
  className="gap-2"
>
  <RotateCcw size={16} aria-hidden="true" />
  <span>Réinitialiser démo</span>
</Button>
```

The sonner toast appears in the top-right corner (anchored by Plan 01's `<Toaster position="top-right" theme="light" richColors={false} />`). No confirmation dialog, no destructive flow, no router/state mutation — UI-SPEC §Layout "Phase 1 behavior" explicitly defers the dialog-confirm-flow to Phase 2.

**Phase 2 amendment contract**: Phase 2's reset plan must AMEND `components/layout/reset-button.tsx` (replace the `onClick` body with the destructive Dialog flow, swap the toast call for `confirm + reset + toast.success`) rather than create a new file or rename the export. The export name (`ResetButton`) is the locked-in contract; everything wiring it from `<Header />` stays unchanged.

## Verification

All grep contracts and runtime checks pass:

```
$ test -f lib/nav.ts                                                         # OK
$ grep -q "Tableau de bord" lib/nav.ts                                       # OK
$ grep -q "Matières premières" lib/nav.ts                                    # OK
$ grep -q "Traçabilité" lib/nav.ts                                           # OK
$ grep -q "/matieres-premieres" lib/nav.ts                                   # OK
$ grep -q "/tracabilite" lib/nav.ts                                          # OK
$ grep -q "export const NAV_ITEMS" lib/nav.ts                                # OK
$ grep -q "export const NAV_LABELS" lib/nav.ts                               # OK
$ grep -q "export function getActiveLabel" lib/nav.ts                        # OK
$ grep -q "export function isActiveRoute" lib/nav.ts                         # OK
$ grep -q '"use client"' components/layout/nav-item.tsx                      # OK
$ grep -q "usePathname" components/layout/nav-item.tsx                       # OK
$ grep -q "isActiveRoute" components/layout/nav-item.tsx                     # OK
$ grep -q "w-60" components/layout/sidebar.tsx                               # OK
$ grep -q "TraceKebab" components/layout/sidebar.tsx                         # OK
$ grep -q "h-14" components/layout/header.tsx                                # OK
$ grep -q "getActiveLabel" components/layout/header.tsx                      # OK
$ grep -q "RotateCcw" components/layout/reset-button.tsx                     # OK
$ grep -q "Disponible en Phase 2" components/layout/reset-button.tsx         # OK
$ grep -q "ghost" components/layout/reset-button.tsx                         # OK
$ grep -q "PlaceholderPage" components/placeholder-page.tsx                  # OK
$ grep -q "Sidebar" app/layout.tsx                                           # OK
$ grep -q "Header" app/layout.tsx                                            # OK
$ grep -q "pl-60" app/layout.tsx                                             # OK
$ grep -q "px-6 py-6" app/layout.tsx                                         # OK
$ grep -q 'iconName="Home"' app/page.tsx                                     # OK
$ grep -q 'iconName="Package"' app/matieres-premieres/page.tsx               # OK
$ grep -q 'iconName="Factory"' app/production/page.tsx                       # OK
$ grep -q 'iconName="Truck"' app/livraisons/page.tsx                         # OK
$ grep -q 'iconName="Users"' app/clients/page.tsx                            # OK
$ grep -q 'iconName="Search"' app/tracabilite/page.tsx                       # OK
$ for f in 13 files in this plan; do wc -l < "$f" <= 300; done               # OK (max 46)
$ npx tsc --noEmit                                                           # exit 0
$ npx next build                                                             # success — all 6 routes prerendered as static
$ npm run dev → curl all six routes                                          # all HTTP 200
$ Human checkpoint task 4                                                    # APPROVED 2026-05-04
```

## Deviations from Plan

Plan executed exactly as written across Tasks 1–4. No auto-fixes were required, no architectural decisions surfaced, and the human checkpoint approved without gap-closure tasks. The optional `gap-4` vs. `gap-2 mt-2` spacing nuance noted in the plan's Task 2e was decided in favor of `gap-4` (UI-SPEC §Density tolerance accepts the simplification), and the human checkpoint confirmed the rendered spacing is acceptable.

### Authentication Gates

None.

### Architectural Decisions Required

None.

## Known Stubs

- **`components/layout/reset-button.tsx` is a Phase 1 stub** — `onClick` fires `toast.info("Disponible en Phase 2")` only. No confirmation dialog, no actual reset. **Resolution plan**: Phase 2's reset-flow plan must amend this file in place (export name `ResetButton` is the locked contract). Documented in PLAN.md frontmatter and in this Summary's "Reset Toast Pattern" section.

- **All six route pages render `<PlaceholderPage />`** — intentional. Each placeholder copy explicitly names the phase that replaces it (`/` → phase 8, `/matieres-premieres` → phase 3, `/production` → phase 4, `/livraisons` → phase 5, `/clients` → phase 6, `/tracabilite` → phase 7). Phase 3+ feature plans replace the page body but inherit `app/layout.tsx`, `lib/nav.ts`, `<Sidebar />`, `<Header />` unchanged.

No other stubs.

## Phase 2 Hand-Off Notes

1. **`<ResetButton />` amendment** — see "Reset Toast Pattern" section above. The export contract (`ResetButton`) is locked; Phase 2 amends the body, not the file structure.
2. **Icon resolution map** — if Phase 2 adds a seventh nav entry, four touch points (listed in "Icon Resolution Map" section above) must update in lockstep.
3. **Active-state pattern** — `isActiveRoute` already supports detail routes via prefix matching. Phase 6 (`/clients/[id]`) and Phase 7 (`/tracabilite/[lotId]`) inherit correct sidebar highlighting and dynamic header titles for free.
4. **Header sticky behavior** — the header uses `sticky top-0 z-10`. If Phase 2+ introduces a portal-based modal/drawer that needs to render above the header, set `z-20` or higher on those overlays.
5. **`app/layout.tsx` wrap** — the `pl-60` wrapper is on a `<div>` (not the `<main>` directly). Phase 2+ pages can target `<main>` for content-specific styling without disturbing the sidebar gutter.

## Self-Check: PASSED

Verified files exist:

- `/Users/sayanth/Desktop/viande/lib/nav.ts` — FOUND
- `/Users/sayanth/Desktop/viande/components/layout/sidebar.tsx` — FOUND
- `/Users/sayanth/Desktop/viande/components/layout/nav-item.tsx` — FOUND
- `/Users/sayanth/Desktop/viande/components/layout/header.tsx` — FOUND
- `/Users/sayanth/Desktop/viande/components/layout/reset-button.tsx` — FOUND
- `/Users/sayanth/Desktop/viande/components/placeholder-page.tsx` — FOUND
- `/Users/sayanth/Desktop/viande/app/layout.tsx` — FOUND (modified)
- `/Users/sayanth/Desktop/viande/app/page.tsx` — FOUND (modified)
- `/Users/sayanth/Desktop/viande/app/matieres-premieres/page.tsx` — FOUND
- `/Users/sayanth/Desktop/viande/app/production/page.tsx` — FOUND
- `/Users/sayanth/Desktop/viande/app/livraisons/page.tsx` — FOUND
- `/Users/sayanth/Desktop/viande/app/clients/page.tsx` — FOUND
- `/Users/sayanth/Desktop/viande/app/tracabilite/page.tsx` — FOUND

Verified commits in `git log --oneline`:

- `3d9910a feat(01-02): add nav data module with NAV_ITEMS, NAV_LABELS, and pathname helpers` — FOUND
- `0b0ccc7 feat(01-02): build Sidebar, NavItem, Header, ResetButton, and PlaceholderPage` — FOUND
- `27a9b93 feat(01-02): wire shell into root layout and add six route placeholders` — FOUND

Human checkpoint task 4 approved by user on 2026-05-04 — APPROVED resolution recorded in PLAN.md.
