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

  // Keep the review references stable when service layouts or copy change.
  if (path === 'index.html') {
    const groups = [
      [1, '.panorama-hero-content > p, .panorama-hero-content > h1, .panorama-hero-content > a'],
      [5, '.bio-title > span:first-child, .bio-copy > p, .bio-more-button, #bio-dialog .bio-dialog-eyebrow, #bio-dialog h2, #bio-dialog .bio-dialog-copy > p'],
      [15, '.consultation-copy > p, .consultation-copy > h2, .consultation-benefits li > span, .consultation-button'],
      [22, '.travel-services-kicker, #travel-services-title, .travel-services-intro, .travel-service--full .travel-service-eyebrow, #full-title, .travel-service--full .travel-service-summary, .travel-service--full .travel-service-description, .travel-service--full .travel-service-features, .travel-service-consultation'],
      [31, '.travel-service--full summary'],
      [32, '.travel-service--road .travel-service-eyebrow, #road-title, .travel-service--road .travel-service-summary, .travel-service--road .travel-service-description, .travel-service--road .travel-service-features, .travel-service-pricing, .travel-service--road .travel-service-button'],
      [39, '.travel-service--road summary'],
      [40, '.preview-copy-block > p, .preview-copy-block > h2, .preview-copy-block > button'],
      [44, '.itinerary-card .timeline strong, .itinerary-card .timeline small'],
      [52, '.stories-intro > p, .stories-intro > h2, .stories-all-link, .contact-copy-block > p, .contact-copy-block > h2, .contact-form > button[type="submit"]']
    ];
    groups.forEach(([first, selector]) => {
      document.querySelectorAll(selector).forEach((node, index) => {
        node.classList.add('copy-ref');
        node.dataset.copyRef = String(first + index);
      });
    });
    return;
  }

  const nodes = document.querySelectorAll(selectors.join(','));
  nodes.forEach((node, index) => {
    node.classList.add('copy-ref');
    node.dataset.copyRef = String(start + index);
  });
})();
