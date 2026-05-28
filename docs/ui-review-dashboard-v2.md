# UI Review: Dashboard — Round 2

**Date:** 2026-05-28
**Branch:** feat/dashboard-documents-redesign
**Context:** Follow-up review after implementing the summary strip, compact cards, left-border status colours, and overflow menus from Round 1.

---

## What was implemented ✅

- Financial summary strip (Outstanding / Paid This Month / Drafts)
- Compact single-row document cards
- Left-border colour per status
- One primary action + `⋯` overflow menu per card

---

## Remaining issues

### 1. Left border does not distinguish SENT from PAID — High priority

Both Sent and Paid cards have a green left border. This defeats the purpose of colour-coding — a user scanning the list cannot tell at a glance which documents still need payment and which are resolved.

**Proposed mapping:**

- Amber → Draft (awaiting action by the user)
- Blue → Sent / Finalized (awaiting payment from client)
- Green → Paid (complete, no action needed)

---

### 2. Summary strip: all three tiles carry equal visual weight — Medium priority

Outstanding is the only number that demands action. Paid This Month and Drafts are context. Currently all three tiles look identical in size and weight, which gives no visual hierarchy.

**Changes:**

- Make the Outstanding amount larger or heavier than the other two
- Relabel "Outstanding" → "Awaiting payment" (clearer for a non-finance audience)
- Make the Drafts tile a tappable link that navigates to Documents filtered by Draft status — a count with no destination is wasted space

---

### 3. Quick Actions still not personalized — High priority

Both cards still read "Choose any customer." The `customerUsage` utility and recent-customer logic already exist in the codebase. With 10 drafts visible in the summary strip, this user clearly has active clients to surface.

Surface the two most recently billed customers as the primary quick-action cards. Keep the generic "New invoice / New quotation" tiles as a fallback row shown only when there is no usage history.

---

### 4. ISO date format is too technical — Medium priority

Dates are displayed as `2026-01-05`. This is developer-friendly but not natural for a small business owner.

**Change to:** `Jan 5, 2026` or `5 Jan 2026`

The latter matches how dates are commonly written in Sri Lanka and reads without mental parsing.

---

### 5. `.00` cents add noise on large LKR amounts — Medium priority

The summary strip shows `LKR 1,539,000.00`. At six-figure amounts, cents are meaningless noise and make the number harder to read at a glance.

**Strip `.00` from the summary strip.** Document cards can keep full decimal formatting for precision. Optionally consider compact notation (`LKR 1.54M`) for the summary strip only, though this may feel unfamiliar to the target demographic.

---

### 6. "Recent Documents" label is misleading — Low priority

The MAS Holdings document is dated January 2026 — five months ago. If the section simply shows the last N documents by creation date regardless of age, the "Recent" label is inaccurate and sets a false expectation.

**Options:**

- Rename to **"Latest Documents"** (neutral, always accurate)
- Or cap to the last 30–60 days and append a time scope: "Last 30 days · 5 documents"

---

### 7. Invoice and quotation share the same document icon — Low priority

Every card shows the same orange document icon. Invoices and quotations are distinct workflows for this user. A subtle visual difference — either a different icon variant or a different icon tint — would let them scan by type without reading the label text.

---

### 8. "View all" is too easy to miss — Low priority

The "View all" ghost button sits in the top-right corner of the Recent Documents section. With 10 drafts outstanding, this link is a key navigation shortcut that deserves more presence.

**Options:**

- Move to the bottom of the section, full-width or centred: "View all documents →"
- Or style it as an underlined text link aligned with the section label rather than a ghost button in the corner

---

## Priority summary

| #   | Issue                                                  | Priority  |
| --- | ------------------------------------------------------ | --------- |
| 1   | SENT and PAID share the same green left border         | 🔴 High   |
| 3   | Quick Actions still show generic "Choose any customer" | 🔴 High   |
| 2   | Summary strip tiles have equal visual weight           | 🟡 Medium |
| 4   | ISO date format instead of readable date               | 🟡 Medium |
| 5   | `.00` cents on large LKR amounts in summary strip      | 🟡 Medium |
| 6   | "Recent Documents" label misleading for old documents  | 🟢 Low    |
| 7   | Same icon for invoice and quotation cards              | 🟢 Low    |
| 8   | "View all" button too easy to miss                     | 🟢 Low    |
