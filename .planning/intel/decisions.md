# Decisions (Synthesized)

Source: classified planning documents under `.planning/intel/classifications/`. Decisions are extracted from the imposed stack (§2 of PRD) and binding scope rules (§6, §7, §8 of PRD). The PRD itself is not a LOCKED ADR, but its stack is declared "imposée" (imposed) — treated here as project-locked stack constraints for the POC.

---

## DEC-stack-framework — Next.js 14+ with App Router

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§2)
- status: locked (stack imposée)
- scope: web application framework
- decision: Use Next.js 14 or later, exclusively the App Router (not the Pages Router).

## DEC-stack-language — TypeScript strict

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§2)
- status: locked
- scope: language and compiler configuration
- decision: TypeScript with strict mode enabled. All domain types defined in §3 of the PRD must be honored as-is.

## DEC-stack-styling — Tailwind CSS

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§2)
- status: locked
- scope: styling system
- decision: Tailwind CSS for all styling. No CSS modules, no styled-components, no other utility frameworks.

## DEC-stack-ui-components — shadcn/ui

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§2)
- status: locked
- scope: UI component library
- decision: shadcn/ui as the component library. Mandatory components include Button, Card, Table, Dialog, Input, Select, Badge, Tabs. Toasts via `sonner` (§6).

## DEC-stack-icons — lucide-react

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§2)
- status: locked
- scope: iconography
- decision: lucide-react for icons.

## DEC-stack-state — Zustand + persist + localStorage

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§2)
- status: locked
- scope: client-side state management and persistence
- decision: Zustand for global state with the `persist` middleware writing to `localStorage`. Data must survive page refresh. No other state libraries (no Redux, no Jotai, no React Context as the primary store).

## DEC-architecture-no-backend — No backend, no API, no database

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§2, §8)
- status: locked
- scope: system architecture
- decision: Strictly no backend services. No Next.js API routes. No Supabase. No database (real or mocked server-side). All data lives client-side in `localStorage` via the Zustand persist middleware.

## DEC-locale-french-only — French-only UI

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§2, §8)
- status: locked
- scope: localization
- decision: Interface language is French exclusively. Multi-language is explicitly out of scope (§8).

## DEC-platform-desktop-only — Desktop-only, no responsive

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§6, §8)
- status: locked
- scope: target platform
- decision: Desktop only. Responsive/mobile layouts are explicitly out of scope. Demo will be shown on a laptop.

## DEC-seed-data — Auto-seed on first load if localStorage empty

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§4)
- status: locked
- scope: data initialization
- decision: On first load with empty `localStorage`, seed: 5 raw materials across 3 suppliers (reception dates within last 7 days), 3 recipes, 8 fictitious Swiss-romand kebab restaurant clients, 2 prior production orders with their broches, 1 prior delivery. Provide a "Réinitialiser les données démo" button in a settings menu to reset `localStorage`.

## DEC-internal-lot-format — TK-AAAA-MMJJ-NNN

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§6)
- status: locked
- scope: internal lot numbering
- decision: Internal lot numbers for finished broches use the format `TK-AAAA-MMJJ-NNN` (e.g., `TK-2026-0815-001`).

## DEC-dlc-defaulting — Broche DLC = production date + 5 days

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§3)
- status: locked
- scope: business rule
- decision: A finished broche's `dlc` is auto-calculated as production date + 5 days by default.

## DEC-recipe-readonly — Recipes are read-only in the POC

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.4, §8)
- status: locked
- scope: feature scope
- decision: The 3 seeded recipes are read-only. No recipe creation/editing flow in the POC.

## DEC-fifo-allocation — FIFO suggestion on raw material allocation

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.4 step 2)
- status: locked
- scope: production wizard UX
- decision: When allocating raw material lots in the production wizard, available lots of the correct type are sorted by DLC ascending (FIFO) and the user may split the required quantity across one or more lots.

## DEC-pdf-export-library — react-to-print or jsPDF for PDF export

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.7)
- status: locked
- scope: PDF generation
- decision: Use `react-to-print` or `jsPDF` to generate the traçabilité PDF dossier. Output need not be polished — must simply work.

## DEC-visual-style — Sober B2B SaaS aesthetic

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§7)
- status: locked
- scope: visual design
- decision: Sober, professional B2B SaaS aesthetic. References: Linear, Notion, Vercel dashboard. Neutral palette (gris/blanc/noir shadcn defaults) with blue accents for primary CTAs. Semantic colors (green/orange/red) reserved for DLC and alert statuses. Dense tables (14px text, moderate cell padding). No emojis in UI except for the navigation icons listed in §5.1.

## DEC-file-size-cap — Max 300 lines per file

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§10)
- status: locked
- scope: code organization
- decision: No source file may exceed 300 lines. Split into well-factored components.

## DEC-no-tests — No unit tests in the POC

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§8)
- status: locked
- scope: quality engineering
- decision: No unit tests are required for the POC. Test-related work is out of scope.
