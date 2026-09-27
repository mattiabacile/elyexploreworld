(() => {
  const stories = {
    japan: {
      destination: 'Giappone',
      category: 'Paesaggi e cultura',
      title: 'Giappone: tra templi, natura e <em>tradizioni</em>',
      deck: 'Un viaggio tra città luminose, paesaggi silenziosi e gesti antichi che continuano a sorprendere.',
      date: '26 aprile 2026',
      hero: 'assets/stories/japan.webp',
      heroAlt: 'Monte Fuji oltre un lago, incorniciato dai ciliegi in fiore e da una pagoda rossa',
      heroCaption: 'Il profilo del Monte Fuji al tramonto.',
      detail1: 'assets/stories/japan-detail.webp',
      detail1Caption: 'Il Giappone tra natura e architettura.',
      detail2: 'assets/stories/japan.webp',
      detail2Caption: 'Il paesaggio si fa quieto lontano dalla città.',
      detail3: 'assets/stories/japan-detail.webp',
      detail3Caption: 'Tradizioni che convivono con il presente.',
      chapter1: 'Il ritmo quieto dei templi',
      chapter2: 'Paesaggi che cambiano voce',
      chapter3: 'Gesti, sapori e tradizioni',
      quote: '“Ogni dettaglio invita a rallentare, osservare e lasciarsi sorprendere.”',
      tags: ['Giappone', 'Asia', 'Cultura', 'Natura', 'Tradizioni']
    },
    bali: {
      destination: 'Bali',
      category: 'Isole e spiritualità',
      title: 'Bali: l’isola che sa di <em>casa</em>',
      deck: 'Templi sull’acqua, risaie e incontri: un’isola da vivere seguendo un ritmo più gentile.',
      date: '18 marzo 2026',
      hero: 'assets/stories/bali.webp',
      heroAlt: 'Tempio balinese sul lago Beratan tra montagne e luce del mattino',
      heroCaption: 'Il tempio di Ulun Danu Beratan al mattino.',
      detail1: 'assets/stories/bali-detail.webp',
      detail1Caption: 'Acqua, pietra e vegetazione nel cuore dell’isola.',
      detail2: 'assets/hero-river.webp',
      detail2Caption: 'La natura accompagna ogni spostamento.',
      detail3: 'assets/hero-temple.webp',
      detail3Caption: 'Un tempio custodito dal giardino tropicale.',
      chapter1: 'L’acqua e i templi',
      chapter2: 'Dentro il verde dell’isola',
      chapter3: 'Il tempo delle piccole cose',
      quote: '“Bali non chiede di essere visitata in fretta: invita a trovare il proprio ritmo.”',
      tags: ['Bali', 'Indonesia', 'Templi', 'Natura', 'Spiritualità']
    },
    singapore: {
      destination: 'Singapore',
      category: 'Città e contrasti',
      title: 'Singapore: un mondo in una <em>città</em>',
      deck: 'Quartieri, giardini e architetture si incontrano in una città sorprendentemente verde.',
      date: '5 gennaio 2026',
      hero: 'assets/stories/singapore.webp',
      heroAlt: 'Veduta di Marina Bay a Singapore con la baia e lo skyline',
      heroCaption: 'Marina Bay e il profilo contemporaneo della città.',
      detail1: 'assets/stories/singapore.webp',
      detail1Caption: 'La città si riflette sull’acqua della baia.',
      detail2: 'assets/hero-river.webp',
      detail2Caption: 'Il lato tropicale della città.',
      detail3: 'assets/stories/singapore.webp',
      detail3Caption: 'Architetture e quartieri da esplorare a piedi.',
      chapter1: 'Una città sull’acqua',
      chapter2: 'Giardini dentro la metropoli',
      chapter3: 'Quartieri, cucine e incontri',
      quote: '“Qui il futuro non cancella la natura: le lascia spazio tra una strada e l’altra.”',
      tags: ['Singapore', 'Asia', 'Città', 'Architettura', 'Natura']
    }
  };

  const order = ['japan', 'bali', 'singapore'];
  const params = new URLSearchParams(location.search);
  const slug = Object.hasOwn(stories, params.get('story')) ? params.get('story') : 'japan';
  const story = stories[slug];
  const currentIndex = order.indexOf(slug);
  const previousSlug = order[(currentIndex - 1 + order.length) % order.length];
  const nextSlug = order[(currentIndex + 1) % order.length];

  document.documentElement.dataset.story = slug;
  document.title = `${story.destination} — Racconti di viaggio | ElyExploreWorld`;
  document.querySelectorAll('[data-field]').forEach((node) => {
    const key = node.dataset.field;
    if (key === 'title') node.innerHTML = story[key];
    else node.textContent = story[key] || '';
  });
  document.querySelectorAll('[data-image]').forEach((image) => {
    const key = image.dataset.image;
    image.src = story[key];
    image.alt = key === 'hero' ? story.heroAlt : story[`${key}Caption`];
  });

  const tagHost = document.querySelector('[data-list="tags"]');
  story.tags.forEach((tag) => {
    const span = document.createElement('span');
    span.textContent = tag;
    tagHost.append(span);
  });

  const setPagination = (direction, targetSlug) => {
    const target = stories[targetSlug];
    const link = document.querySelector(`[data-nav="${direction}"]`);
    link.href = `racconto.html?story=${targetSlug}`;
    link.querySelector(`[data-nav-title="${direction}"]`).textContent = target.destination;
    const image = link.querySelector(`[data-nav-image="${direction}"]`);
    image.src = target.hero;
    image.alt = '';
  };
  setPagination('previous', previousSlug);
  setPagination('next', nextSlug);

  const relatedHost = document.querySelector('[data-list="related"]');
  order.forEach((relatedSlug) => {
    const related = stories[relatedSlug];
    const card = document.createElement('article');
    const current = relatedSlug === slug;
    card.className = `related-card${current ? ' is-current' : ''}`;
    card.innerHTML = `
      <a href="racconto.html?story=${relatedSlug}"${current ? ' aria-current="page"' : ''}>
        <img src="${related.hero}" alt="" loading="lazy">
        <p>${related.date} · ${related.destination}</p>
        <h3>${related.title.replace(/<[^>]+>/g, '')}</h3>
        <span>${current ? 'Stai leggendo' : 'Leggi il racconto →'}</span>
      </a>`;
    relatedHost.append(card);
  });

  const shareUrl = encodeURIComponent(location.href);
  document.querySelector('[data-share-link="facebook"]').href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
  const status = document.querySelector('.copy-status');
  let statusTimer;
  const copyLink = async () => {
    clearTimeout(statusTimer);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(location.href);
      status.textContent = 'Link copiato negli appunti.';
    } catch {
      status.textContent = 'Copia il link dalla barra degli indirizzi del browser.';
    }
    statusTimer = setTimeout(() => { status.textContent = ''; }, 5000);
  };
  document.querySelector('[data-share="native"]').addEventListener('click', async () => {
    if (!navigator.share) return copyLink();
    try { await navigator.share({ title: document.title, url: location.href }); }
    catch (error) { if (error.name !== 'AbortError') await copyLink(); }
  });
  document.querySelector('[data-share="copy"]').addEventListener('click', copyLink);
})();
