# Phase 9: Polish & Demo Dry-Run - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Every cross-cutting UX rule is consistently applied across the whole app, and the §9 5-minute demo flow runs cleanly end-to-end on a fresh seed.

**Requirements:** REQ-dlc-color-coding, REQ-toasts-on-mutations, REQ-confirmations-on-critical-actions, REQ-empty-states, REQ-no-pagination, REQ-success-criteria-demo-flow.

**Success criteria (ROADMAP §Phase 9):**
1. DLC badges across the app use correct colors (green >5d, orange 2-5d, red <2d, grey expired) — verified across matières premières, broches, livraisons, dashboard alerts, traçabilité.
2. Every create/modify action shows a sonner toast — verified by walking through each action.
3. Every critical action (production confirm, "Marquer comme livrée", démo reset) requires explicit user confirmation; no destructive action happens silently.
4. Every list/table renders a contextual empty state; no blank grids; no pagination controls.
5. From a fresh "Réinitialiser démo" state, the §9 5-step demo flow runs cleanly in <5 min.

</domain>

<decisions>
## Implementation Decisions

### Locked
- This is a polish/audit phase. Most work is fixes for existing features rather than new features.
- Outstanding deferred items from earlier phases (STATE.md "Deferred Items" table):
  - Reset button label rendering 12px (size=sm cascades text-xs).
  - Sidebar active indicator is 24px pip instead of full-row 2px strip per UI-SPEC.
  - Pressed-state class missing on nav items + ghost button.
  - --destructive HSL brighter than red-600; sonner shadow-lg vs shadow-md; Brand role missing from Typography table.
  - AlertDialog ships text-lg title + rounded-lg/shadow-lg vs locked text-xl + rounded-md/shadow-md.

### Approach
- Plan 09-01: Cross-cutting UX audit + fixes (DLC color audit, missing toasts, missing confirmations, missing empty states, deferred polish from STATE.md).
- Plan 09-02: Demo dry-run validation. Walk through the §9 5-step flow on a fresh seed; document any rough edges in a SUMMARY; fix any blockers inline.

### Claude's Discretion
- Audit-driven approach: an audit subagent does a read-only sweep first, surfaces a punch list, then the executor fixes them.

</decisions>

<code_context>
## Existing Code Insights

- Reset button: `app/header.tsx` or wherever the "Réinitialiser démo" button lives.
- Nav active indicator: `components/sidebar.tsx` (or similar).
- AlertDialog dimensions: defined in `components/ui/alert-dialog.tsx` (shadcn primitive).
- DLC bucket: `lib/dlc.ts` `dlcColor(date, today)`. Used by `<DlcBadge>`. Audit any place that inlines DLC colors instead.
- Toasts: search for existing actions and verify each fires `toast.success(...)`.
- Confirmations: production wizard step 3 has a Confirmer button; "Marquer comme livrée" has AlertDialog; "Réinitialiser démo" has AlertDialog.

</code_context>

<specifics>
## Specific Ideas

- Plan 09-01 tasks:
  1. **DLC audit**: scan all *.tsx files for hardcoded DLC color classes (`bg-emerald-100`, `bg-orange-100`, `bg-red-100`, `bg-zinc-100`) outside of `<DlcBadge>` or `STATUT_CLASSES`. Replace with the badge.
  2. **Toast audit**: list all create/update/delete actions across the app; verify each fires a sonner toast. Add any missing.
  3. **Confirmations audit**: confirm production confirm, "Marquer comme livrée", "Réinitialiser démo" all gate behind explicit user click. Add AlertDialog if missing.
  4. **Empty states audit**: every table/list must render `<EmptyState>` when empty. Audit pages and add missing.
  5. **STATE.md deferred items**: apply the 5 polish items.
- Plan 09-02 tasks:
  1. **Demo dry-run**: from fresh `seed.ts` state (call `resetToSeed()` mentally), follow the 5-step flow; verify each step works; capture any UX issues; fix blockers; non-blockers documented in SUMMARY for v1.
  2. **Final tsc + build verification**.
  3. **Update PROJECT.md / README** with the demo flow narrative.

</specifics>

<deferred>
## Deferred Ideas

- Anything beyond the milestone — defer to v0.2.

</deferred>
