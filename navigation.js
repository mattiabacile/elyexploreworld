(() => {
  const header = document.getElementById('main-header');
  const menuButton = document.getElementById('mobile-menu-toggle');
  const nav = document.getElementById('primary-nav');
  if (!header || !menuButton || !nav) return;

  let menuScrollY = 0;

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
    window.scrollTo({ top: menuScrollY, left: 0, behavior: 'auto' });
  };

  const getLinks = () => Array.from(nav.querySelectorAll('a'));
  const getFocusables = () => [
    menuButton,
    header.querySelector('.brand'),
    header.querySelector('.header-cta'),
    ...getLinks()
  ].filter(Boolean);

  const setMenu = (open) => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    nav.setAttribute('aria-hidden', String(!open));
    nav.classList.toggle('is-open', open);

    if (open) {
      lockPageScroll();
      window.requestAnimationFrame(() => getLinks()[0]?.focus());
    } else if (document.documentElement.classList.contains('menu-open') || document.body.classList.contains('menu-open')) {
      unlockPageScroll();
    }
  };

  const updateHeader = () => header.classList.toggle('stuck-nav', window.scrollY > 40);
  window.addEventListener('scroll', updateHeader, { passive: true });

  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  header.querySelector('.brand')?.addEventListener('click', () => setMenu(false));
  header.querySelector('.header-cta')?.addEventListener('click', () => setMenu(false));

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
