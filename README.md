# ElyExploreWorld

Static HTML/CSS/JavaScript website. Serve this folder locally:

```sh
python3 -m http.server 4173
```

Open http://localhost:4173/.

- `index.html` is the shared source of homepage content for desktop and mobile.
- `hero.css` retains the existing desktop design.
- `responsive.css` implements the approved phone composition below 768 px and the accessible navigation disclosure below 901 px.
- `script.js` handles navigation, the mobile biography disclosure, and previews of the existing service/itinerary content.

All original website wording and Lorem Ipsum are retained. Mobile service cards contain the full original descriptions, so they are taller than the mockup's shortened examples. Mobile uses the biography shown in the supplied desktop reference; the earlier duplicate biography remains on desktop.

The mockup's vase/books image is absent from the supplied assets. The mobile biography reuses `assets/hero-river.jpg`. No replacement photographs or portraits were generated.

The existing Blog/Contatti labels and disabled desktop Parliamone control have no destinations in this static project. Service and itinerary buttons open accessible previews of existing content; they do not imply additional pages or backend services.

See `VALIDATION.md` for responsive and visual checks.
