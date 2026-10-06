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
    CMS.registerPreviewStyle('/admin/preview.css?v=b57185c2725e');
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
      const editable = (key, label) => ({'data-key-path':key, tabIndex:0, title:`Modifica ${label}`});
      const add = (key, label) => h('button', {...editable(key,label), type:'button', className:'preview-add'}, label);
      // Send the actual draft to the writing tools, including unmounted chapter fields.
      const values = Object.fromEntries(['id','title','kind','destination','date','deck','hero','heroAlt','heroCaption','intro','conclusion','published','preparing'].map(key => [key, data.get(key)]));
      values.chapters = chapters.map(chapter => Object.fromEntries(['title','body','image','imageAlt','caption','quote','note'].map(key => [key, chapter.get('data').get(key)])));
      values.gallery = gallery.map(photo => Object.fromEntries(['image','alt','caption'].map(key => [key, photo.get('data').get(key)])));
      values.travelFacts = Object.fromEntries(['duration','season','style'].map(key => [key, data.getIn(['travelFacts',key])]));
      window.dispatchEvent(new CustomEvent('ely:article-change', {detail:values}));
      const facts = [['duration', 'Durata'], ['season', 'Quando partire'], ['style', 'Tipo di viaggio']].filter(([key]) => data.getIn(['travelFacts', key]));
      return h('article', { className: 'preview-story', style: {'--article-accent': appearance.accent}, 'data-text-style': appearance.textStyle, 'data-drop-cap': String(appearance.dropCap), 'data-cover-format': appearance.coverFormat },
        h('p', {className:'preview-edit-guide'}, 'Clicca un testo o una fotografia per modificarli. Usa Salva per conservare le modifiche.'),
        h('p', { className: 'preview-status', ...editable('published','visibilità sul sito') }, data.get('published') ? (data.get('kind') === 'consiglio' && data.get('preparing') ? 'Dopo Salva · scheda in preparazione' : 'Dopo Salva · visibile sul sito') : 'Dopo Salva · bozza fuori dal sito'),
        h('p', { className: 'preview-meta' }, h('span',editable('destination','destinazione'),data.get('destination') || 'Aggiungi la destinazione'), ' · ', h('span',editable('date','data'),data.get('date') || 'Scegli la data')),
        h('h1', editable('title','titolo'), accentIndex >= 0 ? [title.slice(0, accentIndex), h('em', {}, accent), title.slice(accentIndex + accent.length)] : title),
        h('p', { className: 'preview-deck', ...editable('deck','introduzione breve') }, data.get('deck') || 'Aggiungi poche righe per presentare il viaggio.'),
        hero ? h('figure', {className: 'preview-cover'}, h('img', { ...editable('hero','foto di copertina'), src: hero, alt: data.get('heroAlt') || '', style: {objectPosition: appearance.coverPosition} }), h('figcaption', editable('heroCaption','didascalia della copertina'), data.get('heroCaption') || 'Aggiungi una didascalia'), add('heroAlt','Descrivi la foto di copertina')) : add('hero','Scegli la foto di copertina'),
        facts.length > 0 && h('dl', {className: 'preview-facts'}, ...facts.map(([key, label]) => h('div', {key}, h('dt', {}, label), h('dd', editable('travelFacts.'+key,label), data.getIn(['travelFacts', key]))))),
        add('travelFacts','Modifica le informazioni del viaggio'),
        appearance.showContents && chapters.length > 1 && h('nav', {className: 'preview-contents'}, h('h2', {}, 'In questo racconto'), h('ol', {}, ...chapters.map((chapter, index) => h('li', {key: index}, h('a', {href: '#preview-chapter-' + index}, chapter.get('data').get('title')))))),
        h('div', { className: 'preview-intro' }, data.get('intro') ? widgetFor('intro') : add('intro','Scrivi l’apertura del racconto')),
        ...chapters.map((chapter, index) => {
          const item = chapter.get('data');
          const photo = asset(item.get('image'));
          const {layout, format} = ElyArticle.chapter({layout: item.get('layout'), imageFormat: item.get('imageFormat')}, index);
          return h('section', { key: index, className: 'preview-chapter preview-chapter-' + layout, 'data-photo-format': format },
            h('div', {className: 'preview-copy'},
            h('h2', {id: 'preview-chapter-' + index, ...editable(`chapters.${index}.title`,'titolo del capitolo')}, item.get('title') || 'Il titolo del capitolo'),
            item.get('body') ? chapter.getIn(['widgets', 'body']) : add(`chapters.${index}.body`,'Scrivi il testo del capitolo'),
            item.get('note') ? h('aside', {}, h('strong', {}, 'Da sapere'), chapter.getIn(['widgets', 'note'])) : add(`chapters.${index}.note`,'Aggiungi un consiglio pratico')),
            photo ? h('figure', {}, h('img', { ...editable(`chapters.${index}.image`,'foto del capitolo'), src: photo, alt: item.get('imageAlt') || '' }), h('figcaption', editable(`chapters.${index}.caption`,'didascalia'), item.get('caption') || 'Aggiungi una didascalia'), add(`chapters.${index}.imageAlt`,'Descrivi la foto')) : add(`chapters.${index}.image`,'Aggiungi una fotografia'),
            item.get('quote') ? h('blockquote', editable(`chapters.${index}.quote`,'citazione'), item.get('quote')) : add(`chapters.${index}.quote`,'Aggiungi una citazione'),
            h('div',{className:'preview-block-tools'},add(`chapters.${index}.layout`,'Disposizione del capitolo'),add(`chapters.${index}.imageFormat`,'Formato della foto'))
          );
        }),
        add('chapters','Aggiungi o riordina i capitoli'),
        gallery.length > 0 && h('section', {className: 'preview-gallery'}, h('h2', {}, 'Il viaggio, in immagini'), h('div', {}, ...gallery.map((photo, index) => {const item = photo.get('data');const image = asset(item.get('image'));return h('figure', {key: index}, image ? h('img', {...editable(`gallery.${index}.image`,'foto della galleria'), src: image, alt: item.get('alt') || ''}) : add(`gallery.${index}.image`,'Scegli la fotografia'), h('figcaption', editable(`gallery.${index}.caption`,'didascalia della galleria'), item.get('caption') || 'Aggiungi una didascalia'),add(`gallery.${index}.alt`,'Descrivi la foto'));}))),
        add('gallery','Aggiungi o riordina le foto della galleria'),
        data.get('conclusion') ? h('section', {className: 'preview-conclusion'}, h('h2', {}, 'Prima di ripartire'), widgetFor('conclusion')) : add('conclusion','Scrivi una conclusione'),
        h('section',{className:'preview-page-settings'},h('h2',{},'Il tuo articolo'),
          h('div',{className:'preview-block-tools'},add('kind','Tipo di contenuto'),add('category','Categoria'),add('tags','Etichette'),add('titleAccent','Corsivo nel titolo'),add('slideText','Testo per la homepage'),add('appearance','Aspetto dell’articolo'),add('published','Visibile sul sito'),data.get('kind') === 'consiglio' && add('preparing','Consiglio in preparazione')))
      );
    });
    CMS.init({ config });
  } catch {
    const message = document.createElement('p');
    message.textContent = 'Il pannello non è disponibile. Ricarica la pagina oppure contatta chi gestisce il sito.';
    document.body.append(message);
  }
})();
