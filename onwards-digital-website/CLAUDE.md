# Onwards Digital — project brief for Claude

You are working on **onwardsdigital.com**, the website of Ray's web-design business, plus the fictional demo sites it links to. Read this whole file before touching anything. It is the single source of truth for what the site is, how it is built, what Ray has decided, and how he likes to work.

---

## 1. The business

- **Onwards Digital** builds cheap, fast websites for small businesses (restaurants, cafés, salons, startups). Founded April 2026 by Ray, a Syracuse economics student based in the UAE. Branded as a professional agency, never "a student freelancing".
- Positioning: not the TikTok freelancer/agency model — fully automated, with a cheap monthly subscription so clients update their own site (e.g. a restaurant changing its menu).
- **Onwards builds websites and does NOT host them.** Copy must never mention hosting. The client connects the finished site to their own domain.
- Contact: contactonwardsdigital@gmail.com. Forms relay via FormSubmit (`config.js`).
- Payments: PayPal now (no trade licence yet); Stripe to be added once Ray has a UAE freelancer permit. Both appear on the checkout page; links live in `config.js` (PayPal.me username still a placeholder — `YOURUSERNAME`).

### Plans (all prices in USD, charged in USD)
| Plan | Price | Notes |
|---|---|---|
| Free mockup (`beginner.html`) | Free | Homepage mockup before paying; form sends immediately |
| Advanced (`advanced.html`) | $299 | Up to 3 non-payment pages, 2 revision rounds (bug fixes don't count), 3–5 business days |
| Professional (`professional.html`) | $599 | Up to 5 non-payment pages, booking/payments, 5 rounds, 5–7 business days |
| Monthly Care (`monthly-care.html`) | $12.99/mo | Editor + email support + "Edited by us within 3 business days" + cancel any time |

Refunds: 50% of the build fee any time before handover, none after. Bugs fixed free; client must report them.

### Currency
Prices are shown in USD, EUR, GBP, AED (values in `config.js` → `prices`). The AED symbol is the new dirham glyph drawn as an inline SVG (`.dh`), sized to match the other currency symbols. **Every price on the site follows the selected currency** — pricing cards, hero facts ("from $299", "$12.99 / month"), the Continue-to-payment button, and the checkout summary. Choice persists in `localStorage` (`onwards-currency`). When a non-USD currency is showing, checkout adds "You'll be charged $X USD through PayPal."

The dropdown is the boxed pricing-section style only (the old utility-bar version was removed). It sits at the far right of the homepage nav line and next to the back link in plan/checkout headers. Markup: `.cur-menu` > `.cur-btn` + `.cur-list`; JS in `site.js` (`setCurrency`, `paintCurrency`, `paintSubmit`, `onwards:currency` event).

---

## 2. Repository, deployment, delivery

- GitHub repo **raymulchandani-ux/Onwards-Digital**, folder **`onwards-digital-website/`**, deployed by Vercel. The site is **flat** — every file in one folder, no subfolders.
- Ray deploys by dragging the unzipped folder into GitHub's web upload. **Every delivery must be a zip containing the single `onwards-digital-website` folder with ALL previous changes included** (never a partial set of files).
- Cache-busting: every HTML file loads `site.css?v=…`, `config.js?v=…`, `site.js?v=…`. **Bump the `v=` value in all HTML files on every change** (`sed -i 's/v=OLD/v=NEW/g' *.html`).
- Fonts load from Google Fonts. Photos are Unsplash CDN URLs (`images.unsplash.com/photo-<id>?auto=format&fit=crop&w=…&q=…`) with `onerror="this.remove()"` fallbacks on the homepage tiles.

### Files
```
index.html                homepage
advanced.html, professional.html, monthly-care.html, beginner.html   plan pages (order forms)
payment.html              checkout (PayPal / Stripe)
thanks.html, terms.html, privacy.html, refunds.html
site.css, site.js, config.js      shared styles/logic/config for the Onwards pages only
example-restaurant.html   Ossobello (Providence trattoria)
example-cafe.html         Hollowmere (Portland bakehouse)
example-salon.html        Tessaline (Austin colour studio)
example-veyra.html        Veyra (AI copy-trading startup)
example-noorvale.html     Noor & Vale (global luxury real estate)
veyra-thumb.jpg           real screenshot of Veyra's hero, used as its homepage tile
logo-*.svg/png, favicon*  brand assets
README.md, CLAUDE.md
```
Each demo site is **self-contained** (inline CSS + JS, own fonts) and does not use `site.css`/`site.js`.

---

## 3. Design language (Onwards pages)

- "Ledger" direction: paper-white editorial, **Instrument Serif** headlines + **Schibsted Grotesk** text, hairline rules, square corners, four pricing boxes in one bordered grid. Simplicity in the spirit of crateandbarrel.com / cb2.com.
- Ray dislikes "vibe-coded" bubbly looks, oversized/"zoomed-in" type, and pages that feel too full.
- Logo: the "open O" mark (a ring opening into an arrow), round black favicon, wordmark "Onwards Digital".
- Homepage headline: **"Built in a week. Yours for life. Change whenever you like."** The old "Most small-business websites fail at the front door" section and the "01 — Why / 05 — Questions" section numbers are gone; the nav is unchanged.
- Homepage copy for the hero, how-it-works, what's-included and FAQ was supplied by Ray verbatim — don't rewrite it. Monthly Care FAQ ends "We'll make up to three edits a month for you, delivered within three business days."
- **Phone layout:** "What we build" and "Our work, up close" are merged — each demo photo (still a link) has that site's description under it; the separate Our-work section is hidden on phones. Laptop keeps both sections.

### Phone rule for every page
Ray's biggest complaint: on phones everything stacks vertically and "you feel like you're scrolling forever". Prefer keeping 2–4 items side by side with smaller type, tighter section spacing, clamped descriptions, and horizontal strips/carousels over stacking. Always check every page at **390 px** and **1440 px**.

---

## 4. Order flow (important, was a "big fix")

- Paid-plan forms (Advanced, Professional, Monthly Care) must **NOT** be emailed at "Continue to payment". The form is parked in the browser (`window.ONWARDS_PENDING`, IndexedDB with sessionStorage fallback, file included) and only sent from `payment.html` on the **Pay** click, with the extra field *"PayPal checkout started for $X USD — confirm the payment arrived before starting work"*. If someone reaches checkout without a parked form, a note tells them to go back.
- The free-mockup form sends immediately (no payment).
- Attachments require a real form post (FormSubmit `_next` redirect); text-only submissions use the AJAX endpoint.
- Demo-site forms send nothing (submit → thanks state only).
- `monthly-care.html` has a plan picker (Advanced + Care / Professional + Care / Care only) that hands the plan to `site.js` via `data-plan-key` and `window.__paintSubmit`.

---

## 5. Demo sites — shared rules

- Fictional businesses, no real addresses, phone shown as **(000) 000 0000**, stock photos without faces, written from the business's perspective, every page says it is an example by Onwards Digital.
- The black **"← Back to Onwards Digital / Example site by Onwards Digital"** bar (`.onwards`) stays **pinned** at the top while scrolling, above each site's own sticky header (`position:sticky; top:0; z-index` above the header; header `top:36px`; `html{scroll-padding-top}` adjusted).
- Removed demos: Northgale (trades/plumbing) and Quillmont (bookshop). **Ray asked to be reminded to come back to a Trades & services demo later.**
- Ray finds the three older demos (Ossobello, Hollowmere, Tessaline) "basic, same layout" and wants distinctive ones referencing Zuma, Cipriani, Carbone; full redesigns of Ossobello and Tessaline were built and then reverted to the originals at his request ("really good", experimenting) — the originals are what is live.
- **Ossobello** reservation form uses custom dark/amber **date, time and party-size pickers** (popovers that fade/lift in; native pickers were rejected). Tapping either the text or the icon opens them. Times follow the day's service (closed Mondays).

### Veyra — `example-veyra.html` ("Startups & apps" on the homepage)
Fictional AI copy-trading subscription, $29/month. Brief: Starlink-style — black, one typeface (Geist), one signal-blue accent, one idea per screen, strong but quiet animation. Ray called it "truly amazing".
- Hero: **"Invest with confidence."**, sub "Veyra mirrors the trades of an AI trained on twenty years of markets into your own brokerage account, in seconds." Canvas background: drifting points, faint grid, a **seeded random-walk price line with upward drift** that draws itself on load, plus three very faint market lines behind. "Model active · reviewing N positions" ticker.
- No small eyebrow labels anywhere (How it works / Step 1 / The model … all removed).
- **"Begin in three steps."** — 16 brokerages (Schwab, Fidelity, Interactive Brokers, eToro, Robinhood); "Set how much" (no drawdown-floor sentence); "Every trade, mirrored … within just seconds". On phones the three steps are a **centred swipeable carousel**: liquid-glass arrows on both sides of every step, loops 3→1 and 1→3, auto-advances every 5 s, any touch resets the timer.
- **"Human-level decisions, without the panic."** with an **orbit** on the right: two rings turning in opposite directions (driven in JS so chips stay upright), carrying NYT, WSJ, Economic Times, Nvidia, Tesla, Gold, Silver, S&P 500, Crude oil, Chevron as **typeset names with tickers and line icons (never logos)**; centre chip swaps every ~3 s; hover enlarges a chip; **the rings never stop**. Ring radii are computed in `layout()` from the real chip and core sizes so nothing overlaps at any width (phone: orbit up to 340 px, 50 px chips, 90 px core, `overflow:clip`).
- Three counting stats, then a trade tape (single unbreakable row; **Buy green, Sell/Trim red**).
- **"You set the limit."** risk dial in **liquid glass** (no background). Five-year chart box also liquid glass; its small print no longer says "You can lose money".
- **One plan** card: liquid glass with a **realistic random-walk stock line (green with red pullbacks, solid green at the end)** drawn in front of the glass and behind the text, entering below the card's bottom-left and leaving above its top-right; the section clips it.
- Sign-up is two fields + button; FAQ; footer says Veyra is fictional and nothing is advice.

### Noor & Vale — `example-noorvale.html` ("Real estate" on the homepage)
Fictional global luxury house, homes from $2 M, "Over 500 homes across 40 cities." Reference: Douglas Elliman, but with more animation and no shouting capitals. Newsreader (serif) + Geist, black, one brass accent. A two-city NY+Dubai version was rejected — keep it global.
- Hero: a glass house in the woods (Unsplash `photo-1505843513577-22bb7d21e455`) that breathes (slow zoom/drift), mist layer, film grain, mouse parallax; headline **"The right home, anywhere."**; glass search bar **Where / Kind of home / Budget / Begin**: Where suggests as you type ("Du" → "Dubai, United Arab Emirates", matched letters in brass), Kind of home is a themed list (House, Apartment, Penthouse, Estate, Waterfront — **no "Any/other"**), Budget opens the same slider as the enquiry form. Popovers fade/lift like Ossobello's; **on phones they open downward under the bar**. On phones the copy sits in the lower part of the hero (`.hero .copy{bottom:15%}`) so the headline is over the house and the search bar over the garden; the bg/mist/grain live in `.scene` (clipped) so the hero itself can be `overflow:visible` and popovers can hang below it. Budget slider (`.range`, used in the hero popover and the enquiry form) is Noor & Vale's own design, not Veyra's: a 1 px hairline that fills with brass up to the knob (`--p` set by `paintRange()`), an 18 px dark knob with a brass ring and brass centre, brass glow on hover/press; the input is 36 px tall so the knob sits centred with clear space above and below; a drag that ends outside the popover no longer closes it (pointerdown tracking). Deliveries are named `onwards-digital-website.zip`. Begin carries the answers into the enquiry form.
- Marquee of 16 cities with live local times.
- **"Latest properties."** — 9 homes in a sideways strip, exactly **three per view (two on phones)**, liquid-glass arrows that glide a full page with a custom ease and **loop endlessly in both directions** (the nine cards are cloned before and after themselves and the strip silently re-centres, so "next" after the last card carries straight on to the first), no auto-advance; trackpad/finger scrolling works. Card layout: city pill top-left, **"8 bed · 14,600 sq ft" bottom-right only**, and under the price **"Ocean Boulevard · 1928 estate, restored"** (location · descriptor, no comma). Cards 4:3.4, soft corners. **Every image must be a clear exterior or interior of a real home with a plausible location** (Ray rejected landscapes and mislabelled interiors).
- **"Across six real estate capitals."** — a list (New York, London, Dubai, Los Angeles, Lake Como, Singapore) with live times; the picture follows the hovered row and wipes in with the section; each city uses an **iconic city image** (Central Park aerial, Tower Bridge, Burj Khalifa, LA sunset view, Villa del Balbianello, Marina Bay). Clicking a city fills the form and scrolls to it on laptop; **on phones it only selects, no scrolling**. Picture styled like the property cards (same ratio, corners, pills).
- Numbers row (4 across, also on phone), then a **rotating villa slideshow** (exteriors only) with price in local currency + location and progress dots. The old client quote and the "From the first call to the keys" section are gone.
- Enquiry: **"Tell us the city. 24-hour response time."** Buy/Sell/Let chips; **City field must not trigger browser address autofill** (`autocomplete="off"`, non-address name) and uses the same suggestion popover; Kind of home is a themed popover; budget slider; name/email/phone; no "nothing is shared" line.

### Homepage tiles
Five tiles: Restaurants (Ossobello), Cafés & bakeries (Hollowmere), Salons & studios (Tessaline), Startups & apps (Veyra — `veyra-thumb.jpg` screenshot), Real estate (Noor & Vale — the glass-house photo). Copy "Five kinds of business, five very different demo sites…".

---

## 6. How Ray works with you

- He gives snag lists with exact replacement wording and expects it applied verbatim (typos tidied).
- He tests on his Mac (Chrome/Safari) and iPhone and sends screenshots; fix exactly what's shown.
- He wants honesty: if something cannot be reproduced or verified (e.g. you can't view an image), say so rather than pretend.
- After every task: bump the `v=` param, run a quick check at 390 px and 1440 px, re-zip the whole folder, deliver the zip.
- Never announce memory saves; never mention hosting; keep the Onwards site copy exactly as supplied.

### Useful checks
- Headless Chrome (Puppeteer) is the fastest way to verify: load each page at `{width:1440,height:900}` and `{width:390,height:844,isMobile:true}`, assert no `pageerror`, `document.documentElement.scrollWidth <= innerWidth`, and screenshot sections. Unsplash images are blocked in some sandboxes — stub them in request interception.
- Install the Google fonts locally (Instrument Serif, Schibsted Grotesk, Fraunces, Bricolage Grotesque, Geist, Newsreader from github.com/google/fonts) so screenshots match Ray's screen.
- When sourcing Unsplash photos, verify the CDN id exists by fetching the unsplash.com listing/photo page (the `images.unsplash.com/photo-…` URL appears in its markup); prefer recent, well-captioned uploads.

---

## 7. Open items / ideas
- Trades & services demo to be revisited (Ray asked to be reminded).
- PayPal.me username and Stripe links in `config.js` are placeholders.
- Legal pages are drafts: legal entity name and governing law still to fill in; lawyer review pending.
- Next big idea: the real client editor/login behind Monthly Care.
- Older demos (Ossobello, Hollowmere, Tessaline) are content-heavy on phones (~8–9 screens); further shortening would mean cutting content — ask first.
