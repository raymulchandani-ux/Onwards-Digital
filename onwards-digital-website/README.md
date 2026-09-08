# MONARCH

A standalone browser-game foundation: casino tables, a personal collection, and an interactive coastal city shopping map. Plain HTML, CSS, and JavaScript, with all artwork and fonts included. No installation, API keys, or build tools required.

## Put it on GitHub and Vercel

1. Unzip `monarch-website.zip`.
2. Upload the **contents** to your GitHub repository. Keep `index.html`, `styles.css`, `app.js`, `core.js`, `vercel.json`, and the `assets` folder together at the repository root.
3. In Vercel, create a new project and import that repository.
4. If prompted, choose **Other** for Framework Preset. Use no Build Command and no Install Command; Output Directory is **`.`**. The included `vercel.json` supplies these settings.
5. Deploy and open your Vercel URL.

Vercel's official guides: [Deployments](https://vercel.com/docs/deployments) and [Project configuration](https://vercel.com/docs/project-configuration/vercel-json).

For a quick local look, open `index.html` in a modern browser. Playing from the deployed HTTPS site gives consistent browser storage behavior. The hash routes (`#play`, `#inventory`, `#purchase`) work without server rewrites.

## What's playable

- Home → Enter Monarch → Play / Inventory / Purchase gateway.
- Three persistent header buttons switch between the in-game sections.
- Start with **25,000 credits**.
- Blackjack: hit, stand, double down, soft aces, dealer stands on all 17s, natural blackjack pays 3:2. No split or insurance.
- Poker: **single-player, five-card Jacks or Better video poker**, with hold/draw and nine paying hand categories. This is not multiplayer Texas Hold'em.
- European roulette: animated 37-pocket wheel, red/black, odd/even, low/high, and individual-number bets. One bet per spin.
- Ten map destinations, category filters, zoom controls, and scrollable/pannable map area. Three tiers each for cars, properties, and watches; one eyewear shop carries all three tiers.
- Twelve collectibles, from a city hatchback and studio to a hypercar and hillside mansion.
- Purchase confirmations, balance deductions, duplicate ownership prevention, inventory filters, equip/unequip, and editable player name.
- Equipped favorites appear in the avatar profile's signature collection. The character portrait is fixed artwork; items do not yet change a rendered character model.
- The wallet's **+** button offers simulated credit packs. Pack dollar amounts are concept prices; clicking adds demo credits for free. No checkout or payment collection.
- Local browser saving for wallet, collection, profile, recent outcomes, and unfinished card hands.
- Responsive layouts, keyboard focus styling, native modal dialogs, and reduced-motion support.

## Prototype boundaries

This is the base requested, with a complete local gameplay loop. Accounts, multiplayer poker, friend profiles, social sharing, live payments, a shared economy, and a customizable 3D character are not connected.

The balance is stored in `localStorage` under `monarch-v1`. It belongs to this browser and website address. Clearing site data removes progress. Use one active tab for this local prototype. If storage is unavailable, an on-screen notice explains that progress lasts only for the current visit.

A client-only balance can be edited by a player. Before taking actual payments or offering shared accounts, move balances, game settlement, purchases, and ownership to an authenticated server with an auditable transaction ledger. Payment credits should be awarded only after a verified payment-provider webhook. The demo wallet must be replaced, not reused as payment verification.

Credits and items have no cash value, cannot be withdrawn, and are not transferable. No third-party gambling service is connected.

## Editing the foundation

- **Brand, starting credits, catalog, prices, locations, screens and controls:** `app.js`
- **Color palette, typography, responsive layout and animations:** `styles.css`
- **Deck shuffling, blackjack scoring, poker evaluation and roulette payout rules:** `core.js`
- **Page title, description and entry point:** `index.html`
- **Artwork and fonts:** `assets/`

All product names and location brands are fictional. Artwork was generated for this prototype. Typeface licenses are in `licenses/`. Design rationale and research links are in `DESIGN-NOTES.md`; image prompts are in `ARTWORK-PROMPTS.txt`.

## Validation

Seventeen automated logic/integration checks passed: shuffled-deck uniqueness, blackjack ace/natural/push/double-down rules, all video-poker payout categories, every roulette pocket and bet, wager limits, route rendering, purchases, equipment, repeated-action prevention, name escaping, and state restoration. Local HTTP delivery and packaged asset references were also checked.

These checks run the game and rendering functions in a JavaScript test context. Browser interaction and visual layout testing were not performed; cross-browser behavior and a full accessibility audit remain to be checked before a public launch. An optional feature-detected WebMCP surface exposes collection reading and section navigation; a supported live WebMCP validation context was unavailable, so those integrations are unverified.
