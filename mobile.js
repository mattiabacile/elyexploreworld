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

  const portraitArtwork = document.querySelector('.bio-portrait-art');
  const portraitPhoto = portraitArtwork?.querySelector('.bio-portrait-photo');
  if (portraitPhoto) {
    const source = portraitPhoto.getAttribute('href');
    const syncPortrait = () => {
      portraitArtwork.setAttribute('viewBox', mobile.matches ? '31 30 739 1025' : '0 0 780 1088');
      portraitPhoto.setAttribute('href', window.elyImageSource(source));
    };
    mobile.addEventListener('change', syncPortrait);
    syncPortrait();
  }

  const form = document.querySelector('#contact-form');
  const nativeField = form?.querySelector('.mobile-departure-field');
  const nativeDate = form?.querySelector('#mobile-departure-date');
  const date = form?.querySelector('#departure-date');
  // Keep the phone's native calendar, with a bounded visible field across Safari versions.
  // The transparent native input covers only this field; its selected date is mirrored below.
  let dateDisplay;
  if (nativeField && nativeDate) {
    const display = document.createElement('div');
    display.className = 'mobile-date-display';
    display.setAttribute('aria-hidden', 'true');
    dateDisplay = document.createElement('span');
    display.append(dateDisplay);
    nativeField.append(display);
  }
  const syncDateDisplay = () => {
    if (dateDisplay) dateDisplay.textContent = date.value || nativeDate.getAttribute('aria-label');
  };
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
  const rememberPosition = node => ({ node, parent: node.parentNode, nextSibling: node.nextSibling });
  const bioDetails = [...(document.querySelector('.bio-copy')?.children || [])].slice(1).map(rememberPosition);
  const bioDialogCopy = document.querySelector('.bio-dialog-copy');
  const serviceDetails = [...document.querySelectorAll('.travel-service-content > .travel-service-description')]
    .map(node => ({ ...rememberPosition(node), disclosure: node.parentElement.querySelector('.travel-service-details') }))
    .filter(item => item.disclosure);
  const servicePreview = document.querySelector('#content-preview');
  const servicePreviewBody = servicePreview?.querySelector('.content-preview-body');
  let servicePreviewTrigger;
  const clearServicePreview = (restoreFocus = true) => {
    if (!servicePreviewTrigger) return;
    const trigger = servicePreviewTrigger;
    servicePreviewTrigger = null;
    servicePreview.classList.remove('is-service-preview');
    servicePreviewBody.replaceChildren();
    servicePreviewBody.removeAttribute('tabindex');
    if (restoreFocus && trigger.isConnected) trigger.focus({ preventScroll: true });
  };
  servicePreview?.addEventListener('close', () => {
    // A queued close event must not clear a popup that was already reopened.
    if (!servicePreview.open) clearServicePreview();
  });
  const closeServicePreview = () => {
    if (!servicePreviewTrigger) return;
    servicePreview.close();
    clearServicePreview();
  };
  servicePreview?.addEventListener('cancel', event => {
    if (!servicePreviewTrigger) return;
    event.preventDefault();
    closeServicePreview();
  });
  servicePreview?.querySelector('.preview-close').addEventListener('click', closeServicePreview);
  if (servicePreviewBody) serviceDetails.forEach(item => {
    item.cardTemplate = item.parent.closest('.travel-service').cloneNode(true);
    item.title = rememberPosition(item.parent.querySelector('h3'));
    item.heading = document.createElement('div');
    item.heading.className = 'mobile-service-heading';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-service-more';
    const label = document.createElement('span');
    label.textContent = item.disclosure.querySelector('summary').textContent;
    button.append(label);
    button.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><circle cx="14" cy="14" r="12.5"/><path d="M14 8v12M8 14h12"/></svg>');
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', servicePreview.id);
    item.button = button;
    item.title.node.before(item.heading);
    item.heading.append(item.title.node, button);
    button.addEventListener('click', () => {
      if (servicePreview.open) return;
      const card = item.cardTemplate.cloneNode(true);
      card.classList.add('service-preview-card');
      card.removeAttribute('aria-labelledby');
      card.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      const title = card.querySelector('h3');
      title.id = 'content-preview-title';
      card.setAttribute('aria-labelledby', title.id);
      const paragraphs = [item.node, ...[...item.disclosure.children].filter(node => node.tagName === 'P' && node !== item.node)].map(node => node.cloneNode(true));
      const copy = document.createElement('div');
      copy.className = 'service-preview-copy';
      paragraphs.forEach((paragraph, index) => {
        if (index === 0) paragraph.classList.add('service-preview-lead');
        copy.append(paragraph);
      });
      card.querySelector('.travel-service-description').replaceWith(copy);
      card.querySelector('.travel-service-details').remove();
      servicePreviewBody.replaceChildren(card);
      servicePreviewBody.tabIndex = 0;
      servicePreviewTrigger = button;
      servicePreview.classList.add('is-service-preview');
      servicePreview.showModal();
      servicePreviewBody.scrollTop = 0;
    });
  });
  const mobileCopy = [
    ['.travel-service--full .travel-service-features li:nth-child(3) strong', 'Assistenza e assicurazione'],
    ['.travel-service--full .travel-service-consultation p', 'Consulenza gratuita di 30m'],
    ['.stories-read', 'Leggi ']
  ].flatMap(([selector, text]) => [...document.querySelectorAll(selector)].map(element => {
    const node = [...element.childNodes].find(child => child.nodeType === Node.TEXT_NODE && child.nodeValue.trim());
    return node && { node, desktopText: node.nodeValue, mobileText: text };
  }).filter(Boolean));
  const hero = document.querySelector('#home');
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
    down.href = '#chi-sono';
    down.setAttribute('aria-label', document.querySelector('#bio-title').textContent.trim().replace(/\s+/g, ' '));
    down.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v17m-8-8 8 8 8-8"/></svg>';
    down.hidden = true;
    hero.append(down);
    mobileElements.push(down);
  }
  const syncControls = () => {
    let resizedServiceFocus;
    if (mobile.matches !== mobileLayout && servicePreviewTrigger) {
      resizedServiceFocus = servicePreviewTrigger;
      servicePreview.close();
      clearServicePreview(false);
    }
    if (nativeField) nativeField.hidden = !mobile.matches;
    mobileElements.forEach(element => { element.hidden = !mobile.matches; });
    mobileCopy.forEach(({ node, desktopText, mobileText }) => { node.nodeValue = mobile.matches ? mobileText : desktopText; });
    // Reorder the actual sections on phones so reading and keyboard order follow the design.
    // Restore every original node and control position when returning to desktop.
    if (main && mobile.matches !== mobileLayout) {
      if (mobile.matches) {
        const selectors = ['#home', '#chi-sono', '#bio-dialog', '#servizi', '.consultation-banner', '#blog', '#contatti', '#ispirazioni'];
        main.append(...selectors.map(selector => main.querySelector(selector)).filter(Boolean));
        // Use the original text in the mobile disclosures, without duplicating it.
        bioDialogCopy?.prepend(...bioDetails.map(item => item.node));
        serviceDetails.forEach(({ node, disclosure }) => {
          disclosure.querySelector('summary').after(node);
        });
      } else {
        main.append(...originalOrder);
        // Restore the exact desktop parents and positions, including dialog contents.
        [...bioDetails, ...serviceDetails].forEach(({ node, parent, nextSibling }) => parent.insertBefore(node, nextSibling));
      }
      mobileLayout = mobile.matches;
    }
    resizedServiceFocus?.focus({ preventScroll: true });
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
      syncDateDisplay();
    });
    new MutationObserver(() => {
      const parts = date.value.split('/');
      nativeDate.value = parts.length === 3 ? `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}` : '';
      syncDateDisplay();
    }).observe(document.querySelector('#departure-value'), { childList: true });
    form.addEventListener('reset', () => {
      if (!mobile.matches) return;
      queueMicrotask(() => {
        date.value = '';
        document.querySelector('#departure-value').textContent = nativeDate.getAttribute('aria-label');
        form.querySelector('.contact-date-trigger').classList.remove('has-value');
        syncDateDisplay();
      });
    });
    syncDateDisplay();
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
