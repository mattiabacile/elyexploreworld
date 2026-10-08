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
  const story = requested ? (stories.find(item => item.id === requested) || stories.find(item => item.publicSlug === requested)) : stories[0];
  if (!story) { unavailable('Questo racconto non è disponibile. Scopri gli altri viaggi nell’archivio.'); return; }
  const readableURL = new URL(location.href);
  readableURL.searchParams.set('story', story.publicSlug);
  history.replaceState(history.state, '', readableURL);
  const chapters = Array.isArray(story.chapters) ? story.chapters : [];
  const appearance = ElyArticle.appearance(story.appearance);
  article.style.setProperty('--clay', appearance.accent);
  article.style.setProperty('--accent', appearance.accent);
  article.dataset.textStyle = appearance.textStyle;
  article.dataset.dropCap = String(appearance.dropCap);
  article.dataset.coverFormat = appearance.coverFormat;
  const words = [story.intro, story.conclusion, ...chapters.map(chapter => chapter.body)].join(' ').split(/\s+/).filter(Boolean).length;
  const view = { ...story, date: c.date(story.date), readingTime: `${Math.max(1, Math.ceil(words / 200))} min di lettura` };
  document.documentElement.dataset.story = story.id;
  document.title = `${ElyArticle.plain(story.title)} — ElyExploreWorld`;
  document.querySelector('meta[name="description"]').content = ElyArticle.plain(story.deck || story.title);
  document.querySelectorAll('[data-field]').forEach(node => {
    if (node.dataset.field === 'title') node.innerHTML = c.title(story);
    else if(['deck','heroCaption'].includes(node.dataset.field))node.innerHTML=ElyArticle.inline(view[node.dataset.field]);
    else node.textContent = view[node.dataset.field] || '';
  });
  const hero = document.querySelector('[data-image="hero"]');
  const opening=ElyArticle.openingPhoto(story);
  hero.closest('figure').hidden=!c.image(opening.image);
  if(c.image(opening.image))window.elySetImage(hero, c.image(opening.image));
  hero.alt = opening.alt || '';
  if (story.appearance) hero.style.objectPosition = appearance.coverPosition;
  document.querySelector('[data-content="intro"]').innerHTML = c.markdown(story.intro);
  const intro = document.querySelector('[data-content="intro"]');
  const facts = story.travelFacts || {};
  const factItems = [['duration', 'Durata'], ['season', 'Quando partire'], ['style', 'Tipo di viaggio']].filter(([key]) => typeof facts[key] === 'string' && facts[key].trim());
  if (factItems.length) {
    const details = document.createElement('dl');details.className = 'story-facts';
    details.innerHTML = factItems.map(([key, label]) => `<div><dt>${label}</dt><dd>${c.escape(facts[key])}</dd></div>`).join('');
    intro.before(details);
  }
  if (appearance.showContents && chapters.filter(item => item?.title).length > 1) {
    const contents = document.createElement('nav');contents.className = 'story-contents';contents.setAttribute('aria-label', 'Sommario dell’articolo');
    contents.innerHTML = '<h2>In questo racconto</h2><ol>' + chapters.map((item, index) => item?.title ? `<li><a href="#chapter-${index + 1}-title">${ElyArticle.inline(item.title,{links:false})}</a></li>` : '').join('') + '</ol>';
    intro.before(contents);
  }
  const host = document.querySelector('[data-content="chapters"]');
  host.innerHTML = chapters.filter(item => item && typeof item === 'object').map((chapter, index) => {
    const {layout, format} = ElyArticle.chapter(chapter, index);
    const photo = c.image(chapter.image);
    const figure = photo ? `<figure class="chapter-photo chapter-photo-${['tall', 'wide', 'square'][index % 3]}"${chapter.imageFormat && chapter.imageFormat !== 'auto' ? ` data-photo-format="${format}"` : ''}><img src="${c.escape(photo)}" data-content-image="${c.escape(photo)}" alt="${c.escape(chapter.imageAlt || ElyArticle.plain(chapter.caption) || '')}" loading="lazy" width="1600" height="900" decoding="async">${chapter.caption ? `<figcaption>${ElyArticle.inline(chapter.caption)}</figcaption>` : ''}</figure>` : '';
    const copy = `<div class="chapter-copy"><h2 id="chapter-${index + 1}-title">${ElyArticle.inline(chapter.title)}</h2>${c.markdown(chapter.body)}${chapter.note ? `<aside class="travel-note"><span>Da sapere</span>${c.markdown(chapter.note)}</aside>` : ''}</div>`;
    return `<section class="chapter chapter-${layout}" aria-labelledby="chapter-${index + 1}-title">${layout === 'closing' ? figure + copy : copy + figure}${chapter.quote ? `<blockquote>${ElyArticle.inline(chapter.quote)}</blockquote>` : ''}</section>`;
  }).join('');
  const gallery = (Array.isArray(story.gallery) ? story.gallery : []).filter(item => item && c.image(item.image));
  if (gallery.length) host.insertAdjacentHTML('beforeend', `<section class="story-gallery" aria-labelledby="gallery-title"><h2 id="gallery-title">Il viaggio, in immagini</h2><div class="story-gallery-grid">${gallery.map((item, index) => `<figure><button type="button" data-gallery-index="${index}" aria-label="Apri foto: ${c.escape(item.alt || ElyArticle.plain(item.caption) || `foto ${index + 1}`)}"><img src="${c.escape(c.image(item.image))}" data-content-image="${c.escape(c.image(item.image))}" alt="${c.escape(item.alt || '')}" loading="lazy" decoding="async" width="1600" height="1200"></button>${item.caption ? `<figcaption>${ElyArticle.inline(item.caption)}</figcaption>` : ''}</figure>`).join('')}</div></section>`);
  if (story.conclusion) host.insertAdjacentHTML('beforeend', `<section class="story-conclusion"><h2>Prima di ripartire</h2>${c.markdown(story.conclusion)}</section>`);
  c.responsive(host);
  if (gallery.length) {
    const dialog = document.createElement('dialog');dialog.className = 'story-photo-viewer';dialog.setAttribute('aria-label', 'Galleria fotografica');
    dialog.innerHTML = `<button type="button" class="photo-close">Chiudi foto</button><figure><img src="${c.escape(c.image(gallery[0].image))}" alt=""><figcaption></figcaption></figure><div class="photo-navigation"><button type="button" data-photo-step="-1">Foto precedente</button><span aria-live="polite"></span><button type="button" data-photo-step="1">Foto successiva</button></div>`;
    article.append(dialog);let current = 0, trigger;
    const show = index => {
      current = (index + gallery.length) % gallery.length;
      const item = gallery[current], image = dialog.querySelector('img');
      image.src = c.image(item.image);image.alt = item.alt || '';
      dialog.querySelector('figcaption').innerHTML = ElyArticle.inline(item.caption);
      dialog.querySelector('[aria-live]').textContent = `${current + 1} di ${gallery.length}`;
    };
    host.querySelectorAll('[data-gallery-index]').forEach(button => button.addEventListener('click', () => {trigger = button;show(Number(button.dataset.galleryIndex));dialog.showModal();}));
    dialog.querySelector('.photo-close').addEventListener('click', () => dialog.close());
    dialog.querySelectorAll('[data-photo-step]').forEach(button => {button.hidden = gallery.length < 2;button.addEventListener('click', () => show(current + Number(button.dataset.photoStep)));});
    dialog.addEventListener('keydown', event => {if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {event.preventDefault();show(current + (event.key === 'ArrowRight' ? 1 : -1));}});
    dialog.addEventListener('close', () => trigger?.focus());
  }
  const tagHost = document.querySelector('[data-list="tags"]');
  (Array.isArray(story.tags) ? story.tags : []).forEach(tag => {
    if(typeof tag !== 'string' || !tag.trim())return;
    const node = document.createElement('a'); node.textContent = tag.trim(); node.href='racconti.html?tag='+encodeURIComponent(tag.trim()); tagHost.append(node);
  });
  document.querySelector('.tag-list').hidden = !tagHost.children.length;
  const categoryNode=document.querySelector('[data-field=category]');
  if(categoryNode && typeof story.category==='string' && story.category.trim()){
    const link=document.createElement('a');link.href='racconti.html?category='+encodeURIComponent(story.category.trim());link.textContent=story.category.trim();categoryNode.replaceChildren(link);
  }
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
    card.innerHTML = `<a href="${c.href(related)}"${current ? ' aria-current="page"' : ''}><img src="${c.escape(c.image(related.hero))}" data-content-image="${c.escape(c.image(related.hero))}" alt="" loading="lazy" decoding="async" width="1600" height="900"><p>${c.date(related.date)} · ${c.escape(related.destination)}</p><h3>${c.title(related)}</h3><span>${current ? 'Stai leggendo' : 'Leggi il racconto →'}</span></a>`;
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
