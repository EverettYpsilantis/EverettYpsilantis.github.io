# Everett Ypsilantis — Portfolio

Personal portfolio site. Vanilla HTML, CSS, and JavaScript — no framework, no build
step, no dependencies. Every piece of content on the page is loaded at runtime from
the JSON files in `data/`.

## Run it locally

The page fetches its JSON at load time, and browsers block `fetch()` over `file://`.
Open it through a local server, not by double-clicking `index.html`:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

Any static server works (`npx serve`, VS Code Live Server, etc.).

## Deploy to Netlify

No build command, no dependencies. In Netlify: connect the repo, leave the build
command blank, and set the publish directory to the repo root. `netlify.toml` in the
repo already declares this, so a plain "add new site from Git" will work as-is.
After that, pushing to the default branch redeploys.

## Adding a project

1. Drop images in `assets/images/<project-id>/`.
2. Append one object to `data/projects.json`.

That's it — no HTML or CSS changes. Schema:

```jsonc
{
  "id": "unique-kebab-case-id",          // also used for the deep link (#project-<id>)
  "title": "Project title",
  "category": "GIS & Spatial Analysis",  // see categories below
  "client": null,                        // string, or null if unnamed/confidential
  "role": "Your role",
  "dateRange": "2024 – 2025",
  "teaser": "One or two sentences shown on the collapsed card.",
  "writeup": [                           // shown when the card is expanded
    { "heading": "The problem",  "body": "..." },
    { "heading": "The approach", "body": "..." },
    { "heading": "The result",   "body": "..." }
  ],
  "tools": ["ArcGIS Pro", "Python"],     // rendered as tags
  "dataSources": ["FEMA NFHL", "NWI"],   // public datasets used
  "images": [
    { "src": "assets/images/unique-kebab-case-id/01.png",
      "alt": "Description for screen readers",
      "caption": "Caption under the thumbnail and in the lightbox" }
  ],
  "links": [{ "label": "GitHub repo", "url": "https://..." }],
  "featured": true,                      // featured projects sort to the top
  "confidentialityNote": "Client anonymized; figures reconstructed from public data."
}
```

Notes:

- The **first image** in `images` becomes the card thumbnail. Omit `images` entirely
  and the card renders without one.
- Empty arrays (`links`, `dataSources`, `images`) are fine — those blocks are skipped.
- `confidentialityNote` can be `null`.

### Categories

The filter bar order is defined by `CATEGORIES` in `js/main.js`:

- `GIS & Spatial Analysis`
- `Machine Learning & Analytics`
- `AI & Agentic Systems`
- `Remote Sensing`

A filter button only appears if at least one project uses that category. A project
with a category outside this list still renders and gets its own button after the
known ones.

### Linking to a filtered view

The active filter lives in the URL hash, so a filtered view is linkable:

```
https://example.com/#projects?category=Remote%20Sensing
```

## Editing the rest of the site

| What | Where |
| --- | --- |
| Name, tagline, nav labels, hero CTAs, About copy, contact links | `data/site.json` |
| Jobs, education, awards, skill groups | `data/experience.json` |
| Projects | `data/projects.json` |
| Colors, type, spacing | the `:root` custom properties at the top of `css/styles.css` |

Skill groups are read from the object keys in `experience.json` → `skills`. Rename or
add a group there and the Skills section follows.

## Content status

All projects in `data/projects.json` are real work; the original placeholder
projects and their SVG figures have been removed.

## Accessibility and motion

- Semantic landmarks, a skip link, and visible focus rings throughout.
- Expandable cards use `aria-expanded` / `aria-controls`, and collapsed content is
  `inert` so it stays out of the tab order.
- The lightbox is a labelled dialog with Escape to close and arrow-key navigation,
  and returns focus to the thumbnail that opened it.
- `prefers-reduced-motion: reduce` disables the animated contour background, smooth
  scrolling, and all transitions.

## Structure

```
index.html            static shell — landmarks and empty containers only
css/styles.css        all styling; design tokens in :root
js/main.js            fetches the JSON and builds every section
data/site.json        bio, nav, hero, about, contact
data/projects.json    all projects
data/experience.json  roles, education, awards, skills
assets/images/        one folder per project
netlify.toml          publish root, no build command
```
