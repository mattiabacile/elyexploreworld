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
    CMS.registerPreviewStyle('/admin/preview.css?v=7822bc60cc74');
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
      const add = (key, label, className='preview-add') => h('button', {...editable(key,label), type:'button', className}, label);
      const action = (list, operation, label, index, disabled=false) => h('button', {
        type:'button', className:'preview-action', 'data-list':list, 'data-operation':operation,
        ...(index == null ? {} : {'data-index':index}), disabled, title:label
      }, label);
      const tools = (className, ...children) => h('div', {className:`preview-local-tools ${className || ''}`.trim()}, ...children);
      const fieldChip=(key,label,value,extra='')=>h('button',{type:'button',className:`preview-field-chip ${extra}`.trim(),...editable(key,label)},h('span',{className:'preview-field-chip-label'},label),h('strong',{},value));
      const emptyText = (key, label, className='preview-empty-text') => h('div', {className, ...editable(key,label)}, label);
      const chapterTools = (index,count) => tools('preview-block-toolbar',
        h('span',{className:'preview-block-label'},`Capitolo ${index+1}`),
        action('chapters','up','Sposta prima',index,index===0),
        action('chapters','down','Sposta dopo',index,index===count-1),
        add(`chapters.${index}.layout`,'Layout','preview-action'),
        action('chapters','remove','Elimina',index)
      );
      const galleryTools = (index,count) => tools('preview-photo-toolbar',
        action('gallery','up','Sposta prima',index,index===0),
        action('gallery','down','Sposta dopo',index,index===count-1),
        action('gallery','remove','Elimina',index)
      );

      // Send the actual draft to the writing tools, including unmounted chapter fields.
      const values = Object.fromEntries(['id','title','kind','destination','date','deck','hero','heroAlt','heroCaption','intro','conclusion','published','preparing','category','tags'].map(key => [key, data.get(key)]));
      values.chapters = chapters.map(chapter => Object.fromEntries(['title','body','image','imageAlt','caption','quote','note'].map(key => [key, chapter.get('data').get(key)])));
      values.gallery = gallery.map(photo => Object.fromEntries(['image','alt','caption'].map(key => [key, photo.get('data').get(key)])));
      values.travelFacts = Object.fromEntries(['duration','season','style'].map(key => [key, data.getIn(['travelFacts',key])]));
      values.publicSlug=ElyLinks.assign([...savedArticles.filter(s=>s&&s.id&&s.title&&s.id!==values.id),{id:values.id || 'new-draft',title:values.title}]).find(s=>s.id===(values.id || 'new-draft')).publicSlug;
      window.dispatchEvent(new CustomEvent('ely:article-change', {detail:values}));

      const factRows=[['duration','Durata'],['season','Quando partire'],['style','Tipo di viaggio']];
      const anyFacts=factRows.some(([key])=>data.getIn(['travelFacts',key]));
      const visibility=!data.get('published')?'Bozza':data.get('kind')==='consiglio'&&data.get('preparing')?'In preparazione':'Visibile';
      const kindLabel=data.get('kind')==='consiglio'?'Consiglio':'Racconto';
      const tagsLabel=tagLabels.length?tagLabels.join(' · '):'Aggiungi tag';
      const themeLabel=({clay:'Argilla',forest:'Verde bosco',ocean:'Blu oceano'})[appearance.theme] || 'Naturale';

      return h('article', { className:'preview-story', style:{'--article-accent':appearance.accent}, 'data-text-style':appearance.textStyle, 'data-drop-cap':String(appearance.dropCap), 'data-cover-format':appearance.coverFormat },
        h('header', {className:'preview-editor-header'},
          h('div',{className:'preview-editor-intro'},
            h('span',{className:'preview-editor-kicker'},'Modifica in pagina'),
            h('p', {className:'preview-edit-guide'}, 'Clicca ciò che vuoi cambiare. Testo e impostazioni si modificano qui; solo le fotografie aprono la libreria.')
          ),
          h('div',{className:'preview-editor-fields'},
            fieldChip('kind','Tipo',kindLabel),
            fieldChip('published','Stato',visibility,data.get('published')?'is-live':'is-draft'),
            data.get('kind')==='consiglio' && fieldChip('preparing','Consiglio',data.get('preparing')?'In preparazione':'Completo'),
            fieldChip('category','Categoria',data.get('category') || 'Da scegliere'),
            fieldChip('tags','Tag',tagsLabel,'is-wide')
          )
        ),
        h('p', {className:'preview-meta'}, h('span',editable('destination','destinazione'),data.get('destination') || 'Aggiungi la destinazione'), ' · ', h('span',editable('date','data'),data.get('date') || 'Scegli la data')),
        h('h1', editable('title','titolo'), accentIndex >= 0 ? [title.slice(0,accentIndex), h('em',{},accent), title.slice(accentIndex+accent.length)] : title),
        h('p', {className:'preview-deck',...editable('deck','introduzione breve')},data.get('deck') || 'Presenta il viaggio in poche righe…'),
        h('figure', {className:'preview-cover preview-editable-figure'},
          hero ? h('img', {...editable('hero','foto di copertina'),src:hero,alt:data.get('heroAlt') || '',style:{objectPosition:appearance.coverPosition}}) : add('hero','Scegli la foto di copertina','preview-add preview-add-photo'),
          hero && tools('preview-photo-controls',add('hero','Cambia foto','preview-action preview-photo-action'),add('appearance.coverFormat','Formato','preview-action'),add('appearance.coverPosition','Ritaglio','preview-action')),
          hero && h('figcaption',editable('heroCaption','didascalia della copertina'),data.get('heroCaption') || 'Aggiungi una didascalia'),
          hero && h('p',{className:'preview-image-description',...editable('heroAlt','descrizione della copertina')},data.get('heroAlt') || 'Aggiungi la descrizione accessibile della foto…')
        ),
        h('dl',{className:`preview-facts ${anyFacts?'':'preview-all-empty'}`},...factRows.map(([key,label])=>h('div',{key,className:data.getIn(['travelFacts',key])?'':'preview-fact-empty'},h('dt',{},label),h('dd',editable('travelFacts.'+key,label),data.getIn(['travelFacts',key]) || `Aggiungi ${label.toLowerCase()}`)))),
        h('details',{className:'preview-editor-settings'},
          h('summary',{},'Impostazioni dell’articolo'),
          h('div',{className:'preview-settings-grid'},
            fieldChip('appearance.theme','Colore',themeLabel),
            fieldChip('appearance.textStyle','Testo',appearance.textStyle==='journal'?'Diario':'Contemporaneo'),
            fieldChip('appearance.dropCap','Iniziale',appearance.dropCap?'Grande':'Normale'),
            fieldChip('appearance.showContents','Sommario',appearance.showContents?'Mostra':'Nascondi'),
            fieldChip('titleAccent','Titolo in corsivo',data.get('titleAccent') || 'Nessuna parola'),
            fieldChip('slideText','Testo homepage',data.get('slideText') || 'Automatico','is-wide')
          )
        ),
        appearance.showContents && chapters.length > 1 && h('nav',{className:'preview-contents'},h('h2',{},'In questo racconto'),h('ol',{},...chapters.map((chapter,index) => h('li',{key:index},h('a',{href:'#preview-chapter-'+index},chapter.get('data').get('title') || `Capitolo ${index+1}`))))),
        h('div',{className:'preview-intro'},data.get('intro') ? widgetFor('intro') : emptyText('intro','Scrivi l’apertura del racconto…')),
        ...chapters.map((chapter,index) => {
          const item=chapter.get('data'), photo=asset(item.get('image'));
          const {layout,format}=ElyArticle.chapter({layout:item.get('layout'),imageFormat:item.get('imageFormat')},index);
          return h('section',{key:index,className:'preview-chapter preview-chapter-'+layout,'data-photo-format':format,'data-chapter-index':index},
            chapterTools(index,chapters.length),
            h('div',{className:'preview-copy'},
              h('h2',{id:'preview-chapter-'+index,...editable(`chapters.${index}.title`,'titolo del capitolo')},item.get('title') || 'Titolo del capitolo…'),
              item.get('body') ? chapter.getIn(['widgets','body']) : emptyText(`chapters.${index}.body`,'Scrivi il testo del capitolo…'),
              item.get('note') ? h('aside',{...editable(`chapters.${index}.note`,'consiglio pratico')},h('strong',{},'Da sapere'),chapter.getIn(['widgets','note'])) : null,
              tools('preview-content-inserts',!item.get('quote')&&add(`chapters.${index}.quote`,'+ Citazione','preview-action'),!item.get('note')&&add(`chapters.${index}.note`,'+ Consiglio pratico','preview-action'))
            ),
            photo ? h('figure',{className:'preview-editable-figure'},
              h('img',{...editable(`chapters.${index}.image`,'foto del capitolo'),src:photo,alt:item.get('imageAlt') || ''}),
              tools('preview-photo-controls',add(`chapters.${index}.image`,'Cambia foto','preview-action preview-photo-action'),add(`chapters.${index}.imageFormat`,'Formato','preview-action')),
              h('figcaption',editable(`chapters.${index}.caption`,'didascalia'),item.get('caption') || 'Aggiungi una didascalia'),
              h('p',{className:'preview-image-description',...editable(`chapters.${index}.imageAlt`,'descrizione della foto')},item.get('imageAlt') || 'Aggiungi la descrizione accessibile della foto…')
            ) : add(`chapters.${index}.image`,'+ Aggiungi fotografia','preview-add preview-add-photo'),
            item.get('quote') && h('blockquote',editable(`chapters.${index}.quote`,'citazione'),item.get('quote'))
          );
        }),
        tools('preview-add-row',action('chapters','add','+ Aggiungi capitolo')),
        h('section',{className:'preview-gallery-section'},
          (gallery.length>0) && h('h2',{},'Il viaggio, in immagini'),
          gallery.length>0 && h('div',{className:'preview-gallery'},h('div',{},...gallery.map((photo,index) => {
            const item=photo.get('data'),image=asset(item.get('image'));
            return h('figure',{key:index,'data-gallery-index':index,className:'preview-editable-figure'},
              galleryTools(index,gallery.length),
              image ? h('img',{...editable(`gallery.${index}.image`,'foto della galleria'),src:image,alt:item.get('alt') || ''}) : add(`gallery.${index}.image`,'Scegli la fotografia','preview-add preview-add-photo'),
              image && tools('preview-photo-controls',add(`gallery.${index}.image`,'Cambia foto','preview-action preview-photo-action')),
              h('figcaption',editable(`gallery.${index}.caption`,'didascalia della galleria'),item.get('caption') || 'Aggiungi una didascalia'),
              h('p',{className:'preview-image-description',...editable(`gallery.${index}.alt`,'descrizione della foto')},item.get('alt') || 'Aggiungi la descrizione accessibile della foto…')
            );
          }))),
          tools('preview-add-row',action('gallery','add','+ Aggiungi foto alla galleria'))
        ),
        h('section',{className:'preview-conclusion'},h('h2',{},'Prima di ripartire'),data.get('conclusion') ? widgetFor('conclusion') : emptyText('conclusion','Scrivi una conclusione…')),
        h('footer',{className:'preview-editor-footer'},
          h('p',{},'Tutto ciò che vedi sopra è modificabile direttamente. Premi Salva nella barra in alto quando vuoi conservare la bozza.'),
          h('p',{className:'preview-tags'},tagLabels.length ? `Tag: ${tagLabels.join(' · ')}` : 'Nessun tag ancora.')
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
