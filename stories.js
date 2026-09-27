(() => {
  const section = document.getElementById('blog');
  const track = section?.querySelector('.stories-track');
  if (!track) return;
  const slides = [...track.querySelectorAll('.stories-slide')];
  if (!slides.length) return;
  const controls = section.querySelector('.stories-controls');
  const status = section.querySelector('.stories-status');
  let active = 0;
  let autoplayTimer;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canAutoplay = () => slides.length > 1 && !reducedMotion.matches && !document.hidden && !section.matches(':hover, :focus-within');
  function stopAutoplay() {
    clearInterval(autoplayTimer);
    autoplayTimer = undefined;
  }
  function startAutoplay() {
    stopAutoplay();
    if (canAutoplay()) autoplayTimer = window.setInterval(() => show(active + 1), 5000);
  }
  function show(index, announce = false) {
    // Move focus out of a link before its slide becomes inert.
    if (slides[active].contains(document.activeElement)) track.focus({ preventScroll: true });
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === active);
      slide.inert = i !== active;
      slide.setAttribute('aria-hidden', String(i !== active));
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'diapositiva');
      slide.setAttribute('aria-label', `${i + 1} di ${slides.length}`);
    });
    if (announce) status.textContent = `${slides[active].dataset.destination}, racconto ${active + 1} di ${slides.length}`;
  }
  section.querySelector('.stories-prev').addEventListener('click', () => { show(active - 1, true); startAutoplay(); });
  section.querySelector('.stories-next').addEventListener('click', () => { show(active + 1, true); startAutoplay(); });
  track.addEventListener('keydown', event => {
    const index = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: slides.length - 1 }[event.key];
    if (index === undefined) return;
    event.preventDefault();
    show(index, true);
    startAutoplay();
  });
  section.addEventListener('mouseenter', stopAutoplay);
  section.addEventListener('mouseleave', startAutoplay);
  section.addEventListener('focusin', stopAutoplay);
  section.addEventListener('focusout', () => window.setTimeout(startAutoplay, 0));
  document.addEventListener('visibilitychange', startAutoplay);
  reducedMotion.addEventListener('change', startAutoplay);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      document.querySelector('.back-to-top')?.classList.toggle('is-over-blog', entry.isIntersecting);
    }, { threshold: .15 }).observe(section);
  }
  controls.hidden = slides.length < 2;
  show(0);
  startAutoplay();
})();
