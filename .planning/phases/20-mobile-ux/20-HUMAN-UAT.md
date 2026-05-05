---
status: partial
phase: 20-mobile-ux
source: [20-VERIFICATION.md]
started: 2026-05-05T21:00:00Z
updated: 2026-05-05T21:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Sidebar hidden / hamburger visible at 390px
expected: No sidebar visible; a Menu icon button appears at the left of the header; tapping it opens a Sheet drawer from the left containing all 9 navigation items
result: [pending]

### 2. Sheet drawer nav item tap closes drawer + navigates
expected: Sheet closes on tap via nav event delegation; correct route rendered; hamburger still visible in header
result: [pending]

### 3. Desktop layout unchanged at ≥768px
expected: Sidebar visible; no hamburger button; content starts at 240px left offset; layout identical to pre-phase state
result: [pending]

### 4. All 5 data tables horizontally scrollable at 390px
expected: Each table scrolls horizontally; no table border or action buttons are clipped; rounded corners preserved
result: [pending]

### 5. All 5 dialogs fit within 390px viewport
expected: Each dialog fits within the viewport with 16px margins on each side; all form fields visible; submit button reachable without horizontal scrolling
result: [pending]

### 6. Stock broches table horizontally scrollable at 390px
expected: StockBrochesTable scrolls horizontally if content exceeds viewport; no clipping (uses shadcn Table's built-in overflow-auto wrapper)
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
