# Synthesis Summary

Entry point for downstream consumers (e.g., `gsd-roadmapper`). Produced by `gsd-doc-synthesizer` from the classified planning documents under `.planning/intel/classifications/`.

---

## Inputs

- Mode: new (net-new bootstrap, no existing `.planning/` context to merge against)
- Precedence: ADR > SPEC > PRD > DOC (default)
- Classifications consumed: 1
- Cycle detection: passed (no cross-references — single doc)

## Doc counts by type

- ADR: 0
- SPEC: 0
- PRD: 1 (`/Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md` — "PRD — POC TraceKebab")
- DOC: 0
- UNKNOWN: 0

## Decisions

- Total decisions extracted: 18
- Locked: 18 (all stack and scope choices in §2, §6, §7, §8 are declared "imposée" / explicit project rules)
- File: `.planning/intel/decisions.md`
- Notable locked decisions:
  - DEC-stack-framework — Next.js 14+ App Router
  - DEC-stack-language — TypeScript strict
  - DEC-stack-styling — Tailwind CSS
  - DEC-stack-ui-components — shadcn/ui
  - DEC-stack-icons — lucide-react
  - DEC-stack-state — Zustand + persist + localStorage
  - DEC-architecture-no-backend — no backend, no API, no DB
  - DEC-locale-french-only — French-only UI
  - DEC-platform-desktop-only — desktop-only
  - DEC-internal-lot-format — `TK-AAAA-MMJJ-NNN`
  - DEC-dlc-defaulting — broche DLC = production + 5 days
  - DEC-recipe-readonly — recipes read-only in POC
  - DEC-fifo-allocation — FIFO suggestion in production wizard
  - DEC-pdf-export-library — react-to-print or jsPDF
  - DEC-visual-style — sober B2B SaaS aesthetic
  - DEC-file-size-cap — max 300 lines/file
  - DEC-no-tests — no unit tests in POC
  - DEC-seed-data — auto-seed on empty localStorage

## Requirements

- Total requirements extracted: 21
- File: `.planning/intel/requirements.md`
- IDs:
  - REQ-layout-shell
  - REQ-dashboard
  - REQ-raw-materials-list
  - REQ-raw-material-receive
  - REQ-recipes-readonly
  - REQ-production-orders-list
  - REQ-production-wizard
  - REQ-deliveries-list
  - REQ-delivery-create
  - REQ-clients-crud
  - REQ-client-detail-history
  - REQ-tracabilite-search
  - REQ-tracabilite-upstream
  - REQ-tracabilite-downstream
  - REQ-tracabilite-pdf-export
  - REQ-dlc-color-coding
  - REQ-toasts-on-mutations
  - REQ-confirmations-on-critical-actions
  - REQ-empty-states
  - REQ-no-pagination
  - REQ-success-criteria-demo-flow

## Constraints

- Total constraints extracted: 16
- File: `.planning/intel/constraints.md`
- Type breakdown:
  - schema: 2 (CON-data-model, CON-internal-lot-format)
  - nfr: 14 (DLC defaulting, no-backend, state persistence, French-only UI, desktop-only, no tests, out-of-scope features, file-size cap, no-TODOs, README, npm run dev, seed-on-empty, no-emojis, table density, color palette)
  - api-contract: 0
  - protocol: 0

## Context

- Total context topics: 6
- File: `.planning/intel/context.md`
- Topics: business domain, OSAV traceability mandate, POC purpose, exclusions, target geography (Suisse romande), design language, killer feature (traçabilité screen).

## Conflicts

- Blockers: 0
- Competing variants: 0
- Auto-resolved: 0
- Report: `/Users/sayanth/Desktop/viande/.planning/INGEST-CONFLICTS.md`

With a single source PRD, there is no surface for cross-doc contradictions. No locked-vs-locked ADR conflicts, no competing acceptance variants, no precedence overrides triggered.

## Pointers

- Per-type intel:
  - `/Users/sayanth/Desktop/viande/.planning/intel/decisions.md`
  - `/Users/sayanth/Desktop/viande/.planning/intel/requirements.md`
  - `/Users/sayanth/Desktop/viande/.planning/intel/constraints.md`
  - `/Users/sayanth/Desktop/viande/.planning/intel/context.md`
- Conflicts report: `/Users/sayanth/Desktop/viande/.planning/INGEST-CONFLICTS.md`
- Source PRD: `/Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md`
- Classification: `/Users/sayanth/Desktop/viande/.planning/intel/classifications/PRD-kebab-tracabilite-poc-a3f8b2c1.json`

## Status

READY — safe to route to `gsd-roadmapper`.
