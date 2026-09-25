(() => {
  const header = document.getElementById('main-header');
  const heroImage = document.getElementById('hero-bg-img');
  const menuButton = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('primary-nav');
  const menuViewport = window.matchMedia('(max-width: 900px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const backToTop = document.querySelector('.back-to-top');
  let scrollTicking = false;
  let previousScrollY = window.scrollY;

  const getPreviewLinks = () => Array.from(mobileNav?.querySelectorAll('a') || []);
  const syncPreviewNav = (hash = location.hash) => {
    const currentLink = getPreviewLinks().find((link) => link.getAttribute('href') === hash);
    getPreviewLinks().forEach((link) => {
      const isCurrent = link === currentLink;
      link.classList.toggle('is-current', isCurrent);
      if (isCurrent) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (menuButton) menuButton.querySelector('span').textContent = currentLink?.textContent.trim() || 'Menu';
  };

  const scrollToSection = (event, link) => {
    const href = link.getAttribute('href');
    if (!href?.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    if (menuViewport.matches && mobileNav?.contains(link)) setMenu(false);
    syncPreviewNav(href);
    window.dispatchEvent(new CustomEvent('preview:navigate', { detail: { hash: href } }));
    if (location.hash) history.replaceState(null, '', `${location.pathname}${location.search}`);
    target.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  };

  const updateScrollEffects = () => {
    const scrollY = window.scrollY;
    header?.classList.toggle('stuck-nav', scrollY > 80);
    backToTop?.classList.toggle('is-visible', scrollY > window.innerHeight * 0.75);

    if (header) {
      const movingDown = scrollY > previousScrollY && scrollY > 24;
      const movingUp = scrollY < previousScrollY - 2;
      if (movingDown) header.classList.add('is-scroll-down');
      if (movingUp || scrollY <= 24) header.classList.remove('is-scroll-down');
    }
    previousScrollY = scrollY;

    if (heroImage && !reducedMotion.matches && scrollY < window.innerHeight * 1.2) {
      const shift = Math.min(scrollY * 0.12, 90);
      heroImage.style.transform = `scale(1.08) translate3d(0, ${shift}px, 0)`;
    }
    scrollTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateScrollEffects);
      scrollTicking = true;
    }
  }, { passive: true });
  updateScrollEffects();

  const contactSection = document.getElementById('contatti');
  const contactObserver = 'IntersectionObserver' in window && contactSection
    ? new IntersectionObserver(([entry]) => {
        backToTop?.classList.toggle('is-over-contact', entry.isIntersecting);
      }, { threshold: 0.08 })
    : null;
  contactObserver?.observe(contactSection);

  backToTop?.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });

  const getMenuLinks = () => Array.from(mobileNav?.querySelectorAll('a') || []);

  const setMenu = (open) => {
    if (!menuButton || !mobileNav) return;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    if (menuViewport.matches) mobileNav.setAttribute('aria-hidden', String(!open));
    else mobileNav.removeAttribute('aria-hidden');
    mobileNav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);

    if (open) {
      getMenuLinks()[0]?.focus();
    }
  };

  menuButton?.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  mobileNav?.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    scrollToSection(event, link);
  });
  header?.querySelector('.brand')?.addEventListener('click', (event) => {
    scrollToSection(event, event.currentTarget);
  });
  window.addEventListener('hashchange', () => syncPreviewNav());
  menuViewport.addEventListener('change', () => setMenu(false));
  setMenu(false);
  document.addEventListener('click', (event) => {
    if (menuButton?.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) setMenu(false);
  });

  syncPreviewNav();

  // Preview only existing content. No service pages or itinerary copy are invented.
  const contentPreview = document.getElementById('content-preview');
  const previewBody = contentPreview?.querySelector('.content-preview-body');
  document.querySelectorAll('[data-preview]').forEach((button) => {
    button.addEventListener('click', () => {
      previewBody.replaceChildren();
      if (button.dataset.preview === 'service') {
        const service = button.closest('.book-page');
        previewBody.append(service.querySelector('.page-heading').cloneNode(true), service.querySelector('.service-details').cloneNode(true));
      } else {
        const card = document.querySelector('.postcard-collage .itinerary-card').cloneNode(true);
        card.removeAttribute('id');
        previewBody.append(card);
      }
      previewBody.querySelector('h3').id = 'content-preview-title';
      contentPreview.showModal();
    });
  });
  contentPreview?.querySelector('.preview-close').addEventListener('click', () => contentPreview.close());

  const contactForm = document.getElementById('contact-form');
  contactForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;

    const data = new FormData(contactForm);
    const body = [
      `Nome: ${data.get('nome') || ''}`,
      `Email: ${data.get('email') || ''}`,
      `Destinazione: ${data.get('destinazione') || 'Da definire'}`,
      `Partenza: ${data.get('partenza') || 'Da definire'}`,
      `Viaggiatori: ${data.get('viaggiatori') || 'Da definire'}`,
      `Servizio: ${data.get('servizio') || 'Da definire'}`,
      '',
      String(data.get('messaggio') || '')
    ].join('\n');

    window.location.href = `mailto:hello@elyexploreworld.com?subject=${encodeURIComponent('Parliamo del mio viaggio')}&body=${encodeURIComponent(body)}`;
  });


  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }

    if (event.key === 'Tab' && menuButton?.getAttribute('aria-expanded') === 'true') {
      const focusable = [...getMenuLinks(), menuButton];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    : null;

  document.querySelectorAll('.reveal').forEach((element) => {
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add('is-visible');
  });

  const navigationLinks = Array.from(document.querySelectorAll('.desktop-nav a'));
  const sectionObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navigationLinks.forEach((link) => {
            const active = link.getAttribute('href') === `#${entry.target.id}`;
            if (active) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 })
    : null;

  document.querySelectorAll('main > section[id]').forEach((section) => sectionObserver?.observe(section));

  const travelTrack = document.getElementById('travel-track');
  document.querySelectorAll('[data-gallery-direction]').forEach((button) => {
    button.addEventListener('click', () => {
      const direction = Number(button.dataset.galleryDirection || 1);
      const card = travelTrack?.querySelector('.travel-card');
      const distance = (card?.getBoundingClientRect().width || 360) + 36;
      travelTrack?.scrollBy({ left: distance * direction, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    });
  });

  const openDialog = (dialog) => {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  const closeDialog = (dialog) => {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  };

  const articleDialog = document.getElementById('article-dialog');
  const dialogTitle = document.getElementById('dialog-title');
  const dialogMeta = document.getElementById('dialog-meta');
  const dialogBody = document.getElementById('dialog-body');

  document.querySelectorAll('.article-open').forEach((article) => {
    article.addEventListener('click', () => {
      dialogTitle.textContent = article.dataset.title || '';
      dialogMeta.textContent = article.dataset.category || '';
      dialogBody.textContent = article.dataset.body || '';
      openDialog(articleDialog);
    });
  });

  const legalDialog = document.getElementById('legal-dialog');
  const legalTitle = document.getElementById('legal-title');
  const legalBody = document.getElementById('legal-body');
  const legalCopy = {
    privacy: {
      title: 'Privacy policy',
      body: '<p>lorem ipsum dolorem...</p>'
    },
    cookie: {
      title: 'Cookie policy',
      body: '<p>lorem ipsum dolorem...</p>'
    }
  };

  document.querySelectorAll('[data-legal]').forEach((button) => {
    button.addEventListener('click', () => {
      const content = legalCopy[button.dataset.legal];
      if (!content) return;
      legalTitle.textContent = content.title;
      legalBody.innerHTML = content.body;
      openDialog(legalDialog);
    });
  });

  document.querySelectorAll('[data-dialog-close]').forEach((button) => {
    button.addEventListener('click', () => closeDialog(button.closest('dialog')));
  });

  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
  });

  const year = document.getElementById('current-year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
