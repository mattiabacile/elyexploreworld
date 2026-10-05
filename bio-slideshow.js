(() => {
  const gallery = document.querySelector('.bio-portrait');
  if (!gallery) return;
  const slides = [...gallery.querySelectorAll('.bio-slide')];
  const artwork = gallery.querySelector('.bio-portrait-art');
  const controls = gallery.querySelector('.bio-slideshow-controls');
  const pause = gallery.querySelector('[data-bio-pause]');
  const count = gallery.querySelector('.bio-slide-count');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 767px), (hover: none) and (max-width: 950px) and (max-height: 500px)');
  let current = 0;
  let paused = reducedMotion.matches || mobile.matches;
  let visible = false;
  let timer;
  // Decode each original before it can become a slide, avoiding blank transitions.
  const ready = new Map();
  const prepare = index => {
    if (!ready.has(index)) {
      const slide = slides[index];
      const image = new Image();
      image.src = window.elyImageSource(slide.dataset.src || slide.getAttribute('href'));
      ready.set(index, image.decode().then(() => { slide.setAttribute('href', image.src); return true; }, () => false));
    }
    return ready.get(index);
  };
  let request = 0;
  async function show(index) {
    const token = ++request;
    const next = (index + slides.length) % slides.length;
    if (!await prepare(next) || token !== request) return;
    slides[current].classList.remove('is-active');
    slides[next].classList.add('is-active');
    current = next;
    artwork.setAttribute('aria-label', slides[current].dataset.label);
    count.textContent = `${current + 1} / ${slides.length}`;
  }
  function schedule() {
    clearInterval(timer);
    if (!mobile.matches && !paused && visible && !document.hidden) {
      timer = setInterval(() => show(current + 1), 5000);
    }
    pause.textContent = paused ? '▷' : 'Ⅱ';
    pause.setAttribute('aria-label', paused ? 'Riprendi lo slideshow' : 'Metti in pausa lo slideshow');
  }
  for (const [selector, step] of [['[data-bio-prev]', -1], ['[data-bio-next]', 1]]) {
    gallery.querySelector(selector).addEventListener('click', () => {
      paused = true;
      show(current + step);
      schedule();
    });
  }
  pause.addEventListener('click', () => { paused = !paused; schedule(); });
  gallery.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    paused = true;
    show(current + (event.key === 'ArrowRight' ? 1 : -1));
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', () => {
    paused = reducedMotion.matches || mobile.matches;
    schedule();
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) prepare(current);
    schedule();
  }, { rootMargin: '200px 0px', threshold: 0 }).observe(gallery);
  controls.hidden = false;
  const syncLayout = () => {
    // Reuse the same photographs in a clean, tighter frame on smartphones.
    artwork.setAttribute('viewBox', mobile.matches ? '31 30 739 1025' : '0 0 780 1088');
    if (mobile.matches) paused = true;
    schedule();
  };
  mobile.addEventListener('change', syncLayout);
  syncLayout();
  schedule();
})();
