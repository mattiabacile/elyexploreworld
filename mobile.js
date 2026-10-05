(() => {
  const mobile = matchMedia('(max-width: 767px), (hover: none) and (max-width: 950px) and (max-height: 500px)');
  const pathFor = (source, width) => source.replace(/^assets\//, 'assets/' + 'mobile/').replace(/\.webp$/, `-${width}.webp`);
  const responsiveImages = new Map();
  // Backgrounds and SVG images cannot use picture sources.
  // Available variants are fixed; select the next sufficient size.
  window.elyImageSource = source => mobile.matches && source.endsWith('.webp')
    ? pathFor(source, [640, 960, 1440].find(width => width >= innerWidth * Math.min(devicePixelRatio, 3)) || 1440)
    : source;
  window.elySetImage = (image, source) => {
    responsiveImages.set(image, source);
    const variants = [640, 960, 1440].map(width => `${pathFor(source, width)} ${width}w`).join(', ');
    const pictureSource = image.parentElement?.querySelector('source');
    if (pictureSource) pictureSource.srcset = variants;
    if (mobile.matches && source.endsWith('.webp')) {
      image.sizes = '100vw';
      image.srcset = variants;
    } else image.removeAttribute('srcset');
    image.src = source;
  };
  mobile.addEventListener('change', () => {
    for (const [image, source] of responsiveImages) window.elySetImage(image, source);
  });

  const form = document.querySelector('#contact-form');
  const nativeField = form?.querySelector('.mobile-departure-field');
  const nativeDate = form?.querySelector('#mobile-departure-date');
  const date = form?.querySelector('#departure-date');
  const radios = [...(form?.querySelectorAll('input[name="servizio"]') || [])];
  let serviceDescription;
  if (radios.length) {
    // The three original choices stay visible; their existing explanation follows the grid.
    serviceDescription = document.createElement('p');
    serviceDescription.id = 'mobile-service-description';
    serviceDescription.className = 'mobile-service-description';
    serviceDescription.setAttribute('role', 'status');
    serviceDescription.hidden = true;
    form.querySelector('.contact-option-grid').after(serviceDescription);
    const syncService = () => {
      const selected = radios.find(radio => radio.checked);
      serviceDescription.textContent = selected?.parentElement.querySelector('.contact-tooltip').textContent || '';
      serviceDescription.hidden = !mobile.matches || !selected;
    };
    for (const radio of radios) radio.addEventListener('change', syncService);
    form.addEventListener('reset', () => queueMicrotask(syncService));
    mobile.addEventListener('change', syncService);
    syncService();
  }

  const main = document.querySelector('.home-page main');
  const originalOrder = main ? [...main.children] : [];
  const hero = document.querySelector('#home');
  const heroControls = document.querySelector('.panorama-slideshow-controls:not(.itinerary-slideshow-controls)');
  const itinerary = document.querySelector('#ispirazioni');
  const itineraryControls = document.querySelector('.itinerary-slideshow-controls');
  // The phone hero keeps its uncluttered photo while offering manual navigation by swipe.
  if (hero && heroControls) {
    let gesture;
    hero.addEventListener('pointerdown', event => {
      if (!mobile.matches || event.pointerType !== 'touch' || event.target.closest('a, button')) return;
      gesture = { x: event.clientX, y: event.clientY, id: event.pointerId };
    }, { passive: true });
    hero.addEventListener('pointerup', event => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      gesture = null;
      if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        heroControls.querySelector(dx < 0 ? '[data-hero-next]' : '[data-hero-prev]').click();
      }
    }, { passive: true });
    hero.addEventListener('pointercancel', () => { gesture = null; }, { passive: true });
  }
  const mobileElements = [];
  let mobileLayout = false;
  const nav = document.querySelector('#primary-nav');
  const headerCTA = document.querySelector('.header-cta');
  if (nav && headerCTA) {
    const cta = headerCTA.cloneNode(true);
    cta.className = 'mobile-menu-cta';
    cta.hidden = true;
    nav.querySelector('.menu-socials').before(cta);
    mobileElements.push(cta);
  }
  if (hero) {
    const down = document.createElement('a');
    down.className = 'mobile-hero-down';
    down.href = '#servizi';
    down.setAttribute('aria-label', document.querySelector('#travel-services-title').textContent);
    down.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v17m-8-8 8 8 8-8"/></svg>';
    down.hidden = true;
    hero.append(down);
    mobileElements.push(down);
  }
  const storyTrack = document.querySelector('#stories-track');
  if (storyTrack) {
    const slides = [...storyTrack.querySelectorAll('.stories-slide')];
    const dots = document.createElement('div');
    dots.className = 'mobile-stories-dots';
    dots.setAttribute('role', 'group');
    dots.setAttribute('aria-label', storyTrack.getAttribute('aria-label'));
    dots.hidden = true;
    slides.forEach((slide, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', slide.dataset.destination);
      dot.addEventListener('click', () => {
        const current = slides.findIndex(item => item.classList.contains('is-active'));
        const steps = (index - current + slides.length) % slides.length;
        for (let step = 0; step < steps; step++) document.querySelector('.stories-next').click();
      });
      dots.append(dot);
    });
    const updateDots = () => slides.forEach((slide, index) => dots.children[index].setAttribute('aria-pressed', String(slide.classList.contains('is-active'))));
    new MutationObserver(updateDots).observe(storyTrack, { subtree: true, attributes: true, attributeFilter: ['class'] });
    storyTrack.closest('.stories-carousel').after(dots);
    mobileElements.push(dots);
    updateDots();
  }

  const syncControls = () => {
    if (nativeField) nativeField.hidden = !mobile.matches;
    mobileElements.forEach(element => { element.hidden = !mobile.matches; });
    // Reorder the actual sections on phones so reading and keyboard order follow the design.
    // Restore every original node and control position when returning to desktop.
    if (main && mobile.matches !== mobileLayout) {
      if (mobile.matches) {
        const selectors = ['#home', '#servizi', '#chi-sono', '#bio-dialog', '.consultation-banner', '#blog', '#contatti', '#ispirazioni'];
        main.append(...selectors.map(selector => main.querySelector(selector)).filter(Boolean));
        if (heroControls) hero.append(heroControls);
        if (itineraryControls) itinerary.append(itineraryControls);
      } else {
        main.append(...originalOrder);
      }
      mobileLayout = mobile.matches;
    }
    form?.querySelectorAll('.contact-help').forEach(help => {
      if (mobile.matches) help.removeAttribute('tabindex');
      else help.setAttribute('tabindex', '0');
    });
  };
  if (nativeDate && date) {
    const today = new Date();
    const localISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    nativeDate.min = localISO;
    nativeDate.addEventListener('change', () => {
      const selected = nativeDate.value ? new Date(`${nativeDate.value}T12:00:00`) : null;
      date.value = selected ? new Intl.DateTimeFormat('it-IT').format(selected) : '';
      document.querySelector('#departure-value').textContent = date.value || 'Quando pensi di partire?';
      form.querySelector('.contact-date-trigger').classList.toggle('has-value', Boolean(selected));
    });
    new MutationObserver(() => {
      const parts = date.value.split('/');
      nativeDate.value = parts.length === 3 ? `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}` : '';
    }).observe(document.querySelector('#departure-value'), { childList: true });
  }
  mobile.addEventListener('change', syncControls);
  syncControls();

  const top = document.querySelector('.back-to-top');
  if (top) {
    for (const [selector, className] of [['#contatti', 'is-over-contact'], ['#site-footer-root', 'is-over-footer']]) {
      const target = document.querySelector(selector);
      if (target) new IntersectionObserver(([entry]) => top.classList.toggle(className, entry.isIntersecting)).observe(target);
    }
  }
})();
