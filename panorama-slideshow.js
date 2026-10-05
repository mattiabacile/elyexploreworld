(() => {
  const hero = document.querySelector('.panorama-hero');
  const slides = [...(hero?.querySelectorAll('.panorama-hero-slide') || [])];
  if (slides.length < 2) return;

  let current = 0;
  let visible = false;
  let timer;

  function advance() {
    const next = (current + 1) % slides.length;
    const image = slides[next].querySelector('img');
    // Keep the current photograph visible until the next one has loaded.
    if (!image.complete || !image.naturalWidth) return;
    slides[current].classList.remove('is-active');
    slides[current].setAttribute('aria-hidden', 'true');
    slides[next].classList.add('is-active');
    slides[next].removeAttribute('aria-hidden');
    current = next;
  }

  function schedule() {
    clearInterval(timer);
    if (visible && !document.hidden) timer = setInterval(advance, 5000);
  }

  document.addEventListener('visibilitychange', schedule);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }, { threshold: 0 }).observe(hero);
})();
