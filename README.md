# ElyExploreWorld

Static HTML/CSS/JavaScript website. Serve this folder locally:

```sh
python3 -m http.server 4173
```

Open http://localhost:4173/.

- `index.html` is the shared source of homepage content for desktop and mobile.
- `hero.css` retains the existing desktop design.
- `responsive.css` implements the approved phone composition below 768 px and the accessible navigation disclosure below 901 px.
- `script.js` handles navigation, the mobile biography disclosure, and previews of the service/itinerary content.

The published copy is mapped from `SITO TD (1).docx`. Marketing fields without approved wording use the requested `lorem ipsum dolorem...` placeholder. The biography includes three editorial versions. The third, at `#chi-sono-blob`, follows the organic reference, includes both complete descriptions inside the green panel, and provides email and Instagram links.

The mockup's vase/books image is absent from the supplied assets. The third biography reuses the supplied portrait artwork, with the empty button removed from a separate image copy. Its portrait retains its aspect ratio and its green panel grows with the text. See `BIO-VALIDATION.md` for visual checks and asset provenance.

The Blog link opens the Racconti di viaggio section at `/#blog`. Its isolated styles and interactions are in `stories.css` and `stories.js`. Each destination now links to `racconto.html?story=<slug>`, whose editorial article layout is defined by `racconto.css` and populated by `racconto.js`. Generated photographs and their provenance are in `assets/stories/`. See `BLOG-VALIDATION.md` for the index section and `RACCONTO-VALIDATION.md` for the article surface.

The Contatti navigation and Parliamone control lead to the contact section, which contains the approved email address and Instagram profile. Service and itinerary buttons open accessible previews of existing content. Blog uses a panoramic photograph and overlapping caption, following the September 27 reference. Japan, Bali, and Singapore rotate automatically every six seconds. Article links open the shared long-form story template for the selected destination.

See `VALIDATION.md` for responsive and visual checks.

### Publishing a Blog article

Each `.stories-slide` in `index.html` contains a destination, photo, caption, excerpt, and link to the matching `story` slug. The destination metadata, chapter titles, captions, related links, and images for those slugs live in `racconto.js`; the shared semantic structure lives in `racconto.html`. The long-form paragraph copy is still placeholder text and must be replaced with approved editorial copy before treating the articles as final editorial content.

`stories.css` defines the panoramic layout directly. `stories.js` cycles through slides every six seconds with a fade transition, wrapping at both ends. Arrow buttons and keyboard arrows/Home/End provide manual navigation. Autoplay pauses on mouse hover, keyboard focus, an open preview, a hidden browser tab, or when the section leaves view. A persistent pause control is available, and reduced-motion preferences disable autoplay by default. On phones the caption stacks beneath the photograph.
