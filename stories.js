(() => {
  const section = document.getElementById('blog');
  const track = section?.querySelector('.stories-track');
  if (!track) return;
  const slides = [...track.querySelectorAll('.stories-slide')];
  if (!slides.length) return;
  const controls = section.querySelector('.stories-controls');
  const status = section.querySelector('.stories-status');
  const pauseButton = section.querySelector('.stories-pause');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let paused = reducedMotion.matches;
  let visible = false;
  let hovered = false;
  let timer;
  const schedule = () => {
    clearTimeout(timer);
    if (slides.length > 1 && !paused && visible && !hovered && !document.hidden && !document.querySelector('dialog[open]') && !document.body.classList.contains('menu-open') && !section.contains(document.activeElement)) {
      timer = setTimeout(() => show(active + 1), 6000);
    }
  };
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
    schedule();
  }
  const syncPause = () => {
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.textContent = paused ? 'Riprendi' : 'Pausa';
    pauseButton.setAttribute('aria-label', paused ? 'Riprendi la rotazione dei racconti' : 'Metti in pausa la rotazione dei racconti');
    schedule();
  };
  pauseButton.addEventListener('click', () => { paused = !paused; syncPause(); });
  section.querySelector('.stories-prev').addEventListener('click', () => show(active - 1, true));
  section.querySelector('.stories-next').addEventListener('click', () => show(active + 1, true));
  track.addEventListener('keydown', event => {
    const index = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: slides.length - 1 }[event.key];
    if (index === undefined) return;
    event.preventDefault();
    show(index, true);
  });
  section.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } });
  section.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  section.addEventListener('focusin', schedule);
  section.addEventListener('focusout', () => setTimeout(schedule, 0));
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; syncPause(); });
  new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  document.querySelectorAll('dialog').forEach(dialog => {
    new MutationObserver(schedule).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      document.querySelector('.back-to-top')?.classList.toggle('is-over-blog', visible);
      schedule();
    }, { threshold: .15 }).observe(section);
  } else visible = true;
  controls.hidden = slides.length < 2;
  syncPause();
  show(0);
})();
