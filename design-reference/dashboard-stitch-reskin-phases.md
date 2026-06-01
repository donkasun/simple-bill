# Dashboard Stitch re-skin — implementation phases

Single-branch rollout of the Stitch dashboard design (`design-reference/`). Each phase is a logical checkpoint; land sequentially in one PR or branch, not as separate PRs.

**Reference:** `design-reference/INSTRUCTIONS-FOR-LLM.md`, `design-reference/stitch-dashboard.layout.md`, `design-reference/stitch-dashboard.screenshot.png`

**Rules:** Use `--md-*` tokens (not Tailwind from the HTML export). Status colours follow app mapping: Draft = amber, Sent/Finalized = blue, Paid = green. Wire real data from `useDashboardPage`. Verify light + dark themes after UI phases.

---

## Phase 0 — Baseline

| Task | Description                                                                                                                         | Status |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 0.1  | Extend characterization tests in `tests/hooks/useDashboardPage.test.tsx` and `tests/pages/Dashboard.test.tsx` before visual changes | Done   |
| 0.2  | Add shared dashboard tokens & motion utilities in `src/index.css` (shadows, keyframes, `prefers-reduced-motion`)                    | Done   |

---

## Phase 1 — Data layer (`useDashboardPage`)

| Task | Description                                                                                             | Status |
| ---- | ------------------------------------------------------------------------------------------------------- | ------ |
| 1.1  | Expose `statusCounts`: `{ paidCount, sentCount, draftCount }` (Sent = `finalized`)                      | Done   |
| 1.2  | Expose `spotlightCustomer`: featured customer with highest outstanding balance, fallback to most recent | Done   |
| 1.3  | Expose `taxSeasonTip`: copy derived from documents saved this month + user first name                   | Done   |

Keep existing `financialSummary` until Phase 4 migrates the summary strip.

---

## Phase 2 — Page shell

| Task | Description                                                                                                                        | Status |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 2.1  | Widen dashboard canvas to ~1200px max width (dashboard route or global `.app-page`)                                                | Done   |
| 2.2  | AppShell sidebar aligned to Stitch: nav labels/icons, logo, footer sign-out; removed sidebar CTA, tagline, collapse, and user menu | Done   |

---

## Phase 3 — Header

| Task | Description                                                                                           | Status           |
| ---- | ----------------------------------------------------------------------------------------------------- | ---------------- |
| 3.1  | Replace header copy: "Welcome back, {firstName}" + subtitle; primary **New Invoice** CTA on the right | Done (dashboard) |
| 3.2  | Header styles via design tokens; responsive stack on narrow widths                                    | Partial          |

---

## Phase 4 — Bento summary strip

| Task | Description                                                                         | Status  |
| ---- | ----------------------------------------------------------------------------------- | ------- |
| 4.1  | Refactor `DashboardSummaryStrip` to Paid / Sent / Draft count cards with icon chips | Pending |
| 4.2  | Bento card styles, hover lift, token pairs per `CLAUDE.md`                          | Pending |
| 4.3  | Optional: card clicks navigate to filtered document lists                           | Pending |

---

## Phase 5 — Two-column layout

| Task | Description                                                                    | Status  |
| ---- | ------------------------------------------------------------------------------ | ------- |
| 5.1  | 12-col grid in `Dashboard.tsx`: main (~8) + sticky aside (~4); stack on mobile | Pending |
| 5.2  | Remove/replace `DashboardQuickActions` once spotlight is wired                 | Pending |

---

## Phase 6 — Recent documents (compact rows)

| Task | Description                                                                         | Status  |
| ---- | ----------------------------------------------------------------------------------- | ------- |
| 6.1  | New `DashboardDocumentRow`: status pill, invoice no., customer, amount, date        | Pending |
| 6.2  | Use rows on dashboard instead of full `DocumentCard`; keep "View all →"             | Pending |
| 6.3  | Row click → edit document; defer `⋯` actions to documents page unless spec requires | Pending |

---

## Phase 7 — Customer spotlight

| Task | Description                                                                                       | Status  |
| ---- | ------------------------------------------------------------------------------------------------- | ------- |
| 7.1  | New `DashboardCustomerSpotlight`: avatar, name, email, outstanding balance callout, Send Reminder | Pending |
| 7.2  | Wire spotlight data; decide Send Reminder behaviour (`mailto:` vs navigate)                       | Pending |
| 7.3  | Tax Season Tip card below spotlight                                                               | Pending |

---

## Phase 8 — Motion & polish

| Task | Description                                                                             | Status  |
| ---- | --------------------------------------------------------------------------------------- | ------- |
| 8.1  | Staggered fade-up (bento + rows), slide-in (spotlight); honour `prefers-reduced-motion` | Pending |
| 8.2  | Pulse on header New Invoice CTA; shimmer on outstanding balance                         | Pending |
| 8.3  | Optional ambient background blobs                                                       | Pending |

---

## Phase 9 — Verification

| Task | Description                                                                    | Status  |
| ---- | ------------------------------------------------------------------------------ | ------- |
| 9.1  | Update dashboard tests for new UI                                              | Pending |
| 9.2  | `pnpm lint`, `pnpm test`, `pnpm run test:playwright`; light + dark theme check | Pending |

---

## Open decisions

1. **Send Reminder** — `mailto:`, navigate to invoice, or disabled stub?
2. **Quotation quick action** — remove from dashboard or keep in overflow?
3. **Document row actions** — read-only rows vs `⋯` menu on dashboard?
4. **AppShell changes** — same branch as dashboard or defer?
