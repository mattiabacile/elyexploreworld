(() => {
  const backToTop = document.querySelector('.back-to-top');
  let ticking = false;
  const updateScroll = () => {
    backToTop?.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.75);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  updateScroll();

  // Preview only existing content. No service pages or itinerary copy are invented.
  const contentPreview = document.getElementById('content-preview');
  const previewBody = contentPreview?.querySelector('.content-preview-body');
  document.querySelectorAll('[data-preview]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!previewBody || !contentPreview) return;
      previewBody.replaceChildren();
      if (button.dataset.preview === 'service') {
        const service = button.closest('.book-page');
        const previewParts = ['.page-heading', '.service-summary', '.service-price', '.service-inclusions']
          .map((selector) => service.querySelector(selector))
          .filter(Boolean)
          .map((node) => node.cloneNode(true));
        previewBody.append(...previewParts);
      } else {
        const card = document.querySelector('.postcard-collage .itinerary-card').cloneNode(true);
        card.removeAttribute('id');
        previewBody.append(card);
      }
      previewBody.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      let title = previewBody.querySelector('h3');
      if (!title) {
        title = document.createElement('h3');
        title.textContent = button.closest('section').querySelector('h2')?.textContent || 'Anteprima';
        previewBody.prepend(title);
      }
      title.id = 'content-preview-title';
      contentPreview.showModal();
    });
  });
  contentPreview?.querySelector('.preview-close')?.addEventListener('click', () => contentPreview.close());

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

    window.location.href = `mailto:elisa.exploreworld@gmail.com?subject=${encodeURIComponent('Parliamo del mio viaggio')}&body=${encodeURIComponent(body)}`;
  });

  const bioDialog = document.getElementById('bio-dialog');
  document.querySelector('.bio-more-button')?.addEventListener('click', () => bioDialog?.showModal());
  document.querySelectorAll('[data-dialog-close]').forEach(button => {
    button.addEventListener('click', () => button.closest('dialog')?.close());
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
  });
})();
