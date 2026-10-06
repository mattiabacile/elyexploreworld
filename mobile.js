(() => {
  const mobile = matchMedia('(max-width: 767px), (hover: none) and (max-width: 950px) and (max-height: 500px)');
  const pathFor = (source, width) => source.replace(/^assets\//, 'assets/' + 'mobile/').replace(/\.webp$/, `-${width}.webp`);
  const responsiveImages = new Map();
  // Backgrounds and SVG images cannot use picture sources.
  // Available variants are fixed; select the next sufficient size.
  window.elyImageSource = source => mobile.matches && source.endsWith('.webp')
    ? pathFor(source, [640, 960, 1440].find(width => width >= innerWidth * Math.min(devicePixelRatio, 3)) || 1440)
    : source;
  window.elySetImage = (image, source) => {
    responsiveImages.set(image, source);
    const variants = [640, 960, 1440].map(width => `${pathFor(source, width)} ${width}w`).join(', ');
    const pictureSource = image.parentElement?.querySelector('source');
    if (pictureSource) pictureSource.srcset = variants;
    if (mobile.matches && source.endsWith('.webp')) {
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
