# SimpleBill — Landing Page Spec & Stitch Brief

The finalized plan for the public landing page at `/`. This is both the design spec (for
implementation) and the brief used to generate UI comps in Google Stitch.

**Primary goal:** the page is a **design-craft showcase** first. Visual ambition, motion,
and polish are the priority; marketing SimpleBill is the close second.

**Tone:** warm and personal, first person. No em dashes anywhere in the copy.

---

## 1. Reference analysis (concrete visual DNA)

Stitch / Gemini does **not** open URLs, so references must be translated into concrete
directives. These are the three sites the look is drawn from, captured and analyzed:

### pixeltrue.com — STRONG preference (overall look & feel)

- **Immersive, illustration-first.** Full-bleed illustrated scenes (a whole world: sky,
  mountains, lake, characters), not photos.
- **Deep saturated gradient backgrounds** (purple to navy), white text on top.
- **Big bold rounded geometric sans** headlines, with one **accent-colour emphasis word**
  (e.g. a cyan line in an otherwise white heading).
- **Coral / red pill buttons**; small circular icon badges.
- Friendly characters on **soft blob backdrops**; playful floaters (clouds, sparkles).
- Centered section titles, alternating text-left / illustration-right rows.
- A **persistent floating CTA** pill bottom-right.

### decriminalizepoverty.org — parallax & motion

- **Cinematic, textured.** Full-bleed hand-illustrated, **grainy** scene.
- A **giant condensed display headline layered into the scene** (text sits between
  foreground and background layers = the parallax depth effect).
- Muted, earthy palette (teal / mint / lavender / cream).
- **Scroll-driven journey** with **stage labels** (PRESENT · HISTORY · FUTURE) and a
  literal "scroll slowly for the best experience" hint.

### prevint.pt/en — horizontal scroll & airiness

- **Airy and minimal.** Vast whitespace with **tiny flat-vector people scattered as a
  field**.
- Elegant **wide letter-spaced wordmark**.
- Restrained palette (white + small accent figures); a single rounded pill CTA.
- Side rotated labels; the experience advances **horizontally**.

---

## 2. Three variations (each leads with one reference, all green-branded)

Rather than blend the references into mush, each variation commits to one, in SimpleBill's
green palette.

| #   | Name          | Lead ref      | Direction                                                                                                                                                                                                                                   |
| --- | ------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1  | **Immersive** | PixelTrue     | Full-bleed illustrated green-world hero, bold rounded headline with a mint-accent emphasis word, blob-backed characters, alternating rows, bento features, playful floaters, persistent CTA. Saturated forest-green backgrounds. **Light.** |
| V2  | **Cinematic** | Decriminalize | Grainy textured full-bleed hero with a huge layered display headline for parallax depth, muted sage/cream/green palette, scroll-narrative "How it works" with stage labels. Most dramatic. **Dark / muted.**                                |
| V3  | **Airy**      | Prevint       | Lots of whitespace, scattered small flat-vector vignettes, elegant letter-spaced "SimpleBill" wordmark, horizontal-scroll journey, one quiet green pill CTA. Calmest. **Light.**                                                            |

All three keep: marquee strip, bento features grid, the light dad-story nod, warm copy.

---

## 3. Brand & theme tokens

Exact values from `src/index.css`. Generated comps must match.

| Role                            | Light     | Dark      | Notes                                  |
| ------------------------------- | --------- | --------- | -------------------------------------- |
| Primary (brand green)           | `#0f5238` | `#5acea4` | Buttons, links, accents                |
| Primary hover                   | `#0a3d29` | `#4ab88f` |                                        |
| On-primary (text on primary)    | `#ffffff` | `#003828` |                                        |
| Primary container               | `#2d6a4f` | `#1a4f3a` | Dark green in **both** themes          |
| On-primary-container            | `#a8e7c5` | `#78deb6` | Light mint text on the dark-green card |
| Surface (page background)       | `#f8f9fa` | `#191c1d` |                                        |
| Surface container (cards)       | `#edeeef` | `#232627` |                                        |
| Surface container lowest        | `#ffffff` | `#141718` |                                        |
| On-surface (primary text)       | `#191c1d` | `#e1e3e4` |                                        |
| On-surface variant (muted text) | `#404943` | `#bfc9c1` |                                        |
| Secondary (blue accent)         | `#2b6485` | `#7bbcdc` | Use sparingly                          |
| Success green                   | `#27ae60` | `#27ae60` | "Paid" status                          |
| Warning amber                   | `#f39c12` | `#f39c12` | "Draft" status                         |

**Status colour language** (reflect in product-peek graphics): Draft = amber,
Sent/Finalized = blue, Paid = green.

**Style:** rounded corners (~12-16px cards, 8-10px buttons), soft subtle shadows, no
heavy borders, clean sans-serif (bold rounded for display). Never pure black/white text
on coloured backgrounds; always pair a background with its matching foreground role.

---

## 4. Graphical / illustration system

- **Source:** PixelTrue / Craftwork illustration packs, recoloured to the green palette
  for consistency. (PixelTrue is itself an illustration library, so this matches the
  strong reference closely.)
- **Style:** flat vector + subtle grain/texture overlay; warm, friendly characters. A
  recurring "dad" character (an older person comfortably using the app) ties the story in.
- **Soft blob backdrops** in green tints behind characters and feature icons.
- **Product-peek graphics** double as illustration: mini document cards with the status
  **left-border** (amber/blue/green), a faux dashboard, line-item rows, currency pills.
- **Decorative floaters:** coins, paper plane (send), receipts, checkmarks, sparkles,
  organic blobs.
- **Iconography:** rounded duotone icons in green for bento tiles.
- **Wordmark:** leaf/receipt mark + wide letter-spaced "SimpleBill".
- **Animated illustrations:** a few subtle **Lottie** loops (coins bob, paper plane
  drifts, a cursor clicks "New invoice"). Everything else uses CSS micro-motion.

---

## 5. Motion system (build-time)

**Tooling:** **Lenis** (smooth inertia scroll) + **GSAP ScrollTrigger** (pinning,
horizontal scroll, parallax) + **Framer Motion** (component reveals & micro-interactions).
Full `prefers-reduced-motion` fallback to static, on by default.

| Technique                  | Where                      | Notes                                                                                                                                         |
| -------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Scroll reveals (fade+rise) | every section, bento tiles | staggered; Framer Motion / IntersectionObserver                                                                                               |
| Layered parallax           | hero                       | background drifts slower than foreground; headline mid-layer                                                                                  |
| Pointer parallax           | hero floaters              | shapes drift slightly with cursor                                                                                                             |
| Infinite marquee           | capability strip           | pause on hover                                                                                                                                |
| Pinned horizontal scroll   | "How it works"             | section pins; panels translate sideways on vertical scroll; stage labels (Add · Build · Send) + progress bar; swipe carousel on mobile (GSAP) |
| Animated running total     | hero / product peek        | totals tick up ("the totals add themselves up")                                                                                               |
| Micro-interactions         | buttons, bento tiles       | hover lift + shadow + token-correct colour shift; tile art nudges                                                                             |
| Idle Lottie loops          | hero / showcase            | coins, paper plane, cursor click                                                                                                              |
| Theme toggle transition    | nav                        | smooth colour cross-fade                                                                                                                      |

> Note: Stitch comps are **static**. The motion above is the implementation spec; in the
> comps these appear only as layout intent (layered art, a ticker strip, sideways panels).

---

## 6. Page structure & finalized copy

Warm, personal, first person. No em dashes.

### 6.1 Top nav (sticky)

SimpleBill logo (leaf/receipt mark) left; light/dark theme toggle + primary CTA right.
CTA is **"Sign in with Google"**, or **"Go to app"** when the visitor is already signed in.

### 6.2 Hero

- **Eyebrow (story nod):** Originally built for my dad, who'd never call himself a
  "computer person."
- **Headline:** Make an invoice. Then forget about it.
- **Subhead:** SimpleBill helps you bill your regular clients in a few calm taps. Create
  an invoice or quote, add your items, send a clean PDF. No clutter, no jargon, no stress.
- **Primary CTA:** Sign in with Google · **Secondary:** See how it works
- **Visual:** layered, parallax illustrated dashboard scene with a friendly character.

### 6.3 Marquee strip

Slow horizontal ticker, repeating:

> Invoices · Quotations · Multi-currency · One-tap PDF · Repeat clients · LKR · USD · EUR · GBP

### 6.4 Features (bento grid)

Asymmetric bento, "Invoices and quotes" is the large hero tile.
Heading: **Everything you need, nothing you don't**

- **Your regulars, saved.** Keep the people you bill in one place, so you're never
  retyping an address again.
- **Your usual line items, ready to go.** Save the things you charge for once, then drop
  them into any document.
- **Invoices and quotes, same calm flow.** _(large tile)_ Build either one the same easy
  way, and the totals add themselves up.
- **Bill in their currency.** Charge clients in LKR, USD, or whatever they pay in,
  formatted right every time.
- **A tidy PDF in one tap.** Turn any document into a clean, shareable PDF you'd be happy
  to send.

### 6.5 How it works (pinned horizontal scroll)

Three panels advancing sideways, with stage labels (Add · Build · Send) and a progress bar;
swipe carousel on mobile. Heading: **From blank page to sent invoice in three steps**

1. **Add your client and what you charge for.** Set it up once. SimpleBill remembers, so
   next time is faster.
2. **Build the invoice.** Pick a client, add your items, watch the total sort itself out.
3. **Send it and move on.** Download a polished PDF, send it, and get back to the actual
   work.

### 6.6 Product showcase

Framed app screenshots with subtle parallax (source: `screenshots/stitch-dashboard.png`,
`stitch-customers.png`, `stitch-items.png`).

- **Dashboard:** Draft, sent, paid, all at a glance.
- **Customers:** Your repeat clients, a tap away.
- **Items:** The stuff you bill for, ready to reuse.

### 6.7 Closing CTA band

Heading: **Ready to send that invoice?** → primary CTA **Sign in with Google**

### 6.8 Footer

- Tagline: **A calmer way to bill your clients.**
- Story line: Made for my dad, and anyone who'd rather not think about invoicing.
- Links: **Terms · GitHub**
- Copyright: **© 2026 SimpleBill.**

---

## 7. Routing change (implementation)

- `/` becomes the **public** landing page (currently it redirects into the protected app).
- App routes stay at their current unprefixed paths (`/dashboard`, `/customers`, `/items`,
  `/documents`, `/settings`, `/profile`) but remain wrapped in `ProtectedRoute` via a
  pathless layout route rendering `AppShell`.
- `/login` and `/terms` stay public.
- Logged-in visitors at `/` still see the landing; the nav CTA flips to "Go to app".

---

## 8. Out of scope

- No pricing section (the app is free / single-user).
- No testimonials or customer-logo band.
- No email/password signup (Google Sign-In only).
- No blog / resources nav.

---

## 9. Stitch generation prompts

One per variation. Paste as-is. (Each already embeds product context, exact colours,
section copy, and concrete reference directives, since Stitch can't open URLs.)

### V1 — Immersive (PixelTrue-led, light)

> Design an immersive, illustration-first marketing landing page for **SimpleBill**, a
> calm invoicing & quotation web app. Visual style like a premium illustrated SaaS page:
> full-bleed flat-vector illustrated scenes with a friendly character (an older man
> happily using the app at a desk), soft organic blob backdrops, playful floating elements
> (coins, paper plane, sparkles), big **bold rounded geometric** headlines with ONE
> mint-green emphasis word, rounded green **pill buttons**, and a persistent floating CTA
> pill bottom-right. Generous whitespace, centered section titles, alternating
> text-left/illustration-right rows.
>
> Light theme, green brand. Exact colours: primary #0f5238, primary-hover #0a3d29,
> on-primary #ffffff, primary-container #2d6a4f, on-primary-container #a8e7c5, surface
> #f8f9fa, cards #edeeef, lowest #ffffff, text #191c1d, muted #404943, blue accent
> (sparingly) #2b6485, success #27ae60, amber #f39c12. Status colours in product art:
> Draft=amber, Sent=blue, Paid=green. Rounded corners 12-16px cards / 8-10px buttons,
> soft shadows, no heavy borders. Never pure black/white text on coloured backgrounds.
>
> Sections top to bottom:
>
> 1. Sticky nav: SimpleBill leaf/receipt logo left; theme toggle + "Sign in with Google"
>    button right.
> 2. Hero: small eyebrow "Originally built for my dad, who'd never call himself a 'computer
>    person.'"; headline "Make an invoice. Then forget about it." (emphasis word in mint);
>    subhead "SimpleBill helps you bill your regular clients in a few calm taps. Create an
>    invoice or quote, add your items, send a clean PDF. No clutter, no jargon, no stress.";
>    primary CTA "Sign in with Google"; secondary link "See how it works"; large layered
>    illustrated dashboard scene with a friendly character.
> 3. Marquee ticker repeating "Invoices · Quotations · Multi-currency · One-tap PDF ·
>    Repeat clients · LKR · USD · EUR · GBP".
> 4. Features as an asymmetric BENTO grid (varied tile sizes, NOT uniform columns), large
>    hero tile = "Invoices and quotes, same calm flow." Tiles + copy: "Your regulars,
>    saved." / Keep the people you bill in one place, so you're never retyping an address
>    again. — "Your usual line items, ready to go." / Save the things you charge for once,
>    then drop them into any document. — "Invoices and quotes, same calm flow." / Build
>    either one the same easy way, and the totals add themselves up. — "Bill in their
>    currency." / Charge clients in LKR, USD, or whatever they pay in, formatted right
>    every time. — "A tidy PDF in one tap." / Turn any document into a clean, shareable
>    PDF you'd be happy to send. Heading "Everything you need, nothing you don't".
> 5. How it works, three steps shown as a horizontal row of panels with stage labels
>    Add/Build/Send: 1) "Add your client and what you charge for." Set it up once.
>    SimpleBill remembers, so next time is faster. 2) "Build the invoice." Pick a client,
>    add your items, watch the total sort itself out. 3) "Send it and move on." Download a
>    polished PDF, send it, and get back to the actual work. Heading "From blank page to
>    sent invoice in three steps".
> 6. Product showcase: framed dashboard/customers/items screenshots with captions
>    "Draft, sent, paid, all at a glance.", "Your repeat clients, a tap away.", "The stuff
>    you bill for, ready to reuse."
> 7. Closing CTA band: "Ready to send that invoice?" + "Sign in with Google".
> 8. Footer: logo, tagline "A calmer way to bill your clients.", line "Made for my dad,
>    and anyone who'd rather not think about invoicing.", links Terms · GitHub, "© 2026
>    SimpleBill."
>
> No pricing, no testimonials/logo band, no email/password signup, no blog nav. Do not use
> em dashes in any text.

### V2 — Cinematic (Decriminalize-led, dark / muted)

> Design a cinematic, editorial marketing landing page for **SimpleBill**, a calm
> invoicing & quotation app. Visual style: a full-bleed, hand-illustrated, **grainy
> textured** scene with depth, and a **huge condensed bold display headline layered into
> the scene** (headline overlaps between foreground and background illustration layers for
> a sense of parallax depth). Muted, atmospheric palette built on deep green. Add a "scroll
> to explore" hint and a left-to-right stage progression.
>
> Dark / muted theme, green brand. Exact colours: primary (mint) #5acea4, primary-hover
> #4ab88f, on-primary #003828, primary-container #1a4f3a, on-primary-container #78deb6,
> surface #191c1d, cards #232627, lowest #141718, text #e1e3e4, muted #bfc9c1, blue accent
> (sparingly) #7bbcdc, success #27ae60, amber #f39c12. Add a subtle film-grain texture
> over backgrounds. Status colours in product art: Draft=amber, Sent=blue, Paid=green.
> Rounded corners 14-18px, soft glows on dark surfaces, no heavy borders. Never pure
> black/white text on coloured backgrounds.
>
> Sections:
>
> 1. Sticky nav: SimpleBill logo left; theme toggle + "Sign in with Google" right.
> 2. Hero: huge layered display headline "Make an invoice. Then forget about it." set into
>    a grainy illustrated desk/landscape scene; small eyebrow "Originally built for my dad,
>    who'd never call himself a 'computer person.'"; subhead "SimpleBill helps you bill
>    your regular clients in a few calm taps. Create an invoice or quote, add your items,
>    send a clean PDF. No clutter, no jargon, no stress."; primary CTA "Sign in with
>    Google"; "scroll to explore" hint.
> 3. Full-width marquee ticker "Invoices · Quotations · Multi-currency · One-tap PDF ·
>    Repeat clients · LKR · USD · EUR · GBP".
> 4. Features as an asymmetric BENTO grid, large tile "Invoices and quotes, same calm
>    flow." (same five tiles and copy as V1).
> 5. How it works as a horizontal scroll narrative with stage labels Add · Build · Send and
>    a progress bar (same three steps and copy as V1).
> 6. Product showcase: framed dashboard/customers/items screenshots with the same captions,
>    with depth/parallax framing.
> 7. Closing CTA band "Ready to send that invoice?" + "Sign in with Google".
> 8. Footer: logo, tagline "A calmer way to bill your clients.", line "Made for my dad, and
>    anyone who'd rather not think about invoicing.", links Terms · GitHub, "© 2026
>    SimpleBill."
>
> No pricing, no testimonials/logo band, no email/password signup, no blog nav. Do not use
> em dashes in any text.

### V3 — Airy (Prevint-led, light, horizontal)

> Design an airy, minimal, horizontally-scrolling marketing landing page for **SimpleBill**,
> a calm invoicing & quotation app. Visual style: vast whitespace with **small flat-vector
> vignettes scattered across the canvas** (a person at a desk, an invoice, coins, a phone),
> an elegant **wide letter-spaced "SimpleBill" wordmark**, a restrained palette, and a
> single quiet green **pill CTA**. The page reads as full-height panels that advance
> left-to-right with a horizontal scroll progress indicator.
>
> Light theme, green brand. Exact colours: primary #0f5238, on-primary #ffffff,
> primary-container #2d6a4f, on-primary-container #a8e7c5, surface #f8f9fa (mostly white
> space), cards #edeeef, lowest #ffffff, text #191c1d, muted #404943, success #27ae60,
> amber #f39c12. Status colours in product art: Draft=amber, Sent=blue, Paid=green.
> Generous whitespace, thin elegant type for the wordmark, rounded 12-16px cards / 8-10px
> buttons, soft shadows. Never pure black/white text on coloured backgrounds.
>
> Horizontal panels left to right:
>
> 1. Hero panel: fixed logo top-left, theme toggle + "Sign in with Google" top-right; small
>    eyebrow "Originally built for my dad, who'd never call himself a 'computer person.'";
>    headline "Make an invoice. Then forget about it."; subhead "SimpleBill helps you bill
>    your regular clients in a few calm taps. Create an invoice or quote, add your items,
>    send a clean PDF. No clutter, no jargon, no stress."; primary CTA "Sign in with
>    Google"; scattered small illustration field; "Scroll sideways →" hint.
> 2. Marquee ticker "Invoices · Quotations · Multi-currency · One-tap PDF · Repeat clients ·
>    LKR · USD · EUR · GBP".
> 3. Features panel as an asymmetric BENTO grid, large tile "Invoices and quotes, same calm
>    flow." (same five tiles and copy as V1).
> 4. How it works panel: three side-by-side step cards revealed by horizontal scroll (same
>    three steps and copy as V1).
> 5. Showcase panel: framed dashboard/customers/items screenshots with the same captions
>    sliding past.
> 6. Footer panel: logo, tagline "A calmer way to bill your clients.", line "Made for my
>    dad, and anyone who'd rather not think about invoicing.", links Terms · GitHub, "©
>    2026 SimpleBill.", and a final "Sign in with Google" CTA.
>    Mobile: horizontal panels become swipeable carousels / stacked cards; marquee keeps
>    scrolling.
>
> No pricing, no testimonials/logo band, no email/password signup, no blog nav. Do not use
> em dashes in any text.
