# BackReserve – Landing page

Marketing website for BackReserve, the pre-ordering and pickup platform for bakeries.

- Live: https://reserver.gentlegroup.de/
- App (web): https://metur100.github.io/Back.Reserver.App/ — source in [metur100/Back.Reserver.App](https://github.com/metur100/Back.Reserver.App)

## Concept

The page tells one bakery day as you scroll: the intro clock ticks to 04:00, the hero shows a live ordering demo in the oven light, a pinned timeline runs from the evening order (20:14) through production (04:00) to pickup at the counter (07:32), and the final call to action ends at sunrise.

## Structure

Plain static HTML/CSS/JS, no build step, no dependencies:

| Path | Content |
|---|---|
| `index.html` | Landing page (German) |
| `impressum.html`, `datenschutz.html` | Legal pages (operator: Berk-Can Atesoglu, Gentle Group Studios) |
| `konto-loeschen.html` | Account and data deletion – URL for Google Play / App Store Connect |
| `support.html` | Help & contact – support URL for the stores |
| `404.html` | Not-found page for GitHub Pages |
| `assets/styles.css` | Design tokens, layout and all CSS animations |
| `assets/main.js` | Scroll engine and interactions (see below) |
| `assets/fonts/` | Self-hosted Fraunces, Inter and JetBrains Mono (SIL Open Font License, see LICENSE files) |
| `assets/img/` | Favicon, Open Graph image and app screenshots (WebP, captured from the demo instance) |

### Animations

`assets/main.js` is a small, dependency-free engine:

- one `requestAnimationFrame` loop that writes scroll progress into CSS custom properties (`--p`, `--hp`, `--sp`); the CSS turns these into transforms
- pinned sections built with `position: sticky`: the hero scroll-out, the timeline (`[data-story]`) and the horizontal feature track (`[data-hscroll]`)
- reveal-on-enter via `IntersectionObserver`; per-section colour themes (`data-theme-section`) blend through registered `@property` colours
- hero: a canvas of flour dust, pointer parallax and tilt, variable-font weight that follows the cursor, and a looping ordering demo that prints a receipt
- marquee speed and skew follow the scroll speed; magnetic buttons; spotlight cards; animated FAQ accordion; accessible tabs

Accessibility and fallbacks: with `prefers-reduced-motion` the intro, parallax and pinned horizontal scroll are switched off (cards become a native swipe row) and all content is shown statically. Without JavaScript the page is fully readable.

Privacy: no cookies, no tracking, no third-party requests. Only `sessionStorage` is used, to show the intro once per session.

## Local preview

```bash
npx serve .        # or: python -m http.server 8000
```

## Deployment

Every push to `main` runs `.github/workflows/pages.yml`: a link/asset check, then deployment to GitHub Pages (source: GitHub Actions).

## Links into the app

All calls to action point to the web app on GitHub Pages (`/registrieren`, `/login`, demo bakery `/b/baeckerei-rheinblick`). When the app moves to its own domain, search and replace `https://metur100.github.io/Back.Reserver.App` in `index.html`.
