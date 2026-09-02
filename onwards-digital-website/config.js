/* ─────────────────────────────────────────────────────────────
   Onwards Digital — the ONLY file you need to edit to go live.
   ───────────────────────────────────────────────────────────── */
window.ONWARDS = {

  // Where form submissions are emailed (FormSubmit.co — no account needed;
  // the first submission sends a one-time activation email to this address).
  formEndpoint: "https://formsubmit.co/ajax/contact@onwardsdigital.com",

  // Public contact email shown on the site.
  contactEmail: "contact@onwardsdigital.com",

  // ── PayPal ─────────────────────────────────────────────────
  // Your PayPal.me link, e.g. "https://paypal.me/onwardsdigital".
  // The amount is appended automatically ("/299USD").
  paypalMe: "https://paypal.me/YOURUSERNAME",
  // Optional: a PayPal subscription link for Monthly Care (PayPal → Pay & Get Paid →
  // Subscriptions → create a $12.99/month plan → copy the link). If left empty the
  // first month is taken via PayPal.me and you email the subscription link afterwards.
  paypalMonthlyCare: "",

  // ── Stripe ─────────────────────────────────────────────────
  // Once you have a Stripe account, create one Payment Link per product
  // (Stripe Dashboard → Product catalog → Payment links) and paste them here.
  // Leave a value empty ("") and that Stripe option is shown as "coming soon"
  // while PayPal keeps working.
  stripe: {
    advanced:     "",   // one-time, $299
    professional: "",   // one-time, $599
    monthlyCare:  ""    // recurring subscription, $12.99 / month
  },

  // ── Prices ─────────────────────────────────────────────────
  // USD is the source of truth and what checkout charges. The other
  // currencies are display-only conversions — update them whenever you like.
  prices: {
    beginner:     { USD: 0,     AED: 0,    GBP: 0,    EUR: 0     },
    advanced:     { USD: 299,   AED: 1099, GBP: 225,  EUR: 255   },
    professional: { USD: 599,   AED: 2200, GBP: 450,  EUR: 510   },
    monthlyCare:  { USD: 12.99, AED: 48,   GBP: 9.99, EUR: 11.49 }
  },
  currencies: { USD: "$", AED: "AED ", GBP: "£", EUR: "€" }
};
