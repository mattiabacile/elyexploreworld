(() => {
  const path = location.pathname.split('/').pop() || 'index.html';
  let start;
  let selectors;

  if (path === 'index.html') {
    start = 1;
    selectors = [
      '.panorama-hero-content > p', '.panorama-hero-content > h1', '.panorama-hero-content > a',
      '.bio-title > span:first-child', '.bio-copy > p', '.bio-more-button',
      '#bio-dialog .bio-dialog-eyebrow', '#bio-dialog h2', '#bio-dialog .bio-dialog-copy > p',
      '.consultation-copy > p', '.consultation-copy > h2', '.consultation-benefits li > span', '.consultation-button',
      '.services-heading > p', '.services-heading > h2',
      '.book-page .page-eyebrow', '.book-page .page-heading h3', '.book-page .service-summary',
      '.book-page .service-price strong', '.book-page .service-inclusions li > span:last-child', '.book-button',
      '.preview-copy-block > p', '.preview-copy-block > h2', '.preview-copy-block > button',
      '.itinerary-card .timeline strong', '.itinerary-card .timeline small',
      '.stories-intro > p', '.stories-intro > h2', '.stories-all-link',
      '.contact-copy-block > p', '.contact-copy-block > h2', '.contact-form > button[type="submit"]'
    ];
  } else if (path === 'racconti.html') {
    start = 101;
    selectors = [
      '.stories-intro h1', '.stories-intro .stories-intro-detail',
      '.stories-archive-heading h2'
    ];
  } else if (path === 'racconto.html') {
    const story = new URLSearchParams(location.search).get('story');
    start = { japan: 201, bali: 301, singapore: 401 }[story] || 201;
    selectors = [
      '.article-masthead h1', '.article-deck', '.hero-figure figcaption', '.article-intro',
      '.chapter-copy h2', '.chapter-copy > p', '.chapter-photo figcaption',
      '.chapter blockquote', '.travel-note p', '.related-stories h2',
      '.article-cta p', '.article-cta h2', '.article-cta a'
    ];
  } else return;

  const nodes = document.querySelectorAll(selectors.join(','));
  nodes.forEach((node, index) => {
    node.classList.add('copy-ref');
    node.dataset.copyRef = String(start + index);
  });
})();
