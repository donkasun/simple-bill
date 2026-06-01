# simple-bill — Claude Code guidance

## Design system basics

### Colour token pairs — always use together

Every background token has a matching foreground token. Never put text on a background using a token from a different pair — it will fail in at least one of light/dark theme.

| Background token                           | Foreground token to use                        |
| ------------------------------------------ | ---------------------------------------------- |
| `--md-primary`                             | `--md-on-primary`                              |
| `--md-primary-container`                   | `--md-on-primary-container`                    |
| `--md-secondary`                           | `--md-on-secondary`                            |
| `--md-secondary-container`                 | `--md-on-secondary-container`                  |
| `--md-surface` / `--md-surface-container*` | `--md-on-surface` or `--md-on-surface-variant` |

### Hover state contrast — the key rule

**If a hover state changes the background colour, the text colour must change with it.**

The customer quick-action cards are the canonical example:

- **Default state:** background is `--md-primary-container` (dark green in both themes) → text uses `--md-on-primary-container` (light mint)
- **Hover state:** background becomes a **lighter green** → text must flip to dark

**Critical:** `--md-on-surface` is dark in light mode but **light** in dark mode, so it cannot be used as the hover text colour when you want dark text in both themes. Instead, define explicit per-theme tokens.

```css
/* In :root (light theme) */
--quick-action-customer-hover-bg: #d4f0e5; /* light green */
--quick-action-customer-hover-text: #0d2b1c; /* dark green text */
--quick-action-customer-hover-text-muted: #1e4d35;

/* In [data-theme="dark"] */
--quick-action-customer-hover-bg: #3d8a5e; /* medium green (lighter than default #1a4f3a) */
--quick-action-customer-hover-text: #0d2b1c; /* same dark text — bg is light enough */
--quick-action-customer-hover-text-muted: #1a3d28;
```

```css
.my-card--coloured {
  background: var(--md-primary-container); /* dark green both themes */
}
.my-card--coloured .my-text {
  color: var(--md-on-primary-container); /* light text on dark bg */
}
.my-card--coloured:hover {
  background: var(--my-card-hover-bg); /* lighter green (per-theme token) */
}
.my-card--coloured:hover .my-text {
  color: var(
    --my-card-hover-text
  ); /* dark text on lighter bg (per-theme token) */
}
```

### When to use per-theme tokens vs semantic tokens

- Use **semantic tokens** (`--md-on-surface`, `--md-on-primary-container`) when the background they sit on is also a semantic token that stays logically consistent between themes.
- Use **explicit per-theme tokens** when a hover or state change requires the text to behave the **same way** (e.g. always dark) regardless of theme, because semantic tokens may invert.

### Theme-aware design checklist

Before shipping any interactive element with a coloured background:

- [ ] Default state: text colour is the correct `on-*` pair for the background
- [ ] Hover/active state: if the background changes, recheck the text colour pair
- [ ] Verify in both light and dark themes — `--md-primary-container` is dark green in **both** themes in this project
- [ ] Never use `color: white` or `color: black` — use tokens
- [ ] If you want the text to always be dark (or always be light) regardless of theme, define explicit per-theme tokens rather than relying on semantic `on-*` tokens

### Status colour mapping

Used on document cards (left border, badge, amount text):

| Status           | Colour role | Token                              |
| ---------------- | ----------- | ---------------------------------- |
| Draft            | Amber       | `--brand-warning`                  |
| Sent / Finalized | Blue        | `--md-secondary`                   |
| Paid             | Green       | `--md-primary` / `--brand-success` |

---

## Git workflow

### Squash merges on PRs

When the user asks to squash-merge a PR (or after CI is green and merge is intended):

1. **Rewrite the squash commit message** — never accept GitHub's default. The default body concatenates every branch commit; agent commits often repeat the same `Co-authored-by` trailer once per commit.
2. **Merge with explicit subject and body:**

   ```bash
   gh pr merge <number> --squash \
     -t "feat(scope): concise outcome" \
     -b "$(cat <<'EOF'
   Short summary of what landed on main (not a commit-by-commit dump).

   Co-authored-by: Cursor <cursoragent@cursor.com>
   EOF
   )"
   ```

   Use `--body-file` for longer bodies. Append **each unique `Co-authored-by` once** at the end (dedupe by email/name across branch commits). Do not omit co-authors.

3. **Delete the feature branch** after a successful merge unless the user asks to keep it — either pass `--delete-branch` on `gh pr merge`, or run `git push origin --delete <branch>` (and delete the local branch if needed).
4. **Checkout `main` and pull** in the workspace after merge so the agent is not left on a stale head branch.

---

## Project overview

**simple-bill** is an invoicing and quotation app for Sri Lankan freelancers and small business owners billing corporate clients. Target users are time-poor non-technical operators who invoice a small pool of repeat clients.

Key design priorities:

1. Status clarity at a glance (colour-coded left borders on document cards)
2. Minimal actions per screen — one primary CTA per card, secondary actions in `⋯` overflow
3. Personalised quick actions based on recent customer usage (`customerUsage` utility)
