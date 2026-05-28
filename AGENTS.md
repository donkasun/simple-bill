## Learned User Preferences

- Prefer keeping IDE-local Cursor state out of git (ignore `.cursor/` by default; only commit shared rules if explicitly intended).
- Optimize for non-technical, occasional users: plain-language labels, helper copy, and invoice-first flows over power-user patterns.
- When executing milestone plans, do not edit the plan file; use the existing todos and mark progress there.
- Prefer Playwright with mock user mode for local UI smoke verification.
- Delegate narrow, spec-driven work to Jules using handoff docs under `docs/jules/`; keep design-system and ambiguous UX work in Cursor.

## Learned Workspace Facts

- SimpleBill is a React + Vite + TypeScript app using Firebase/Firestore, built as minimal invoicing for occasional use.
- Project documentation and planning live under `docs/` (including `docs/typography.md` for font sizes and `docs/project_plan.md` for milestones).
- Theme preference is localStorage-only (not synced to Firestore user profiles).
- Supported document currencies: USD, LKR, EUR, GBP, AUD, CAD (`SUPPORTED_CURRENCIES` in `src/utils/currency.ts`).
- In-app pages use a shared layout: `.app-page` (1024px centered column) and `PageHeader` for titles.
- Sidebar follows invoice-first Layout A: New invoice CTA, then Home, Customers, Products & services, and Settings.
