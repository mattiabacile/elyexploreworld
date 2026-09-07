(() => {
  const header = document.getElementById('main-header');
  const heroImage = document.getElementById('hero-bg-img');
  const menuButton = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('primary-nav');
  const menuViewport = window.matchMedia('(max-width: 900px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let scrollTicking = false;
  let previousScrollY = window.scrollY;

  const updateScrollEffects = () => {
    const scrollY = window.scrollY;
    header?.classList.toggle('stuck-nav', scrollY > 80);

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
    if (!link || !menuViewport.matches) return;
    setMenu(false);
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });
  menuViewport.addEventListener('change', () => setMenu(false));
  setMenu(false);
  document.addEventListener('click', (event) => {
    if (menuButton?.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) setMenu(false);
  });

  // The mobile biography uses the exact section from the desktop reference.
  const phoneViewport = window.matchMedia('(max-width: 767px)');
  const storyLink = document.querySelector('.story-cta');
  const storyQuote = document.querySelector('.story-quote');
  const aboutNavLink = mobileNav?.querySelector('a[href="#chi-sono"]');
  const syncBiography = () => {
    storyQuote.hidden = phoneViewport.matches;
    aboutNavLink?.setAttribute('href', phoneViewport.matches ? '#chi-sono-dettaglio' : '#chi-sono');
    if (phoneViewport.matches) {
      storyLink.setAttribute('role', 'button');
      storyLink.setAttribute('aria-expanded', 'false');
      storyLink.setAttribute('aria-controls', 'story-quote');
    } else {
      storyLink.removeAttribute('role');
      storyLink.removeAttribute('aria-expanded');
      storyLink.removeAttribute('aria-controls');
    }
  };
  storyLink?.addEventListener('click', (event) => {
    if (!phoneViewport.matches) return;
    event.preventDefault();
    storyQuote.hidden = !storyQuote.hidden;
    storyLink.setAttribute('aria-expanded', String(!storyQuote.hidden));
  });
  storyLink?.addEventListener('keydown', (event) => {
    if (phoneViewport.matches && event.key === ' ') {
      event.preventDefault();
      storyLink.click();
    }
  });
  phoneViewport.addEventListener('change', syncBiography);
  syncBiography();

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

  const mobileStickyCta = document.querySelector('.mobile-sticky-cta');
  const heroPrimaryCta = document.querySelector('.hero-actions .button');
  const contactSection = document.getElementById('contatti');
  const contactForm = document.getElementById('contact-form');
  if ('IntersectionObserver' in window && mobileStickyCta && heroPrimaryCta && contactSection) {
    let heroCtaVisible = true;
    let contactReached = contactSection.getBoundingClientRect().top <= window.innerHeight;
    const updateStickyCta = () => {
      mobileStickyCta.classList.toggle('is-hidden', heroCtaVisible || contactReached);
    };
    const heroCtaObserver = new IntersectionObserver(([entry]) => {
      heroCtaVisible = entry.isIntersecting;
      updateStickyCta();
    }, { threshold: 0.15 });
    const contactSectionObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      contactReached = true;
      updateStickyCta();
    }, { threshold: 0.02 });
    heroCtaObserver.observe(heroPrimaryCta);
    contactSectionObserver.observe(contactSection);
    updateStickyCta();
  }

  const travelTrack = document.getElementById('travel-track');
  document.querySelectorAll('[data-gallery-direction]').forEach((button) => {
    button.addEventListener('click', () => {
      const direction = Number(button.dataset.galleryDirection || 1);
      const card = travelTrack?.querySelector('.travel-card');
      const distance = (card?.getBoundingClientRect().width || 360) + 36;
      travelTrack?.scrollBy({ left: distance * direction, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    });
  });

  const tripInput = document.getElementById('trip-idea');
  const messageInput = document.getElementById('message');

  document.querySelectorAll('.travel-card').forEach((card) => {
    card.addEventListener('click', () => {
      if (tripInput) tripInput.value = card.dataset.trip || '';
      if (messageInput && !messageInput.value) {
        messageInput.value = `Vorrei costruire un viaggio dedicato a “${card.dataset.trip}”.`;
      }
      document.getElementById('contatti')?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      window.setTimeout(() => tripInput?.focus(), reducedMotion.matches ? 0 : 650);
    });
  });

  const contactStatus = document.getElementById('contact-status');
  contactForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }
    contactStatus.textContent = 'Struttura del modulo verificata. Il servizio di invio verrà collegato prima della pubblicazione.';
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
      body: '<p>Questa demo non invia né conserva dati su un server. Prima della pubblicazione, collega i moduli al servizio scelto e inserisci qui titolare del trattamento, finalità, base giuridica, tempi di conservazione e modalità per esercitare i diritti.</p>'
    },
    cookie: {
      title: 'Cookie policy',
      body: '<p>Questa pagina non installa cookie di profilazione. I servizi esterni per font, immagini o analisi dovranno essere descritti e gestiti con un consenso appropriato prima della pubblicazione.</p>'
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
