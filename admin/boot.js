window.elyCMSReady = (async () => {
  try {
    const [response,history] = await Promise.all([
      fetch('config.json', { cache: 'no-cache', signal:AbortSignal.timeout(15000) }),
      fetch('../content/stories.json',{cache:'no-cache',signal:AbortSignal.timeout(5000)}).then(r=>r.ok?r.json():[]).catch(()=>[])
    ]);
    if (!response.ok) throw new Error('Configurazione non disponibile');
    const config = await response.json();
    config.backend.base_url = location.origin;
    config.site_url = location.origin;
    config.display_url = location.origin;
    config.backend.api_root = location.origin + '/cms/api/v3';
    config.backend.graphql_api_root = location.origin + '/cms/api/graphql';
    config.load_config_file = false;
    const savedArticles=Array.isArray(history)?history.filter(record=>record&&typeof record.id==='string'):[];
    const h=CMS.React.createElement;
    CMS.registerPreviewStyle('/admin/preview.css?v=f8a9163ab771');
    const renderStory = ({ entry, widgetFor, widgetsFor, getAsset }) => {
      const data = entry.get('data');
      const asset = path => path ? getAsset(path)?.url || path : '';
      const hero = asset(data.get('hero'));
      const reuse=data.get('reuseCover') !== 'no', opening=asset(data.get(reuse?'hero':'articleHero')), openingKey=reuse?'hero':'articleHero', altKey=reuse?'heroAlt':'articleHeroAlt';
      const title = data.get('title') || 'Il titolo del tuo racconto';
      const accent = data.get('titleAccent');
      const chapters = widgetsFor('chapters') || [];
      const appearance = ElyArticle.appearance(Object.fromEntries(['theme', 'coverFormat', 'coverPosition', 'textStyle', 'dropCap', 'showContents'].map(key => [key, data.getIn(['appearance', key])])));
      const gallery = widgetsFor('gallery') || [];
      const editable = (key, label) => ({'data-key-path':key, tabIndex:0, title:`Modifica ${label}`});
      const formatted=(tag,key,label,value,fallback='')=>h(tag,{...editable(key,label),dangerouslySetInnerHTML:{__html:key==='title'?ElyArticle.heading(value || fallback,accent):ElyArticle.inline(value || fallback)}});
      const add = (key, label) => h('button', {...editable(key,label), type:'button', className:'preview-add'}, label);
      const action = (list, operation, label, index, disabled=false) => h('button', {
        type:'button', className:'preview-action', 'data-list':list, 'data-operation':operation,
        ...(index == null ? {} : {'data-index':index}), disabled
      }, label);
      const tools = (...children) => h('div', {className:'preview-local-tools'}, ...children);
      const options = (label, ...children) => h('details', {className:'preview-options'}, h('summary', {}, label), tools(...children));
      const emptyText = (key, label, className='preview-empty-text') => h('div', {className, ...editable(key,label)}, label);
      const photoSlot=(key,format='landscape')=>h('div',{className:'preview-photo-slot','data-photo-format':format},h('button',{...editable(key,'fotografia'),type:'button'},'Aggiungi foto'));
      const itemTools = (list, index, count, label) => tools(
        action(list,'up','Sposta prima',index,index===0), action(list,'down','Sposta dopo',index,index===count-1),
        action(list,'remove',`Elimina ${label}`,index)
      );
      // Send the actual draft to the writing tools, including unmounted chapter fields.
      const values = Object.fromEntries(['id','title','kind','destination','date','deck','hero','heroAlt','heroCaption','reuseCover','articleHero','articleHeroAlt','intro','conclusion','published','preparing','category','tags','slideText'].map(key => [key, data.get(key)]));
      values.chapters = chapters.map(chapter => Object.fromEntries(['title','body','image','imageAlt','caption','quote','note'].map(key => [key, chapter.get('data').get(key)])));
      values.gallery = gallery.map(photo => Object.fromEntries(['image','alt','caption'].map(key => [key, photo.get('data').get(key)])));
      values.appearance=appearance;
      values.titleAccent=data.get('titleAccent');
      values.travelFacts = Object.fromEntries(['duration','season','style'].map(key => [key, data.getIn(['travelFacts',key])]));

      window.dispatchEvent(new CustomEvent('ely:article-change', {detail:values}));
      const facts = [['duration', 'Durata'], ['season', 'Quando partire'], ['style', 'Tipo di viaggio']].filter(([key]) => data.getIn(['travelFacts', key]));
      return h('div', {className:'preview-workspaces'},
        h('section',{className:'preview-cover-workspace','aria-label':'Anteprima della copertina'},
          h('p',{className:'preview-surface-label'},'Copertina · slideshow e archivio'),
          h('figure',{className:'preview-cover-card'},hero?h('img',{...editable('hero','foto di copertina'),src:hero,alt:data.get('heroAlt') || ''}):photoSlot('hero','landscape'),
          h('figcaption',{},h('p',editable('destination','destinazione'),data.get('destination') || 'Destinazione'),formatted('h2','title','titolo',title),formatted('p','slideText','testo dello slideshow',data.get('slideText') || data.get('deck'),'Testo dello slideshow…'))),
          tools(add('hero','Cambia foto'),add('heroAlt','Descrizione della copertina'),add('deck','Testo dell’archivio'))),
        h('article', { className:'preview-story', style:{'--article-accent':appearance.accent}, 'data-text-style':appearance.textStyle, 'data-drop-cap':String(appearance.dropCap), 'data-cover-format':appearance.coverFormat },
        h('header', {className:'preview-editor-header'},
          h('p', {className:'preview-edit-guide'}, 'Clicca un testo o una foto per modificarli.'),
          null
        ),
        h('p', {className:'preview-meta'}, h('span',editable('destination','destinazione'),data.get('destination') || 'Aggiungi la destinazione'), ' · ', h('span',editable('date','data'),data.get('date') || 'Scegli la data')),
        h('h1',{...editable('title','titolo'),dangerouslySetInnerHTML:{__html:ElyArticle.heading(title,accent)}}),
        h('p',{className:'preview-deck',...editable('deck','introduzione breve'),dangerouslySetInnerHTML:{__html:ElyArticle.inline(data.get('deck') || 'Presenta il viaggio in poche righe…')}}),
        tools(add('reuseCover','Usare la copertina come prima foto? '+(reuse?'Sì':'No'))),
        h('figure', {className:'preview-cover'},
          opening ? h('img', {...editable(openingKey,'prima foto dell’articolo'),src:opening,alt:data.get(altKey) || '',style:{objectPosition:appearance.coverPosition}}) : photoSlot(openingKey,appearance.coverFormat),
          opening && formatted('figcaption','heroCaption','didascalia della prima foto',data.get('heroCaption'),'Aggiungi una didascalia'),
          opening && h('p',{className:'preview-image-description',...editable(altKey,'descrizione della prima foto')},'Descrizione della foto: '+(data.get(altKey) || 'aggiungi una descrizione…')),
          options('Opzioni della prima foto',add(openingKey,'Cambia foto'),add('appearance.coverFormat','Formato'),add('appearance.coverPosition','Ritaglio'))
        ),
        facts.length > 0 && h('dl',{className:'preview-facts'},...facts.map(([key,label]) => h('div',{key},h('dt',{},label),h('dd',editable('travelFacts.'+key,label),data.getIn(['travelFacts',key]))))),
        appearance.showContents && chapters.length > 1 && h('nav',{className:'preview-contents'},h('h2',{},'In questo racconto'),h('ol',{},...chapters.map((chapter,index) => h('li',{key:index},h('a',{href:'#preview-chapter-'+index,dangerouslySetInnerHTML:{__html:ElyArticle.inline(chapter.get('data').get('title') || `Capitolo ${index+1}`,{links:false})}}))))),
        h('div',{className:'preview-intro'},data.get('intro') ? widgetFor('intro') : emptyText('intro','Scrivi l’apertura del racconto…')),
        ...chapters.map((chapter,index) => {
          const item=chapter.get('data'), photo=asset(item.get('image'));
          const {layout,format}=ElyArticle.chapter({layout:item.get('layout'),imageFormat:item.get('imageFormat')},index);
          return h('section',{key:index,className:'preview-chapter preview-chapter-'+layout,'data-photo-format':format,'data-chapter-index':index},
            h('div',{className:'preview-chapter-tools'},h('span',{},`Capitolo ${index+1}`),itemTools('chapters',index,chapters.length,'capitolo')),
            h('div',{className:'preview-copy'},
              h('h2',{id:'preview-chapter-'+index,...editable(`chapters.${index}.title`,'titolo del capitolo'),dangerouslySetInnerHTML:{__html:ElyArticle.inline(item.get('title') || 'Titolo del capitolo…')}}),
              item.get('body') ? chapter.getIn(['widgets','body']) : emptyText(`chapters.${index}.body`,'Scrivi il testo del capitolo…'),
              item.get('note') && h('aside',{},h('strong',{},'Da sapere'),chapter.getIn(['widgets','note']))
            ),
            photo ? h('figure',{},
              h('img',{...editable(`chapters.${index}.image`,'foto del capitolo'),src:photo,alt:item.get('imageAlt') || ''}),
              formatted('figcaption',`chapters.${index}.caption`,'didascalia',item.get('caption'),'Aggiungi una didascalia'),
              h('p',{className:'preview-image-description',...editable(`chapters.${index}.imageAlt`,'descrizione della foto')},'Descrizione della foto: '+(item.get('imageAlt') || 'aggiungi una descrizione…')),
              options('Opzioni della foto',add(`chapters.${index}.image`,'Cambia foto'),add(`chapters.${index}.imageFormat`,'Formato'))
            ) : h('figure',{},photoSlot(`chapters.${index}.image`,format)),
            item.get('quote') && formatted('blockquote',`chapters.${index}.quote`,'citazione',item.get('quote')),
            options('Opzioni del capitolo',
              add(`chapters.${index}.layout`,'Disposizione'),
              !item.get('quote') && add(`chapters.${index}.quote`,'Aggiungi citazione'),
              !item.get('note') && add(`chapters.${index}.note`,'Aggiungi consiglio pratico')
            )
          );
        }),
        tools(action('chapters','add','Aggiungi capitolo')),
        h('section',{className:'preview-gallery-section'},
          (gallery.length>0) && h('h2',{},'Il viaggio, in immagini'),
          gallery.length>0 && h('div',{className:'preview-gallery'},h('div',{},...gallery.map((photo,index) => {
            const item=photo.get('data'),image=asset(item.get('image'));
            return h('figure',{key:index,'data-gallery-index':index},
              image ? h('img',{...editable(`gallery.${index}.image`,'foto della galleria'),src:image,alt:item.get('alt') || ''}) : photoSlot(`gallery.${index}.image`,'landscape'),
              formatted('figcaption',`gallery.${index}.caption`,'didascalia della galleria',item.get('caption'),'Aggiungi una didascalia'),
              h('p',{className:'preview-image-description',...editable(`gallery.${index}.alt`,'descrizione della foto')},'Descrizione della foto: '+(item.get('alt') || 'aggiungi una descrizione…')),
              options('Opzioni della foto',add(`gallery.${index}.image`,'Cambia foto'),itemTools('gallery',index,gallery.length,'foto'))
            );
          }))),
          tools(action('gallery','add','Aggiungi foto alla galleria'))
        ),
        h('section',{className:'preview-conclusion'},h('h2',{},'Prima di ripartire'),data.get('conclusion') ? widgetFor('conclusion') : emptyText('conclusion','Scrivi una conclusione…'))

      ));
    };
    // Se il template fallisce, l'errore compare nell'anteprima invece di lasciarla vuota.
    CMS.registerPreviewTemplate('racconti', props => {
      try { return renderStory(props); }
      catch (error) {
        console.error('Anteprima racconto:', error);
        return h('pre', {style:{padding:'24px',whiteSpace:'pre-wrap',color:'#9f4933',font:'14px/1.6 monospace'}}, 'Errore nell’anteprima: ' + (error && error.message ? error.message : error) + '\n\nMandami questo messaggio per correggere.');
      }
    });
    CMS.registerEventListener({name:'preSave',handler:async({entry})=>{
      await window.elyDraftBackup?.beforeSave();
      const data=entry.get('data'),previous=savedArticles.find(record=>record.id===data.get('id'));
      return previous && previous.title!==data.get('title') ? data.set('titleAccent','') : data;
    }});
    ElyTitle.register();
    ElyPlacementEditor.register();
    await CMS.init({ config });
  } catch (error) { throw error; }
})();
// The access controller displays initialization failures with its retry action.
window.elyCMSReady.catch(()=>{});
