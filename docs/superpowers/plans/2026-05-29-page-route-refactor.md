# Page route refactor — architecture & rollout plan

> **For agentic workers:** Implement the **pilot route (Customers) first**. Do not refactor other routes until the pilot is reviewed and merged. Reuse the patterns defined here; do not invent per-route conventions.

**Goal:** Separate route **orchestration** (data, side effects, handlers) from **presentation** (JSX, layout) so dashboard routes stay testable and consistent as the app grows.

**Pilot route:** `/customers` (`Customers.tsx`) — smallest full CRUD list page; nearly identical to `/items`.

**Tech stack:** React 18, TypeScript, React Router v6, existing `useFirestore` / `useAuth` / shared components.

---

## Principles (apply to every route)

### 1. Three layers — not two arbitrary files

| Layer                | Location                                                        | Responsibility                                       |
| -------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| **Pure logic**       | `src/utils/`, `src/types/`                                      | Validation, formatting, payloads, no React           |
| **Route controller** | `src/hooks/pages/use<Route>Page.ts`                             | State, Firestore/auth hooks, handlers, derived data  |
| **View**             | `src/pages/<Route>.tsx` (+ optional `src/components/<domain>/`) | JSX only: wire hook → layout, pass props to children |

Avoid parallel `Customers.logic.ts` / `Customers.ui.tsx` — React idioms favor **custom hooks as controllers**.

### 2. Page file stays the route entry

- Keep lazy imports in `App.tsx` pointing at `src/pages/Customers.tsx` (or `src/pages/customers/index.ts` if we later colocate).
- The page default export is a **thin component** (~50–120 lines of JSX).

### 3. Hook naming and shape

- One hook per route: `useCustomersPage`, `useItemsPage`, `useDashboardPage`, etc.
- Return a **stable, documented view model** (object), not dozens of loose returns.
- Group related UI state (modals, confirm dialogs) inside the hook.

```ts
// Illustrative — final names/types defined in pilot PR
export type CustomersPageViewModel = {
  title: string;
  loading: boolean;
  error: string | null;
  customers: CustomerRow[];
  empty: boolean;
  modal: {
    open: boolean;
    title: string;
    initial?: CustomerFormData;
    submitting: boolean;
  };
  deleteConfirm: { open: boolean; deletingId: string | null };
  actions: {
    openAdd: () => void;
    openEdit: (c: Customer) => void;
    requestDelete: (id: string) => void;
    confirmDelete: () => Promise<void>;
    cancelDelete: () => void;
    submitCustomer: (data: CustomerFormData) => Promise<void>;
    closeModal: () => void;
  };
};
```

### 4. What stays shared (do not duplicate per route)

Already exists — **keep using**:

| Concern                       | Existing home                       |
| ----------------------------- | ----------------------------------- |
| Firestore CRUD                | `useFirestore`                      |
| Document form state           | `useDocumentForm`                   |
| Catalog modals on doc screens | `useDocumentCatalogModals`          |
| Auth                          | `useAuth` / `AuthProvider`          |
| Page chrome title             | `usePageTitle` + `PageHeader`       |
| Design-system controls        | `@components/core/*`, domain modals |

Extract **only when a second route needs the same behavior** (rule: duplicate once → extract):

| Candidate shared hook | When to extract                                               |
| --------------------- | ------------------------------------------------------------- |
| `useConfirmDelete`    | After Customers + Items both use delete-confirm pattern       |
| `useEntityModal`      | If add/edit modal state is identical across 2+ list pages     |
| `useDocumentPage`     | When refactoring `DocumentCreation` + `DocumentEdit` together |

Do **not** pre-build abstractions in the pilot; note them in this plan and extract in Task 2 (Items).

### 5. Presentational components

Extract a child component when **either**:

- The same UI block appears on 2+ routes, or
- A single inline block exceeds ~60 lines of JSX (e.g. customer list row → `CustomerListRow`).

Styling: prefer existing `index.css` classes over new inline styles when touching extracted components (incremental; not a big-bang CSS migration).

### 6. Testing strategy

| Layer | Test type                                                            |
| ----- | -------------------------------------------------------------------- |
| Hook  | `renderHook` + mocked `useFirestore` / `useAuth`                     |
| Page  | Existing page tests: assert UI from view model (mock hook if needed) |
| Utils | Unit tests (unchanged)                                               |

Pilot must include **`tests/hooks/useCustomersPage.test.ts`** (or extend `tests/pages/Customers.test.tsx` with hook coverage).

### 7. Routes out of scope for “full” refactor

| Route            | Approach                                                        |
| ---------------- | --------------------------------------------------------------- |
| `Login`, `Terms` | Leave combined unless we add a design-system login layout later |
| `Profile`        | Thin page; hook optional                                        |
| `Settings`       | Small; hook optional after Items                                |

---

## Target file layout (after full rollout)

```
src/
  hooks/
    pages/
      useCustomersPage.ts      # pilot
      useItemsPage.ts          # copy pattern
      useDocumentsPage.ts
      useDashboardPage.ts
      useDocumentPage.ts       # shared by new + edit
      useConfirmDelete.ts      # optional shared (post-pilot)
  pages/
    Customers.tsx              # thin view
    Items.tsx
    ...
  components/
    customers/
      CustomerModal.tsx        # existing
      CustomerListRow.tsx      # optional extract from pilot
```

Path alias: use `@hooks/pages/useCustomersPage` (add to `tsconfig` paths if missing).

---

## Rollout order (after pilot merge)

1. **Customers** (pilot) — establish hook + view model + tests
2. **Items** — mirror Customers; extract `useConfirmDelete` if duplicated
3. **Documents** — list + filters + card actions → `useDocumentsPage`
4. **Dashboard** — summaries + quick actions + recent docs → `useDashboardPage`
5. **DocumentCreation** + **DocumentEdit** — shared `useDocumentPage` + thin views (largest change; do last)
6. **Profile** / **Settings** — only if still painful

---

## Pilot: Customers — task breakdown

### File map (pilot only)

| Action | File                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------ |
| Create | `src/hooks/pages/useCustomersPage.ts`                                                                  |
| Create | `tests/hooks/useCustomersPage.test.ts`                                                                 |
| Create | `src/components/customers/CustomerListRow.tsx` (recommended — removes ~80 lines inline JSX)            |
| Modify | `src/pages/Customers.tsx` (thin view)                                                                  |
| Modify | `tests/pages/Customers.test.tsx` (adjust imports/mocks if needed)                                      |
| Modify | `tsconfig*.json` / `vite.config.ts` — `@hooks/pages/*` alias only if not already covered by `@hooks/*` |

### Task 1: `useCustomersPage` hook

- [ ] Move from `Customers.tsx` into hook:
  - `useFirestore` setup + `CustomerRow` select
  - Modal state (`open`, `editing`, `submitting`)
  - Delete confirm state (`confirmOpen`, `customerToDelete`, `deletingId`)
  - `pageError` handling
  - All handlers: add, edit, delete, submit, cancel
- [ ] Export `CustomersPageViewModel` type from hook file (or `src/hooks/pages/types.ts` if shared fields emerge).
- [ ] Page component calls `const vm = useCustomersPage()` and only renders.

### Task 2: `CustomerListRow` component

- [ ] Extract list row markup from page into `CustomerListRow.tsx`.
- [ ] Props: `customer`, `deleting`, `onEdit`, `onDelete`.
- [ ] Use design tokens already in inline styles (no redesign).

### Task 3: Tests

- [ ] Hook tests: load state, open modal, submit add/update, delete confirm flow (mock Firestore).
- [ ] Keep or update page smoke tests in `tests/pages/Customers.test.tsx`.

### Task 4: Verification

- [ ] `pnpm run lint`
- [ ] `pnpm test`
- [ ] `pnpm run build`
- [ ] Manual: add / edit / delete customer in mock mode

### Task 5: Review gate (before Items)

- [ ] Confirm view model shape works for Items without renaming concepts.
- [ ] Document any shared extraction (`useConfirmDelete`) in a short comment in plan or PR description.
- [ ] Merge pilot PR; then start Items using same checklist.

---

## Success criteria (pilot)

- `Customers.tsx` is mostly JSX composition (target: **&lt; 120 lines**).
- Business logic is unit-testable without rendering the full page tree.
- No behavior change for end users (refactor only).
- Plan patterns are copy-pasteable for Items with find-replace on entity names.

---

## Non-goals (this initiative)

- Redesigning Login or moving auth out of `AuthProvider`
- Splitting `AppShell` / global layout
- Moving all inline styles to CSS modules
- Monorepo or feature-folder restructure beyond `hooks/pages/`
