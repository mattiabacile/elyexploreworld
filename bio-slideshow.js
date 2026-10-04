(() => {
  const gallery = document.querySelector('.bio-portrait');
  if (!gallery) return;
  const slides = [...gallery.querySelectorAll('.bio-slide')];
  const artwork = gallery.querySelector('.bio-portrait-art');
  const controls = gallery.querySelector('.bio-slideshow-controls');
  const pause = gallery.querySelector('[data-bio-pause]');
  const count = gallery.querySelector('.bio-slide-count');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let paused = reducedMotion.matches;
  let visible = false;
  let timer;
  // Decode each original before it can become a slide, avoiding blank transitions.
  const ready = slides.map(slide => {
    const image = new Image();
    image.src = slide.getAttribute('href');
    return image.decode().then(() => true, () => false);
  });
  let request = 0;
  async function show(index) {
    const token = ++request;
    const next = (index + slides.length) % slides.length;
    if (!await ready[next] || token !== request) return;
    slides[current].classList.remove('is-active');
    slides[next].classList.add('is-active');
    current = next;
    artwork.setAttribute('aria-label', slides[current].dataset.label);
    count.textContent = `${current + 1} / ${slides.length}`;
  }
  function schedule() {
    clearInterval(timer);
    if (!paused && visible && !document.hidden) {
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
    paused = reducedMotion.matches;
    schedule();
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    schedule();
  }, { threshold: 0.15 }).observe(gallery);
  controls.hidden = false;
  schedule();
})();
