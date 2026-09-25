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

The Blog link opens the new Racconti di viaggio section at `/#blog`. Its isolated styles and interactions are in `stories.css` and `stories.js`; generated photographs and their provenance are in `assets/stories/`. See `BLOG-VALIDATION.md` for reference measurements and visual checks.

The Contatti navigation and Parliamone control lead to the contact section, which contains the approved email address and Instagram profile. Service and itinerary buttons open accessible previews of existing content. Blog preserves the centered introduction, organic feature photograph, accompanying text and three photographic cards of the reference; these cards control the horizontal slideshow; its destination previews are marked “Racconto in arrivo” until complete article content and URLs are available.

See `VALIDATION.md` for responsive and visual checks.

### Publishing a Blog article

Each `.stories-slide` in `index.html` contains the destination, image, title, deck, excerpt, and publication status. Add another article following that structure; selectors and the counter are generated from the slides automatically. When an article is ready, replace its `.stories-publication` status with a real link to its published page, with a destination-specific accessible name. No full article pages or CMS are included. Native horizontal scrolling remains available without JavaScript; with JavaScript, buttons, keyboard arrows, Home/End, and polite status announcements are enabled. There is no autoplay.

Desktop Blog height is the viewport minus the 72 px shared header. Very short windows below 602 px and layouts up to 900 px wide use readable content flow instead of clipping content.
