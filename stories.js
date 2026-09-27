(() => {
  const section = document.getElementById('blog');
  if (!section) return;
  const nav = document.getElementById('primary-nav');
  const menuButton = document.getElementById('mobile-menu-toggle');
  const originalTitle = document.title;
  const syncStories = (hash = location.hash) => {
    const navLinks = [...(nav?.querySelectorAll('a') || [])];
    const currentLink = navLinks.find(link => {
      const href = link.getAttribute('href');
      return href === hash;
    });
    document.title = hash === '#blog' ? 'Racconti di viaggio — Elyexploreworld' : originalTitle;
    navLinks.forEach(link => {
      link.classList.toggle('is-current', link === currentLink);
      if (link === currentLink) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const menuLabel = menuButton?.querySelector('span');
    if (menuLabel) menuLabel.textContent = currentLink?.textContent.trim() || 'Menu';
  };
  window.addEventListener('hashchange', () => syncStories());
  window.addEventListener('preview:navigate', event => syncStories(event.detail?.hash || ''));
  syncStories();

  const track = section.querySelector('.stories-track');
  const slides = [...track.querySelectorAll('.stories-slide')];
  const controls = section.querySelector('.stories-controls');
  const status = section.querySelector('.stories-status');
  const dialog = section.querySelector('.stories-preview');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let paused = reducedMotion.matches;
  let visible = false;
  let hovered = false;
  let timer;
  const schedule = () => {
    clearTimeout(timer);
    if (!paused && visible && !hovered && !document.hidden && !dialog.open && !section.contains(document.activeElement)) {
      timer = setTimeout(() => show(active + 1), 6000);
    }
  };
  function show(index, announce = false) {
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
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; schedule(); });
  const backToTop = document.querySelector('.back-to-top');
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    backToTop?.classList.toggle('is-over-blog', visible);
    schedule();
  }, { threshold: .15 }).observe(section);
  section.querySelectorAll('button.stories-read').forEach(button => {
    button.addEventListener('click', () => {
      const slide = button.closest('.stories-slide');
      dialog.querySelector('h3').textContent = slide.dataset.destination;
      dialog.querySelector('.stories-preview-text').textContent = slide.querySelector('.stories-excerpt').textContent;
      dialog.showModal();
      schedule();
    });
  });
  dialog.querySelector('.stories-preview-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', schedule);
  controls.hidden = slides.length < 2;
  show(0);
})();
