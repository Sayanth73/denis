---
phase: 1
phase_name: Scaffolding & Application Shell
status: ready_for_planning
mode: auto-generated
gathered: 2026-05-04
---

# Phase 1: Scaffolding & Application Shell - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via `workflow.skip_discuss`)

<domain>
## Phase Boundary

A developer can `npm run dev` and see a French-language Next.js application with a working sidebar, header, and route placeholders for all six screens. This phase only delivers the chrome — no real screen content, no data layer, no shared store. Screen-specific UIs land in phases 3–8; the data store lands in phase 2.

In scope:
- Project init: Next.js 14+ App Router, TypeScript strict, Tailwind, shadcn/ui base install (Button, Card minimum to support nav active state), lucide-react, sonner registration.
- Root layout with fixed left sidebar (six entries with icons, French labels) and top header (page title + discrete "Réinitialiser démo" no-op button).
- Six route placeholders: `/` (Tableau de bord), `/matieres-premieres`, `/production`, `/livraisons`, `/clients`, `/tracabilite`. Each renders a minimal "À venir — Phase N" stub so navigation is verifiable.
- Active-route visual indication in the sidebar.
- Sober B2B SaaS palette: shadcn neutrals as base, blue primary for CTAs, no emojis in the UI surface (sidebar icons are lucide components, not emojis).

Out of scope (deferred to later phases):
- Any business logic or store (Phase 2)
- Reset confirmation behavior (Phase 2 wires it; Phase 1 only stubs the button)
- Screen content (Phases 3–8)
- Toasts and confirmation patterns beyond `sonner` install (cross-cutting in Phase 9)

</domain>

<decisions>
## Implementation Decisions

All decisions inherit from PROJECT.md locked decisions. No additional choices required at this phase. Specifically:
- Next.js 14+ App Router, TypeScript strict — locked
- Tailwind + shadcn/ui — locked
- lucide-react for icons — locked
- French UI exclusively — locked
- Desktop-only — locked
- shadcn neutrals + blue primary — locked
- File size cap 300 lines — locked

### Claude's Discretion
- Project root layout: `app/`, `components/`, `lib/` per Next.js App Router convention.
- Sidebar component composition: a single `<Sidebar />` client component is sufficient; no need for slot-based abstraction yet.
- Header component: a single `<Header />` client component reading the current pathname for the page title.
- Active-route styling: Tailwind class toggle based on `usePathname()`.
- Route stubs: a shared `<PlaceholderPage />` component reused across the six routes, accepting `title` + `description` props.
- shadcn components installed in this phase: only Button (needed by the reset stub). Other components install just-in-time per phase.

</decisions>

<code_context>
## Existing Code Insights

This is a greenfield repository. The only file present at the start of this phase is the source PRD and the bootstrapped `.planning/` directory. There is no `package.json` yet — `create-next-app` will produce it.

</code_context>

<specifics>
## Specific Ideas from PRD §5.1

Sidebar entries (exact French labels + lucide icons):
- 🏠 Tableau de bord — `Home`
- 📦 Matières premières — `Package`
- 🏭 Production — `Factory`
- 🚚 Livraisons — `Truck`
- 👥 Clients — `Users`
- 🔍 Traçabilité — `Search`

The emoji prefixes in the PRD §5.1 are descriptive only — the actual UI uses the lucide icon components (per PRD §7: "no emojis in the UI sauf pour les icônes de navigation listées plus haut"). Treat the lucide icons themselves as the "icônes de navigation" referenced in §7.

Header:
- Current page title (derived from pathname → label map).
- "Réinitialiser démo" button in the top-right, discrete (ghost variant or small outline), with a Settings or RotateCcw icon. Wired to a no-op + sonner toast saying "Disponible en Phase 2" for now (so the button is observable but harmless).

</specifics>

<deferred>
## Deferred Ideas

- Reset confirmation dialog — Phase 2 (when the store exists and there's something to reset).
- Theme tokens / dark mode toggle — explicitly out of scope (PRD §8: "Pas de mode sombre").
- Mobile/responsive — explicitly out of scope (PRD §8).
- Settings page or route — not in PRD scope; the reset button is the only "settings" surface.
- Auth — explicitly out of scope (PRD §8).

</deferred>
