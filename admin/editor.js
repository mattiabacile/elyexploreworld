(() => {
  const field = key => document.querySelector(`.content-editor section.field[data-key-path="${key}"]`);
  let currentEditor=null, draftOwner=null, kind=null, scheduled=false;
  let previewKey='',syncUntil=0,syncPending=false,syncHost=null,syncRetries=0,workspace='article',reuse=true;
  let lastInput=-Infinity,composing=null;
  const deferred=new Map();
  // Native rich text serializes shortly after input. Wait before unmounting
  // its field or saving, and keep delayed actions on their originating draft.
  const defer=(action,channel='selection')=>{
    clearTimeout(deferred.get(channel));deferred.delete(channel);
    const owner=document.querySelector('.content-editor');
    const remaining=250-(performance.now()-lastInput);
    if(!owner || (remaining<=0&&!composing?.isConnected))return false;
    const resume=()=>{
      if(!owner.isConnected||owner!==document.querySelector('.content-editor')){deferred.delete(channel);return;}
      const delay=250-(performance.now()-lastInput);
      if(composing?.isConnected||delay>0){deferred.set(channel,setTimeout(resume,Math.max(50,delay)));return;}
      deferred.delete(channel);action();
    };
    deferred.set(channel,setTimeout(resume,Math.max(50,remaining)));return true;
  };
  const editable=target=>target.closest?.('section.field')&&target.closest?.('[contenteditable="true"]');
  document.addEventListener('input',event=>{if(editable(event.target))lastInput=performance.now();},true);
  document.addEventListener('beforeinput',event=>{if(editable(event.target))lastInput=performance.now();},true);
  document.addEventListener('compositionstart',event=>{if(editable(event.target))composing=event.target;},true);
  document.addEventListener('compositionend',event=>{if(composing===event.target){composing=null;lastInput=performance.now();}},true);
  let pendingListOwner=null;
  const protectListAction=event=>{
    const button=event.target.closest?.('button'),root=button?.closest('section.field[data-field-type="list"]');
    const key=root?.dataset.keyPath;if(!['chapters','gallery'].includes(key))return;
    const keyboard=event.type==='keydown';
    if(keyboard&&(button.dataset.action!=='reorder'||!['ArrowUp','ArrowDown','Home','End'].includes(event.key)))return;
    const direction=keyboard?(['ArrowUp','Home'].includes(event.key)?'up':'down'):button.dataset.direction||button.dataset.action?.match(/^move-(up|down)$/)?.[1];
    const action=direction?'move':button.getAttribute('aria-label')==='Rimuovi'?'remove':button.closest('.toolbar.add')?'add':null;
    if(!action)return;
    const owner=root.closest('.content-editor'),custom=button.closest('.ely-chapter-moves');
    if(!owner)return;
    if(pendingListOwner===owner){event.preventDefault();event.stopImmediatePropagation();return;}
    const index=[...(root.querySelector(':scope > .field-wrapper .item-list')?.children || [])].indexOf(button.closest('.item-wrapper'));
    const busy=root.getAttribute('aria-busy');
    const finish=()=>{
      pendingListOwner=null;
      if(busy===null)root.removeAttribute('aria-busy');else root.setAttribute('aria-busy',busy);
      // Serialization can remount the control: resolve it in the current list.
      const liveRoot=field(key),item=liveRoot?.querySelector(':scope > .field-wrapper .item-list')?.children[index];
      const control=action==='add'?liveRoot?.querySelector(':scope > .field-wrapper .toolbar.add button'):action==='remove'?item?.querySelector('button[aria-label="Rimuovi"]'):item?.querySelector(keyboard?'[data-action="reorder"]':custom?`.ely-chapter-moves [data-direction="${direction}"]`:`[data-action="move-${direction}"]`);
      if(!control?.isConnected||control.disabled)return;
      if(keyboard){control.focus({preventScroll:true});control.dispatchEvent(new KeyboardEvent('keydown',{key:event.key,bubbles:true,cancelable:true,composed:true}));}
      else control.click();
    };
    if(defer(finish,'native-list')){
      pendingListOwner=owner;root.setAttribute('aria-busy','true');event.preventDefault();event.stopImmediatePropagation();
    }
  };
  document.addEventListener('click',protectListAction,true);
  document.addEventListener('keydown',protectListAction,true);
  const writing=focus=>{
    if(!currentEditor)return;
    currentEditor.classList.toggle('ely-writing-mode',focus);
    const button=currentEditor.querySelector('.ely-focus-toggle');
    if(button){button.setAttribute('aria-pressed',String(focus));button.textContent=focus?'Mostra anteprima':'Solo scrittura';}
  };
  window.elyEditor={defer,writing};
  const coverKeys=new Set(['hero','heroAlt','slideText']);
  const applyWorkspace=()=>{
    const editor=currentEditor;if(!editor)return;
    editor.dataset.workspace=workspace;
    editor.querySelectorAll('.ely-workspace-switch button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workspace===workspace)));
    const doc=editor.querySelector('iframe.preview')?.contentDocument;if(doc?.documentElement)doc.documentElement.dataset.workspace=workspace;
    for(const node of editor.querySelectorAll('.ely-editor-content > section.field')){
      const key=node.dataset.keyPath;
      node.classList.toggle('ely-other-workspace',workspace==='cover'?!['title','destination','deck','hero','heroAlt','slideText','published','preparing'].includes(key):coverKeys.has(key));
      node.classList.toggle('ely-unused-photo',reuse&&['articleHero','articleHeroAlt'].includes(key));
    }
  };
  const showWorkspace=mode=>{
    if(!['cover','article'].includes(mode)||mode===workspace)return;
    if(defer(()=>showWorkspace(mode)))return;
    workspace=mode;applyWorkspace();window.dispatchEvent(new CustomEvent('ely:workspace-change',{detail:mode}));
    const content=currentEditor?.querySelector('.ely-editor-content');if(content)content.scrollTop=0;
  };
  window.elyWorkspace={show:showWorkspace,forKey:key=>coverKeys.has(key.split('.')[0])?'cover':'article'};

  const syncPreview=key=>{
    const editor=document.querySelector('.content-editor');if(!key || editor?.classList.contains('ely-page-mode'))return;
    previewKey=key;const doc=editor?.querySelector('iframe.preview')?.contentDocument;
    const target=[...(doc?.querySelectorAll(`[data-key-path="${CSS.escape(key)}"]`) || [])].find(node=>node.getClientRects().length) || (key==='hero'?doc?.querySelector('.preview-cover'):null);
    if(target){target.scrollIntoView({block:'start'});doc.querySelectorAll('.ely-field-highlight').forEach(node=>node.classList.remove('ely-field-highlight'));target.classList.add('ely-field-highlight');}
  };
  document.addEventListener('focusin',event=>{const key=event.target.closest?.('section.field')?.dataset.keyPath;if(key){syncUntil=performance.now()+350;syncPreview(key);}});
  const retryScrollSync=()=>{
    if(++syncRetries<20){syncPending=true;setTimeout(()=>requestAnimationFrame(syncScrolledField),50);}else syncHost=null;
  };
  const syncScrolledField=()=>{
    syncPending=false;const host=syncHost;
    if(!host?.isConnected || host!==currentEditor?.querySelector('.ely-editor-content') || performance.now()<syncUntil || currentEditor?.matches('.ely-writing-mode, .ely-page-mode')){syncHost=null;return;}
    const doc=currentEditor?.querySelector('iframe.preview')?.contentDocument;
    // Native virtualization briefly rebuilds the preview while the form
    // scrolls. Wait for its fields instead of restoring the previous chapter.
    const keys=new Set([...(doc?.querySelectorAll('[data-key-path]') || [])].map(node=>node.dataset.keyPath));
    if(!keys.size){retryScrollSync();return;}
    // List and object wrappers can span many chapters. Follow an actual
    // preview field rather than stopping at their enclosing container.
    const top=host.getBoundingClientRect().top+120;
    const target=[...host.querySelectorAll('section.field[data-key-path]')].find(node=>keys.has(node.dataset.keyPath)&&node.getClientRects().length&&node.getBoundingClientRect().bottom>top);
    if(!target){retryScrollSync();return;}
    syncHost=null;
    syncPreview(target?.dataset.keyPath);
  };
  document.addEventListener('scroll',event=>{
    const host=event.target;if(!host.matches?.('.ely-editor-content'))return;
    syncHost=host;syncRetries=0;if(syncPending)return;
    syncPending=true;requestAnimationFrame(syncScrolledField);
  },true);
  const updateKind = () => {
    const selected=field('kind')?.querySelector('[role="radio"][aria-checked="true"]');
    if(selected)kind=selected.value;
    const preparing=field('preparing');if(preparing && kind)preparing.hidden=kind!=='consiglio';
  };
  const enhance = () => {
    scheduled=false;
    const editor=document.querySelector('.content-editor');
    if(!editor){currentEditor=null;kind=null;previewKey='';return;}
    if(editor!==currentEditor){currentEditor=editor;previewKey='';workspace='article';if(draftOwner!==editor){kind=null;reuse=true;}}
    const content=editor.querySelector('.pane[data-mode="edit"] #first-pane-body > .content');
    const preview=editor.querySelector('.pane[data-mode="preview"] #first-pane-body > .content');
    preview?.classList.remove('ely-editor-content');
    content?.classList.add('ely-editor-content');
    const previewHeader = editor.querySelector('#second-pane-header .sui.toolbar > .inner') || editor.querySelector('.pane[data-mode="preview"] #first-pane-header .sui.toolbar > .inner');
    if (previewHeader && !previewHeader.querySelector('.ely-preview-devices')) {
      const controls = document.createElement('div');controls.className = 'ely-preview-devices';controls.setAttribute('role','group');controls.setAttribute('aria-label','Formato dell’anteprima');
      for (const [mode,label] of [['desktop','Desktop'],['phone','Telefono']]) {
        const button = document.createElement('button');button.type = 'button';button.setAttribute('aria-label',label);button.title=label;button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">'+(mode==='desktop'?'<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M12 16v5m-5 0h10"/>':'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>')+'</svg>';button.setAttribute('aria-pressed',String(mode === (editor.classList.contains('ely-phone-preview')?'phone':'desktop')));
        button.addEventListener('click',() => {editor.classList.toggle('ely-phone-preview',mode === 'phone');for (const item of controls.children) item.setAttribute('aria-pressed',String(item === button));});controls.append(button);
      }
      previewHeader.append(controls);
    }
    const firstHeader = editor.querySelector('#first-pane-header .sui.toolbar > .inner');
    if (firstHeader && !firstHeader.querySelector('.ely-focus-toggle')) {
      const button = document.createElement('button');button.type = 'button';button.className = 'ely-focus-toggle';button.textContent = 'Solo scrittura';button.setAttribute('aria-pressed','false');
      button.addEventListener('click',() => writing(!editor.classList.contains('ely-writing-mode')));firstHeader.append(button);writing(editor.classList.contains('ely-writing-mode'));
    }
    const header=editor.querySelector(':scope > .primary > .inner');
    if(header&&!header.querySelector('.ely-workspace-switch')&&editor.querySelector('section.field[data-key-path="title"]')){
      const choices=document.createElement('div');choices.className='ely-workspace-switch';choices.setAttribute('role','group');choices.setAttribute('aria-label','Sezione da modificare');
      for(const [mode,label] of [['cover','Copertina'],['article','Articolo']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.workspace=mode;button.addEventListener('click',()=>window.elyWorkspace.show(mode));choices.append(button);}header.append(choices);
    }
    // Chapters and appearance remain native fields, presented without disclosure boxes.
    for(const root of editor.querySelectorAll('section.field[data-key-path="chapters"], section.field[data-key-path="appearance"]')){
      for(const button of root.querySelectorAll('button[aria-controls][aria-expanded="false"]')){
        if(button.closest('[data-field-type="richtext"]'))continue;
        if(button.getAttribute('aria-controls').endsWith('-body')||button.closest('.toolbar'))button.click();
      }
      for(const [index,item] of [...root.querySelectorAll('.item-list > .item-wrapper')].entries()){
        const header=item.querySelector('.item > .header');if(!header||header.querySelector('.ely-chapter-label'))continue;
        const label=document.createElement('strong');label.className='ely-chapter-label';label.textContent='Capitolo '+(index+1);header.prepend(label);
        const controls=document.createElement('span');controls.className='ely-chapter-moves';
        for(const [direction,symbol,text] of [['up','↑','Sposta capitolo prima'],['down','↓','Sposta capitolo dopo']]){
          const button=document.createElement('button');button.type='button';button.textContent=symbol;button.dataset.direction=direction;button.setAttribute('aria-label',text);
          button.addEventListener('click',()=>{const native=item.querySelector(`[data-action="move-${direction}"]`),handle=item.querySelector('[data-action="reorder"]');if(native)native.click();else if(handle){handle.focus({preventScroll:true});handle.dispatchEvent(new KeyboardEvent('keydown',{key:direction==='up'?'ArrowUp':'ArrowDown',bubbles:true,cancelable:true,composed:true}));}});controls.append(button);
        }header.append(controls);
      }
      root.querySelectorAll('.ely-chapter-label').forEach(node=>{const item=node.closest('.item-wrapper'),items=[...root.querySelector('.item-list').children],index=items.indexOf(item);const value='Capitolo '+(index+1);if(node.textContent!==value)node.textContent=value;for(const button of node.parentElement.querySelectorAll('.ely-chapter-moves button'))button.disabled=button.dataset.direction==='up'?index===0:index===items.length-1;});
    }
    for(const button of editor.querySelectorAll('section.field[data-key-path=chapters] > .field-wrapper .toolbar button'))if(/^(Espandi tutto|Comprimi tutto)$/.test(button.textContent.trim()))button.hidden=true;
    for(const hint of document.querySelectorAll('[role=dialog] [data-entry-draft-root] > p.hint'))if(hint.textContent.startsWith('The new'))hint.textContent=hint.closest('[role=dialog]').querySelector('[data-key-path=name] h4')?.textContent.includes('categoria')?'La nuova categoria verrà salvata insieme all’articolo.':'Il nuovo tag verrà salvato insieme all’articolo.';
    applyWorkspace();updateKind();
    const frame=editor.querySelector('iframe.preview');if(frame && !frame.dataset.elySync){frame.dataset.elySync='true';frame.addEventListener('load',()=>{applyWorkspace();syncPreview(previewKey);});}
  };
  window.addEventListener('ely:article-change',event=>{draftOwner=document.querySelector('.content-editor');kind=event.detail.kind;reuse=event.detail.reuseCover!=='no';applyWorkspace();updateKind();if(previewKey)requestAnimationFrame(()=>syncPreview(previewKey));});
  document.addEventListener('click',event=>{if(event.target.closest?.('section.field[data-key-path="kind"]'))requestAnimationFrame(updateKind);});
  new MutationObserver(records=>{
    if(records.every(record=>record.target.closest?.('[class^="ely-"]')))return;
    if(!scheduled){scheduled=true;requestAnimationFrame(enhance);}
  }).observe(document.body,{childList:true,subtree:true});
  enhance();
})();
