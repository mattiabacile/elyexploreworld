(() => {
  const header = document.getElementById('main-header');
  const menuButton = document.getElementById('mobile-menu-toggle');
  const nav = document.getElementById('primary-nav');
  if (!header || !menuButton || !nav) return;

  let menuScrollY = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const background = [...document.body.children].filter(node => node !== header && !['SCRIPT', 'STYLE'].includes(node.tagName));
  const previousInert = new Map();

  const lockPageScroll = () => {
    menuScrollY = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add('menu-open');
    document.body.classList.add('menu-open');
    document.body.style.setProperty('--menu-lock-top', `-${menuScrollY}px`);
  };

  const unlockPageScroll = () => {
    document.documentElement.classList.remove('menu-open');
    document.body.classList.remove('menu-open');
    document.body.style.removeProperty('--menu-lock-top');
    window.scrollTo({ top: menuScrollY, left: 0, behavior: 'instant' });
  };

  const getLinks = () => Array.from(nav.querySelectorAll('a'));
  const getFocusables = () => [...header.querySelectorAll('a[href], button')].filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden');

  const setMenu = (open) => {
    const wasOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    nav.setAttribute('aria-hidden', String(!open));
    nav.inert = !open;
    nav.classList.toggle('is-open', open);

    if (open && !wasOpen) {
      background.forEach(node => { previousInert.set(node, node.inert); node.inert = true; });
      lockPageScroll();
      // Allow visibility and inert changes to reach the rendered frame before
      // moving focus; focusing immediately can be ignored by the browser.
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        if (menuButton.getAttribute('aria-expanded') === 'true' &&
            (document.activeElement === menuButton || document.activeElement === document.body)) {
          getLinks()[0]?.focus({ preventScroll: true });
        }
      }));
    } else if (!open && wasOpen) {
      unlockPageScroll();
      background.forEach(node => { node.inert = previousInert.get(node) || false; });
      previousInert.clear();
      if (nav.contains(document.activeElement)) menuButton.focus({ preventScroll: true });
    }
  };

  const updateHeader = () => header.classList.toggle('stuck-nav', window.scrollY > 40);
  window.addEventListener('scroll', updateHeader, { passive: true });

  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  const syncNavigation = () => {
    getLinks().forEach(link => {
      const current = link.getAttribute('href') === location.hash;
      link.classList.toggle('is-current', current);
      if (link.getAttribute('href')?.startsWith('#')) {
        if (current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    });
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (header.contains(link)) setMenu(false);
    const href = link.getAttribute('href');
    if (!href.startsWith('#') || href.length < 2) return;
    let id;
    try { id = decodeURIComponent(href.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    if (location.hash !== href) history.pushState(null, '', href);
    target.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    syncNavigation();
  });
  window.addEventListener('hashchange', () => {
    const wasOpen = menuButton.getAttribute('aria-expanded') === 'true';
    if (wasOpen) setMenu(false);
    syncNavigation();
    // History navigation can happen while the body is fixed by the menu.
    // Restore the destination after releasing the scroll lock.
    if (wasOpen) requestAnimationFrame(() => {
      let id;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
      const target = document.getElementById(id || 'top');
      target?.scrollIntoView({ block: 'start', behavior: 'instant' });
      target?.focus({ preventScroll: true });
    });
  });
  syncNavigation();

  document.addEventListener('keydown', (event) => {
    if (menuButton.getAttribute('aria-expanded') !== 'true') return;

    if (event.key === 'Escape') {
      setMenu(false);
      menuButton.focus();
      return;
    }

    if (event.key === 'Tab') {
      const focusable = getFocusables();
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

  setMenu(false);
  updateHeader();
})();
