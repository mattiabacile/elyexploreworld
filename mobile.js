(() => {
  const mobile = matchMedia('(max-width: 767px), (hover: none) and (max-width: 950px) and (max-height: 500px)');
  const pathFor = (source, width) => normalPath(source).replace(/^assets\//, 'assets/' + 'mobile/').replace(/\.webp$/, `-${width}.webp`);
  const responsiveImages = new Map();
  const variantsAvailable = new Set(["assets/bali-rice-terraces-retouched.webp", "assets/consultation-japan-blossoms-retouched.webp", "assets/consultation-japan-bridge-retouched.webp", "assets/consultation-japan-city-retouched.webp", "assets/consultation-japan-door-retouched.webp", "assets/consultation-japan-lanterns-retouched.webp", "assets/consultation-japan-stream-retouched.webp", "assets/contact-fuji-blossoms.webp", "assets/contact-ocean-waves.webp", "assets/contact-turquoise-lagoon.webp", "assets/elisa-aereo-retouched.webp", "assets/elisa-case-colorate-retouched.webp", "assets/elisa-cocco-bali-retouched.webp", "assets/elisa-cocco-retouched.webp", "assets/elisa-cocco-ristorante-retouched.webp", "assets/elisa-risaie-retouched.webp", "assets/elisa-tartaruga-retouched.webp", "assets/hero-beach.webp", "assets/hero-palms.webp", "assets/hero-river-retouched.webp", "assets/hero-sunset-desktop.webp", "assets/hero-temple-retouched.webp", "assets/indonesia-slideshow/IMG20250815100744-4k.webp", "assets/indonesia-slideshow/IMG20250815122849-4k.webp", "assets/indonesia-slideshow/IMG20250815122942-4k.webp", "assets/indonesia-slideshow/IMG20250815123639-4k.webp", "assets/indonesia-slideshow/IMG_20230830_094751_122-4k.webp", "assets/indonesia-slideshow/IMG_20230830_094751_184-retouched.webp", "assets/indonesia-slideshow/IMG_20230830_094751_223-4k.webp", "assets/indonesia-slideshow/IMG_20230830_094751_265-4k.webp", "assets/indonesia-slideshow/IMG_20230830_094751_371-4k.webp", "assets/itinerary-batur-mirrored-enhanced.webp", "assets/itinerary-day-by-day.webp", "assets/nusa-penida-kelingking-retouched.webp", "assets/stories/bali-detail-retouched.webp", "assets/stories/bali-retouched.webp", "assets/stories/japan-detail-retouched.webp", "assets/stories/japan-retouched.webp", "assets/stories/singapore-retouched.webp", "assets/tips/bali-market-retouched.webp", "assets/tips/packing-retouched.webp", "assets/tips/planning-retouched.webp"]);
  const normalPath = source => source.replace(/^\//, "");
  const hasVariants = source => variantsAvailable.has(normalPath(source));
  // Backgrounds and SVG images cannot use picture sources.
  // Available variants are fixed; select the next sufficient size.
  window.elyImageSource = source => mobile.matches && hasVariants(source)
    ? pathFor(source, [640, 960, 1440].find(width => width >= innerWidth * Math.min(devicePixelRatio, 3)) || 1440)
    : source;
  window.elySetImage = (image, source) => {
    responsiveImages.set(image, source);
    const variants = [640, 960, 1440].map(width => `${pathFor(source, width)} ${width}w`).join(', ');
    const pictureSource = image.parentElement?.querySelector('source');
    if (pictureSource) pictureSource.srcset = hasVariants(source) ? variants : '';
    if (mobile.matches && hasVariants(source)) {
      image.sizes = '100vw';
      image.srcset = variants;
    } else image.removeAttribute('srcset');
    image.src = source;
  };
  mobile.addEventListener('change', () => {
    for (const [image, source] of responsiveImages) window.elySetImage(image, source);
  });

  const nav = document.querySelector('#primary-nav');
  const headerCTA = document.querySelector('.header-cta');
  if (nav && headerCTA) {
    const cta = headerCTA.cloneNode(true);
    cta.className = 'mobile-menu-cta';
    cta.hidden = true;
    nav.querySelector('.menu-socials').before(cta);
    const syncMenuCTA = () => { cta.hidden = !mobile.matches; };
    mobile.addEventListener('change', syncMenuCTA);
    syncMenuCTA();
  }
})();
