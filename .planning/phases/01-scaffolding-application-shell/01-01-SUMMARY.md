---
phase: 1
plan: 1
plan_name: scaffolding-foundation
subsystem: scaffolding
tags: [next.js, app-router, typescript, tailwind, shadcn, geist, sonner, foundation]
status: complete
completed_at: 2026-05-04
duration_minutes: 6
tasks_completed: 3
tasks_total: 3
requires: []
provides:
  - Next.js 14 App Router project rooted at repo with TypeScript strict
  - Tailwind 3 + shadcn/ui (New York, neutral, CSS variables) design system foundation
  - Button + Toaster shadcn components installed
  - Geist Sans + Geist Mono wired via geist npm package and Tailwind font-sans/font-mono
  - Global <Toaster /> mounted in root layout
  - French metadata (TraceKebab title + description) + <html lang="fr">
  - HSL CSS variables matching UI-SPEC §Color (blue-600 primary, zinc neutrals, red-600 destructive)
affects:
  - All Phase 1+ plans inherit this foundation; no further bootstrap needed
tech-stack:
  added:
    - next@14.2.35
    - react@18.x
    - react-dom@18.x
    - typescript@5.x
    - tailwindcss@3.4.1
    - shadcn-cli@2.10.0 (used at install-time only — not a runtime dep)
    - lucide-react@1.14.0
    - geist@1.7.0
    - sonner@2.0.7
    - zustand@5.0.12 (declared now, first used in Phase 2)
    - class-variance-authority@0.7.1
    - clsx@2.1.1
    - tailwind-merge@3.5.0
    - tailwindcss-animate@1.0.7
    - "@radix-ui/react-slot@1.2.4"
    - next-themes@0.4.6 (transitive — installed by shadcn add sonner; left in place to avoid dep churn)
  patterns:
    - shadcn CSS-variable theming with hsl(var(--token)) bindings in tailwind.config.ts
    - next/font CSS variables (--font-geist-sans, --font-geist-mono) consumed by Tailwind font-family
    - sonner Toaster mounted globally in root layout, light theme, top-right anchor
key-files:
  created:
    - package.json
    - package-lock.json
    - tsconfig.json
    - next.config.mjs
    - postcss.config.mjs
    - tailwind.config.ts
    - components.json
    - .gitignore
    - .eslintrc.json
    - README.md
    - app/page.tsx
    - app/globals.css
    - app/favicon.ico
    - lib/utils.ts
    - components/ui/button.tsx
    - components/ui/sonner.tsx
  modified:
    - app/layout.tsx (replaced create-next-app boilerplate with Geist + Toaster + French metadata)
  deleted:
    - app/fonts/GeistVF.woff (replaced by geist npm package)
    - app/fonts/GeistMonoVF.woff (replaced by geist npm package)
decisions:
  - Pinned create-next-app to v14 because the latest (v16) installs Tailwind v4 + Next.js 16 with breaking changes; plan and UI-SPEC are written against Next.js 14 + Tailwind v3 with tailwind.config.ts + HSL CSS variables
  - Pinned shadcn-cli to v2.10.0 (last v2) because v4.x removed the New York style preset, switched from Radix to base-ui primitives, and writes oklch() not HSL — which would break the plan's verification grep contract and the locked UI-SPEC §Design System
  - Used temp-then-merge bootstrap pattern (nextapp-bootstrap/) to scaffold without disturbing pre-existing .planning/, .git/, and PRD_kebab_tracabilite_poc.md
  - Manually rewrote app/globals.css with HSL values (shadcn-cli v2.10 incorrectly wrote oklch() into globals.css while leaving hsl(var(--*)) bindings in tailwind.config.ts — incompatible pair)
  - Simplified components/ui/sonner.tsx to a fixed theme=light + position=top-right + richColors=false per UI-SPEC §Design System and PRD §8 (no dark mode)
metrics:
  duration_minutes: 6
  task_count: 3
  file_count: 17
---

# Phase 1 Plan 1: Scaffolding Foundation Summary

Bootstrapped a Next.js 14.2.35 App Router project at `/Users/sayanth/Desktop/viande` with TypeScript strict, Tailwind 3.4.1, and shadcn/ui (New York style, neutral base, CSS variables). The Button and Sonner shadcn components are installed, Geist Sans + Geist Mono are wired via the `geist` package and exposed as Tailwind `font-sans`/`font-mono`, and the root layout sets `<html lang="fr">`, mounts a global `<Toaster />`, and declares French metadata. `npm run dev` boots cleanly on http://localhost:3000 with HTTP 200, and `npx tsc --noEmit` exits 0. The pre-existing `.planning/` directory and `PRD_kebab_tracabilite_poc.md` are intact.

## Tasks Completed

| # | Task | Commit | Key Outputs |
|---|------|--------|-------------|
| 1 | Bootstrap Next.js 14 App Router at repo root | `1208a28` | package.json, tsconfig.json, tailwind.config.ts, app/layout.tsx, app/page.tsx, app/globals.css, README.md, .gitignore |
| 2 | Initialize shadcn/ui (New York + neutral) and configure theme tokens | `f42256e` | components.json, lib/utils.ts, components/ui/button.tsx, components/ui/sonner.tsx; rewrote app/globals.css with HSL tokens; rewrote tailwind.config.ts with font-family wiring |
| 3 | Wire Geist fonts and global Toaster into root layout | `335d16c` | Final app/layout.tsx (28 lines, ≤40 cap); deleted app/fonts/Geist*.woff |

## Final Dependency Versions

Resolved by `npm install` after Task 1 + the shadcn-cli v2.10 add commands:

```
next@14.2.35
react@18.3.1, react-dom@18.3.1
typescript@5.x
tailwindcss@3.4.1
@radix-ui/react-slot@1.2.4
class-variance-authority@0.7.1
clsx@2.1.1
geist@1.7.0
lucide-react@1.14.0
next-themes@0.4.6 (transitive from shadcn add sonner; not removed)
sonner@2.0.7
tailwind-merge@3.5.0
tailwindcss-animate@1.0.7
zustand@5.0.12
```

## Bootstrap Pattern Notes

The temp-then-merge pattern worked, with two adjustments versus the plan's exact spec:

1. **`create-next-app` rejected `.nextapp-bootstrap`** as a project name (npm naming restriction: name cannot start with a period). Used `nextapp-bootstrap` (no dot) instead. Adjusted the merge loop accordingly.
2. **`create-next-app@latest` defaulted to Next.js 16 + Tailwind v4** (config-less, `@theme` in CSS). That diverges from the plan's contract (which expects `tailwind.config.ts`, HSL CSS variables, Tailwind v3). Reverted that scaffold and re-bootstrapped with `create-next-app@14`, which produces Next.js 14.2.35 + Tailwind 3.4.1 with the expected file layout.
3. **`create-next-app@14` does not honor `--skip-install`**; it always runs `npm install`. Acceptable — it removed a step.
4. **`.gitignore` merge**: the repo had no pre-existing `.gitignore`, so the create-next-app one moved in cleanly with no merge required.
5. **`mv` of dotfiles**: used a shell glob loop with `dotglob`/`setopt dotglob nullglob` and skip-list (`. .. .planning .git PRD_kebab_tracabilite_poc.md`). Worked on first pass; the loop iterated twice because already-moved entries were re-globbed, but the case-skip handled the SKIP cleanly.

## shadcn-cli Flag Adjustments

The plan was written for shadcn-cli v2.x. The current `npx shadcn@latest` is v4.6.0 and has a different flag set (`--base` not `--base-color`, presets like `base-nova`, base-ui primitives instead of Radix). v4 init produces:

- `"style": "base-nova"` (not `"new-york"`) → would fail `grep -q '"style": "new-york"' components.json`
- `oklch()` color values (not HSL) → would fail `grep -q '221.2 83.2% 53.3%' app/globals.css`
- `@base-ui/react/button` (not `@radix-ui/react-slot`) → would diverge from UI-SPEC §Design System

Pinned to **`shadcn@2.10.0`** — the last v2 release that supports `--base-color neutral`, `--no-src-dir`, `--css-variables`, and writes the New York Radix Button. The interactive style picker still appeared with just `--yes`, but adding `--defaults` selected New York automatically.

## CSS Variable Override

shadcn-cli v2.10 wrote the **neutral** CSS variables in `oklch()` color space (the v2.10 templates were updated to OKLCH while still binding the tokens with `hsl(var(--*))` in `tailwind.config.ts` — an incompatible pair that would produce broken `hsl(oklch(...))` at compile time). Manually rewrote `app/globals.css` with HSL values per UI-SPEC §Color:

```
--background:           0 0% 100%        /* #FFFFFF */
--foreground:           240 6% 10%       /* #18181B zinc-900 */
--card:                 0 0% 100%        /* #FFFFFF */
--card-foreground:      240 6% 10%
--popover:              0 0% 100%
--popover-foreground:   240 6% 10%
--primary:              221.2 83.2% 53.3% /* #2563EB blue-600 — UI-SPEC accent (10%) */
--primary-foreground:   0 0% 100%
--secondary:            240 5% 96%
--secondary-foreground: 240 6% 10%
--muted:                240 5% 96%       /* zinc-100 */
--muted-foreground:     240 4% 46%       /* #71717A zinc-500 */
--accent:               240 5% 96%       /* neutral hover surface */
--accent-foreground:    240 6% 10%
--destructive:          0 84% 60%        /* #DC2626 red-600 */
--destructive-foreground: 0 0% 100%
--border:               240 6% 90%       /* #E4E4E7 zinc-200 */
--input:                240 6% 90%
--ring:                 221.2 83.2% 53.3% /* matches primary */
--radius:               0.5rem
```

Removed shadcn's default `chart-*` and `sidebar-*` tokens (UI-SPEC defines neither) and the entire `.dark { … }` block (PRD §8: "Pas de mode sombre"). `tailwind.config.ts` was updated in lockstep to drop those tokens.

## Verification

All grep contracts and runtime checks pass:

```
$ test -d .planning && test -f PRD_kebab_tracabilite_poc.md   # OK
$ grep -q '"strict": true' tsconfig.json                       # OK
$ grep -q '"style": "new-york"' components.json                # OK
$ grep -q '"baseColor": "neutral"' components.json             # OK
$ grep -q 'export function cn' lib/utils.ts                    # OK
$ grep -q 'buttonVariants' components/ui/button.tsx            # OK
$ grep -q 'Toaster' components/ui/sonner.tsx                   # OK
$ grep -q '221.2 83.2% 53.3%' app/globals.css                  # OK
$ grep -q 'var(--font-geist-sans)' tailwind.config.ts          # OK
$ grep -q 'var(--font-geist-mono)' tailwind.config.ts          # OK
$ grep -q 'tailwindcss-animate' tailwind.config.ts             # OK
$ grep -q 'lang="fr"' app/layout.tsx                           # OK
$ grep -q 'GeistSans' app/layout.tsx                           # OK
$ grep -q 'GeistMono' app/layout.tsx                           # OK
$ grep -q '<Toaster' app/layout.tsx                            # OK
$ grep -q 'TraceKebab' app/layout.tsx                          # OK
$ grep -q 'npm run dev' README.md                              # OK
$ npx tsc --noEmit                                             # exit 0
$ npm run dev → curl http://localhost:3000/                    # HTTP 200; lang="fr"; <title>TraceKebab</title>
```

## Preservation Confirmation

```
$ test -d .planning && echo intact                # intact
$ test -f PRD_kebab_tracabilite_poc.md && echo intact   # intact
$ test -d .git && echo intact                     # intact
$ git log --oneline | head -1                     # 335d16c (HEAD pointing at last task commit)
```

The pre-existing `.planning/` directory tree (PROJECT.md, ROADMAP.md, REQUIREMENTS.md, STATE.md, intel/, phases/) and `PRD_kebab_tracabilite_poc.md` are untouched. `.git/` history retained.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `create-next-app` rejected `.nextapp-bootstrap` as project name**
- **Found during:** Task 1 step 1
- **Issue:** npm forbids package names starting with a period. The plan literally specified `.nextapp-bootstrap` as the temp dir name.
- **Fix:** Used `nextapp-bootstrap` (no leading dot). Adjusted the dotfile-skip glob loop to handle the merge identically.
- **Files modified:** none in the final tree (temp dir was deleted after merge)
- **Commit:** `1208a28`

**2. [Rule 3 - Blocking] `create-next-app@latest` installs Next.js 16 + Tailwind v4 (config-less)**
- **Found during:** Task 1 step 1 (first attempt)
- **Issue:** The latest `create-next-app` produces a Tailwind-v4 project with no `tailwind.config.ts`, `oklch()` theme in CSS, and Next.js 16 (with `next.config.ts`). The plan's verification commands and the UI-SPEC contract are written for Next.js 14 + Tailwind v3 with `tailwind.config.ts` + HSL variables. Continuing on v4 would invalidate the verification contract and require rewriting UI-SPEC.
- **Fix:** Removed the Next.js 16 scaffold and re-bootstrapped with `create-next-app@14`, which produces Next.js 14.2.35 + Tailwind 3.4.1 with the expected file layout.
- **Files modified:** entire bootstrap (already replaced before any commit)
- **Commit:** `1208a28`

**3. [Rule 3 - Blocking] shadcn-cli v4.6.0 has a completely different flag set and writes incompatible artifacts**
- **Found during:** Task 2 step 1
- **Issue:** `npx shadcn@latest init --yes --base-color neutral` failed with "unknown option '--base-color'". v4 uses `--base radix|base`, presets like `base-nova`, base-ui primitives (not Radix), and writes `oklch()` colors. Output diverges from UI-SPEC and the plan's verification grep would fail on `"style": "new-york"` and `"221.2 83.2% 53.3%"`.
- **Fix:** Pinned to `shadcn@2.10.0` (last v2 release supporting `--base-color`, `--no-src-dir`, `--css-variables`, New York Radix Button). Used `--defaults --yes` to skip the interactive style prompt.
- **Files modified:** none in the final tree (the v4 init was reverted before commit)
- **Commit:** `f42256e`

**4. [Rule 1 - Bug] shadcn-cli v2.10 wrote oklch() into globals.css but hsl() bindings into tailwind.config.ts**
- **Found during:** Task 2 step 4
- **Issue:** The v2.10 init writes `--background: oklch(1 0 0)` etc. while the same init's `tailwind.config.ts` references `'hsl(var(--background))'`. At compile time Tailwind would produce `color: hsl(oklch(1 0 0))` — invalid CSS. Reading the file as-shipped would fail UI-SPEC §Color (which requires HSL).
- **Fix:** Manually rewrote `app/globals.css` with the exact HSL values prescribed by the plan's task 2 step 4 (blue-600 primary + zinc neutrals + red-600 destructive). Dropped the unused `chart-*` / `sidebar-*` tokens and the entire `.dark { … }` block (PRD §8: no dark mode). Updated `tailwind.config.ts` to drop matching unused color groups so the config and CSS stay in lockstep.
- **Files modified:** `app/globals.css`, `tailwind.config.ts`
- **Commit:** `f42256e`

**5. [Rule 2 - Critical functionality] Default sonner.tsx imports next-themes for dark/light, but PRD §8 forbids dark mode**
- **Found during:** Task 2 step 6
- **Issue:** shadcn-cli installed `next-themes` and the default Sonner reads `useTheme()`. Without a `<ThemeProvider>` in the layout, `useTheme()` returns `theme: "system"`, which renders sonner with `theme="system"` — dark mode would activate from OS preference. Plan UI-SPEC §Design System mandates `theme="light"`, `position="top-right"`, `richColors={false}`.
- **Fix:** Rewrote `components/ui/sonner.tsx` to drop the `next-themes` import and hardcode `theme="light"` + `position="top-right"` + `richColors={false}`. Kept the `next-themes` npm dep in `package.json` to avoid lockfile churn (it's harmless dead code, ~6KB).
- **Files modified:** `components/ui/sonner.tsx`
- **Commit:** `f42256e`

### Authentication Gates

None.

### Architectural Decisions Required

None — every deviation was a blocking-issue or bug fix per Rules 1–3, all decided autonomously.

## Known Stubs

- **`app/page.tsx` returns `null`** — intentional placeholder per Task 1 step 6. Plan 02 task 2 finalizes this route as the dashboard placeholder. Documented in PLAN.md `<done>` block of Task 1 ("[Plan 02 finalizes]").

No other stubs. The `next-themes` dependency in `package.json` is unused but kept to avoid touching the lockfile; documented above and in this Summary.

## Self-Check: PASSED

Verified files exist:
- `/Users/sayanth/Desktop/viande/package.json` — FOUND
- `/Users/sayanth/Desktop/viande/tsconfig.json` — FOUND
- `/Users/sayanth/Desktop/viande/tailwind.config.ts` — FOUND
- `/Users/sayanth/Desktop/viande/components.json` — FOUND
- `/Users/sayanth/Desktop/viande/app/layout.tsx` — FOUND
- `/Users/sayanth/Desktop/viande/app/page.tsx` — FOUND
- `/Users/sayanth/Desktop/viande/app/globals.css` — FOUND
- `/Users/sayanth/Desktop/viande/lib/utils.ts` — FOUND
- `/Users/sayanth/Desktop/viande/components/ui/button.tsx` — FOUND
- `/Users/sayanth/Desktop/viande/components/ui/sonner.tsx` — FOUND
- `/Users/sayanth/Desktop/viande/README.md` — FOUND
- `/Users/sayanth/Desktop/viande/.planning/` — FOUND (preserved)
- `/Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md` — FOUND (preserved)

Verified commits in `git log --oneline`:
- `1208a28 chore(01-01): bootstrap Next.js 14 App Router project at repo root` — FOUND
- `f42256e feat(01-01): initialize shadcn/ui (New York + neutral) and configure theme tokens` — FOUND
- `335d16c feat(01-01): wire Geist fonts and global Toaster into root layout` — FOUND
