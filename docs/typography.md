# SimpleBill — Typography

Reference for font families and **font-size** tokens used in the app. Assumes the browser default root size of **16px** (`1rem` ≈ 16px unless the user changes system settings).

**Last reviewed:** May 2026 — tokens live in `src/index.css` (`:root`).

---

## Font families

| Token                     | Family                     | Typical use                                     |
| ------------------------- | -------------------------- | ----------------------------------------------- |
| `--font-body`             | Atkinson Hyperlegible Next | Body copy, labels, tables, buttons              |
| `--font-heading`          | Epilogue                   | Page titles, brand, modal headings, card titles |
| Material Symbols Outlined | Icon font                  | Sidebar, actions, dashboard icons               |

---

## Size tokens (`:root`)

| Token                  | Value                         | ~px @ 16px | Use                                                      |
| ---------------------- | ----------------------------- | ---------- | -------------------------------------------------------- |
| `--text-2xs`           | `0.75rem`                     | 12px       | Hints, `.muted`, microcopy                               |
| `--text-xs`            | `0.8125rem`                   | 13px       | Helper text, `.link-btn`, status badges                  |
| `--text-sm`            | `0.875rem`                    | 14px       | Table headers + cells, section labels, sidebar user name |
| `--text-md`            | `0.9rem`                      | ~14.4px    | Page subtitles, empty states, user menu                  |
| `--text-label`         | `0.9375rem`                   | 15px       | Form field labels (`FieldWrapper`)                       |
| `--text-compact`       | `0.95rem`                     | ~15.2px    | Sidebar CTA, collapse label                              |
| `--text-base`          | `1rem`                        | 16px       | **Body default**, buttons, inputs, nav                   |
| `--text-lg`            | `1.125rem`                    | 18px       | Card subtitles, document totals (`.text-total`)          |
| `--text-xl`            | `1.25rem`                     | 20px       | Modal titles (`.modal-title`)                            |
| `--text-2xl`           | `1.5rem`                      | 24px       | Dashboard card titles, empty-state headings              |
| `--text-3xl`           | `1.75rem`                     | 28px       | Reserved / marketing                                     |
| `--text-4xl`           | `2rem`                        | 32px       | Login title                                              |
| `--text-brand-sidebar` | `1.1rem`                      | ~17.6px    | Sidebar wordmark                                         |
| `--text-page-title`    | `clamp(1.5rem, 4vw, 1.75rem)` | 24–28px    | `.page-title`                                            |
| `--text-page-hero`     | `clamp(1.75rem, 5vw, 2.5rem)` | 28–40px    | Home hero (`.page-header--large`)                        |

### Icon tokens

| Token       | Value  | Use                                                  |
| ----------- | ------ | ---------------------------------------------------- |
| `--icon-sm` | `20px` | Inline CTA icons                                     |
| `--icon-md` | `22px` | Default Material icon (`.material-symbols-outlined`) |
| `--icon-lg` | `40px` | Bento decorative icons                               |
| `--icon-xl` | `64px` | Empty-state illustration                             |

Utility classes: `.icon-sm`, `.icon-md`, `.icon-lg`, `.icon-xl` (with `!important` where needed).

---

## Utility classes

| Class                     | Maps to                                     |
| ------------------------- | ------------------------------------------- |
| `.text-2xs` … `.text-4xl` | Matching `--text-*` token                   |
| `.muted`                  | `--text-2xs` + `--md-on-surface-variant`    |
| `.text-total`             | `--text-lg`, semibold (document totals row) |
| `.modal-title`            | `--text-xl`, Epilogue, bold                 |
| `.modal-error`            | `--text-xs`, danger color                   |

Prefer these over inline `fontSize` in new UI.

---

## Semantic mapping (where sizes apply)

| UI element                        | Token / class                              |
| --------------------------------- | ------------------------------------------ |
| `body`                            | `--text-base`                              |
| `.page-title`                     | `--text-page-title`                        |
| `.page-header--large .page-title` | `--text-page-hero`                         |
| `.page-subtitle`                  | `--text-md`                                |
| `.page-section-label`             | `--text-sm`                                |
| `.page-card-title`                | `--text-lg`                                |
| `.table thead th`                 | `--text-sm`                                |
| `.table tbody td`                 | `--text-sm`                                |
| `.status-badge`                   | `--text-xs`                                |
| `.link-btn`                       | `--text-xs`                                |
| Dashboard doc cards               | `.doc-card__*` classes in `index.css`      |
| Modals                            | `.modal-title`, `.modal-error`             |
| Field labels / inputs / errors    | `--text-label`, `--text-base`, `--text-sm` |

---

## Dashboard (Home)

Typography for document cards, empty state, and bento grid is defined in `src/index.css` under **Home / dashboard** (e.g. `.doc-card__title` → `--text-2xl`). `Dashboard.tsx` should not set inline font sizes.

---

## Remaining inline sizes

Some marketing/auth pages still use one-off inline sizes (`Login.tsx`, `Terms.tsx`, parts of `Customers.tsx`). Migrate to tokens when touching those files.

Legacy `Dashboard.styles.ts` is unused by the current Home page; prefer `index.css` dashboard classes.

---

## Dark mode

Typography tokens are the same in light and dark; only color tokens change via `[data-theme="dark"]`.
