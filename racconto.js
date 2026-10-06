(async () => {
  const article = document.querySelector('#racconto > article');
  const statusHost = document.querySelector('[data-content-state]');
  const c = ElyContent;
  const unavailable = (message, retry = false) => {
    document.title = 'Racconto non disponibile — ElyExploreWorld';
    document.documentElement.dataset.story = 'not-found';
    c.status(statusHost, message, retry);
    const link = document.createElement('a');
    link.href = 'racconti.html'; link.textContent = 'Vai a tutti i racconti';
    statusHost.append(link);
    document.documentElement.dataset.contentReady = 'true';
  };
  let stories;
  try { stories = (await c.load()).filter(story => !story.preparing); }
  catch { unavailable('Non riesco a caricare il racconto in questo momento.', true); return; }
  const requested = new URLSearchParams(location.search).get('story');
  const story = requested ? stories.find(item => item.id === requested) : stories[0];
  if (!story) { unavailable('Questo racconto non è disponibile. Scopri gli altri viaggi nell’archivio.'); return; }
  const chapters = Array.isArray(story.chapters) ? story.chapters : [];
  const words = [story.intro, ...chapters.map(chapter => chapter.body)].join(' ').split(/\s+/).filter(Boolean).length;
  const view = { ...story, date: c.date(story.date), readingTime: `${Math.max(1, Math.ceil(words / 200))} min di lettura` };
  document.documentElement.dataset.story = story.id;
  document.title = `${story.title} — ElyExploreWorld`;
  document.querySelector('meta[name="description"]').content = story.deck || story.title;
  document.querySelectorAll('[data-field]').forEach(node => {
    if (node.dataset.field === 'title') node.innerHTML = c.title(story);
    else node.textContent = view[node.dataset.field] || '';
  });
  const hero = document.querySelector('[data-image="hero"]');
  window.elySetImage(hero, c.image(story.hero));
  hero.alt = story.heroAlt || '';
  document.querySelector('[data-content="intro"]').innerHTML = c.markdown(story.intro);
  const host = document.querySelector('[data-content="chapters"]');
  host.innerHTML = chapters.filter(item => item && typeof item === 'object').map((chapter, index) => {
    const layout = ['opening', 'landscape', 'closing'][index % 3];
    const photo = c.image(chapter.image);
    const figure = photo ? `<figure class="chapter-photo chapter-photo-${['tall', 'wide', 'square'][index % 3]}"><img src="${c.escape(photo)}" data-content-image="${c.escape(photo)}" alt="${c.escape(chapter.imageAlt || chapter.caption || '')}" loading="lazy" width="1600" height="900" decoding="async">${chapter.caption ? `<figcaption>${c.escape(chapter.caption)}</figcaption>` : ''}</figure>` : '';
    const copy = `<div class="chapter-copy"><h2 id="chapter-${index + 1}-title">${c.escape(chapter.title)}</h2>${c.markdown(chapter.body)}${chapter.note ? `<aside class="travel-note"><span>Da sapere</span>${c.markdown(chapter.note)}</aside>` : ''}</div>`;
    return `<section class="chapter chapter-${layout}" aria-labelledby="chapter-${index + 1}-title">${layout === 'closing' ? figure + copy : copy + figure}${chapter.quote ? `<blockquote>${c.escape(chapter.quote)}</blockquote>` : ''}</section>`;
  }).join('');
  c.responsive(host);
  const tagHost = document.querySelector('[data-list="tags"]');
  (Array.isArray(story.tags) ? story.tags : []).forEach(tag => {
    const node = document.createElement('span'); node.textContent = tag; tagHost.append(node);
  });
  document.querySelector('.tag-list').hidden = !tagHost.children.length;
  const currentIndex = stories.indexOf(story);
  for (const [direction, offset] of [['previous', -1], ['next', 1]]) {
    const target = stories[(currentIndex + offset + stories.length) % stories.length];
    const link = document.querySelector(`[data-nav="${direction}"]`);
    link.href = c.href(target);
    link.querySelector(`[data-nav-title="${direction}"]`).textContent = target.destination;
    window.elySetImage(link.querySelector('img'), c.image(target.hero));
  }
  document.querySelector('.story-pagination').hidden = stories.length < 2;
  const relatedHost = document.querySelector('[data-list="related"]');
  stories.slice(0, 3).forEach(related => {
    const current = related.id === story.id;
    const card = document.createElement('article');
    card.className = `related-card${current ? ' is-current' : ''}`;
    card.innerHTML = `<a href="${c.href(related)}"${current ? ' aria-current="page"' : ''}><img src="${c.escape(c.image(related.hero))}" data-content-image="${c.escape(c.image(related.hero))}" alt="" loading="lazy" decoding="async" width="1600" height="900"><p>${c.date(related.date)} · ${c.escape(related.destination)}</p><h3>${c.escape(related.title)}</h3><span>${current ? 'Stai leggendo' : 'Leggi il racconto →'}</span></a>`;
    relatedHost.append(card);
  });
  c.responsive(relatedHost);
  article.hidden = false;
  statusHost.remove();
  document.documentElement.dataset.contentReady = 'true';
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
