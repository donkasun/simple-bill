## Learned User Preferences

- Prefer keeping IDE-local agent tooling out of git: `.cursor/` by default, `docs/superpowers/` for local Superpowers plans/specs, and `.superpowers/` at repo root; only commit shared rules if explicitly intended.
- Optimize for non-technical, occasional users: plain-language labels, helper copy, and invoice-first flows over power-user patterns.
- When executing milestone plans, do not edit the plan file; use the existing todos and mark progress there.
- Prefer Playwright smoke via `pnpm run test:playwright` with mock user mode (`VITE_MOCK_USER=true` dev server); only `scripts/playwright-smoke.mjs` remains. Add characterization page tests before route or dashboard refactors when coverage is missing.
- README and other portfolio-facing copy should sound natural and human; let product story and technical depth speak without labeling audience segments; avoid em dashes in prose.
- Delegate narrow, spec-driven work to Jules using handoff docs under `docs/jules/`; keep design-system and ambiguous UX work in Cursor.
- When refactoring dashboard routes or doing a large in-app Stitch reskin, work in phases on one branch (not multiple PRs unless asked); prefer custom page hooks over parallel logic/UI file pairs; track dashboard Stitch phases in `design-reference/dashboard-stitch-reskin-phases.md`.
- For diff-tab commit-and-push actions, commit only the explicitly listed staged files; treat that list as authoritative and do not stage additional files.
- On the public landing page, avoid empty section placeholders; defer a Product showcase until real screenshots exist. Landing visual work should follow Stitch references in `docs/landing-page-stitch-brief.md` and `screenshots/stitch-*.png`.
- When squash-merging a PR, **rewrite the squash commit message** — do not use GitHub's default concatenation of branch commits. Write a fresh PR summary with `gh pr merge --squash -t "subject" -b "body"` (or `--body-file`). Agent commits often carry `Co-authored-by` trailers; the default squash body duplicates them. In the rewritten body, include **each unique co-author once** at the end — do not omit attribution and do not repeat the same co-author.
- Primary in-app CTAs (e.g. header New invoice) use rounded-square corners, not full pill shape.
- App shell sidebar logo and branding should match the public landing page.

## Learned Workspace Facts

- SimpleBill is a React + Vite + TypeScript app using Firebase/Firestore, built as minimal invoicing for occasional use.
- Package manager is pnpm (`packageManager` in package.json; CI uses pnpm).
- Project documentation lives under `docs/` (`docs/typography.md`, `docs/project_plan.md`); `docs/superpowers/` is gitignored for local agent plans only.
- Theme preference is localStorage-only (not synced to Firestore user profiles).
- Supported document currencies: USD, LKR, EUR, GBP, AUD, CAD (`SUPPORTED_CURRENCIES` in `src/utils/currency.ts`).
- In-app pages use a shared layout: `.app-page` (1024px centered column) and `PageHeader` for titles.
- Sidebar follows invoice-first Layout A: New invoice CTA, then Home, Customers, Products & services, and Settings.
- Dashboard route orchestration uses `src/hooks/pages/use<Route>Page.ts` with thin views in `src/pages/`; list routes use `useCustomersPage`, `useItemsPage`, `useDocumentsPage`, and `useDashboardPage` with shared `useDocumentMutations` for document card actions; document create/edit use shared `useDocumentPage` with `DocumentEditorForm`; Settings uses `useSettingsPage`.
- App defines 10 routable screens in `App.tsx` (Login, Terms, and eight authenticated routes under `AppShell`); `/` redirects to `/dashboard` with no separate document view route.
- Public landing page is `src/pages/Landing.tsx` (outside `AppShell`): hero, marquee, features bento, sticky `HowItWorksSection` (typewriter step titles, stacked step images), and closing CTA.
- In-app dashboard Stitch re-skin specs live in `design-reference/` (`INSTRUCTIONS-FOR-LLM.md`, `stitch-dashboard.layout.md`, `dashboard-stitch-reskin-phases.md`, screenshot); use `--md-*` tokens and real `useDashboardPage` data, not Tailwind pasted from the HTML export.
- Dashboard bento **Sent** counts map to document status `finalized`. Customer spotlight uses invoices only (not quotations) for highlight/outstanding logic and does not show avatars. Recent-document rows are compact: status pill beside document id, invoice/quotation type icons, date under amount; tax-season and similar copy should reflect real counts (no praise at zero).
