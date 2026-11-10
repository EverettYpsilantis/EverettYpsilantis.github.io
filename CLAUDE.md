# CLAUDE.md

Personal portfolio site for Everett Ypsilantis — geospatial services, data analytics,
and AI. The thesis of the site is "using AI and analytics to study the earth, plan
infrastructure, and serve communities," told as a transition narrative from GIS
delivery into AI/analytics — not a debut portfolio.

## Hard constraints

- **Vanilla only.** HTML, CSS, and JavaScript. No React, no framework, no build step,
  no bundler, no npm dependencies, no CDN scripts. Netlify must deploy it by pushing
  the repo with no build command.
- **Content is data, never markup.** Every string, project, job, and skill on the page
  comes from `data/*.json` and is rendered by `js/main.js` at runtime. Adding a
  project means appending one object to `data/projects.json` and dropping images in
  `assets/images/<id>/` — never editing `index.html` or `css/styles.css`. If a change
  requires touching markup to add content, the JS is wrong; fix the renderer instead.
- **Single page**, anchor navigation, smooth scroll.
- **Mobile-first and responsive**, semantic HTML, keyboard-accessible, WCAG AA
  contrast, `prefers-reduced-motion` respected.

## Architecture

`index.html` is an empty shell: landmarks, section headings, and containers marked
with `data-*` hooks (`data-projects`, `data-experience`, `data-skills`, …).
`js/main.js` fetches the three JSON files, then builds DOM nodes with the `h()`
helper and fills those containers.

Build nodes with `h()` / `textContent` — never `innerHTML` with data values.

## Conventions

- Design tokens (colors, fonts, spacing, radii, transition) live in `:root` in
  `css/styles.css`. Change the palette there, not in component rules.
- Project categories are ordered by the `CATEGORIES` array in `js/main.js`. Filter
  buttons only appear for categories in use; unknown categories still render.
- The projects filter is mirrored in the URL hash as `#projects?category=<name>` so
  filtered views are linkable. `parseHash()` / `writeHash()` own that format.
- Clicking a project card opens the project viewer: a modal `<dialog>`
  (`#project-viewer`) that fills the window with a margin of dimmed page around
  it and scrolls internally. Open projects are linkable as `#project-<id>`.
  The image lightbox is also a modal `<dialog>`, so it stacks above the viewer.
- Imagery belongs inside the write-up: a `writeup` block may carry `figures`, a
  list of rows (`images`, optional `caption` and `legend`). A multi-image row
  renders side by side at the first image's size so comparisons line up. Images
  carry `width`/`height` and never scale above their native size. Set
  `mediaFirst: true` on a block to put its figures above its text.
  `project.images[0]` is the card thumbnail only; the viewer shows images
  solely through write-up figures (there is no gallery). Write-up `body` text
  supports `**bold**`.
- A project may set `"accent": "red"` to recolor its card and viewer (top
  rule, category label, step numbers, bold text, primary button). Accent
  palettes are `[data-accent='<name>']` blocks in `css/styles.css`, using
  tokens from `:root`; `red` is AARP red for the LifeSync project.

## Visual direction

Dark, earthy, cartographic — a satellite basemap or Google Earth night view, not a
generic dark-mode developer portfolio. Deep near-black green ground (`--bg #0A1A14`),
lighter card surfaces (`--surface #122A20`), off-white text (`--text #F0F4EF`), sage
accent (`--sage #9BC7A9`), with gold (`--gold`) and water blue (`--water`) as sparing
secondary accents. The hero is a satellite cover image (`site.json` → `hero.image`)
framed so open ocean sits behind a centered text panel, with the coastline along the
left and bottom. The framing variables (`--hero-position`, `--hero-zoom`,
`--hero-origin`) on `.hero--image` are tuned to that specific image.

## Local dev

`fetch()` of the JSON fails over `file://`. Serve the folder:
`python -m http.server 8000`.

## Content status

Every project in `data/projects.json` is Everett's real work; the scaffolded
placeholder projects have been removed. Don't invent project specifics: take them
from the materials he provides (decks, READMEs, notebooks). Client-attributable work carries a
`confidentialityNote`; keep that habit — anonymize clients and reconstruct figures
from public data rather than reproducing client deliverables.
