(async () => {
  try {
    const response = await fetch('config.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Configurazione non disponibile');
    const config = await response.json();
    config.backend.base_url = location.origin;
    config.site_url = location.origin;
    config.display_url = location.origin;
    config.backend.api_root = location.origin + '/cms/api/v3';
    config.backend.graphql_api_root = location.origin + '/cms/api/graphql';
    config.load_config_file = false;
    CMS.registerPreviewStyle('/admin/preview.css');
    CMS.registerPreviewTemplate('racconti', ({ entry, widgetFor, widgetsFor, getAsset }) => {
      const data = entry.get('data');
      const asset = path => path ? getAsset(path)?.url || path : '';
      const hero = asset(data.get('hero'));
      const chapters = widgetsFor('chapters') || [];
      return h('article', { className: 'preview-story' },
        h('p', { className: 'preview-status' }, data.get('published') ? (data.get('preparing') ? 'In preparazione · solo anteprima nell’archivio' : 'Pubblicato · appare nell’archivio e nello slideshow') : 'Bozza · non appare sul sito'),
        h('p', { className: 'preview-meta' }, data.get('destination'), ' · ', data.get('date')),
        h('h1', {}, data.get('title') || 'Il titolo del tuo racconto'),
        h('p', { className: 'preview-deck' }, data.get('deck')),
        hero && h('figure', {}, h('img', { src: hero, alt: data.get('heroAlt') || '' }), h('figcaption', {}, data.get('heroCaption'))),
        h('div', { className: 'preview-intro' }, widgetFor('intro')),
        ...chapters.map((chapter, index) => {
          const item = chapter.get('data');
          const photo = asset(item.get('image'));
          return h('section', { key: index },
            h('h2', {}, item.get('title')),
            chapter.getIn(['widgets', 'body']),
            photo && h('figure', {}, h('img', { src: photo, alt: item.get('imageAlt') || '' }), h('figcaption', {}, item.get('caption'))),
            item.get('quote') && h('blockquote', {}, item.get('quote')),
            item.get('note') && h('aside', {}, h('strong', {}, 'Da sapere'), chapter.getIn(['widgets', 'note']))
          );
        })
      );
    });
    CMS.init({ config });
  } catch {
    const message = document.createElement('p');
    message.textContent = 'Il pannello non è disponibile. Ricarica la pagina oppure contatta chi gestisce il sito.';
    document.body.append(message);
  }
})();
