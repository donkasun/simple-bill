## Learned User Preferences

- Prefer keeping IDE-local agent tooling out of git: `.cursor/` by default, `docs/superpowers/` for local Superpowers plans/specs, and `.superpowers/` at repo root; only commit shared rules if explicitly intended.
- Optimize for non-technical, occasional users: plain-language labels, helper copy, and invoice-first flows over power-user patterns.
- When executing milestone plans, do not edit the plan file; use the existing todos and mark progress there.
- Prefer Playwright with mock user mode for local UI smoke verification.
- Delegate narrow, spec-driven work to Jules using handoff docs under `docs/jules/`; keep design-system and ambiguous UX work in Cursor.
- When refactoring dashboard routes, pilot one route with a reusable pattern before rolling out; prefer custom page hooks over parallel logic/UI file pairs.
- For route refactors, add characterization page tests before changing behavior when page coverage is missing.

## Learned Workspace Facts

- SimpleBill is a React + Vite + TypeScript app using Firebase/Firestore, built as minimal invoicing for occasional use.
- Package manager is pnpm (`packageManager` in package.json; CI uses pnpm).
- Project documentation lives under `docs/` (`docs/typography.md`, `docs/project_plan.md`); `docs/superpowers/` is gitignored for local agent plans only.
- Theme preference is localStorage-only (not synced to Firestore user profiles).
- Supported document currencies: USD, LKR, EUR, GBP, AUD, CAD (`SUPPORTED_CURRENCIES` in `src/utils/currency.ts`).
- In-app pages use a shared layout: `.app-page` (1024px centered column) and `PageHeader` for titles.
- Sidebar follows invoice-first Layout A: New invoice CTA, then Home, Customers, Products & services, and Settings.
- Dashboard route orchestration uses `src/hooks/pages/use<Route>Page.ts` with thin views in `src/pages/`; list routes use `useCustomersPage`, `useItemsPage`, `useDocumentsPage`, and `useDashboardPage` with shared `useDocumentMutations` for document card actions; next rollout target is document create/edit (`useDocumentPage`).
