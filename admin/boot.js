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
    const savedArticles=await fetch('../content/stories.json',{cache:'no-cache'}).then(r=>r.ok?r.json():[]).catch(()=>[]);
    CMS.registerPreviewStyle('/admin/preview.css?v=ff1d300ea755');
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
      const rawTags=data.get('tags');
      const tagLabels=Array.isArray(rawTags)?rawTags:(rawTags?.toJS?.() || []);
      const editable = (key, label) => ({'data-key-path':key, tabIndex:0, title:`Modifica ${label}`});
      const add = (key, label) => h('button', {...editable(key,label), type:'button', className:'preview-add'}, label);
      const action = (list, operation, label, index, disabled=false) => h('button', {
        type:'button', className:'preview-action', 'data-list':list, 'data-operation':operation,
        ...(index == null ? {} : {'data-index':index}), disabled
      }, label);
      const tools = (...children) => h('div', {className:'preview-local-tools'}, ...children);
      const options = (label, ...children) => h('details', {className:'preview-options'}, h('summary', {}, label), tools(...children));
      const emptyText = (key, label, className='preview-empty-text') => h('div', {className, ...editable(key,label)}, label);
      const itemTools = (list, index, count, label) => tools(
        action(list,'up','Sposta prima',index,index===0), action(list,'down','Sposta dopo',index,index===count-1),
        action(list,'remove',`Elimina ${label}`,index)
      );
      // Send the actual draft to the writing tools, including unmounted chapter fields.
      const values = Object.fromEntries(['id','title','kind','destination','date','deck','hero','heroAlt','heroCaption','intro','conclusion','published','preparing','category','tags'].map(key => [key, data.get(key)]));
      values.chapters = chapters.map(chapter => Object.fromEntries(['title','body','image','imageAlt','caption','quote','note'].map(key => [key, chapter.get('data').get(key)])));
      values.gallery = gallery.map(photo => Object.fromEntries(['image','alt','caption'].map(key => [key, photo.get('data').get(key)])));
      values.travelFacts = Object.fromEntries(['duration','season','style'].map(key => [key, data.getIn(['travelFacts',key])]));
      values.publicSlug=ElyLinks.assign([...savedArticles.filter(s=>s&&s.id&&s.title&&s.id!==values.id),{id:values.id || 'new-draft',title:values.title}]).find(s=>s.id===(values.id || 'new-draft')).publicSlug;
      window.dispatchEvent(new CustomEvent('ely:article-change', {detail:values}));
      const facts = [['duration', 'Durata'], ['season', 'Quando partire'], ['style', 'Tipo di viaggio']].filter(([key]) => data.getIn(['travelFacts', key]));
      return h('article', { className:'preview-story', style:{'--article-accent':appearance.accent}, 'data-text-style':appearance.textStyle, 'data-drop-cap':String(appearance.dropCap), 'data-cover-format':appearance.coverFormat },
        h('header', {className:'preview-editor-header'},
          h('p', {className:'preview-edit-guide'}, 'Seleziona il testo e scrivi sul posto. Le modifiche restano nella bozza fino a Salva.'),
          tools(
            h('span', {className:'preview-draft-status'}, !data.get('published') ? 'Bozza · fuori dal sito' : data.get('kind')==='consiglio'&&data.get('preparing') ? 'Scheda in preparazione dopo Salva' : 'Visibile sul sito dopo Salva'),
            ...['details','appearance','publish'].map((group,index) => h('button', {type:'button','data-group':group}, ['Dettagli','Aspetto','Visibilità'][index]))
          )
        ),
        h('p', {className:'preview-meta'}, h('span',editable('destination','destinazione'),data.get('destination') || 'Aggiungi la destinazione'), ' · ', h('span',editable('date','data'),data.get('date') || 'Scegli la data')),
        h('h1', editable('title','titolo'), accentIndex >= 0 ? [title.slice(0,accentIndex), h('em',{},accent), title.slice(accentIndex+accent.length)] : title),
        h('p', {className:'preview-deck',...editable('deck','introduzione breve')},data.get('deck') || 'Presenta il viaggio in poche righe…'),
        h('figure', {className:'preview-cover'},
          hero ? h('img', {...editable('hero','foto di copertina'),src:hero,alt:data.get('heroAlt') || '',style:{objectPosition:appearance.coverPosition}}) : add('hero','Scegli la foto di copertina'),
          hero && h('figcaption',editable('heroCaption','didascalia della copertina'),data.get('heroCaption') || 'Aggiungi una didascalia'),
          hero && h('p',{className:'preview-image-description',...editable('heroAlt','descrizione della copertina')},'Descrizione della foto: '+(data.get('heroAlt') || 'aggiungi una descrizione…')),
          hero && options('Opzioni della copertina',add('hero','Cambia foto'),add('appearance.coverFormat','Formato'),add('appearance.coverPosition','Ritaglio'))
        ),
        facts.length > 0 && h('dl',{className:'preview-facts'},...facts.map(([key,label]) => h('div',{key},h('dt',{},label),h('dd',editable('travelFacts.'+key,label),data.getIn(['travelFacts',key]))))),
        options('Informazioni del viaggio',add('travelFacts','Durata, periodo e tipo di viaggio')),
        appearance.showContents && chapters.length > 1 && h('nav',{className:'preview-contents'},h('h2',{},'In questo racconto'),h('ol',{},...chapters.map((chapter,index) => h('li',{key:index},h('a',{href:'#preview-chapter-'+index},chapter.get('data').get('title') || `Capitolo ${index+1}`))))),
        h('div',{className:'preview-intro'},data.get('intro') ? widgetFor('intro') : emptyText('intro','Scrivi l’apertura del racconto…')),
        ...chapters.map((chapter,index) => {
          const item=chapter.get('data'), photo=asset(item.get('image'));
          const {layout,format}=ElyArticle.chapter({layout:item.get('layout'),imageFormat:item.get('imageFormat')},index);
          return h('section',{key:index,className:'preview-chapter preview-chapter-'+layout,'data-photo-format':format,'data-chapter-index':index},
            h('div',{className:'preview-copy'},
              h('h2',{id:'preview-chapter-'+index,...editable(`chapters.${index}.title`,'titolo del capitolo')},item.get('title') || 'Titolo del capitolo…'),
              item.get('body') ? chapter.getIn(['widgets','body']) : emptyText(`chapters.${index}.body`,'Scrivi il testo del capitolo…'),
              item.get('note') && h('aside',{},h('strong',{},'Da sapere'),chapter.getIn(['widgets','note']))
            ),
            photo ? h('figure',{},
              h('img',{...editable(`chapters.${index}.image`,'foto del capitolo'),src:photo,alt:item.get('imageAlt') || ''}),
              h('figcaption',editable(`chapters.${index}.caption`,'didascalia'),item.get('caption') || 'Aggiungi una didascalia'),
              h('p',{className:'preview-image-description',...editable(`chapters.${index}.imageAlt`,'descrizione della foto')},'Descrizione della foto: '+(item.get('imageAlt') || 'aggiungi una descrizione…')),
              options('Opzioni della foto',add(`chapters.${index}.image`,'Cambia foto'),add(`chapters.${index}.imageFormat`,'Formato'))
            ) : add(`chapters.${index}.image`,'Aggiungi una fotografia'),
            item.get('quote') && h('blockquote',editable(`chapters.${index}.quote`,'citazione'),item.get('quote')),
            options('Opzioni del capitolo',
              add(`chapters.${index}.layout`,'Disposizione'),
              !item.get('quote') && add(`chapters.${index}.quote`,'Aggiungi citazione'),
              !item.get('note') && add(`chapters.${index}.note`,'Aggiungi consiglio pratico'),
              itemTools('chapters',index,chapters.length,'capitolo')
            )
          );
        }),
        tools(action('chapters','add','Aggiungi capitolo')),
        h('section',{className:'preview-gallery-section'},
          (gallery.length>0) && h('h2',{},'Il viaggio, in immagini'),
          gallery.length>0 && h('div',{className:'preview-gallery'},h('div',{},...gallery.map((photo,index) => {
            const item=photo.get('data'),image=asset(item.get('image'));
            return h('figure',{key:index,'data-gallery-index':index},
              image ? h('img',{...editable(`gallery.${index}.image`,'foto della galleria'),src:image,alt:item.get('alt') || ''}) : add(`gallery.${index}.image`,'Scegli la fotografia'),
              h('figcaption',editable(`gallery.${index}.caption`,'didascalia della galleria'),item.get('caption') || 'Aggiungi una didascalia'),
              h('p',{className:'preview-image-description',...editable(`gallery.${index}.alt`,'descrizione della foto')},'Descrizione della foto: '+(item.get('alt') || 'aggiungi una descrizione…')),
              options('Opzioni della foto',add(`gallery.${index}.image`,'Cambia foto'),itemTools('gallery',index,gallery.length,'foto'))
            );
          }))),
          tools(action('gallery','add','Aggiungi foto alla galleria'))
        ),
        h('section',{className:'preview-conclusion'},h('h2',{},'Prima di ripartire'),data.get('conclusion') ? widgetFor('conclusion') : emptyText('conclusion','Scrivi una conclusione…')),
        h('footer',{className:'preview-editor-footer'},
          tools(h('span',{},'Categoria: '+(data.get('category') || 'da scegliere')),add('category','Modifica categoria'),add('tags','Etichette')),
          h('p',{className:'preview-tags'},tagLabels.join(' · ') || 'Aggiungi le etichette per organizzare questo articolo.')
        )
      );
    });
    CMS.init({ config });
  } catch {
    const message = document.createElement('p');
    message.textContent = 'Il pannello non è disponibile. Ricarica la pagina oppure contatta chi gestisce il sito.';
    document.body.append(message);
  }
})();
