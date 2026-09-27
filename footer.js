(() => {
  const root = document.getElementById('site-footer-root');
  if (!root) return;

  const footerMarkup = `
<footer class="site-footer" aria-label="Footer del sito">
  <div class="site-footer-shell">
    <a class="site-footer-brand" href="index.html#home" aria-label="ElyExploreWorld, torna alla home">
      <strong>Elyexploreworld</strong>
      <span>Travel designer</span>
    </a>

    <nav class="site-footer-legal" aria-label="Informazioni legali">
      <span aria-disabled="true" title="Documento in preparazione">Privacy Policy</span>
      <span aria-disabled="true" title="Documento in preparazione">Cookie Policy</span>
      <span aria-disabled="true" title="Documento in preparazione">Termini e condizioni</span>
    </nav>

    <address class="site-footer-contact" aria-label="Contatti">
      <a href="mailto:elisa.exploreworld@gmail.com" aria-label="Scrivi a elisa.exploreworld@gmail.com">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2"></rect>
          <path d="m4 7 8 6 8-6"></path>
        </svg>
        <span>elisa.exploreworld@gmail.com</span>
      </a>
      <a href="https://www.instagram.com/elyexploreworld/" target="_blank" rel="noreferrer" aria-label="Apri Instagram @elyexploreworld">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5"></rect>
          <circle cx="12" cy="12" r="4"></circle>
          <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"></circle>
        </svg>
        <span>@elyexploreworld</span>
      </a>
    </address>
  </div>

  <div class="site-footer-meta">
    <p>© <span data-year></span> Elyexploreworld</p>
    <a href="#top" aria-label="Torna all'inizio della pagina">Torna su ↑</a>
  </div>
</footer>`;

  root.innerHTML = footerMarkup;
  root.querySelector('[data-year]').textContent = String(new Date().getFullYear());
})();
