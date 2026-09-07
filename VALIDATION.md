# Responsive validation — 7 September 2026

Validated with headless Google Chrome at device scale 1. Fonts and image decoding were awaited before screenshot comparisons.

| Viewport | Horizontal overflow | Section order | Copy preservation |
| --- | --- | --- | --- |
| 320 × 844 | None | Pass | Pass |
| 360 × 844 | None | Pass | Pass |
| 375 × 844 | None | Pass | Pass |
| 390 × 844 | None | Pass | Pass |
| 393 × 844 | None | Pass | Pass |
| 412 × 844 | None | Pass | Pass |
| 430 × 844 | None | Pass | Pass |
| 1440 × 1080 | None | Original | Pass |
| 1920 × 1080 | None | Original | Pass |

Desktop comparisons against the unmodified project: **0 changed pixels** at both 1440 and 1920 px. The same browser, font loading, and decoded images were used for before/after comparisons.

All original main-content text matches the baseline after whitespace normalization (including treating HTML line breaks as spaces). No headings, CTA labels, paragraphs, Lorem Ipsum, destinations, or itinerary entries were rewritten.

Mobile order: header → hero → the referenced Chi sono section → services introduction → first service → second service → itinerary preview. The obsolete duplicate biography and services-help strip remain desktop-only. The referenced biography's existing quote can be expanded with its original CTA. Neither a method section nor a final contact section exists in the supplied homepage; neither was added.

Checked:

- Full-page renders visually inspected at 320, 360, 375, 390, 430, 1440, and 1920 px; 390 px compared with the approved reference.
- All seven phone widths checked for document and visible-element overflow with global horizontal clipping disabled.
- No visible broken images or JavaScript exceptions.
- Menu opens with Enter, focuses the first link, closes with Escape, and returns focus to its button.
- Forward and reverse Tab navigation stays within the open menu; Space activates the mobile biography disclosure.
- Choosing a navigation link closes the menu and moves focus to its section.
- Resizing to desktop resets the disclosure state and restores desktop navigation/biography content.
- Hero CTA navigates to services.
- Biography CTA expands/collapses the original quote.
- Both service CTAs and the itinerary CTA open native modal dialogs populated from the existing content. Escape closes each dialog and returns focus to its trigger.
- Existing fonts and original photography reused; images retain their aspect ratios.

The mobile reference contains different photographs and substantially shorter copy. The implementation therefore retains the original photographs/crops and all three original descriptions per service. This necessarily produces taller cards. The itinerary visual is a live miniature beside the copy; its CTA opens the same original entries at readable size.

Validation covers Chromium rendering and keyboard interaction. Physical iOS Safari and Android devices were not available for testing.

Rendered screenshots and the machine-readable report are saved in:

`/Users/Mattia/.codex/visualizations/2026/09/07/01a07dc1-b8d4-7540-832c-bb1795c6cd7c/ely-responsive`
