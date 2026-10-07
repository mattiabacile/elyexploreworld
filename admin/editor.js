(() => {
  const field = key => document.querySelector(`.content-editor section.field[data-key-path="${key}"]`);
  let currentEditor=null, kind=null, scheduled=false;
  let previewKey='',syncUntil=0,syncPending=false;
  const syncPreview=key=>{
    const editor=document.querySelector('.content-editor');if(!key || editor?.classList.contains('ely-page-mode'))return;
    previewKey=key;const doc=editor?.querySelector('iframe.preview')?.contentDocument;
    const target=doc?.querySelector(`[data-key-path="${CSS.escape(key)}"]`) || (key==='hero'?doc?.querySelector('.preview-cover'):null);
    if(target){syncUntil=performance.now()+350;target.scrollIntoView({block:'start'});doc.querySelectorAll('.ely-field-highlight').forEach(node=>node.classList.remove('ely-field-highlight'));target.classList.add('ely-field-highlight');}
  };
  document.addEventListener('focusin',event=>{const key=event.target.closest?.('section.field')?.dataset.keyPath;if(key)syncPreview(key);});
  document.addEventListener('scroll',event=>{const host=event.target;if(!host.matches?.('.ely-editor-content') || performance.now()<syncUntil || syncPending)return;syncPending=true;requestAnimationFrame(()=>{syncPending=false;const top=host.getBoundingClientRect().top+120;const candidates=[...host.querySelectorAll('section.field[data-key-path]')].filter(node=>node.getBoundingClientRect().bottom>top);syncPreview(candidates[0]?.dataset.keyPath);});},true);
  const updateKind = () => {
    const selected=field('kind')?.querySelector('[role="radio"][aria-checked="true"]');
    if(selected)kind=selected.value;
    const preparing=field('preparing');if(preparing && kind)preparing.hidden=kind!=='consiglio';
  };
  const enhance = () => {
    scheduled=false;
    const editor=document.querySelector('.content-editor');
    if(!editor){currentEditor=null;kind=null;previewKey='';return;}
    if(editor!==currentEditor){currentEditor=editor;kind=null;previewKey='';}
    const content=editor.querySelector('.pane[data-mode="edit"] #first-pane-body > .content');
    const preview=editor.querySelector('.pane[data-mode="preview"] #first-pane-body > .content');
    preview?.classList.remove('ely-editor-content');
    content?.classList.add('ely-editor-content');
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
    updateKind();
    const frame=editor.querySelector('iframe.preview');if(frame && !frame.dataset.elySync){frame.dataset.elySync='true';frame.addEventListener('load',()=>syncPreview(previewKey));}
  };
  window.addEventListener('ely:article-change',event=>{kind=event.detail.kind;updateKind();if(previewKey)requestAnimationFrame(()=>syncPreview(previewKey));});
  document.addEventListener('click',event=>{if(event.target.closest?.('section.field[data-key-path="kind"]'))requestAnimationFrame(updateKind);});
  new MutationObserver(records=>{
    if(records.every(record=>record.target.closest?.('[class^="ely-"]')))return;
    if(!scheduled){scheduled=true;requestAnimationFrame(enhance);}
  }).observe(document.body,{childList:true,subtree:true});
  enhance();
})();
