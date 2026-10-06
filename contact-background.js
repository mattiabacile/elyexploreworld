(() => {
  const section = document.querySelector('#contatti');
  const image = section?.querySelector('.contact-background-photo');
  if (!image) return;
  const source = 'assets/contact-ocean-waves.webp';
  const mobile = matchMedia('(max-width: 767px), (hover: none) and (max-width: 950px) and (max-height: 500px)');
  const syncSource = () => {
    let next = source;
    if (mobile.matches) {
      const required = Math.max(section.clientWidth, section.clientHeight * 1152 / 2048) * Math.min(devicePixelRatio, 2);
      const width = [640, 960, 1440].find(size => size >= required);
      if (width) next = source.replace(/^assets\//, 'assets/' + 'mobile/').replace(/\.webp$/, `-${width}.webp`);
    }
    if (image.getAttribute('src') !== next) image.src = next;
  };
  syncSource();
  new ResizeObserver(syncSource).observe(section);
  mobile.addEventListener('change', syncSource);
})();
