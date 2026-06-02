## Learned User Preferences

- Prefer keeping IDE-local agent tooling out of git: `.cursor/` by default, `docs/superpowers/` for local Superpowers plans/specs, and `.superpowers/` at repo root; only commit shared rules if explicitly intended.
- Optimize for non-technical, occasional users: plain-language labels, helper copy, invoice-first flows, and visible choice cards or tiles (not dropdowns) on Settings over power-user patterns.
- When executing milestone plans, do not edit the plan file; use the existing todos and mark progress there.
- Prefer Playwright smoke via `pnpm run test:playwright` with mock user mode (`VITE_MOCK_USER=true` dev server); only `scripts/playwright-smoke.mjs` remains. Add characterization page tests before route or dashboard refactors when coverage is missing.
- README and other portfolio-facing copy should sound natural and human; let product story and technical depth speak without labeling audience segments; avoid em dashes in prose.
- Delegate narrow, spec-driven work to Jules using handoff docs under `docs/jules/`; keep design-system and ambiguous UX work in Cursor.
- When refactoring dashboard routes or doing a large in-app Stitch reskin, work in phases on one branch (not multiple PRs unless asked); prefer custom page hooks over parallel logic/UI file pairs; track dashboard Stitch phases in `design-reference/dashboard-stitch-reskin-phases.md`.
- For diff-tab commit-and-push actions, commit only the explicitly listed staged files; treat that list as authoritative and do not stage additional files.
- On the public landing page, avoid empty section placeholders; defer a Product showcase until real screenshots exist. Landing visual work should follow Stitch references in `docs/landing-page-stitch-brief.md` and `screenshots/stitch-*.png`.
- When squash-merging a PR: confirm CI is green; **rewrite** the squash message with `gh pr merge --squash -t "subject" -b "body"` (or `--body-file`) — never use GitHub's default (it concatenates commits and duplicates `Co-authored-by` lines). Summarize the PR outcome in the body; append **each unique co-author once** at the end. After merge, **delete the head branch** (`--delete-branch` or `git push origin --delete <branch>`) unless the user asks to keep it; checkout `main` and pull locally. See `CLAUDE.md` → Git workflow → Squash merges on PRs for the full checklist.
- Primary in-app CTAs use rounded-square corners (not full pill shape); app shell sidebar logo and branding should match the public landing page.
- Invoice and quotation PDF preview should use an inset centered panel with side margins on a dimmed backdrop, not a full-screen modal.

## Learned Workspace Facts

- SimpleBill is a React + Vite + TypeScript app using Firebase/Firestore, built as minimal invoicing for occasional use.
- Package manager is pnpm (`packageManager` in package.json; CI uses pnpm).
- Project documentation lives under `docs/` (`docs/typography.md`, `docs/project_plan.md`, `docs/dashboard-settings-colors.md`); `docs/superpowers/` is gitignored for local agent plans only. Local dev color tables: `/dev/colors` (Vite `import.meta.env.DEV` only).
- Theme preference is localStorage-only (not synced to Firestore user profiles).
- Supported document currencies: USD, LKR, EUR, GBP, AUD, CAD (`SUPPORTED_CURRENCIES` in `src/utils/currency.ts`); Settings picker order is LKR-first (`CURRENCY_PICKER_ORDER`).
- In-app pages use a shared layout: `.app-page` (1024px centered column) and `PageHeader` for titles.
- Sidebar follows invoice-first Layout A: New invoice CTA, then Home, Customers, Products & services, Settings; `/documents` is labeled **Documents** in the nav (lists invoices and quotations).
- Dashboard route orchestration uses `src/hooks/pages/use<Route>Page.ts` with thin views in `src/pages/`; list routes use `useCustomersPage`, `useItemsPage`, `useDocumentsPage`, and `useDashboardPage` with shared `useDocumentMutations` for document card actions; document create/edit use shared `useDocumentPage` with `DocumentEditorForm`; Settings uses `useSettingsPage`.
- App defines 10 routable screens in `App.tsx` (Login, Terms, and eight authenticated routes under `AppShell`); `/` redirects to `/dashboard` with no separate document view route.
- Public landing page is `src/pages/Landing.tsx` (outside `AppShell`): hero, marquee, features bento, sticky `HowItWorksSection` (typewriter step titles, stacked step images), and closing CTA.
- In-app dashboard Stitch re-skin specs live in `design-reference/` (`INSTRUCTIONS-FOR-LLM.md`, `stitch-dashboard.layout.md`, `dashboard-stitch-reskin-phases.md`, screenshot); use `--md-*` tokens and real `useDashboardPage` data, not Tailwind pasted from the HTML export.
- Document statuses are `draft`, `ready`, `sent`, `paid` (`src/types/document.ts`). Dashboard bento **Sent** counts use `sent`. Recent documents sort by `createdAt` desc. Customer spotlight uses invoices only (not quotations) for highlight/outstanding logic and does not show avatars. Recent-document rows are compact: status pill beside document id, invoice/quotation type icons, date under amount; tax-season and similar copy should reflect real counts (no praise at zero). Dashboard entrance motion runs once per browser tab session (`useDashboardIntroAnimation` / sessionStorage), not on every SPA return to `/dashboard`.
