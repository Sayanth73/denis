# Context (Synthesized)

Source: §1 Contexte métier of the PRD.

---

## CTX-business-domain — Swiss kebab meat transformation business

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§1)
- topic: business domain
- content: |
  The target user is a small Swiss meat transformer specializing in kebab spits ("broches"). The business operates across three stages:
  1. Purchases raw materials (matières premières): viande de bœuf, viande d'agneau, viande de poulet, épices, marinades, sel.
  2. Produces finished kebab spits ("broches finies") by mixing those raw materials according to recipes — example: "broche standard 25 kg = 60% bœuf + 30% agneau + 10% mélange épices A".
  3. Delivers those finished spits to regular kebab-restaurant clients.

## CTX-traceability-mandate — OSAV sanitary control requirement

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§1)
- topic: regulatory driver
- content: |
  In case of an OSAV (Swiss Federal Food Safety and Veterinary Office) sanitary control, the transformer must be able to prove traceability bidirectionally:
  - Forward (downstream): for any delivered broche, retrieve the supplier lots of raw materials that composed it.
  - Reverse (upstream): for any supplier lot of raw material, retrieve every client that received a finished product containing it.
  This bidirectional traceability is the core regulatory driver and the killer feature of the POC.

## CTX-poc-purpose — Clickable demo to validate the concept

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (preamble, §1, §9)
- topic: project intent
- content: |
  This is a Proof of Concept — not a production v1. Its purpose is a clickable demo to validate the concept with a kebab meat transformer prospect. It must visibly render the entire flow (raw materials → production → deliveries → traceability search) in just a few clicks. The demo is judged successful if the §9 5-minute flow runs.

## CTX-no-real-systems — No auth, no database, no payments

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (preamble)
- topic: scope
- content: |
  The POC explicitly excludes authentication, real databases, and payments. It is a demonstrative front-end-only flow. Production hardening, security, and data integrity at scale are non-goals.

## CTX-target-geography — Suisse romande

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§4)
- topic: localization context
- content: |
  Seed data uses Suisse-romande naming conventions: realistic kebab restaurant names ("Kebab Royal Lausanne", "Snack Istanbul Yverdon", etc.) and Swiss-romand addresses. Combined with the French-only UI (DEC-locale-french-only), the product is positioned for the French-speaking Swiss market.

## CTX-design-language — Sober B2B SaaS

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§7)
- topic: visual identity
- content: |
  The product is positioned as a sober, professional B2B SaaS tool. Reference apps are Linear, Notion, and the Vercel dashboard. The target user works in a regulated/sanitary domain and expects seriousness — no playful design language, no emojis in the chrome, dense data tables.

## CTX-killer-feature — Traçabilité screen sells the product

- source: /Users/sayanth/Desktop/viande/PRD_kebab_tracabilite_poc.md (§5.7)
- topic: product differentiation
- content: |
  §5.7 explicitly calls out the Traçabilité screen as "L'écran qui fait vendre" (the screen that sells the product). UX polish on this screen has higher priority than on any other screen, because the demo's entire value proposition crystallizes here: visualizing the upstream and downstream chain in one click, with an exportable PDF dossier ready for an OSAV inspector.
