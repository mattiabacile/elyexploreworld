(() => {
  const portrait = document.querySelector('.contact-portrait');
  if (!portrait) return;
  const gallery = portrait.querySelector('.contact-slideshow');
  const slides = [...gallery.querySelectorAll('.contact-slide')];
  const pause = portrait.querySelector('.contact-slideshow-pause');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 767px), (hover: none) and (max-width: 950px) and (max-height: 500px)');
  let current = 0;
  let paused = reducedMotion.matches || mobile.matches;
  let visible = false;
  let timer;
  let request = 0;

  async function advance() {
    const token = ++request;
    // Skip unavailable photos and keep the current image visible while decoding.
    for (let step = 1; step < slides.length; step++) {
      const next = (current + step) % slides.length;
      try { await slides[next].decode(); } catch { continue; }
      if (token !== request || paused || !visible || document.hidden) return;
      slides[current].classList.remove('is-active');
      slides[next].classList.add('is-active');
      gallery.setAttribute('aria-label', slides[next].dataset.label);
      current = next;
      return;
    }
  }
  function schedule() {
    clearInterval(timer);
    request++;
    if (!paused && visible && !document.hidden) timer = setInterval(advance, 5000);
    pause.textContent = paused ? '▷' : 'Ⅱ';
    pause.setAttribute('aria-label', paused ? 'Riprendi lo slideshow' : 'Metti in pausa lo slideshow');
  }
  pause.addEventListener('click', () => { paused = !paused; schedule(); });
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches || mobile.matches; schedule(); });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    schedule();
  }, { threshold: 0.15 }).observe(portrait);
  pause.hidden = false;
  schedule();
})();
