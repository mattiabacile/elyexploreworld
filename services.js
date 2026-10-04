(() => {
  document.querySelector('[data-service-contact="road"]')?.addEventListener('click', () => {
    const radio = document.querySelector('input[name="servizio"][value="Itinerario day by day"]');
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    }
    requestAnimationFrame(() => {
      document.getElementById('contatti')?.scrollIntoView({ behavior: 'instant' });
      document.querySelector('#contact-form input[name="nome"]')?.focus({ preventScroll: true });
    });
  });
})();
