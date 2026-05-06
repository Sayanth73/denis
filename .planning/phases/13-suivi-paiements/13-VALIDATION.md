---
phase: 13
slug: suivi-paiements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-05
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none (no test runner installed) |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd-verify-work`:** Build must be green (0 TypeScript errors)
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | REQ-v3-suivi-paiements | — | N/A | build | `npm run build` | ✅ | ⬜ pending |
| 13-01-02 | 01 | 1 | REQ-v3-suivi-paiements | — | N/A | build | `npm run build` | ✅ | ⬜ pending |
| 13-01-03 | 01 | 1 | REQ-v3-suivi-paiements | — | N/A | build | `npm run build` | ✅ | ⬜ pending |
| 13-02-01 | 02 | 2 | REQ-v3-suivi-paiements | — | N/A | build | `npm run build` | ✅ | ⬜ pending |
| 13-02-02 | 02 | 2 | REQ-v3-suivi-paiements | — | N/A | build | `npm run build` | ✅ | ⬜ pending |
| 13-02-03 | 02 | 2 | REQ-v3-suivi-paiements | — | N/A | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework installation needed — `npm run build` provides TypeScript type-checking across all modified files.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Badge "En retard" appears after delaiPaiementJours | REQ-v3-suivi-paiements | Requires date manipulation | Set delaiPaiementJours=0 in /parametres, open a facture, confirm orange badge appears |
| "Payé à la livraison" button marks facture + shows toast | REQ-v3-suivi-paiements | UI interaction | Open /factures/[id] for en_attente facture, click button, verify toast + badge |
| "Virement reçu" button works | REQ-v3-suivi-paiements | UI interaction | Same as above with second button |
| KPI "Factures impayées" shows correct total | REQ-v3-suivi-paiements | Dashboard live data | Mark one facture paid, verify KPI total decreases |
| delaiPaiementJours persists across reload | REQ-v3-suivi-paiements | localStorage persistence | Set to 15, reload, confirm value retained |
| Store migration v2→v3 on cold boot | REQ-v3-suivi-paiements | localStorage state migration | Clear localStorage except factures without paiement field, reload, confirm no crash |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
