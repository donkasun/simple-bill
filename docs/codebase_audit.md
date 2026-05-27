# SimpleBill — Codebase Audit

_Audit date: 2026-05-27_

A technical review of the SimpleBill codebase: why it exists, what is architecturally
strong, how it demonstrates senior software engineering (SSE) skills, how AI was used in
development, and where the gaps are.

---

## 1. Why this project exists

SimpleBill is a focused invoicing app with a clear, human origin story documented in the
README:

> _"I built SimpleBill for my non-tech-savvy dad, who only needs to make an invoice
> occasionally... The focus is a calm, uncluttered flow that makes the task quick and
> stress-free."_

This is the single most valuable thing about the project from a portfolio standpoint.
It is not a generic "todo/CRUD clone" — it is a **product built around a real user with
real constraints**. Every notable design decision traces back to that user:

- **Google Sign-In only** — no password to remember for a non-technical user.
- **Optional email + `showEmail` toggle** — the dad's customers may not have email.
- **Multi-line addresses, currency switching** — matches real-world invoice needs.
- **Draft vs. finalize workflow** — lets him save half-done work without pressure.
- **PDF export** — the actual deliverable he hands to a customer.

**Takeaway:** the project tells a story of empathy-driven scoping. That narrative is
worth leading with in any interview or portfolio write-up.

---

## 2. Tech stack

| Layer   | Choice                                               |
| ------- | ---------------------------------------------------- |
| UI      | React 19 + TypeScript (strict), Vite 7               |
| Routing | React Router 7 (lazy routes)                         |
| Backend | Firebase Auth (Google) + Firestore                   |
| PDF     | pdf-lib (dynamically imported)                       |
| Testing | Vitest + Testing Library + jsdom                     |
| Tooling | ESLint 9 (flat config), Prettier, Husky, lint-staged |
| Hosting | Vercel (also has Firebase config)                    |

A modern, current stack — React 19, Vite 7, ESLint flat config — not a stale boilerplate.
It is "serverless by composition": no custom backend to maintain, security pushed into
Firestore rules, all logic in the client.

---

## 3. What is architecturally good

### 3.1 Clean separation of concerns

The `src/` tree reads like a textbook layered frontend:

```
auth/        — authentication provider + hook
components/  — core (reusable UI), feature-scoped (customers/items/documents), layout
contexts/    — cross-cutting state (theme)
hooks/       — reusable logic (useFirestore, useDocumentForm, useTheme, useUserProfile)
pages/       — route-level screens
types/       — shared domain models
utils/       — pure functions (currency, date, math, validation, pdf, docNumber)
```

The `utils/` folder is almost entirely **pure, framework-agnostic functions**
(`documentMath`, `documentValidation`, `currency`, `docNumber`). This is exactly why the
test suite can be small but meaningful — the hard logic is isolated from React.

### 3.2 The generic `useFirestore` hook (`src/hooks/useFirestore.ts`)

This is the standout piece of engineering. A single generic hook that:

- Is fully typed with two generics — `<T extends BaseEntity, U = T>` — supporting a
  `select` projection so callers can map raw docs to view models.
- Supports both **real-time subscriptions** (`onSnapshot`) and **one-shot reads**
  (`getDocs`) behind one `subscribe` flag.
- Composes queries declaratively from options (`userId`, `whereEqual[]`, `orderByField`).
- Guards against unscoped reads — bails out early if there is no `userId` or filter,
  preventing accidental full-collection queries.
- Uses a `selectRef` (a `useRef` mirror of the `select` callback) so the projection can
  change without tearing down the subscription. This is a **subtle, senior-level move**
  most developers miss; it avoids re-subscribing on every render.
- Centralizes metadata stamping (`createdAt` / `updatedAt` via `serverTimestamp()`).

One generic hook removes per-collection CRUD boilerplate across customers, items, and
documents. This is good DRY without over-abstraction.

### 3.3 Document form as a reducer (`src/hooks/useDocumentForm.ts`)

Complex form state (header fields + dynamic line items + computed amounts) is modeled as
a **discriminated-union reducer**. This is the right tool for the job:

- Every action is typed (`SET_FIELD`, `ADD_LINE_ITEM`, `SET_ITEM_SELECTION`, ...).
- A `canEdit` gate wraps `dispatch` so finalized/read-only documents reject mutations at
  a single chokepoint — a clean way to enforce an invariant.
- Derived totals are memoized and pluggable via an injectable `totalsCalculator`.
- Validation is split into `validateDraft` vs. `validateFinalize` — encoding the
  real business rule that drafts are lenient and finalized docs are strict.

### 3.4 Correct concurrency for document numbering (`src/utils/docNumber.ts`)

Auto-numbering (`INV-2026-001`) uses a **Firestore transaction** on a per-user,
per-type, per-year counter document. This shows awareness that naive
"count existing docs + 1" approaches race under concurrency. Using `runTransaction` with
a dedicated `docCounters` collection is the correct, production-grade solution.

### 3.5 Security-first Firestore rules (`config/firebase/firestore.rules`)

- Per-user ownership enforced on every collection (`resource.data.userId == request.auth.uid`).
- Update/delete rules prevent **ownership reassignment** by requiring the `userId` to be
  unchanged — a thoughtful detail that blocks a privilege-escalation vector.
- A final `match /{document=**} { allow read, write: if false; }` deny-all catch-all.
- A documented exception (counter reads allowed for not-yet-existent docs) with a comment
  explaining _why_ — exactly the kind of "comment the non-obvious" discipline that
  belongs in security code.

### 3.6 Performance-conscious choices

- **Route-level code splitting** — every page is `React.lazy` + `Suspense` in `App.tsx`.
- **pdf-lib dynamic import** — the heavy PDF dependency only loads when a user exports.
- **Path aliases** (`@components`, `@hooks`, `@models`, ...) keep imports clean and refactor-safe.

### 3.7 Project hygiene

- Strict TypeScript split into `tsconfig.app.json` / `tsconfig.node.json`.
- Pre-commit hook via Husky + lint-staged (ESLint --fix + Prettier on staged files).
- Full GitHub community scaffolding: issue templates, PR template, CONTRIBUTING,
  CODE_OF_CONDUCT, MIT license.
- Meaningful, conventional commit history (`feat:`, `fix:`, `docs:`, `chore:`) with PRs
  merged via numbered pull requests (#1–#31) — i.e., the project was developed like a
  real team repo, not a single dump commit.

---

## 4. How this reflects Senior Software Engineer (SSE) skills

| SSE competency            | Evidence in this codebase                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| **Product thinking**      | Scoped to a real user; features map to that user's actual workflow, not feature-checklist     |
| **Abstraction judgment**  | Generic `useFirestore` and reducer-based form — DRY where it pays, concrete elsewhere         |
| **Type-system mastery**   | Generics with projections, discriminated unions for actions, strict mode, no `any` sprawl     |
| **Concurrency awareness** | Transactional counters instead of naive count+1                                               |
| **Security mindset**      | Owner-scoped rules, ownership-reassignment prevention, deny-all default                       |
| **Performance**           | Lazy routes, dynamic heavy imports, query guards against full scans                           |
| **Testing**               | Pure logic isolated and unit-tested (math, validation, docNumber); component + hook tests     |
| **Engineering process**   | PR-per-feature, conventional commits, pre-commit gates, planning docs, CI-ready structure     |
| **Documentation**         | README with rationale, a PRD (`feature_requirements.md`), a delivery plan (`project_plan.md`) |

The combination of **product empathy + clean architecture + production concerns
(security, concurrency, performance)** is precisely what distinguishes senior from
mid-level work. This repo demonstrates all three.

---

## 5. Use of AI in development

There is concrete evidence this project was built with AI-assisted workflows — and,
importantly, _governed_ rather than just generated:

- **`.cursor/` directory** — Cursor IDE config with an MCP server (`mcp.json`) and a
  `continual-learning` hook state file, indicating an agentic / MCP-driven development setup.
- **Planning-first docs** — `docs/feature_requirements.md` (a structured PRD with
  status/implementation/outcome per feature) and `docs/project_plan.md` (milestones with
  acceptance criteria and file touchpoints). These read like AI-collaboration artifacts:
  the developer drove the spec, the agent executed against milestones.
- **CLAUDE/agent-friendly structure** — consistent naming, path aliases, isolated pure
  functions, and small files make the codebase easy for an AI agent to navigate and edit
  safely. That is itself a skill: structuring a repo so AI can be productive in it.

**The signal to highlight:** AI was used as a force-multiplier on top of a clear plan and
strong conventions — not as a substitute for design decisions. The architecture is
coherent and opinionated in a way pure prompt-and-paste rarely produces.

---

## 6. Gaps & opportunities (honest critique)

Calling these out makes the audit credible — and gives a roadmap.

1. **No CI pipeline.** There is a `.github/` with templates but **no `workflows/`
   directory.** Tests, lint, and build run only locally via Husky. Adding a GitHub
   Actions workflow (lint + typecheck + test + build on PR) is the single highest-value
   improvement and would complete the "real team repo" story.
2. **Data encryption is planned but not done** (Milestone 9 in the plan). Invoice data
   sits in Firestore in plaintext. For a billing app this is worth at least a documented
   decision.
3. **Test coverage is selective.** Pure utils and a few components are covered, but
   `useFirestore`, auth flows, and PDF generation are not. No coverage threshold is
   enforced.
4. **`useFirestore` `whereEqual` in a dependency array** — passing a new array/object
   literal as `whereEqual` will re-trigger the subscription effect on every render unless
   callers memoize it. Worth a `useMemo` note or internal stabilization.
5. **`dist/` appears committed** — build output should generally be git-ignored.
6. **Package name is `simple-bill-temp`** — a leftover that should be renamed to `simple-bill`.
7. **README drift** — it still describes Rough.js as the design language, but commit
   `#28` removed RoughJS for a modern clean UI. The README's Design Language section is
   now stale.
8. **No error boundary** — a render error in a lazy route would blank the app; a top-level
   React error boundary would harden the UX.

---

## 7. One-paragraph summary (for a portfolio / interview)

> SimpleBill is a React 19 + TypeScript + Firebase invoicing app I built for a specific
> real user (my non-technical father), which forced disciplined, empathy-driven scoping.
> Architecturally it leans on a fully-generic, strongly-typed Firestore CRUD hook, a
> reducer-driven document form with draft/finalize validation tiers, transactional
> per-user document numbering to stay correct under concurrency, and owner-scoped
> Firestore security rules with a deny-all default. Heavy work (PDF export) and every
> route are code-split for performance. It was developed PR-by-PR with conventional
> commits, pre-commit gates, a written PRD and milestone plan, and an AI-assisted
> (Cursor/MCP) workflow — using AI as an executor against a plan I owned, not a
> replacement for design judgment.

---

_Generated as a static audit of the repository at the time noted above. Re-verify the
"gaps" section against the live codebase before quoting, as some may be addressed later._
