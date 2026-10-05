# Story photographs — provenance

Historical creation record. During the 27 September 2026 cleanup, used images were converted to WebP. The original PNG/JPEG files and the unused Amalfi/Jordan images are now in the external pre-cleanup backup, not in the published asset folder. `bali-retouched.webp` and `japan-retouched.webp` come from the 1600px JPEG derivatives; `bali-detail-retouched.webp` and `japan-detail-retouched.webp` preserve the separate original compositions. Historical prompts below retain their original filenames.


The exact original Bali, Amalfi Coast, Petra and Mount Fuji photographs were absent from the supplied project. The user subsequently requested that the photographs be generated from scratch, with natural photographic texture and no plastic or stereotyped AI appearance. No photographs were extracted from the reference screenshot.

Generated with the built-in image_gen tool on 9 September 2026. Final files are local assets in this directory. Bali received a second composition pass so that the temple tip stays inside the custom SVG silhouette. These are generated illustrations in a photographic style, not authenticated location photographs. They retain the subjects and intended visual composition, but do not reproduce the source photograph pixels.

## bali.png

Use case: photorealistic-natural. Create a single landscape travel photograph for the large Bali feature in the attached website reference (reference only, do not render UI). Ulun Danu Beratan temple on Lake Beratan, eleven dark layered pagoda roofs centered at x48%, base at y75%, low little shrines on both sides, quiet lake reflecting the stone island, distant densely forested volcanic ridge to the right, warm pale low sunrise to the left with real irregular clouds, naturally backlit leaves framing upper left, small defocused red flowers at lower right. Wide 16:9 horizontal photograph. Camera across water at human eye level, temple dominates central 60% height, surroundings visible. Restrained natural editorial photography, actual irregular weathered stone, subtle sensor grain, real atmospheric perspective, soft highlights, realistic greens. Match reference composition, not stylization. No synthetic HDR, no excessive orange teal grade, no plastic foliage or water, no repeated AI patterns, no exaggerated sun rays, no fantasy buildings, no text, border or watermark. Generate from scratch.

## amalfi.png

Use case: photorealistic-natural. One single panoramic 2.25:1 landscape travel photograph, Amalfi Coast Positano from a hillside looking down the coast. In foreground left third irregular leafy lemon branches with a handful of believable yellow lemons, pastel cream and peach buildings cascade down steep cliffs in middle-left, calm turquoise Mediterranean covers right half, craggy coastline receding toward upper right in afternoon haze. Match the first lower photograph in supplied reference in composition. Natural candid travel editorial photography, weathered real building textures, no HDR, no plastic surfaces, no hyper-saturated water, no repetitive AI textures, no extra props, no lettering, no watermark, no UI. Generate from scratch.

## jordan.png

Use case: photorealistic-natural. A single panoramic 2.25:1 landscape travel photograph of Petra Jordan, a young adult woman seen from behind sitting on a rugged sandstone ledge in the lower center-left at x40%, wearing an ordinary cream linen dress and straw sunhat, dark brown hair. She looks across canyon toward Al Deir monastery facade at x57%, naturally weathered sandstone cliffs behind, dusty warm light near sunset with small sun near upper right. Wide environmental composition, human small enough to see landscape, shoulders around y50% and seated figure meets lower edge. Match second lower photograph of reference. Documentary travel photography, believable anatomy, worn stone, incidental irregular detail, restrained natural colors, no smooth wax skin, no plastic rock, no AI repetitive patterns, no cinematic HDR or dramatic fantasy landscape, no text or UI. Generate from scratch.

## japan.png

Use case: photorealistic-natural. Single panoramic 2.25:1 landscape editorial travel photograph: distant Mount Fuji centered at x58% y45% with believable snow and pale pink sunset sky, quiet reflective lake and town along its far bank, softly lit cherry blossom branches across upper left and left edge, a cropped red Japanese pagoda at far right occupying rightmost 17%. Match third lower photograph in supplied reference as closely in framing as possible. Real photographic material texture, natural imperfect blossoms, subtle hazy distance, muted pink and warm red, irregular water reflection. No artificial HDR, no plastic textures, no excessive saturation, no repeated AI patterns, no symmetry tricks, no fantasy mountain, no text border watermark or website UI. Generate from scratch.

## Bali composition correction

Use case: precise-object-edit. This generated Bali photo is the EDIT TARGET for a travel website, not a UI screenshot. Retain photographic realism, scene, lake, foreground leaves, flowers and natural weathered architecture. Adjust composition for an organic top mask: make the tall temple and entire island ensemble 18% smaller in the frame and shift it a little left and down, so tallest temple tip lies at x46%, y19%, base of island at y77%. Tallest temple must have full intact roof tip, substantial clear sky above it. Distant misty densely wooded volcanic mountain should rise behind temple toward upper right, gentle clouds touch mountain summit. Sunrise stays far left but remove the obvious starburst rays, light should be gentle and indirect. Keep realistic naturally variable stone texture and layered roofs, natural muted warm palette, no plastic surfaces or HDR, no duplicated AI patterns. Full rectangular landscape 16:9 photograph with no mask, borders, words or watermark. Do not add objects. The photo will be cropped by a custom webpage shape.

## Decorative artwork

botanical-branch.svg is a locally authored vector drawing. Existing ../balinese-botanical-ambient.png supplies the edge fronds through an SVG color-to-alpha filter and CSS positioning. The mask, contour and color-to-alpha filter are inline SVG in index.html. No decorative raster asset was generated.

## Blog slideshow — 25 September 2026

- `bali-retouched.webp` and `japan-retouched.webp`: WebP conversions of the 1600 px JPEG derivatives of the existing generated illustrations above. Original files are in the pre-cleanup backup.
- `singapore-retouched.webp`: photograph by Bára Buri, downloaded from Unsplash. Source: https://unsplash.com/photos/mFTcsgX0SYA ; image: https://images.unsplash.com/photo-1637062285066-d408467a87a8?auto=format&fit=crop&w=1600&q=85 . Actual dimensions 1600 × 459. This is a representative destination photograph, not a photograph attributed to Ely.
- The destination decks/excerpts are proposed editorial preview copy. This describes the September 25 state. The current site links to `racconto.html?story=<slug>`; article body copy is still provisional.

Ritocco del 5 ottobre 2026: resa tonale e nitidezza leggere, senza rigenerazione AI, preservando soggetti, composizione e risoluzione originali; salvataggio WebP senza perdita. Le fonti e la provenienza sopra restano quelle delle immagini originali.

Sorgente fotografica originale in alta risoluzione recuperata il 5 ottobre 2026 per `singapore-retouched.webp`: https://images.unsplash.com/photo-1637062285066-d408467a87a8?fm=png&fit=max&w=3840 . Dimensioni native: 3840 × 1101. Nessuna rigenerazione AI.
