# Onwards Digital — website

Plain HTML, CSS and JavaScript. No build step, no subfolders — every file sits
at the same level. Upload them all to GitHub and Vercel deploys as-is.

```
index.html            Homepage
beginner.html         Free mockup (form only, no payment)
advanced.html         $299 plan — questionnaire → payment.html
professional.html     $599 plan — questionnaire → payment.html
monthly-care.html     $12.99/mo — plan picker + questionnaire → payment.html
payment.html          Checkout: PayPal or Stripe (reads plan/price from the URL)
site.css              The design system (one file for all six pages)
site.js               Shared behaviour: nav, currency, forms, add-on, submit
config.js             ← THE ONLY FILE YOU NEED TO EDIT TO GO LIVE
example-*.html        Five demo homepages for fictional businesses
```

## 1. Go live checklist (edit `config.js             ← THE ONLY FILE YOU NEED TO EDIT TO GO LIVE

1. **Form emails** — `formEndpoint` uses FormSubmit.co and points at
   `contact@onwardsdigital.com`. The first real submission triggers a one-time
   activation email to that inbox; click the link once and every later
   submission arrives normally. (If you'd rather use Formspree or Netlify Forms,
   change this one URL.)
2. **PayPal** — replace `https://paypal.me/YOURUSERNAME` with your PayPal.me
   link. The checkout appends the amount (`/299.00USD`). Optional: create a
   PayPal *subscription* for Monthly Care ($12.99/month) and paste its link in
   `paypalMonthlyCare`; until you do, the first month is taken via PayPal.me and
   the page tells the customer you'll email a subscription link.
3. **Stripe** — when you have your Stripe account, create three **Payment
   Links** (Dashboard → Product catalog → Payment links): Advanced $299 one-time,
   Professional $599 one-time, Monthly Care $12.99/month recurring. Paste each
   URL into `stripe.advanced`, `stripe.professional`, `stripe.monthlyCare`.
   Any that is left empty shows Stripe as "coming soon" on the checkout page
   while PayPal keeps working — so nothing breaks in the meantime.
4. **Prices** — `prices` holds USD (charged) and AED (display only). Change a
   number here and every page updates.

Until PayPal/Stripe links are filled in, the Pay button shows a polite message
asking the customer to email you rather than sending them to a dead link.

## 2. Photos

The homepage hero mockup and the five example sites use designed photo slots
(`<figure class="photo" data-photo="…">`). The `data-photo` text describes the
shot to take. To drop a real photo in, put the image inside the figure:

```html
<figure class="photo" data-photo="dining room at dusk">
  <img src="images/dining-room.jpg" alt="The dining room at Ossobello at dusk">
</figure>
```

Each example site's CSS already makes an `img` inside `.photo` fill the slot
(`object-fit: cover`). Aim for 1600px-wide JPGs under 300 KB.

## 3. Things deliberately left out

- **Testimonials on the homepage.** The old site carried placeholder reviews.
  Rather than invent quotes from people who don't exist, the section is gone;
  add it back (there's a `.quotes` style ready in `site.css`) once you have
  real ones with names you're allowed to use.
- **The client editor / login.** The site now *sells* self-service editing
  ("edit your menu yourself"). That product doesn't exist yet in this repo —
  it's a separate build. Until it does, Monthly Care is fulfilled by you making
  the changes (the page also promises "up to 3 changes a month done for you",
  so the offer is still honest).

## 4. The example sites

`example-restaurant.html` (Ossobello), `example-cafe.html` (Hollowmere), `example-salon.html` (Tessaline), `example-trades.html` (Northgale), `example-shop.html` (Quillmont).
Every business,
person, address, phone number and review is fictional; phone numbers use the
reserved 555 range. Each page is self-contained, so you can copy one as the
starting point for a real client's site. Forms on the example pages are
front-end only (they confirm on the page and send nothing).

## 5. Editing the site

- Colours, spacing and type live at the top of `site.css              The design system (one file for all six pages)
- The three questionnaire pages share one structure; if you change a field on
  one, change it on the others (or regenerate them — ask Claude for
  `tools/build_plans.py`).
- Fonts: Instrument Serif + Schibsted Grotesk from Google Fonts.
