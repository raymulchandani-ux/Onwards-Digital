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
  // USD is the source of truth; AED figures are shown when the visitor
  // switches currency (display only — checkout is charged in USD).
  prices: {
    beginner:     { usd: 0,     aed: 0    },
    advanced:     { usd: 299,   aed: 1099 },
    professional: { usd: 599,   aed: 2200 },
    monthlyCare:  { usd: 12.99, aed: 48   }
  }
};
