# BackReserve – Landing page

Marketing website for BackReserve, the pre-ordering and pickup platform for bakeries.

- Live: https://metur100.github.io/Back.Reserver.Landing/
- App (web): https://metur100.github.io/Back.Reserver.App/ — source in [metur100/Back.Reserver.App](https://github.com/metur100/Back.Reserver.App)

## Structure

Plain static HTML/CSS/JS, no build step:

| Path | Content |
|---|---|
| `index.html` | Landing page (German) |
| `impressum.html`, `datenschutz.html` | Legal pages — **placeholders, must be completed before launch** |
| `404.html` | Not-found page for GitHub Pages |
| `assets/styles.css`, `assets/main.js` | Styles and the mobile navigation |
| `assets/fonts/` | Self-hosted Inter and Fraunces (SIL Open Font License, see LICENSE files) — no requests to Google Fonts |
| `assets/img/` | Favicon and app screenshots (captured from the demo instance) |

Privacy: no cookies, no tracking, no third-party requests.

## Local preview

```bash
npx serve .        # or: python -m http.server 8000
```

## Deployment

Every push to `main` runs `.github/workflows/pages.yml`: a link/asset check, then deployment to GitHub Pages (source: GitHub Actions).

## Links into the app

All calls to action point to the web app on GitHub Pages (`/registrieren`, `/login`, demo bakery `/b/baeckerei-rheinblick`). When the app moves to its own domain, search and replace `https://metur100.github.io/Back.Reserver.App` in `index.html`.
