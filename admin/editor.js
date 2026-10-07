(() => {
  const groups = [
    ['title', 'L’essenziale', 'Un titolo, una destinazione e poche righe per invitare a partire.'],
    ['hero', 'La prima impressione', 'Scegli la fotografia che apre il viaggio.'],
    ['intro', 'La tua voce, il tuo viaggio', 'Parti da un ricordo. I capitoli ti aiutano a dare ritmo al racconto.'],
    ['travelFacts', 'I dettagli che aiutano a partire', 'Informazioni pratiche, fotografie e conclusione: aggiungi ciò che serve.'],
    ['appearance', 'Il racconto prende forma', 'Colori, copertina e stile di lettura, con l’anteprima accanto.'],
    ['published', 'Prima di condividere', 'Controlla il racconto, poi scegli come salvarlo.']
  ];
  const steps = [['title','Inizia'], ['hero','Copertina'], ['intro','Scrivi'], ['appearance','Aspetto'], ['published','Pubblica']];
  const field = key => document.querySelector(`.content-editor section.field[data-key-path="${key}"]`);
  const text = value => String(value || '').trim();
  const plain = value => text(value).replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, ' ').replace(/[#*_`~>|]/g, ' ');
  const icon = name => {
    const paths = {check:'m5 12 4 4L19 6', arrow:'M5 12h14m-5-5 5 5-5 5', download:'M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5', book:'M4 4h6a2 2 0 0 1 2 2v14a3 3 0 0 0-3-2H4V4Zm16 0h-6a2 2 0 0 0-2 2v14a3 3 0 0 1 3-2h5V4Z', circle:'M12 8v5m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'};
    return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]}"/></svg>`;
  };
  let previewKey='',syncUntil=0,syncPending=false;
  const syncPreview=key=>{
    const editor=document.querySelector('.content-editor');if(!key || editor?.classList.contains('ely-page-mode'))return;
    previewKey=key;const doc=editor?.querySelector('iframe.preview')?.contentDocument;
    const target=doc?.querySelector(`[data-key-path="${CSS.escape(key)}"]`) || (key==='hero'?doc?.querySelector('.preview-cover'):null);
    if(target){syncUntil=performance.now()+350;target.scrollIntoView({block:'start'});doc.querySelectorAll('.ely-field-highlight').forEach(node=>node.classList.remove('ely-field-highlight'));target.classList.add('ely-field-highlight');}
  };
  document.addEventListener('focusin',event=>{const key=event.target.closest?.('section.field')?.dataset.keyPath;if(key)syncPreview(key);});
  document.addEventListener('scroll',event=>{const host=event.target;if(!host.matches?.('.ely-editor-content') || performance.now()<syncUntil || syncPending)return;syncPending=true;requestAnimationFrame(()=>{syncPending=false;const top=host.getBoundingClientRect().top+120;const candidates=[...host.querySelectorAll('section.field[data-key-path]')].filter(node=>node.getBoundingClientRect().bottom>top);syncPreview(candidates[0]?.dataset.keyPath);});},true);
  let article = null, scheduled = false, jumpToken = 0, currentContent = null, currentEditor = null;
  const editedText = new Set();
  const setText = (element, value) => {if (element && element.textContent !== value) element.textContent = value;};
  // The native preview pauses on phones. Read edited controls as well, without
  // writing to the CMS or reaching into its private stores.
  const markdownNode = node => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const content = [...node.childNodes].map(markdownNode).join('');
    switch (node.tagName) {
      case 'BR': return '\n';
      case 'STRONG': case 'B': return `**${content}**`;
      case 'EM': case 'I': return `*${content}*`;
      case 'A': return `[${content}](${node.getAttribute('href') || ''})`;
      case 'H2': return `## ${content}\n\n`;
      case 'H3': return `### ${content}\n\n`;
      case 'P': return `${content}\n\n`;
      case 'BLOCKQUOTE': return content.trim().split('\n').map(line => '> ' + line).join('\n') + '\n\n';
      case 'UL': case 'OL': return [...node.children].map((item,index) => `${node.tagName === 'OL' ? index + 1 + '.' : '-'} ${[...item.childNodes].map(markdownNode).join('').trim()}`).join('\n') + '\n\n';
      case 'IMG': return `![${node.getAttribute('alt') || ''}](${node.getAttribute('src') || ''})`;
      default: return content;
    }
  };
  const syncControls = () => {
    if (!article || !currentContent?.isConnected) return;
    for (const section of currentContent.querySelectorAll('section.field[data-key-path]')) {
      const type = section.dataset.fieldType, path = section.dataset.keyPath.split('.');
      if (!['string','text','datetime','boolean','select','richtext','image'].includes(type)) continue;
      const wrapper = section.querySelector(':scope > .field-wrapper');
      if (!wrapper) continue;
      let value;
      if (type === 'richtext') {
        const editor = wrapper.querySelector('[contenteditable="true"]');
        if (!editor || !editedText.has(section.dataset.keyPath)) continue;
        value = [...editor.childNodes].map(markdownNode).join('').trim();
      } else if (type === 'boolean') {
        const toggle = wrapper.querySelector('[role="switch"], [role="checkbox"]');
        if (!toggle) continue;value = toggle.getAttribute('aria-checked') === 'true';
      } else if (type === 'select') {
        const selected = wrapper.querySelector('[role="radio"][aria-checked="true"]');
        if (!selected) continue;value = selected.value;
      } else if (type === 'image') {
        const image = wrapper.querySelector('[role="textbox"]');
        if (!image) continue;value = image.textContent.trim();
      } else {
        const input = wrapper.querySelector('input:not([type="file"]), textarea');
        if (!input) continue;value = input.value;
      }
      let target = article;
      for (let index = 0; index < path.length - 1; index++) {
        if (target[path[index]] == null) target[path[index]] = /^\d+$/.test(path[index + 1]) ? [] : {};
        target = target[path[index]];
      }
      target[path.at(-1)] = value;
    }
  };
  const jump = key => {
    const token = ++jumpToken, content = currentContent;
    if (!content) return;
    const reveal = section => {
      const collapsed = section.querySelector('button[aria-expanded="false"][aria-controls]');
      if (collapsed && section.dataset.fieldType === 'object') collapsed.click();
      section.scrollIntoView({block:'start', behavior:'instant'});
      for (const delay of [100,250]) setTimeout(() => {
        if (token === jumpToken && section.isConnected) section.scrollIntoView({block:'start', behavior:'instant'});
      }, delay);
      const control = section.querySelector('input:not([type="file"]), textarea, [contenteditable="true"]') || section.querySelector('.field-wrapper [role="switch"], .field-wrapper [role="checkbox"], .field-wrapper [role="radio"], .field-wrapper button');
      control?.focus({preventScroll:true});
    };
    if (field(key)) {reveal(field(key));return;}
    // Traverse virtualized fields in either direction rather than relying on mounted DOM.
    let attempts = 0;
    const find = () => {
      if (token !== jumpToken || !content.isConnected) return;
      const section = field(key);
      if (section) {reveal(section);return;}
      if (++attempts > 35) {setText(content.querySelector('.ely-editor-feedback'), 'Sezione non ancora disponibile. Scorri l’editor per raggiungerla.');return;}
      const first = [...content.querySelectorAll(':scope > section.field')][0]?.dataset.keyPath;
      const all = ['title','kind','date','destination','deck','hero','heroAlt','heroCaption','intro','chapters','travelFacts','category','tags','gallery','conclusion','appearance','titleAccent','slideText','published','preparing'];
      content.scrollTop += all.indexOf(key) < all.indexOf(first) ? -content.clientHeight * .8 : content.clientHeight * .8;
      setTimeout(find, 60);
    };
    find();
  };
  const checks = data => {
    const chapters = data.chapters || [], gallery = data.gallery || [];
    const narrative = [data.intro, data.conclusion, ...chapters.flatMap(c => [c.body,c.quote,c.note])].join('\n');
    const placeholder = [data.title,data.deck,narrative,...chapters.map(c => c.title)].some(value => /lorem ipsum|testo (?:provvisorio|di prova)|\[da (?:scrivere|completare)\]/i.test(text(value)));
    const photos = (data.hero ? 1 : 0) + chapters.filter(c => c.image).length + gallery.filter(p => p.image).length;
    const descriptions = (!data.hero || text(data.heroAlt)) && chapters.every(c => !c.image || text(c.imageAlt)) && gallery.every(p => !p.image || text(p.alt));
    return [
      {key:'title', label:'Titolo e destinazione', done:!!(text(data.title) && text(data.destination)), hint:'Dai un nome al racconto e al luogo.'},
      {key:'deck', label:'Introduzione per l’archivio', done:!!text(data.deck), hint:'Aggiungi poche righe per presentare il viaggio.'},
      {key:'hero', label:'Foto di copertina', done:!!data.hero, hint:'Scegli la fotografia di apertura.'},
      {key:!text(data.heroAlt) && data.hero ? 'heroAlt' : chapters.some(c => c.image && !text(c.imageAlt)) ? 'chapters' : 'gallery', label:'Descrizioni delle fotografie', done:!!(photos && descriptions), hint:'Descrivi le foto della copertina, dei capitoli e della galleria.'},
      {key:'intro', label:'Testo completo, senza segnaposto', done:!!plain(data.intro).trim() && !placeholder && chapters.every(c => text(c.title) && plain(c.body).trim()), hint:placeholder ? 'Ci sono testi provvisori: sostituiscili prima di pubblicare.' : 'Scrivi l’apertura e completa i capitoli che hai aggiunto.'},
      {key:'date', label:'Data del racconto', done:/^\d{4}-\d{2}-\d{2}$/.test(text(data.date)), hint:'Scegli la data: determina l’ordine nell’archivio.'}
    ];
  };
  const update = () => {
    if (!article || !currentContent?.isConnected) return;
    const list = checks(article), complete = list.filter(c => c.done).length;
    const narrative = [article.intro,article.conclusion,...(article.chapters || []).flatMap(c => [c.body,c.note,c.quote])].map(plain).join(' ');
    const words = (narrative.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) || []).length;
    setText(currentContent.querySelector('.ely-word-count'), `${words.toLocaleString('it-IT')} parole`);
    setText(currentContent.querySelector('.ely-reading-time'), words ? `${Math.max(1,Math.ceil(words / 200))} min di lettura · stima` : 'Tempo di lettura da stimare');
    const chapters = article.chapters?.length || 0;
    setText(currentContent.querySelector('.ely-chapter-count'), `${chapters} ${chapters === 1 ? 'capitolo' : 'capitoli'}`);
    setText(currentContent.querySelector('.ely-visibility'), !article.published ? 'Dopo Salva: bozza' : article.kind === 'consiglio' && article.preparing ? 'Dopo Salva: in preparazione' : 'Dopo Salva: visibile sul sito');
    setText(currentContent.querySelector('.ely-check-summary'), complete === list.length ? 'Controlli completati. Rileggi l’anteprima.' : `${list.length - complete} ${list.length - complete === 1 ? 'dettaglio da rivedere' : 'dettagli da rivedere'}`);
    currentContent.querySelector('.ely-check-jump')?.setAttribute('data-ready', String(complete === list.length));
    const checklist = currentContent.querySelector('.ely-publish-checks');
    if (checklist && checklist.dataset.signature !== JSON.stringify(list)) {
      checklist.dataset.signature = JSON.stringify(list);
      // Retain controls and keyboard focus across preview updates.
      for (const [i,check] of list.entries()) {
        const row = checklist.children[i];row.dataset.done = String(check.done);
        row.querySelector('button').dataset.jump = check.key;
        row.querySelector('button').setAttribute('aria-label', `${check.done ? 'Completato' : 'Da rivedere'}: ${check.label}. Vai al campo`);
        setText(row.querySelector('.ely-check-label'), check.label);
        setText(row.querySelector('.ely-check-hint'), check.done ? 'Completato' : check.hint);
      }
    }
    setText(currentContent.querySelector('.ely-publish-status'), !article.published ? 'Salva una bozza: il racconto resta fuori dall’archivio e dalla homepage.' : article.kind === 'consiglio' && article.preparing ? 'Salva una scheda in preparazione: sarà visibile nell’archivio, senza l’articolo completo.' : 'Salva rende il racconto visibile nell’archivio e nello slideshow della homepage.');
    if (field('preparing')) field('preparing').hidden = article.kind !== 'consiglio';
    const download = currentContent.querySelector('.ely-download');
    if (download) download.disabled = !text(article.title) && !words;
  };
  const download = () => {
    if (!article) return;
    syncControls();
    const chapterText = (article.chapters || []).map(c => [c.title && `## ${c.title}`,c.body,c.image && `![${c.imageAlt || ''}](${c.image})`,c.caption,c.quote && `> ${c.quote}`,c.note && `### Da sapere\n\n${c.note}`].filter(Boolean).join('\n\n')).join('\n\n');
    const facts = article.travelFacts || {};
    const markdown = [`# ${article.title || 'Il mio racconto'}`,[article.destination,article.date].filter(Boolean).join(' · '),article.deck,article.hero && `![${article.heroAlt || ''}](${article.hero})`,article.heroCaption,...[['duration','Durata'],['season','Quando partire'],['style','Tipo di viaggio']].filter(([key]) => facts[key]).map(([key,label]) => `${label}: ${facts[key]}`),article.intro,chapterText,...(article.gallery || []).map(p => [p.image && `![${p.alt || ''}](${p.image})`,p.caption].filter(Boolean).join('\n\n')),article.conclusion].filter(Boolean).join('\n\n') + '\n';
    const url = URL.createObjectURL(new Blob([markdown],{type:'text/markdown;charset=utf-8'}));
    const link = document.createElement('a');link.href = url;
    link.download = (text(article.title).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80) || 'racconto') + '.md';
    link.click();setTimeout(() => URL.revokeObjectURL(url),1000);
    setText(currentContent.querySelector('.ely-editor-feedback'), 'Copia del testo scaricata. Le fotografie sono incluse come riferimenti; usa Salva per conservare le modifiche nel pannello.');
  };
  const createStudio = content => {
    const studio = document.createElement('section');studio.className = 'ely-studio';studio.setAttribute('aria-label','Il taccuino di Ely');
    studio.innerHTML = `<div class="ely-studio-brand"><a href="/" target="_blank" rel="noopener">ElyExploreWorld</a><span>Studio racconti</span></div><h1>Il taccuino di Ely.</h1><p>Un luogo per raccogliere ricordi e trasformarli in voglia di partire.</p><span class="ely-visibility">Caricamento del racconto…</span><div class="ely-writing-stats" aria-label="Statistiche del testo"><span class="ely-word-count">— parole</span><span class="ely-reading-time">Tempo di lettura da stimare</span><span class="ely-chapter-count">— capitoli</span></div><div class="ely-studio-actions"><button type="button" class="ely-check-jump">${icon('circle')}<span class="ely-check-summary">Controlla prima di pubblicare</span>${icon('arrow')}</button><button type="button" class="ely-download" disabled title="Scarica una copia del testo in formato Markdown">${icon('download')}Scarica il testo</button></div><p class="ely-editor-feedback" role="status" aria-live="polite"></p>`;
    studio.querySelector('.ely-check-jump').addEventListener('click',() => jump('published'));
    studio.querySelector('.ely-download').addEventListener('click',download);
    const nav = document.createElement('nav');nav.className = 'ely-editor-nav';nav.setAttribute('aria-label','Sezioni dell’editor');
    for (const [key,label] of steps) {
      const button = document.createElement('button');button.type = 'button';button.textContent = label;button.dataset.jump = key;
      button.addEventListener('click',() => jump(key));nav.append(button);
    }
    const guide = document.createElement('details');guide.className = 'ely-editor-guide';
    guide.innerHTML = '<summary>La prima volta qui? Parti da questa guida.</summary><ol><li><strong>Prepara l’invito.</strong> Titolo, destinazione, introduzione breve e copertina presentano il racconto nell’archivio.</li><li><strong>Racconta il viaggio.</strong> Scrivi l’apertura, poi aggiungi capitoli, consigli pratici e fotografie se servono.</li><li><strong>Rileggi e condividi.</strong> Controlla l’anteprima e la checklist. Attiva “Visibile sul sito” e premi Salva quando sei pronta.</li></ol><p>Per continuare più tardi, lascia “Visibile sul sito” disattivato e salva una bozza. Il salvataggio non rende riservato il file: evita informazioni personali o confidenziali.</p>';
    content.prepend(studio,nav,guide);
    content.addEventListener('click', () => requestAnimationFrame(() => {syncControls();update();}));
    content.addEventListener('scroll',() => {
      const offset = content.getBoundingClientRect().top + 100;
      let active = 'title';
      for (const [key] of steps) if (field(key)?.getBoundingClientRect().top <= offset) active = key;
      for (const button of nav.children) {
        if (button.dataset.jump === active) button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
      }
    },{passive:true});
    nav.firstElementChild.setAttribute('aria-current','step');
  };
  const enhance = () => {
    scheduled = false;
    const editor = document.querySelector('.content-editor');
    if (!editor) {currentContent = null;currentEditor = null;article = null;return;}
    const content = editor.querySelector('.pane[data-mode="edit"] #first-pane-body > .content') || field('title')?.parentElement;
    if (!content) {
      // The phone's edit/preview switch reuses its content container. Remove
      // our form-only additions when the native pane becomes a preview.
      const preview = editor.querySelector('.pane[data-mode="preview"] #first-pane-body > .content');
      preview?.classList.remove('ely-editor-content');
      preview?.querySelectorAll(':scope > .ely-studio, :scope > .ely-editor-nav, :scope > .ely-editor-guide').forEach(element=>element.remove());
      currentContent = null;
      return;
    }
    if (editor !== currentEditor) {
      currentEditor = editor;
      editedText.clear();
      if (article?.editor !== editor) article = null;
    }
    currentContent = content;content.classList.add('ely-editor-content');
    if (!content.querySelector('.ely-studio')) createStudio(content);
    for (const [key,label,hint] of groups) {
      const section = field(key);
      if (!section || section.querySelector(':scope > .ely-editor-section')) continue;
      const heading = document.createElement('div');heading.className = 'ely-editor-section';
      const h2 = document.createElement('h2');h2.textContent = label;
      const description = document.createElement('p');description.textContent = hint;heading.append(h2,description);section.prepend(heading);
      if (key === 'intro') {
        const prompts = document.createElement('details');prompts.className = 'ely-writing-prompts';
        prompts.innerHTML = `<summary>${icon('book')}Un piccolo aiuto per iniziare</summary><ul><li><strong>Un momento preciso.</strong> Quale immagine, incontro o sensazione ti è rimasta?</li><li><strong>Il tuo ritmo.</strong> Cosa hai scelto di vivere con calma e cosa ti ha sorpresa?</li><li><strong>Da Ely a chi parte.</strong> Quale consiglio concreto daresti a una persona che sogna questo viaggio?</li></ul><p>Non serve raccontare tutto. Scegli i dettagli che fanno sentire il luogo.</p>`;heading.append(prompts);
      }
      if (key === 'published') {
        const list = document.createElement('ul');list.className = 'ely-publish-checks';list.setAttribute('aria-label','Checklist prima della pubblicazione');
        for (let i = 0; i < 6; i++) {
          const row = document.createElement('li');row.innerHTML = `<button type="button"><span class="ely-check-icon">${icon('check')}${icon('circle')}</span><span><span class="ely-check-label"></span><span class="ely-check-hint"></span></span>${icon('arrow')}</button>`;
          row.querySelector('button').addEventListener('click',event => jump(event.currentTarget.dataset.jump));list.append(row);
        }
        const status = document.createElement('p');status.className = 'ely-publish-status';
        const note = document.createElement('p');note.className = 'ely-publish-note';note.textContent = 'La checklist ti aiuta a rileggere, senza bloccare il salvataggio delle bozze. Dopo Salva, il sito può impiegare qualche minuto ad aggiornarsi. La data ordina i racconti: non programma la pubblicazione.';
        heading.append(list,status,note);
      }
    }
    const previewHeader = editor.querySelector('#second-pane-header .sui.toolbar > .inner') || editor.querySelector('.pane[data-mode="preview"] #first-pane-header .sui.toolbar > .inner');
    if (previewHeader && !previewHeader.querySelector('.ely-preview-devices')) {
      const controls = document.createElement('div');controls.className = 'ely-preview-devices';controls.setAttribute('role','group');controls.setAttribute('aria-label','Formato dell’anteprima');
      for (const [mode,label] of [['desktop','Desktop'],['phone','Telefono']]) {
        const button = document.createElement('button');button.type = 'button';button.setAttribute('aria-label',label);button.title=label;button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">'+(mode==='desktop'?'<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M12 16v5m-5 0h10"/>':'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>')+'</svg>';button.setAttribute('aria-pressed',String(mode === 'desktop'));
        button.addEventListener('click',() => {editor.classList.toggle('ely-phone-preview',mode === 'phone');for (const item of controls.children) item.setAttribute('aria-pressed',String(item === button));});controls.append(button);
      }
      previewHeader.append(controls);
    }
    const firstHeader = editor.querySelector('#first-pane-header .sui.toolbar > .inner');
    if (firstHeader && !firstHeader.querySelector('.ely-focus-toggle')) {
      const button = document.createElement('button');button.type = 'button';button.className = 'ely-focus-toggle';button.textContent = 'Solo scrittura';button.setAttribute('aria-pressed','false');
      button.addEventListener('click',() => {const focus = editor.classList.toggle('ely-writing-mode');button.setAttribute('aria-pressed',String(focus));button.textContent = focus ? 'Mostra anteprima' : 'Solo scrittura';});firstHeader.append(button);
    }
    syncControls();update();
    const frame=editor.querySelector('iframe.preview');if(frame && !frame.dataset.elySync){frame.dataset.elySync='true';frame.addEventListener('load',()=>syncPreview(previewKey));}
  };
  window.addEventListener('ely:article-change',event => {article = {...event.detail,editor:document.querySelector('.content-editor')};update();if(previewKey)requestAnimationFrame(()=>syncPreview(previewKey));});
  const readInput = event => {
    if (!event.target.closest('.content-editor')) return;
    const rich = event.target.closest('[contenteditable="true"]');
    if (rich) editedText.add(rich.closest('section.field')?.dataset.keyPath);
    syncControls();update();
    requestAnimationFrame(() => {syncControls();update();});
  };
  for (const event of ['input','beforeinput']) document.addEventListener(event, readInput, {capture:true});
  new MutationObserver(records => {
    if (records.every(record => record.target.closest?.('[class^="ely-"]'))) return;
    if (!scheduled) {scheduled = true;requestAnimationFrame(enhance);}
  }).observe(document.body,{childList:true,subtree:true});
  enhance();
})();
