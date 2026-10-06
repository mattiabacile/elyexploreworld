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
      const title = data.get('title') || 'Il titolo del tuo racconto';
      const accent = data.get('titleAccent');
      const accentIndex = accent ? title.lastIndexOf(accent) : -1;
      const chapters = widgetsFor('chapters') || [];
      const appearance = ElyArticle.appearance(Object.fromEntries(['theme', 'coverFormat', 'coverPosition', 'textStyle', 'dropCap', 'showContents'].map(key => [key, data.getIn(['appearance', key])])));
      const gallery = widgetsFor('gallery') || [];
      const facts = [['duration', 'Durata'], ['season', 'Quando partire'], ['style', 'Tipo di viaggio']].filter(([key]) => data.getIn(['travelFacts', key]));
      return h('article', { className: 'preview-story', style: {'--article-accent': appearance.accent}, 'data-text-style': appearance.textStyle, 'data-drop-cap': String(appearance.dropCap), 'data-cover-format': appearance.coverFormat },
        h('p', { className: 'preview-status' }, data.get('published') ? (data.get('preparing') ? 'In preparazione · solo anteprima nell’archivio' : 'Pubblicato · appare nell’archivio e nello slideshow') : 'Bozza · non appare sul sito'),
        h('p', { className: 'preview-meta' }, data.get('destination'), ' · ', data.get('date')),
        h('h1', {}, accentIndex >= 0 ? [title.slice(0, accentIndex), h('em', {}, accent), title.slice(accentIndex + accent.length)] : title),
        h('p', { className: 'preview-deck' }, data.get('deck')),
        hero && h('figure', {className: 'preview-cover'}, h('img', { src: hero, alt: data.get('heroAlt') || '', style: {objectPosition: appearance.coverPosition} }), h('figcaption', {}, data.get('heroCaption'))),
        facts.length > 0 && h('dl', {className: 'preview-facts'}, ...facts.map(([key, label]) => h('div', {key}, h('dt', {}, label), h('dd', {}, data.getIn(['travelFacts', key]))))),
        appearance.showContents && chapters.length > 1 && h('nav', {className: 'preview-contents'}, h('h2', {}, 'In questo racconto'), h('ol', {}, ...chapters.map((chapter, index) => h('li', {key: index}, h('a', {href: '#preview-chapter-' + index}, chapter.get('data').get('title')))))),
        h('div', { className: 'preview-intro' }, widgetFor('intro')),
        ...chapters.map((chapter, index) => {
          const item = chapter.get('data');
          const photo = asset(item.get('image'));
          const {layout, format} = ElyArticle.chapter({layout: item.get('layout'), imageFormat: item.get('imageFormat')}, index);
          return h('section', { key: index, className: 'preview-chapter preview-chapter-' + layout, 'data-photo-format': format },
            h('div', {className: 'preview-copy'},
            h('h2', {id: 'preview-chapter-' + index}, item.get('title')),
            chapter.getIn(['widgets', 'body']),
            item.get('note') && h('aside', {}, h('strong', {}, 'Da sapere'), chapter.getIn(['widgets', 'note']))),
            photo && h('figure', {}, h('img', { src: photo, alt: item.get('imageAlt') || '' }), h('figcaption', {}, item.get('caption'))),
            item.get('quote') && h('blockquote', {}, item.get('quote'))
          );
        }),
        gallery.length > 0 && h('section', {className: 'preview-gallery'}, h('h2', {}, 'Il viaggio, in immagini'), h('div', {}, ...gallery.map((photo, index) => {const item = photo.get('data');const image = asset(item.get('image'));return image && h('figure', {key: index}, h('img', {src: image, alt: item.get('alt') || ''}), h('figcaption', {}, item.get('caption')));}))),
        data.get('conclusion') && h('section', {className: 'preview-conclusion'}, h('h2', {}, 'Prima di ripartire'), widgetFor('conclusion'))
      );
    });
    CMS.init({ config });
  } catch {
    const message = document.createElement('p');
    message.textContent = 'Il pannello non è disponibile. Ricarica la pagina oppure contatta chi gestisce il sito.';
    document.body.append(message);
  }
})();
