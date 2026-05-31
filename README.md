# SimpleBill

[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

A calm invoicing app for freelancers and small business owners who bill the same people regularly. Real product scope, not a tutorial exercise.

**Repo:** [github.com/donkasun/simple-bill](https://github.com/donkasun/simple-bill)

---

## What this is

SimpleBill helps you set up customers and line items once, then create invoices and quotations in a few taps. Save a draft when you're half-done, finalize when you're ready, export a PDF, mark it paid. Google sign-in, multi-currency, light and dark theme.

I built it for my dad. He invoices maybe once a week and has zero interest in enterprise software. Most decisions in this repo trace back to him: plain labels, one main action per screen, no feature creep.

Under the hood there's enough structure to take seriously: typed Firestore hooks, transactional document numbering, a reducer for the invoice form, Firestore rules that actually enforce ownership, and around 150 tests covering the business logic. The goal was always a small app someone would use, but I wanted to build it the way I'd build something at work.

---

## Features

- **Customers and items:** reusable catalog, search, and quick-action shortcuts on the dashboard based on recent usage
- **Invoices and quotations:** create, edit, duplicate; draft, finalized, and paid states with colour-coded status
- **Quotation to invoice:** convert an approved quote into a new invoice in one step
- **Multi-currency:** USD, LKR, EUR, GBP, AUD, CAD; per-document currency with a user default
- **PDF export:** generated in the browser via pdf-lib, loaded only when you export
- **Dashboard:** recent documents, a financial summary strip, shortcuts to frequent customers
- **Settings:** default currency and theme (theme stored in localStorage)
- **Landing page:** public marketing site at `/` with Google sign-in; the app itself sits behind auth

---

## How it's built

React SPA on the front, Firebase Auth and Firestore on the back. Security lives in Firestore rules. No custom Node server to deploy.

| Layer   | Choice                                                                                 |
| ------- | -------------------------------------------------------------------------------------- |
| UI      | React 19, TypeScript (strict), Vite 7                                                  |
| Routing | React Router 7, lazy-loaded routes, one bundle per page                                |
| Data    | Firestore via a generic `useFirestore` hook (real-time or one-shot, typed projections) |
| Auth    | Firebase Auth, Google sign-in only                                                     |
| PDF     | pdf-lib, dynamic import on export                                                      |
| Tests   | Vitest + Testing Library (~150 tests), Playwright smoke script                         |
| CI      | GitHub Actions: lint, test, build on every PR                                          |
| Tooling | ESLint 9 (flat config), Prettier, Husky + lint-staged                                  |
| Hosting | Vercel (SPA rewrites, COOP header for Google popup auth)                               |

### Architecture notes

**Page hooks, thin views.** Screens in `src/pages/` call into `use<Route>Page` hooks in `src/hooks/pages/`. The page renders UI; the hook handles data, mutations, and navigation. Document card actions share `useDocumentMutations`.

**Generic Firestore hook.** One typed hook covers CRUD, subscriptions, and query building. It refuses unscoped reads and lets callers pass a `select` projection instead of duplicating boilerplate per collection.

**Document form as a reducer.** Header fields, line items, and totals go through a discriminated-union reducer. A `canEdit` gate blocks mutations on finalized documents in one place. Validation is split between `validateDraft` and `validateFinalize` because drafts and finalized docs have different rules.

**Transactional document numbering.** Numbers like `INV-2026-001` come from a Firestore transaction on a per-user counter. Counting existing documents and adding one would race under concurrency; this doesn't.

**Pure utils, tested on their own.** Currency, document math, validation, and numbering live in `src/utils/` as plain functions. Most unit tests target that layer.

**Firestore rules.** Per-user ownership on every collection, no ownership reassignment on update, deny-all catch-all. See `config/firebase/`.

---

## Design

SimpleBill uses a **"Simple Humanist"** design system aimed at people who don't live in software:

- Sage-green palette, light and dark themes, semantic colour tokens with matching foreground colours
- Atkinson Hyperlegible for body text, Epilogue for headings
- Large tap targets, labelled controls, plain English copy
- Document status visible at a glance via colour-coded left borders (draft, sent, paid)

More in [`docs/typography.md`](docs/typography.md) and [`docs/landing-page-stitch-brief.md`](docs/landing-page-stitch-brief.md).

---

## Project structure

```
src/
├── auth/              Auth provider + useAuth hook
├── components/
│   ├── core/          Reusable UI (Button, StyledInput, ErrorBoundary, …)
│   ├── customers/     Customer list, modal, empty state
│   ├── documents/     Editor, cards, filters, line items table
│   ├── dashboard/     Summary strip, quick actions, empty state
│   ├── landing/       Public marketing page sections
│   ├── layout/        AppShell, PageHeader, sidebar nav
│   └── settings/      Theme and currency cards
├── hooks/
│   ├── pages/         Route orchestration (useDashboardPage, useDocumentPage, …)
│   ├── useFirestore.ts
│   └── useDocumentForm.ts
├── pages/             Thin route views
├── types/             Domain models
└── utils/             Pure logic (currency, pdf, validation, docNumber, …)

tests/                 Vitest: hooks, pages, utils, components
config/firebase/       Firestore rules + indexes
scripts/               Playwright smoke test
```

---

## Getting started

**Prerequisites:** Node.js 20+, pnpm, a Firebase project with Firestore and Google sign-in enabled.

```bash
pnpm install
cp .env.sample .env   # fill in Firebase web config
pnpm dev              # http://localhost:5173
```

### Firestore setup

1. Create the database (Native mode) in Firebase Console
2. Deploy rules and indexes:

```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules,firestore:indexes
```

Config files: `firebase.json`, `config/firebase/firestore.rules`, `config/firebase/firestore.indexes.json`.

### Local dev without Firebase auth

For UI testing and Playwright, add to `.env.development.local` (gitignored):

```bash
VITE_MOCK_USER=true
```

---

## Testing

```bash
pnpm test                  # Vitest: unit, hook, and page tests
pnpm test:watch            # watch mode
pnpm run test:playwright   # smoke test (dev server must be running with mock user)
```

CI runs lint, test, and build on every push and PR to `main`.

---

## About

Built by [Don Kasun Gallage](https://github.com/donkasun). Side project, but built with the same habits I'd bring to a client engagement: start from a real user, scope hard, ship something maintainable.

If you want to talk about the project or something similar for your business, open an issue or reach out on GitHub.

---

## Docs and contributing

- Feature status: [`docs/feature_requirements.md`](docs/feature_requirements.md)
- Delivery plan: [`docs/project_plan.md`](docs/project_plan.md)
- Contributing: [CONTRIBUTING](.github/CONTRIBUTING.md) · [Code of Conduct](.github/CODE_OF_CONDUCT.md)

## License

[MIT](LICENSE)
