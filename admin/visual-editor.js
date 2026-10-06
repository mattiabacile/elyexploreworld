/* Place the real CMS field over the selected preview block. No duplicate draft,
   HTML-to-Markdown conversion or private CMS store is involved. */
(() => {
  let editor, frame, active, selection, toolbar, backdrop, selecting = false, previewSwitch = false, pending = 0, lastInput = 0, finishTimer;
  const boundFrames = new WeakSet();
  const field = key => editor?.querySelector(`section.field[data-key-path="${CSS.escape(key)}"]`);
  const visual = () => editor?.classList.contains('ely-page-mode');
  const close = (restoreFocus = true) => {
    // The native rich text editor serializes changes asynchronously (100 ms).
    // Let that finish before the phone's single pane unmounts the control.
    if (restoreFocus && active?.dataset.fieldType==='richtext' && performance.now()-lastInput<250) {
      clearTimeout(finishTimer);
      finishTimer=setTimeout(()=>close(restoreFocus),250-(performance.now()-lastInput));
      return;
    }
    clearTimeout(finishTimer);
    pending++;
    selecting = false;
    active?.classList.remove('ely-on-page-field');
    active?.style.removeProperty('--ely-field-left');
    active?.style.removeProperty('--ely-field-top');
    active?.style.removeProperty('--ely-field-width');
    active = null;
    if (toolbar) toolbar.hidden = true;
    backdrop?.remove();backdrop = null;
    if (restoreFocus && selection?.element.isConnected) selection.element.focus({preventScroll:true});
    requestAnimationFrame(enhance);
  };
  const place = () => {
    if (!active) return;
    const bounds = frame?.isConnected ? frame.getBoundingClientRect() : selection.bounds;
    const target = selection?.element.isConnected ? selection.element.getBoundingClientRect() : {top:60,left:24,width:bounds.width-48};
    const phone = innerWidth < 768;
    const width = phone ? innerWidth - 24 : Math.min(700,Math.max(380,target.width),innerWidth - 48);
    const left = phone ? 12 : Math.max(24,Math.min(bounds.left+target.left,innerWidth-width-24));
    const top = phone ? Math.max(100,innerHeight*.38) : Math.max(120,Math.min(bounds.top+target.top,innerHeight-320));
    active.style.setProperty('--ely-field-left',left+'px');
    active.style.setProperty('--ely-field-top',top+'px');
    active.style.setProperty('--ely-field-width',width+'px');
    toolbar.style.left = left+'px';toolbar.style.top = (top-44)+'px';toolbar.style.width = width+'px';
  };
  const select = element => {
    close(false);
    const key = element.dataset.keyPath;
    selection = {element, scroll:frame.contentWindow.scrollY, bounds:frame.getBoundingClientRect()};
    if (!editor.querySelector('#second-pane-body')) {
      // Small screens unmount the native preview while a field is open. Keep
      // an inert snapshot behind the editor until the live preview returns.
      backdrop = document.createElement('iframe');backdrop.className='ely-page-backdrop';
      backdrop.setAttribute('aria-hidden','true');backdrop.tabIndex=-1;backdrop.title='';
      backdrop.setAttribute('sandbox','allow-same-origin');
      const snapshot=frame.contentDocument.documentElement.cloneNode(true);
      snapshot.querySelectorAll('script').forEach(script=>script.remove());
      backdrop.srcdoc=snapshot.outerHTML;
      const scroll = selection.scroll;
      backdrop.addEventListener('load',()=>backdrop?.contentWindow?.scrollTo(0,scroll),{once:true});
      editor.querySelector('.content-area').append(backdrop);
    }
    selecting = true;
    const token = ++pending;
    const feedback = editor.querySelector('.ely-page-feedback');
    feedback.textContent = 'Apertura del campo…';
    // This is the CMS's native preview-to-field protocol. It expands collapsed
    // list items and finds fields that are not yet mounted by virtualization.
    window.postMessage({type:'highlight-editor-field',payload:{locale:editor.querySelector('.pane[data-locale]').dataset.locale,keyPath:key}},location.origin);
    let attempts = 0;
    const reveal = () => {
      if (token !== pending || !visual()) return;
      const section = field(key);
      if (!section || !section.querySelector(':scope > .field-wrapper')) {
        const parts = key.split('.');
        const parent = field(parts[0]);
        const item = parts.length > 2 ? parent?.querySelector(`[id$="-item-${parts[1]}-body"]`) : parent;
        // Native preview highlighting expands the item. Bring its placeholders
        // into the edit pane's viewport so lazy field controls can mount.
        const placeholder = item?.querySelector('.placeholder');
        (placeholder || item || parent)?.scrollIntoView({block:'center'});
        if (!parent) {
          // A newly created gallery can sit below an expanded chapter. The
          // native highlighter stops at the last mounted field; traverse the
          // real scroll pane until the target root's placeholders can mount.
          const content=editor.querySelector('.pane[data-mode="edit"] #first-pane-body > .content');
          const order=['title','kind','date','destination','deck','hero','heroAlt','heroCaption','intro','chapters','travelFacts','category','tags','gallery','conclusion','appearance','titleAccent','slideText','published','preparing'];
          const mounted=content?.querySelector(':scope > section.field');
          if(content) content.scrollTop+=(order.indexOf(parts[0])<order.indexOf(mounted?.dataset.keyPath)?-1:1)*content.clientHeight*.8;
        }
        if (++attempts < 80) {setTimeout(reveal,75);return;}
        selecting = false;feedback.textContent = 'Il campo non è disponibile. Apri Campi per continuare.';return;
      }
      active = section;active.classList.add('ely-on-page-field');
      selecting = false;
      const expanded = active.querySelector(':scope > .field-wrapper button[aria-expanded="false"]');
      if (['object','list'].includes(active.dataset.fieldType)) expanded?.click();
      toolbar.querySelector('span').textContent = section.querySelector(':scope > header h4')?.textContent || 'Modifica';
      toolbar.hidden = false;place();
      const control = active.querySelector('[contenteditable="true"], input:not([type="file"]), textarea, .field-wrapper button');
      control?.focus({preventScroll:true});
      feedback.textContent = 'Modifica il contenuto, poi premi Fine per tornare alla pagina. Salva conserva le modifiche.';
      for (const delay of [0,150,350]) setTimeout(() => {
        if (token === pending && frame?.isConnected) frame.contentWindow.scrollTo(0,selection.scroll);
      },delay);
    };
    setTimeout(reveal,100);
  };
  const bind = () => {
    const doc = frame?.contentDocument;
    if (!doc || boundFrames.has(doc)) return;
    boundFrames.add(doc);
    doc.body?.classList.toggle('ely-editable-page',visual());
    const activate = event => {
      if (!visual() || (event.type === 'keydown' && !['Enter',' '].includes(event.key))) return;
      const element = event.target.closest('[data-key-path]');
      if (!element) {if (event.type === 'click') close();return;}
      // Keep the native preview listener from moving focus twice.
      event.preventDefault();event.stopPropagation();select(element);
    };
    doc.addEventListener('click',activate,true);doc.addEventListener('keydown',activate,true);
    doc.addEventListener('keydown',event => {if (event.key==='Escape' && active) {event.preventDefault();event.stopPropagation();close();}},true);
  };
  const setMode = mode => {
    close(false);
    editor.classList.remove('ely-writing-mode');
    editor.classList.toggle('ely-page-mode',mode==='page');
    if (mode==='fields') previewSwitch=false;
    if (mode==='fields') editor.querySelector('#first-pane-header button[aria-label="Anteprima"][aria-pressed="true"]')?.click();
    for (const button of editor.querySelectorAll('.ely-mode-switch button')) button.setAttribute('aria-pressed',String(button.dataset.mode===mode));
    frame?.contentDocument?.body.classList.toggle('ely-editable-page',mode==='page');
    // Desktop retains both panes; the native switch controls phones.
    bind();
    editor.querySelector('.ely-page-feedback').textContent = 'Clicca un testo o una fotografia per modificarli. Le modifiche si conservano con Salva.';
    if (mode==='page') frame?.focus();
  };
  const openSettings = key => {
    if (!visual()) {setMode('page');}
    const current=editor;
    let attempts=0;
    const jump=()=>{
      if(editor!==current) return;
      const element=frame?.contentDocument?.querySelector(`[data-key-path="${key}"]`);
      if(element) {element.scrollIntoView({block:'center'});select(element);}
      else if(++attempts<30) setTimeout(jump,75);
    };
    jump();
  };
  const enhance = () => {
    const next = document.querySelector('.content-editor');
    if (next !== editor) {
      close(false);editor = next;selection = null;frame = null;previewSwitch=false;
      toolbar?.remove();toolbar = null;
    }
    if (!editor) return;
    const header = editor.querySelector(':scope > .primary > .inner');
    const body = editor.querySelector(':scope > .body');
    if (header && body && !header.querySelector('.ely-mode-switch')) {
      const group = document.createElement('div');group.className='ely-mode-switch';group.setAttribute('role','group');group.setAttribute('aria-label','Modalità di modifica');
      for (const [mode,label] of [['page','Pagina'],['fields','Campi']]) {
        const button = document.createElement('button');button.type='button';button.textContent=label;button.dataset.mode=mode;button.setAttribute('aria-pressed',String(mode==='fields'));
        button.addEventListener('click',()=>setMode(mode));group.append(button);
      }
      const actions = document.createElement('div');actions.className='ely-page-actions';
      for (const [key,label] of [['appearance','Aspetto'],['published','Pubblica']]) {
        const button = document.createElement('button');button.type='button';button.textContent=label;
        button.addEventListener('click',()=>openSettings(key));actions.append(button);
      }
      const anchor=header.querySelector('h2') || header.firstElementChild;
      if(anchor) anchor.after(group,actions);else header.append(group,actions);
      const feedback = document.createElement('p');feedback.className='ely-page-feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.textContent='Clicca un testo o una fotografia per modificarli. Le modifiche si conservano con Salva.';
      body.prepend(feedback);
      toolbar = document.createElement('div');toolbar.className='ely-on-page-toolbar';toolbar.hidden=true;
      toolbar.innerHTML='<span></span><button type="button">Fine</button>';
      toolbar.querySelector('button').addEventListener('click',()=>close());editor.append(toolbar);
    }
    const nextFrame = editor.querySelector('iframe.preview');
    if (nextFrame !== frame) {frame=nextFrame;frame?.addEventListener('load',bind);}
    bind();
    if (active && !active.isConnected) close(false);
    // The CMS has one pane on small screens. Use its own preview switch, and
    // let native highlighting return to the editor while a field is selected.
    if (frame) previewSwitch=false;
    if (visual() && !frame && !active && !selecting && !previewSwitch) {
      const toggle=editor.querySelector('#first-pane-header button[aria-label="Anteprima"][aria-pressed="false"]');
      if (toggle) {previewSwitch=true;toggle.click();}
    }
    const previewHeader = editor.querySelector('.pane[data-mode="preview"] #first-pane-header .toolbar > .inner');
    if (previewHeader && !previewHeader.querySelector('.ely-mobile-actions')) {
      const actions=document.createElement('div');actions.className='ely-mobile-actions';
      for (const [key,label] of [['appearance','Aspetto'],['published','Pubblica']]) {
        const button=document.createElement('button');button.type='button';button.textContent=label;
        button.addEventListener('click',()=>openSettings(key));actions.append(button);
      }
      previewHeader.append(actions);
    }
    editor.style.setProperty('--ely-toolbar-height',editor.querySelector(':scope > .primary')?.getBoundingClientRect().height+'px');
  };
  window.addEventListener('keydown',event => {
    if (event.key!=='Escape' || !active) return;
    // Media dialogs and native menus own Escape while open.
    if ([...document.querySelectorAll('dialog[open], [role="dialog"], [role="menu"]')].some(element=>element.getClientRects().length && getComputedStyle(element).visibility==='visible')) return;
    event.preventDefault();event.stopImmediatePropagation();close();
  },true);
  window.addEventListener('resize',place);
  document.addEventListener('input',event=>{if(active?.contains(event.target))lastInput=performance.now();},true);
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if (!visual() || active?.dataset.fieldType!=='richtext' || !button || button.textContent.trim()!=='Salva') return;
    const remaining=250-(performance.now()-lastInput);
    if (remaining<=0) return;
    event.preventDefault();event.stopImmediatePropagation();
    setTimeout(()=>{if(button.isConnected)button.click();},remaining);
  },true);
  let scheduled=false;
  new MutationObserver(()=>{
    if (scheduled) return;
    scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance();});
  }).observe(document.body,{childList:true,subtree:true});
  enhance();
})();
