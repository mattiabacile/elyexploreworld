(() => {
  const section = document.querySelector('#contatti');
  const gallery = section?.querySelector('.contact-background-slideshow');
  if (!gallery) return;
  const slides = [...gallery.querySelectorAll('.contact-background-slide')];
  const panel = section.querySelector('.contact-panel');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 767px), (hover: none) and (max-width: 950px) and (max-height: 500px)');
  const photos = [
    [
        "assets/contact-fuji-blossoms.webp",
        "50% 75%",
        1.333333
    ],
    [
        "assets/hero-sunset-desktop.webp",
        "50% 65%",
        1.333333
    ],
    [
        "assets/hero-palms.webp",
        "50% 58%",
        1.333333
    ],
    [
        "assets/hero-beach.webp",
        "50% 65%",
        0.75
    ],
    [
        "assets/itinerary-day-by-day.webp",
        "50% 65%",
        1.333333
    ],
    [
        "assets/stories/japan-retouched.webp",
        "50% 60%",
        2.250352
    ],
    [
        "assets/stories/bali-retouched.webp",
        "50% 60%",
        1.777778
    ],
    [
        "assets/stories/singapore-retouched.webp",
        "50% 55%",
        3.487738
    ],
    [
        "assets/bali-rice-terraces-retouched.webp",
        "50% 55%",
        1.5
    ],
    [
        "assets/nusa-penida-kelingking-retouched.webp",
        "50% 55%",
        1.499063
    ],
    [
        "assets/hero-river-retouched.webp",
        "50% 55%",
        0.826446
    ],
    [
        "assets/hero-temple-retouched.webp",
        "50% 55%",
        0.753453
    ],
    [
        "assets/indonesia-slideshow/IMG20250815100744-4k.webp",
        "50% 55%",
        0.75
    ],
    [
        "assets/indonesia-slideshow/IMG20250815122849-4k.webp",
        "50% 55%",
        0.75
    ],
    [
        "assets/indonesia-slideshow/IMG20250815122942-4k.webp",
        "50% 55%",
        0.75
    ],
    [
        "assets/indonesia-slideshow/IMG20250815123639-4k.webp",
        "50% 55%",
        0.75
    ],
    [
        "assets/indonesia-slideshow/IMG_20230830_094751_122-4k.webp",
        "50% 55%",
        1.0
    ],
    [
        "assets/indonesia-slideshow/IMG_20230830_094751_184-retouched.webp",
        "50% 55%",
        1.0
    ],
    [
        "assets/indonesia-slideshow/IMG_20230830_094751_223-4k.webp",
        "50% 55%",
        1.0
    ],
    [
        "assets/indonesia-slideshow/IMG_20230830_094751_265-4k.webp",
        "50% 55%",
        1.0
    ],
    [
        "assets/indonesia-slideshow/IMG_20230830_094751_371-4k.webp",
        "50% 55%",
        1.0
    ],
    [
        "assets/consultation-japan-blossoms-retouched.webp",
        "50% 50%",
        0.75
    ],
    [
        "assets/consultation-japan-bridge-retouched.webp",
        "50% 50%",
        0.75
    ],
    [
        "assets/consultation-japan-city-retouched.webp",
        "50% 50%",
        0.75
    ],
    [
        "assets/consultation-japan-lanterns-retouched.webp",
        "50% 50%",
        0.75
    ],
    [
        "assets/consultation-japan-stream-retouched.webp",
        "50% 50%",
        0.75
    ]
];
  let current = 0;
  let active = 0;
  let visible = false;
  let timer;
  let request = 0;
  let pending;
  const layerPhotos = [0, 0];
  gallery.dataset.photoCount = photos.length;
  gallery.dataset.photoIndex = current;

  const canPlay = () => visible && !document.hidden && !reducedMotion.matches && !panel.contains(document.activeElement);
  function sourceFor(index) {
    const [source, , aspect] = photos[index];
    if (!mobile.matches) return source;
    const required = Math.max(section.clientWidth, section.clientHeight * aspect) * Math.min(devicePixelRatio, 2);
    const width = [640, 960, 1440].find(size => size >= required);
    return width ? source.replace(/^assets\//, 'assets/' + 'mobile/').replace(/\.webp$/, `-${width}.webp`) : source;
  }
  function prepare(index) {
    const source = sourceFor(index);
    if (pending?.index === index && pending.source === source) return pending.ready;
    const image = new Image();
    image.src = source;
    pending = { index, source, ready: image.decode().then(() => true, () => false) };
    return pending.ready;
  }
  async function advance() {
    const token = ++request;
    for (let step = 1; step < photos.length; step++) {
      const next = (current + step) % photos.length;
      if (!await prepare(next)) continue;
      if (token !== request || !canPlay()) return;
      const nextLayer = (active + 1) % slides.length;
      slides[nextLayer].loading = 'eager';
      slides[nextLayer].src = sourceFor(next);
      layerPhotos[nextLayer] = next;
      slides[nextLayer].style.objectPosition = photos[next][1];
      try { await slides[nextLayer].decode(); } catch { continue; }
      if (token !== request || !canPlay()) return;
      slides[active].classList.remove('is-active');
      slides[nextLayer].classList.add('is-active');
      active = nextLayer;
      current = next;
      gallery.dataset.photoIndex = current;
      prepare((current + 1) % photos.length);
      return;
    }
  }
  function schedule() {
    clearInterval(timer);
    request++;
    if (canPlay()) {
      prepare((current + 1) % photos.length);
      timer = setInterval(advance, 5000);
    }
  }
  const syncSources = () => {
    slides.forEach((slide, layer) => {
      const source = sourceFor(layerPhotos[layer]);
      if (slide.getAttribute('src') !== source) slide.src = source;
    });
    schedule();
  };
  syncSources();
  new ResizeObserver(syncSources).observe(section);
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', schedule);
  mobile.addEventListener('change', syncSources);
  panel.addEventListener('focusin', schedule);
  panel.addEventListener('focusout', () => queueMicrotask(schedule));
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }, { threshold: 0 }).observe(section);
})();
