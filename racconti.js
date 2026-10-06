(async () => {
  document.querySelector('.archive-back')?.addEventListener('click', () => {
    const previous = document.referrer ? new URL(document.referrer, location.href) : null;
    if (previous && previous.origin === location.origin && history.length > 1) {
      history.back();
    } else {
      location.href = 'index.html#blog';
    }
  });
  const host = document.querySelector('.stories-archive .stories-grid');
  const tipsHost = document.querySelector('.tips-grid');
  try {
    const records = await ElyContent.load();
    const stories = records.filter(story => story.kind !== 'consiglio');
    if (!stories.length) ElyContent.status(host, 'I primi racconti arriveranno presto.');
    else {
      host.innerHTML = stories.map(ElyContent.card).join('');
      ElyContent.responsive(host);
    }
    const tips = records.filter(story => story.kind === 'consiglio');
    if (!tips.length) ElyContent.status(tipsHost, 'Nuovi consigli di viaggio arriveranno presto.');
    else {
      tipsHost.innerHTML = tips.map(story => {
        if (!story.preparing) return ElyContent.card(story);
        const e = ElyContent.escape;
        return `<article class="story-card tip-card"><div class="story-card-link"><figure class="story-card-media"><img src="${e(ElyContent.image(story.hero))}" data-content-image="${e(ElyContent.image(story.hero))}" alt="${e(story.heroAlt)}" width="1600" height="900" loading="lazy" decoding="async"></figure><div class="story-card-body"><p class="story-card-meta">${e(story.category || story.destination)}</p><h3>${e(story.title)}</h3><p class="story-card-description">${e(story.deck)}</p><span class="story-card-cta">Articolo in preparazione</span></div></div></article>`;
      }).join('');
      ElyContent.responsive(tipsHost);
    }
    document.documentElement.dataset.contentReady = 'true';
  } catch {
    ElyContent.status(host, 'Non riesco a caricare i racconti in questo momento.', true);
    ElyContent.status(tipsHost, 'Non riesco a caricare i consigli in questo momento.');
  }
})();
