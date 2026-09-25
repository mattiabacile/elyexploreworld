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
      return href === hash
        || (href === '#chi-sono' && hash === '#chi-sono-dettaglio')
        || (href === '#chi-sono-dettaglio' && hash === '#chi-sono');
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
  if (!slides.length) return;
  const controls = section.querySelector('.stories-controls');
  const destinations = section.querySelector('.stories-destinations');
  const previous = section.querySelector('.stories-prev');
  const next = section.querySelector('.stories-next');
  const counter = section.querySelector('.stories-counter');
  const status = section.querySelector('.stories-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let requested = 0;
  let scrollFrame;
  let settleTimer;
  let programmaticScroll = false;
  const number = value => String(value).padStart(2, '0');
  const buttons = slides.map((slide, index) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'diapositiva');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'stories-destination';
    const photo = slide.querySelector('img').cloneNode(true);
    photo.alt = '';
    photo.removeAttribute('id');
    const title = document.createElement('span');
    title.className = 'stories-card-title';
    const heading = slide.querySelector('h3').cloneNode(true);
    heading.querySelectorAll('br').forEach(br => br.replaceWith(' '));
    title.textContent = heading.textContent;
    const excerpt = document.createElement('span');
    excerpt.className = 'stories-card-excerpt';
    excerpt.textContent = slide.querySelector('.stories-deck').textContent;
    const action = document.createElement('span');
    action.className = 'stories-card-action';
    action.textContent = 'Esplora la destinazione';
    button.append(photo, title, excerpt, action);
    button.setAttribute('aria-label', `Mostra ${slide.dataset.destination}`);
    button.setAttribute('aria-controls', 'stories-track');
    button.addEventListener('click', () => {
      goTo(index);
      if (window.matchMedia('(max-width: 600px)').matches) {
        track.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      }
    });
    destinations.append(button);
    return button;
  });
  const update = (index, announce = false) => {
    active = index;
    buttons.forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
      slides[i].inert = i !== index;
    });
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    counter.textContent = `${number(index + 1)} / ${number(slides.length)}`;
    if (announce) status.textContent = `${slides[index].dataset.destination}, racconto ${index + 1} di ${slides.length}`;
  };
  function goTo(index, behavior = reducedMotion.matches ? 'instant' : 'smooth') {
    requested = Math.max(0, Math.min(slides.length - 1, index));
    programmaticScroll = true;
    track.scrollTo({ left: slides[requested].offsetLeft - slides[0].offsetLeft, behavior });
    update(requested, true);
  }
  const finishScroll = () => {
    programmaticScroll = false;
    requested = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
    update(requested, true);
  };
  previous.addEventListener('click', () => goTo(requested - 1));
  next.addEventListener('click', () => goTo(requested + 1));
  track.addEventListener('keydown', event => {
    if (event.target !== track) return;
    const target = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: slides.length - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    goTo(target);
  });
  track.addEventListener('pointerdown', () => { programmaticScroll = false; });
  track.addEventListener('wheel', () => { programmaticScroll = false; }, { passive: true });
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      if (!programmaticScroll) {
        requested = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
        update(requested);
      }
    });
    clearTimeout(settleTimer);
    settleTimer = setTimeout(finishScroll, 160);
  }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(() => goTo(active, 'instant')).observe(track);
  else window.addEventListener('resize', () => goTo(active, 'instant'));
  // Suppress the floating page shortcut while it would cover the carousel controls.
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      backToTop.classList.toggle('is-over-blog', entry.isIntersecting);
    }, { threshold: 0.15 }).observe(section);
  }
  section.classList.add('stories-enhanced');
  controls.hidden = slides.length < 2;
  update(0);
})();
