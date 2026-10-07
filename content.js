(() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const date = value => new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${String(value).slice(0, 10)}T12:00:00Z`));
  const image = value => {
    const source = String(value ?? '').trim();
    // Keep local assets and previously saved HTTPS cover URLs usable.
    // URL parsing rejects executable schemes, credentials and malformed URLs.
    if (/^https:\/\//i.test(source)) {
      try {const url = new URL(source);return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';} catch {return '';}
    }
    if (!/^\/?assets\/[^<>\"\\?#\u0000-\u001f]+\.(?:webp|png|jpe?g|avif|gif)$/i.test(source)) return '';
    try {const decoded=decodeURIComponent(source);return decoded.split('/').some(part=>part==='.'||part==='..')||/[<>\"\\?#\u0000-\u001f]/.test(decoded)?'':source;} catch {return '';}
  };
  const href = story => `racconto.html?story=${encodeURIComponent(story.id)}`;
  const title = story => {
    const text = String(story.title ?? '');
    const accent = String(story.titleAccent ?? '');
    if (!accent || !text.includes(accent)) return escape(text);
    const index = text.lastIndexOf(accent);
    return escape(text.slice(0, index)) + '<em>' + escape(accent) + '</em>' + escape(text.slice(index + accent.length));
  };
  const markdown = value => {
    const clean = DOMPurify.sanitize(marked.parse(String(value ?? ''), { breaks: true }), {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 's', 'a', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'img', 'hr', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
      ALLOW_DATA_ATTR: false
    });
    const template = document.createElement('template');
    template.innerHTML = clean;
    template.content.querySelectorAll('img').forEach(node => {
      const source = image(node.getAttribute('src'));
      if (!source) node.remove();
      else { node.src = source; node.loading = 'lazy'; node.decoding = 'async'; }
    });
    template.content.querySelectorAll('a').forEach(node => {
      const target = node.getAttribute('href') ?? '';
      if (!/^(?:https?:\/\/|mailto:|#|\/?[\w.-]+(?:[/?#]|$))/i.test(target) || target.startsWith('//')) node.removeAttribute('href');
      if (/^https?:\/\//i.test(target)) node.rel = 'noreferrer noopener';
    });
    return template.innerHTML;
  };
  let request;
  const load = () => request ??= (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('content/stories.json', { cache: 'no-cache', signal: controller.signal });
      if (!response.ok) throw new Error('Archivio non disponibile');
      const records = await response.json();
      if (!Array.isArray(records)) throw new Error('Archivio non valido');
      const ids = new Set();
      return records.filter(story => {
        if (!story || story.published !== true || typeof story.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,100}$/.test(story.id) || ids.has(story.id)) return false;
        if (!story.title?.trim() || !image(story.hero) || !/^\d{4}-\d{2}-\d{2}$/.test(story.date) || Number.isNaN(Date.parse(story.date))) return false;
        ids.add(story.id);
        return true;
      }).sort((a, b) => b.date.localeCompare(a.date));
    } finally { clearTimeout(timeout); }
  })();
  const status = (host, message, retry = false) => {
    const paragraph = document.createElement('p');
    paragraph.className = 'content-status';
    paragraph.setAttribute('role', 'status');
    paragraph.textContent = message;
    if (retry) {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = 'Riprova';
      button.addEventListener('click', () => location.reload());
      paragraph.append(' ', button);
    }
    host.replaceChildren(paragraph);
  };
  const responsive = host => host.querySelectorAll('img[data-content-image]').forEach(node => window.elySetImage(node, node.dataset.contentImage));
  const card = (story, index = 0) => `<article class="story-card"><a class="story-card-link" href="${href(story)}" aria-label="Leggi ${escape(story.title)}">
    <figure class="story-card-media"><img src="${escape(image(story.hero))}" data-content-image="${escape(image(story.hero))}" alt="${escape(story.heroAlt)}" width="1600" height="900" ${index ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></figure>
    <div class="story-card-body"><p class="story-card-meta"><time datetime="${escape(story.date)}">${date(story.date)}</time><span>${escape(story.destination)}</span></p>
    <h3>${escape(story.title)}</h3><p class="story-card-description">${escape(story.deck)}</p><span class="story-card-cta">Leggi il racconto <b aria-hidden="true">→</b></span></div></a></article>`;
  window.ElyContent = { load, escape, image, href, title, date, markdown, status, responsive, card };
})();
