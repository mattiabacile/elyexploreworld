# Consultation banner — implementation note

Date: 2026-09-26.

The user-supplied reference is `/Users/Mattia/Desktop/Screenshot 2026-09-26 alle 13.05.25.png`. It is copied unchanged to `assets/consultation-reference.png`; both files have SHA-256 `e11aa84b9fe4b6f95d6e415289adc06f907fd216f8d843e78d375dad5a83965c`.

The banner in `index.html` sits between the biography (`chi-sono`) and services (`servizi`). `consultation.css` uses cropped regions of the reference for decorative photography and empty paper texture. The crop excludes the reference's Bali stamp and embedded lettering; the original asset itself remains intact.

The heading, supporting copy, offer details and CTA are live HTML. The CTA links to the existing `#contatti` section, supporting PRODUCT.md's free 30-minute consultation objective. The section has an accessible heading, decorative artwork is hidden from assistive technology, and the button has a visible keyboard focus style. At 900 px and below, the layout becomes a single column; reduced-motion preferences disable the button transition.

This is a local, reference-led extension of the existing visual system. Its paper treatment, serif display, muted green CTA and terracotta accent belong to this banner; no new global tokens or component rules are required. `DESIGN.md` and `.impeccable/design.json` are preserved without edits.

Verification recorded here covers source structure, CSS behavior and asset identity. Rendered fidelity, responsive fit and interaction checks are handled separately; this note does not claim a completed visual or WCAG audit.

## Browser verification

- Chrome captures at 2010, 1440, 390 and 320 px saved in `.impeccable/review/banner-*.png`.
- At the reference width the banner measures 2010 × 262 px.
- DOM order verified: `chi-sono` → consultation banner → `servizi`.
- After fonts settle, no banner/document horizontal overflow at 320, 768, 900, 901, 1024 or 1501 px; CTA height at least 44 px.
- CTA click reaches existing `#contatti` (72 px below viewport top).
- Corrected original image bottom-rule leakage, heading scale, small-text contrast, narrow-phone heading fit and minimum CTA height.
- Reference recreation retains live HTML text; minor font rasterization and paper texture differences remain. No claim of pixel identity.

## Background refinement — 26 September 2026

User requested stronger separation from biography/services. Banner now uses forest #344c3d, ivory text, warm terracotta emphasis and ivory CTA. Decorative source artwork retained. The mobile heading may wrap during fallback-font loading to prevent transient overflow.

Blog now has an olive outer rule, double top rule, paper inset, sand surround and divider under the introduction. Changes are local to the two sections; global design tokens remain unchanged. Browser checks cover widths 320–2010 px, next/previous carousel controls and the consultation contact link. Independent visual review approved desktop/mobile captures.

## Correction after user rejected the framed version

Replaced dark banner with sand #cfb89e, dark green copy/CTA and terracotta heading emphasis. Photograph blends with the paper without the prior white glow; last 4% of its height softens the edge.

Removed the Blog's added horizontal padding, smaller viewport-height calculation, inner padding overrides and extra introduction divider. Original shell/carousel sizes are restored; frame is an absolute section pseudo-element with no effect on layout. Only outside vertical space is added. Current captures: `.impeccable/review/spacious-*.png`. Desktop frame closes on all four sides; photo/card proportions match the initial unframed version. Desktop/mobile captures show no horizontal overflow. Global design tokens remain untouched.
