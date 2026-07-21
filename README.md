# MITRE v19 Slide Options

Static prototype for comparing presentation-friendly Cardinal MITRE v19 layouts and exporting 1920×1080 PNGs.

## Open locally

Open `index.html` directly in a browser. No build command, package installation, or local server is required.

The PNG and ZIP export libraries load from CDN, so an internet connection is required for exports.

## Review workflow

- Select a layout tab; the selected layout is part of the variation.
- Use **Uncovered techniques** as a separate client coverage option.
- Test the variation checkboxes inside each tab.
- Copy the generated boolean variation object for feedback.
- **Calculate ghosts** is available only for the weighted matrix; weighted techniques always flow top-to-bottom.

## Deploy

Upload the folder as a static site. No build command is required; `index.html` is the entry point.

For GitHub Pages, publish the repository from the `main` branch and `/(root)` folder under **Settings → Pages → Build and deployment**.

The project uses Cardinal's tactics and parent techniques from `common/src/data/mitreMap.json`. The demo creates deterministic TCS v1 health and recommendation values, then applies Cardinal's health-map technique sorting rules: covered techniques by ascending health, followed by uncovered techniques by descending recommendation count. Production should pass through the already-sorted technique order returned by the Cardinal API.

## Files

- `index.html` — page structure and third-party script imports.
- `styles.css` — site and slide presentation styles.
- `app.js` — layout calculation, controls, and PNG export.
- `mitre-data.js` — Cardinal MITRE v19 tactic and parent-technique data.
- `generate-mitre-data.mjs` — regenerates `mitre-data.js` from the Cardinal repository.

## Layout performance

Text wrapping is calculated with a cached canvas measurement. Grid candidates are evaluated in memory and only the selected layout is written to the DOM. A short binary-search overflow check handles browser font-rendering differences.
