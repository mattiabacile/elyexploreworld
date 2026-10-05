(() => {
  document.querySelector('[data-service-contact="road"]')?.addEventListener('click', () => {
    const radio = document.querySelector('input[name="servizio"][value="Itinerario day by day"]');
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    }
    requestAnimationFrame(() => {
      const destination = matchMedia('(max-width: 767px), (hover: none) and (max-width: 950px) and (max-height: 500px)').matches
        ? document.getElementById('contact-form') : document.getElementById('contatti');
      destination?.scrollIntoView({ block: 'start', behavior: 'instant' });
      document.querySelector('#contact-form input[name="nome"]')?.focus({ preventScroll: true });
    });
  });
})();
