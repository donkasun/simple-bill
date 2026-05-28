# UI Review: Dashboard & Documents Pages

**Date:** 2026-05-28
**Branch:** feat/dashboard-documents-redesign
**Scope:** Dashboard (home) and Documents list pages

---

## Target demographic

Solo operators and small-team businesses in Sri Lanka billing corporate clients. They are time-poor, not power users, and their core anxiety is **"what do I need to do today and am I getting paid?"** — not exploring UI. They invoice the same small pool of clients repeatedly and need status clarity at a glance.

---

## Dashboard

### 1. Missing financial summary strip — High priority

The number-one reason a small business owner opens an invoicing app is to know how much they are owed. The current dashboard provides no answer to this. A compact summary strip placed above Quick Actions would transform the page from a document list with a header into an actual business dashboard.

**Proposed content:**

```
Outstanding  LKR 1,177,000   |   Paid this month  LKR 340,000   |   Drafts  2
```

Outstanding = sum of all finalized/sent documents not yet marked paid.
Paid this month = sum of documents marked paid within the current calendar month.
Drafts = count of draft documents.

---

### 2. Quick Actions are too generic — Medium priority

"Choose any customer" is dead weight for someone who invoices the same 3–5 clients repeatedly. The codebase already tracks recent customer usage (`customerUsage` utility). Surface the two most recently billed customers as the primary quick-action cards. The generic "New invoice / New quotation" tiles should become secondary — smaller, below the customer shortcuts.

**Current:** Two equal cards — New invoice (choose any customer) / New quotation (choose any customer)

**Proposed:** Two recent-customer cards as primary CTAs → generic actions as a secondary row below

---

### 3. Document cards are too tall and action-heavy — High priority

Each card currently wraps the document number across two lines, presents the amount and status badge in an awkward stack, and offers three equal-weight action buttons. This creates decision fatigue on every card.

**Problems:**

- Three buttons (Continue editing / Duplicate / Delete, or Mark as paid / Duplicate / Download PDF) carry equal visual weight — the user must read all three before acting
- Doc numbers like `QUO-2026-006` wrap unnecessarily
- Card height means only 3–4 documents are visible before scrolling

**Proposed card layout (single row):**

```
[avatar]  Customer name · Doc# · Date          Amount  [STATUS]   [Primary CTA]  [⋯]
```

- One primary action per card — the most likely next step given the status:
  - Draft → "Continue editing"
  - Sent → "Mark as paid"
  - Paid → "Download PDF"
- All secondary actions (Duplicate, Download, Delete, Mark as unpaid) move into a `⋯` overflow menu
- Target card height: 60–72px

---

### 4. Status badges have no visual hierarchy — Medium priority

DRAFT / SENT / PAID appear as small dark pills that require reading rather than scanning. For a user with 10–20 documents, the list should communicate status before they read a word.

**Proposed:** Add a coloured left border to each card:

- Amber — Draft
- Blue — Sent / Finalized
- Green — Paid

This makes the status of the entire list legible in under a second.

---

## Documents page

### 5. Two stacked filter rows is too much — High priority

The page currently stacks two SegmentedToggle rows: one for document type (All / Invoices / Quotations) and one for status (All / Draft / Sent / Paid). This doubles the cognitive load and consumes vertical space before a single document is visible.

Observation from current data: all visible documents are quotations, suggesting the type filter is rarely needed day-to-day. Status is the more actionable dimension.

**Option A — Merge into one row (recommended):**
Single toggle: All · Draft · Sent · Paid
Type filtering becomes a secondary concern (add a small type indicator per card or an advanced filter).

**Option B — Contextual second row:**
Show the status row only when a specific type is selected (not "All"). When viewing all types, status is the only filter shown.

---

### 6. Primary CTA excludes quotations — Medium priority

The "+ New invoice" button is the only document creation entry point on this page. However, current data shows quotations are the dominant document type in use. Users who primarily create quotations must navigate elsewhere or know to ignore the label.

**Option A — Split button:**
`+ New invoice ▾` with a dropdown containing "New quotation"

**Option B — Relabelled CTA:**
"+ New document" opens a type picker (invoice / quotation) before proceeding to creation

Either option removes the false implication that invoices are the primary workflow.

---

### 7. Page subtitle adds no value — Low priority

"Your invoices and quotations." is redundant given the page title, the filter toggles, and the document cards themselves.

**Replace with a live count:**

```
6 documents · 2 drafts · 2 sent
```

This gives the user instant orientation and makes the subtitle earn its space.

---

### 8. Card density (same as Dashboard) — Low priority

See item 3 above. Tighter card rows (60–72px) on the Documents page would surface 8–10 documents before scrolling on a typical laptop, versus the current 4–5.

---

## Priority summary

| #   | Change                                                    | Page      | Priority  |
| --- | --------------------------------------------------------- | --------- | --------- |
| 1   | Add financial summary strip (outstanding / paid / drafts) | Dashboard | 🔴 High   |
| 3   | One primary action + overflow menu on cards               | Both      | 🔴 High   |
| 5   | Collapse double filter row into single status toggle      | Documents | 🔴 High   |
| 4   | Colour-coded left border per status                       | Both      | 🟡 Medium |
| 2   | Surface recent customers in Quick Actions                 | Dashboard | 🟡 Medium |
| 6   | Split button or "New document" CTA                        | Documents | 🟡 Medium |
| 7   | Replace subtitle with live document count                 | Documents | 🟢 Low    |
| 8   | Tighten card row height to 60–72px                        | Both      | 🟢 Low    |
