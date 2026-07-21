# MITRE v19 Slide Options

Static prototype for comparing presentation-friendly Cardinal MITRE v19 layouts and exporting a 1920×1080 PNG from each layout tab.

## Open locally

Open `index.html` directly in a browser. No build command, package installation, or local server is required.

The PNG export library loads from CDN, so an internet connection is required for exports.

## Review workflow

- Select a layout tab; the selected layout is part of the variation.
- Use **Uncovered techniques** as a separate client coverage option.
- Test the variation checkboxes inside each tab.
- Copy the generated boolean variation object for feedback.
- Preferred minimum font size is controlled by the scoped CSS variable `--min-font-size`: 12px for the weighted matrix and 10px for lanes. The layout keeps that value whenever possible and only shrinks further when necessary to prevent clipping.
- **Stretch techniques to fill tactic container** is available only for the weighted matrix. When uncovered techniques are hidden, it removes their reserved positions and stretches the visible techniques to fill the tactic container.
- Technique order is fixed in both layouts: low health (red) at the top, followed by progressively better health, with uncovered techniques last. Weighted-matrix grids use CSS row flow so each full row is painted before moving down to the next one.

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
