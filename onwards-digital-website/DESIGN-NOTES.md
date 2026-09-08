# MONARCH — design notes

## Visual direction

An understated private-club atmosphere: midnight navy surfaces, cool white typography, electric mint actions, and warm metallic accents. Original coastal-city artwork gives the experience a world beyond the casino. Clear card faces and a restrained green table connect it to familiar table games.

| Color | Value | Purpose |
| --- | --- | --- |
| Midnight | `#0B1118` | Main background |
| Blue slate | `#111A24` | Panels and cards |
| Cool white | `#F4F7FA` | Primary text |
| Muted blue | `#9AA9B9` | Supporting text |
| Electric mint | `#A6F56E` | Actions, active sections, credits |
| Warm gold | `#DEB975` | Watches and rare collectibles |
| Soft red | `#F17888` | Loss/result cues |

Mint has high contrast against the dark surface and is used sparingly to make actions and active states easier to find. Blue, green, gold, and violet differentiate location categories; icons and labels provide a second cue, so category meaning is not conveyed by color alone.

## What the research does and does not show

The color-psychology literature is context-dependent and contains methodological limitations. It does not establish that a particular web palette reliably creates pleasure or keeps every player engaged. MONARCH's palette is an informed art-direction choice, not an experimentally proven retention formula. Andrew Elliot's review explicitly recommends caution in applying findings to real settings. [Elliot, 2015, Frontiers in Psychology](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2015.00368/full)

For practical interface decisions, readability provides firmer guidance. W3C specifies a minimum 4.5:1 contrast ratio for ordinary text and 3:1 for large text, with documented exceptions. The main text and action colors were chosen around strong contrast; this prototype has not undergone a complete accessibility conformance audit. [W3C: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

Card dealing, selected-item feedback, and the roulette spin respond to player actions. The site respects the operating system's reduced-motion preference. W3C recommends allowing nonessential interaction animation to be disabled. [W3C: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)

The progression loop is play → collect → equip. Payout rules are visible, wins and losses are reported as actual results, and the interface uses no fake activity counts, fabricated countdowns, auto-betting, or purchase-pressure interruptions.

## Layout and navigation

The home screen provides the requested cinematic entry point. The gateway then presents three equal choices. Once inside, the three header links are the cross-section navigation.

Casino controls stay beside the game on desktop and below it on narrow screens. Inventory pairs the character profile with owned items. Purchase uses a detailed bird's-eye city image with interactive location pins, matching directory entries, and individual store panels. The city is fictional and inspired by Southern California; its coordinates and map scale are atmospheric, not a geographic dataset.

The city is a 2D image with rendered depth, interactive overlays, and zoom. The avatar is a fixed character portrait with an equipped-item profile. A live 3D city or character would be a separate next-stage implementation.

## Artwork

Three original assets were created with the built-in image generation tool: the city-and-supercar home artwork, a bird's-eye city map, and a twelve-item catalog atlas. Exact prompts are included in `ARTWORK-PROMPTS.txt`.

Images are displayed directly or as CSS background windows. Fonts are locally bundled Google Fonts (DM Sans and Manrope), distributed with their SIL Open Font Licenses.
