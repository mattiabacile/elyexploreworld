/* Contextual article editing. Native fields stay mounted in their CMS owner. */
(() => {
  let backdrop, editor, frame, active, selection, panel, toolbar, selecting=false, previewSwitch=false, pending=0, lastInput=0, finishTimer, statusTimer, saveRequested=false, nativeErrorForwarding=false, nativeValidationReceiver, working=false, actionStatus, validationRefs=[], article={};
  const boundFrames=new WeakSet();
  const field=key=>editor?.querySelector(`section.field[data-key-path="${CSS.escape(key)}"]`);
  const isRichKey=key=>/(?:intro|body|note|conclusion|quote)$/.test(key);
  const inlineHeight=(key,anchorHeight=0)=>{
    const base=Math.max(0,anchorHeight);
    if(isRichKey(key))return Math.min(Math.max(base+86,220),440);
    if(key==='deck'||key==='slideText')return Math.min(Math.max(base+22,96),180);
    if(key==='tags')return Math.min(Math.max(base+18,82),190);
    if(/(?:^title$|\.title$)/.test(key))return Math.max(base+14,72);
    if(/(?:caption|heroAlt|\.(alt|imageAlt)$)/.test(key))return Math.max(base+12,64);
    return Math.min(Math.max(base+14,64),170);
  };
  const isImageField=key=>key==='hero'||/^chapters\.\d+\.image$/.test(key)||/^gallery\.\d+\.image$/.test(key);
  const inlineTone=key=>key==='title'?'ely-inline-title':/chapters\.\d+\.title$/.test(key)?'ely-inline-heading':key==='deck'?'ely-inline-deck':/(?:intro|body|note|conclusion|quote)$/.test(key)?'ely-inline-copy':/(?:heroCaption|caption|heroAlt|\.(?:alt|imageAlt)$)/.test(key)?'ely-inline-caption':'ely-inline-control';
  const inlineTones=['ely-inline-title','ely-inline-heading','ely-inline-deck','ely-inline-copy','ely-inline-caption','ely-inline-control'];
  const visual=()=>editor?.classList.contains('ely-page-mode');
  const roots=['title','kind','date','destination','deck','hero','heroAlt','heroCaption','intro','chapters','travelFacts','category','tags','gallery','conclusion','appearance','titleAccent','slideText','published','preparing'];
  const valueAt=(value,key)=>key.split('.').reduce((current,part)=>current?.[part],value);
  const clearSelection=()=>frame?.contentDocument?.querySelectorAll('.ely-selected-block').forEach(e=>e.classList.remove('ely-selected-block'));
  const lockFields=()=>{
    if(!editor)return;
    // Native controls set their own visibility; explicitly hide their branches
    // and remove them from keyboard navigation unless they own the selection.
    for(const root of editor.querySelectorAll('.pane[data-mode="edit"] #first-pane-body > .content > section.field')){
      root.inert=visual() && !(root===active || root.contains(active));
      for(const child of root.querySelectorAll('section.field'))child.inert=visual() && !(child===active || child.contains(active) || active?.contains(child));
    }
  };
  const draw=()=>{if(panel)panel.classList.toggle('ely-inspecting',!!active || selecting);};
  const place=()=>{
    if(!active || !panel)return;
    const inline=panel.classList.contains('ely-inline-edit');
    if(selection&&!selection.element?.isConnected && frame?.contentDocument){
      selection.element=frame.contentDocument.querySelector(`[data-key-path="${CSS.escape(selection.key)}"]`);
    }
    const anchor=selection?.element?.isConnected?selection.element.getBoundingClientRect():selection?.anchor;
    const frameRect=frame?.isConnected?frame.getBoundingClientRect():selection?.frameBounds;
    const viewportHeight=window.visualViewport?.height || innerHeight;
    const topbar=editor.querySelector(':scope > .primary')?.getBoundingClientRect().bottom || 64;
    const minInlineWidth=selection?.key==='tags'||selection?.key==='slideText'?Math.min(520,innerWidth-24):Math.min(280,innerWidth-24);
    const width=inline&&anchor?Math.min(Math.max(anchor.width,minInlineWidth),innerWidth-24):Math.min(680,innerWidth-24);
    const desired=inline&&anchor?inlineHeight(selection.key,anchor.height):560;
    const inlineBottomSpace=inline?56:12;
    const height=Math.max(56,Math.min(desired,viewportHeight-topbar-inlineBottomSpace-16));
    const left=anchor&&frameRect?Math.max(12,Math.min(frameRect.left+anchor.left,innerWidth-width-12)):(innerWidth-width)/2;
    const targetTop=anchor&&frameRect?frameRect.top+(inline?anchor.top:anchor.bottom+12):topbar+20;
    const top=Math.max(topbar+12,Math.min(targetTop,viewportHeight-height-inlineBottomSpace));
    panel.style.left=left+'px';panel.style.top=top+'px';panel.style.width=width+'px';panel.style.height=height+'px';
    if(toolbar){
      if(inline&&!toolbar.hidden){
        const buttonWidth=70,toolbarTop=Math.min(top+height+8,viewportHeight-44);
        Object.assign(toolbar.style,{position:'fixed',left:Math.max(12,Math.min(left+width-buttonWidth,innerWidth-buttonWidth-12))+'px',top:toolbarTop+'px',width:buttonWidth+'px',height:'36px',boxSizing:'border-box'});
      } else {
        toolbar.removeAttribute('style');
      }
    }
    const nativeSlot=panel.querySelector('.ely-inspector-slot').getBoundingClientRect();
    const slot={left,top:nativeSlot.top,width,height:Math.max(90,top+height-nativeSlot.top)};
    const rect=inline?{left,top,width,height}:slot;
    active.style.setProperty('--ely-field-left',rect.left+'px');
    active.style.setProperty('--ely-field-top',rect.top+'px');
    active.style.setProperty('--ely-field-width',rect.width+'px');
    active.style.setProperty('--ely-field-height',rect.height+'px');
    for(const [property,value] of Object.entries({left:rect.left,top:rect.top,width:rect.width,height:rect.height,maxHeight:rect.height})){
      active.style.setProperty(property==='maxHeight'?'max-height':property,value+'px','important');
    }
  };
  const close=(restoreFocus=true)=>{
    if(restoreFocus && active?.querySelector('[contenteditable="true"]') && performance.now()-lastInput<250){clearTimeout(finishTimer);finishTimer=setTimeout(()=>close(restoreFocus),250-(performance.now()-lastInput));return;}
    clearTimeout(finishTimer);pending++;selecting=false;backdrop?.remove();backdrop=null;
    if(active){for(const property of ['left','top','width','height','max-height'])active.style.removeProperty(property);active.classList.remove('ely-on-page-field',...inlineTones);}active=null;
    if(selection?.element)selection.element.style.minHeight='';panel?.classList.remove('ely-inline-edit');
    if(toolbar)toolbar.hidden=true;
    clearSelection();lockFields();draw();
    if(restoreFocus && selection?.element?.isConnected)selection.element.focus({preventScroll:true});
    editor?.classList.remove('ely-inspector-open');
    requestAnimationFrame(enhance);
  };
  const select=(key,element)=>{
    if(nativeValidationReceiver){window.removeEventListener('message',nativeValidationReceiver,true);nativeValidationReceiver=null;}
    // Flush the native rich editor before changing the selected control.
    if(active?.querySelector('[contenteditable="true"]') && performance.now()-lastInput<250){setTimeout(()=>select(key,element),250-(performance.now()-lastInput));return;}
    if(working)return;
    const scroll=frame?.contentWindow?.scrollY ?? selection?.scroll ?? 0;
    close(false);validationRefs=[];frame?.contentDocument?.querySelector('.preview-validation')?.remove();panel.querySelector('.ely-inspector-error').textContent='';
    element=element || frame?.contentDocument?.querySelector(`[data-key-path="${CSS.escape(key)}"]`);
    if(element?.tagName==='BUTTON'&&/^chapters\.\d+\.(quote|note)$/.test(key)){
      const chapter=element.closest('.preview-chapter');
      const placeholder=element.ownerDocument.createElement(key.endsWith('quote')?'blockquote':'aside');
      placeholder.dataset.keyPath=key;placeholder.tabIndex=0;placeholder.textContent=key.endsWith('quote')?'Scrivi la citazione…':'Scrivi un consiglio pratico…';
      if(key.endsWith('note')){const copy=chapter.querySelector('.preview-copy');copy?.insertBefore(placeholder,copy.querySelector('.preview-content-inserts'));}
      else chapter.append(placeholder);
      element=placeholder;
    }
    element?.scrollIntoView({block:'nearest'});
    selection={element,scroll:frame?.contentWindow?.scrollY ?? scroll,key,initialValue:valueAt(article,key),anchor:element?.getBoundingClientRect().toJSON(),frameBounds:frame?.getBoundingClientRect().toJSON()};element?.classList.add('ely-selected-block');
    const inline=!!element&&!isImageField(key);
    if(inline){
      element.scrollIntoView({block:'nearest'});
      selection.anchor=element.getBoundingClientRect().toJSON();selection.scroll=frame?.contentWindow?.scrollY ?? scroll;
    }
    panel.classList.toggle('ely-inline-edit',inline);panel.setAttribute('role',inline?'region':'dialog');
    editor.classList.add('ely-inspector-open');selecting=true;draw();
    preservePreview(selection.scroll);
    const token=++pending;
    panel.querySelector('.ely-inspector-title').textContent='Apertura del campo…';
    window.postMessage({type:'highlight-editor-field',payload:{locale:editor.querySelector('.pane[data-locale]').dataset.locale,keyPath:key}},location.origin);
    let attempts=0;
    const reveal=()=>{
      if(token!==pending || !visual())return;
      const section=field(key);
      if(!section || !section.querySelector(':scope > .field-wrapper')){
        const parts=key.split('.'),parent=field(parts[0]);
        const item=parts.length>2?parent?.querySelector(`[id$="-item-${parts[1]}-body"]`):parent;
        (item?.querySelector('.placeholder') || item || parent)?.scrollIntoView({block:'center'});
        if(!parent){const content=editor.querySelector('.pane[data-mode="edit"] #first-pane-body > .content');const mounted=content?.querySelector(':scope > section.field');if(content)content.scrollTop+=(roots.indexOf(parts[0])<roots.indexOf(mounted?.dataset.keyPath)?-1:1)*content.clientHeight*.8;}
        if(++attempts<80){setTimeout(reveal,75);return;}
        selecting=false;draw();panel.querySelector('.ely-inspector-error').textContent='Questo campo non si è aperto. Riprova oppure usa Campi.';return;
      }
      active=section;active.classList.add('ely-on-page-field');if(inline)active.classList.add(inlineTone(key));selecting=false;
      const expanded=active.querySelector(':scope > .field-wrapper button[aria-expanded="false"]');
      if(['object','list'].includes(active.dataset.fieldType))expanded?.click();
      const label=section.querySelector(':scope > header h4')?.textContent || 'Modifica';
      const chapter=key.match(/^chapters\.(\d+)\./);
      panel.querySelector('.ely-inspector-title').textContent=chapter?`Capitolo ${Number(chapter[1])+1} · ${label}`:label;
      toolbar.hidden=!inline;draw();place();lockFields();
      active.querySelector('[contenteditable="true"], input:not([type="file"]), textarea, .field-wrapper button')?.focus({preventScroll:true});
      for(const delay of [0,200])setTimeout(()=>{if(token===pending && frame?.isConnected)frame.contentWindow.scrollTo(0,selection?.scroll ?? scroll);},delay);
    };
    setTimeout(reveal,100);
  };
  const preservePreview = scroll => {
    if(innerWidth>=768||!frame?.contentDocument?.documentElement)return;
    backdrop?.remove();
    const copy=frame.contentDocument.documentElement.cloneNode(true);
    copy.querySelectorAll('script').forEach(node=>node.remove());
    const base=document.createElement('base');base.href=frame.contentDocument.baseURI;copy.querySelector('head')?.prepend(base);
    backdrop=document.createElement('iframe');backdrop.className='ely-article-backdrop';backdrop.setAttribute('aria-hidden','true');backdrop.tabIndex=-1;backdrop.inert=true;backdrop.srcdoc='<!doctype html>'+copy.outerHTML;
    const bounds=frame.getBoundingClientRect();Object.assign(backdrop.style,{left:bounds.left+'px',top:bounds.top+'px',width:bounds.width+'px',height:bounds.height+'px'});editor.append(backdrop);
    const snapshot=backdrop;backdrop.addEventListener('load',()=>snapshot.contentWindow?.scrollTo(0,scroll),{once:true});
  };
  const pause = ms => new Promise(resolve=>setTimeout(resolve,ms));
  const ready = async get => {
    for(let attempt=0;attempt<80;attempt++){
      const result=get();if(result)return result;await pause(75);
    }
    throw new Error('Il comando non è riuscito. Riprova: la bozza resta aperta.');
  };
  const selectInArticle = async key => {
    try{
      // The native phone validation sheet returns through its edit pane first.
      // Restore the article before positioning the field on its actual block.
      await pause(100);close(false);enhance();
      const element=await ready(()=>{
        const preview=editor?.querySelector('iframe.preview');
        const target=preview?.contentDocument?.querySelector(`[data-key-path="${CSS.escape(key)}"]`);
        if(target&&preview.getBoundingClientRect().width){frame=preview;bind();return target;}return null;
      });
      select(key,element);
    }catch{announce('Non riesco ad aprire il campo. Riprova dall’articolo; la bozza resta aperta.');}
  };
  const mountNative = async key => {
    const locale=editor.querySelector('.pane[data-locale]')?.dataset.locale;
    window.postMessage({type:'highlight-editor-field',payload:{locale,keyPath:key}},location.origin);
    return ready(()=>{
      const section=field(key);
      if(section?.querySelector(':scope > .field-wrapper'))return section;
      const content=editor.querySelector('.pane[data-mode="edit"] #first-pane-body > .content');
      const mounted=content?.querySelector(':scope > section.field');
      if(content)content.scrollTop+=(roots.indexOf(key)<roots.indexOf(mounted?.dataset.keyPath)?-1:1)*content.clientHeight*.7;
      return null;
    });
  };
  const listItems = root => [...(root?.querySelector(':scope > .field-wrapper .item-list')?.children || [])];
  const announce = message => {clearTimeout(statusTimer);if(actionStatus)actionStatus.textContent=message;if(message&&!working)statusTimer=setTimeout(()=>{if(actionStatus)actionStatus.textContent='';},4000);};
  const changeList = async (key,operation,index) => {
    if(working)return;
    if(active?.querySelector('[contenteditable="true"]'))await pause(Math.max(0,250-(performance.now()-lastInput)));
    if(!editor||!visual()||working)return;
    const currentEditor=editor,oldScroll=frame?.contentWindow?.scrollY || 0;
    close(false);preservePreview(oldScroll);working=true;editor.classList.add('ely-list-working');editor.setAttribute('aria-busy','true');
    announce(operation==='add'?(key==='chapters'?'Aggiungo il capitolo…':'Aggiungo la foto…'):'Aggiorno l’articolo…');
    let targetIndex=index;
    try{
      const root=await mountNative(key);
      if(currentEditor!==editor)return;
      root.inert=false;root.querySelector('button[aria-controls$="-item-list"][aria-expanded="false"]')?.click();
      await pause(100);
      const items=listItems(root),before=items.length;
      if(operation==='add'){
        const add=root.querySelector(':scope > .field-wrapper .toolbar.add button') || [...root.querySelectorAll(':scope > .field-wrapper button')].find(b=>b.dataset.label?.startsWith('Aggiungi'));
        if(!add)throw new Error('Non riesco ad aggiungere questo elemento. Riprova dalla pagina.');
        add.click();await ready(()=>listItems(field(key)).length===before+1);targetIndex=before;
      }else{
        let item=items[index];if(!item)throw new Error('Questo elemento è cambiato. Riprova dalla pagina.');
        item.scrollIntoView({block:'center'});
        item=await ready(()=>{
          const candidate=listItems(field(key))[index];
          if(candidate?.querySelector('[data-action="reorder"], [data-action="move-up"], [data-action="move-down"], button[aria-label="Rimuovi"]'))return candidate;
          candidate?.scrollIntoView({block:'center'});return null;
        });
        if(operation==='remove'){
          item.querySelector('button[aria-label="Rimuovi"]')?.click();
          await ready(()=>listItems(field(key)).length===before-1);targetIndex=Math.min(index,before-2);
        }else{
          const move=item.querySelector(`[data-action="move-${operation}"]`);
          const reorder=item.querySelector('[data-action="reorder"]');
          if(move)move.click();else if(reorder)reorder.dispatchEvent(new KeyboardEvent('keydown',{key:operation==='up'?'ArrowUp':'ArrowDown',bubbles:true}));
          else throw new Error('Non riesco a spostare questo elemento. Riprova dalla pagina.');
          targetIndex=index+(operation==='up'?-1:1);await pause(150);
        }
      }
      working=false;editor.classList.remove('ely-list-working');lockFields();enhance();
      const targetKey=key+'.'+targetIndex+'.'+(key==='chapters'?'title':'image');
      const target=targetIndex>=0?await ready(()=>{
        const next=editor?.querySelector('iframe.preview');
        const candidate=next?.contentDocument?.querySelector(`[data-key-path="${targetKey}"]`);
        if(candidate){frame=next;bind();return candidate;}return null;
      }):null;
      if(target){target.scrollIntoView({block:'center'});target.focus({preventScroll:true});}
      else frame?.contentWindow?.scrollTo(0,oldScroll);
      announce(operation==='add'?(key==='chapters'?'Capitolo aggiunto. Scrivi direttamente nell’articolo.':'Foto aggiunta alla galleria. Scegli l’immagine.') : operation==='remove'?'Elemento eliminato dalla bozza.':'Ordine aggiornato.');
      if(operation==='add'&&target)select(targetKey,target);
    }catch(error){announce(error.message || 'Il comando non è riuscito. Riprova dalla pagina.');}
    finally{if(!active){backdrop?.remove();backdrop=null;}working=false;currentEditor?.classList.remove('ely-list-working');currentEditor?.setAttribute('aria-busy','false');lockFields();enhance();}
  };
  const renderValidation = doc => {
    if(!validationRefs.length||!doc?.querySelector('.preview-story')||doc.querySelector('.preview-validation'))return;
    const row=doc.createElement('section');row.className='preview-validation';row.setAttribute('aria-label','Campi da completare');
    const text=doc.createElement('p');text.textContent='Completa questi campi per salvare. Seleziona un nome per correggerlo nell’articolo.';row.append(text);
    for(const ref of validationRefs){
      const label=ref.querySelector('.summary')?.textContent || 'Correggi il campo';
      const button=doc.createElement('button');button.type='button';button.textContent=label;
      button.addEventListener('click',()=>{
        const receive=event=>{
          if(event.source!==window||event.data?.type!=='highlight-editor-field')return;
          window.removeEventListener('message',receive,true);selectInArticle(event.data.payload.keyPath);
        };
        window.addEventListener('message',receive,true);
        const liveRef=[...editor.querySelectorAll('.sidebar button.ref')].find(item=>item.querySelector('.summary')?.textContent===label) || ref;
        liveRef.click();setTimeout(()=>window.removeEventListener('message',receive,true),1000);
      });row.append(button);
    }
    doc.querySelector('.preview-story').prepend(row);row.scrollIntoView({block:'start'});row.querySelector('button')?.focus();
  };
  const showValidation = async source => {
    if(!visual())return;
    if(innerWidth<768&&source){
      if(nativeValidationReceiver)window.removeEventListener('message',nativeValidationReceiver,true);
      nativeValidationReceiver=event=>{
        if(event.source!==window||event.data?.type!=='highlight-editor-field')return;
        const key=event.data.payload.keyPath;
        window.removeEventListener('message',nativeValidationReceiver,true);nativeValidationReceiver=null;selectInArticle(key);
      };
      window.addEventListener('message',nativeValidationReceiver,true);
      nativeErrorForwarding=true;source.click();nativeErrorForwarding=false;return;
    }
    close(false);
    editor.querySelector('.sidebar button[aria-label="Validazione"]')?.click();
    try{
      const refs=await ready(()=>{
        const items=[...editor.querySelectorAll('.sidebar button.ref')];return items.length?items:null;
      });
      enhance();
      const doc=await ready(()=>editor.querySelector('iframe.preview')?.contentDocument?.querySelector('.preview-story')?.ownerDocument);
      validationRefs=refs;renderValidation(doc);
    }catch{announce('Riprova a salvare per vedere quali campi completare. La bozza resta aperta.');}
  };
  const confirmRemoval = element => {
    const doc=element.ownerDocument,scope=element.closest('.preview-local-tools');
    if(scope.querySelector('.preview-remove-confirm'))return;
    const row=doc.createElement('span');row.className='preview-remove-confirm';row.setAttribute('role','group');row.setAttribute('aria-label','Conferma eliminazione');
    const label=doc.createElement('span');label.textContent=element.dataset.list==='chapters'?'Eliminare questo capitolo e il suo contenuto?':'Eliminare questa foto dalla galleria?';
    const yes=doc.createElement('button');yes.type='button';yes.textContent='Elimina';yes.dataset.list=element.dataset.list;yes.dataset.index=element.dataset.index;yes.dataset.operation='confirm-remove';
    const no=doc.createElement('button');no.type='button';no.textContent='Annulla';no.addEventListener('click',()=>{row.remove();element.hidden=false;element.focus();});
    row.append(label,yes,no);scope.append(row);element.hidden=true;no.focus();
  };
  const bind=()=>{
    const doc=frame?.contentDocument;if(!doc)return;
    doc.body?.classList.toggle('ely-editable-page',visual());if(visual())renderValidation(doc);
    if(boundFrames.has(doc))return;boundFrames.add(doc);
    const activate=event=>{
      if(event.type==='keydown'&&event.key==='Escape'&&visual()&&(active||editor.classList.contains('ely-inspector-open'))){
        event.preventDefault();event.stopPropagation();close();return;
      }
      if(working || !visual() || event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
      const element=event.target.closest('[data-key-path], [data-operation]');if(!element)return;
            event.preventDefault();event.stopPropagation();
      if(element.dataset.operation){
        if(element.dataset.operation==='remove')confirmRemoval(element);
        else changeList(element.dataset.list,element.dataset.operation==='confirm-remove'?'remove':element.dataset.operation,Number(element.dataset.index));
      }else select(element.dataset.keyPath,element);
    };
    doc.addEventListener('scroll',()=>{if(active)place();},true);
    doc.addEventListener('click',activate,true);doc.addEventListener('keydown',activate,true);
  };
  const setMode=mode=>{
    close(false);editor.classList.remove('ely-writing-mode','ely-inspector-open');editor.classList.toggle('ely-page-mode',mode==='page');
    if(mode==='fields'){previewSwitch=false;editor.querySelector('#first-pane-header button[aria-label="Anteprima"][aria-pressed="true"]')?.click();}
    editor.querySelectorAll('.ely-mode-switch button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
    bind();lockFields();draw();
  };
  const createPanel=()=>{
    panel=document.createElement('div');panel.className='ely-inspector';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Modifica nell’articolo');
    panel.innerHTML='<header><h2>Fotografia</h2><button type="button" class="ely-inspector-dismiss">Fine</button></header><p class="ely-inspector-error" role="status"></p><div class="ely-inspector-detail"><h3 class="ely-inspector-title"></h3><div class="ely-inspector-slot"></div></div>';
    panel.querySelector('.ely-inspector-dismiss').addEventListener('click',()=>close());
    toolbar=document.createElement('div');toolbar.className='ely-on-page-toolbar';toolbar.hidden=true;toolbar.innerHTML='<button type="button">Fine</button>';toolbar.querySelector('button').addEventListener('click',()=>close());editor.append(panel,toolbar);draw();
  };
  const enhance=()=>{
    const next=document.querySelector('.content-editor');
    if(next!==editor){if(nativeValidationReceiver){window.removeEventListener('message',nativeValidationReceiver,true);nativeValidationReceiver=null;}close(false);panel?.remove();toolbar?.remove();panel=null;toolbar=null;editor=next;selection=null;frame=null;previewSwitch=false;validationRefs=[];article={};}
    if(!editor)return;
    const header=editor.querySelector(':scope > .primary > .inner');
    if(header&&!header.querySelector('.ely-mode-switch')){
      const choices=document.createElement('div');choices.className='ely-mode-switch';choices.setAttribute('role','group');choices.setAttribute('aria-label','Modalità di modifica');
      for(const [mode,label] of [['page','Pagina'],['fields','Campi']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.mode=mode;b.setAttribute('aria-pressed',String(mode==='fields'));b.addEventListener('click',()=>setMode(mode));choices.append(b);}
      const anchor=header.querySelector('h2')||header.firstElementChild;if(anchor)anchor.after(choices);else header.append(choices);
      createPanel();
      actionStatus=document.createElement('p');actionStatus.className='ely-action-status';actionStatus.setAttribute('role','status');actionStatus.setAttribute('aria-live','polite');editor.append(actionStatus);
    }
    const nextFrame=editor.querySelector('iframe.preview');if(nextFrame!==frame){frame=nextFrame;frame?.addEventListener('load',bind);}bind();
    if(active&&!active.isConnected)close(false);
    if(frame)previewSwitch=false;
    if(visual()&&!working&&!frame&&!active&&!selecting&&!previewSwitch){const toggle=editor.querySelector('#first-pane-header button[aria-label="Anteprima"][aria-pressed="false"]');if(toggle){previewSwitch=true;toggle.click();}}
    editor.style.setProperty('--ely-toolbar-height',editor.querySelector(':scope > .primary')?.getBoundingClientRect().height+'px');
    lockFields();place();
    if(visual())for(const button of document.querySelectorAll('button[data-label="Show Errors"]')){
      const label=button.querySelector('.label .truncated-text');if(label&&label.textContent!=='Mostra cosa manca')label.textContent='Mostra cosa manca';
    }
    if(active?.dataset.fieldType==='image'&&!selection?.mediaClosing){
      const path=active.querySelector('.field-wrapper [role="textbox"]')?.textContent.trim();
      if(path&&path!==selection?.initialValue){
        selection.mediaClosing=true;const token=pending;
        setTimeout(()=>{if(token===pending&&active?.dataset.fieldType==='image')close();},200);
      }
    }
  };
  window.addEventListener('ely:article-change',event=>{article=event.detail;draw();});
  window.addEventListener('resize',()=>{place();});window.visualViewport?.addEventListener('resize',()=>place());
  document.addEventListener('input',event=>{if(active?.contains(event.target))lastInput=performance.now();},true);
  window.addEventListener('keydown',event=>{
    if(!visual())return;
    if(event.key==='Escape'&&working)return;
    if([...document.querySelectorAll('dialog[open], [role="dialog"]:not(.ely-inspector), [role="menu"]')].some(e=>e.getAttribute('aria-hidden')!=='true'&&!e.closest('[hidden]')&&e.getClientRects().length&&getComputedStyle(e).visibility==='visible'))return;
    if(event.key==='Escape'&&(active||editor.classList.contains('ely-inspector-open'))){event.preventDefault();event.stopImmediatePropagation();close();editor.classList.remove('ely-inspector-open');return;}
    if(event.key==='Tab'&&!panel.classList.contains('ely-inline-edit')&&editor.classList.contains('ely-inspector-open')){
      const candidates=[...panel.querySelectorAll('button'),...toolbar.querySelectorAll('button'),...(active?.querySelectorAll('button, input:not([type="file"]), textarea, [contenteditable="true"], [tabindex="0"]')||[])].filter(e=>!e.disabled&&!e.closest('[inert]')&&e.getClientRects().length&&getComputedStyle(e).visibility==='visible');
      const index=candidates.indexOf(document.activeElement);if(index<0||!event.shiftKey&&index===candidates.length-1||event.shiftKey&&index===0){event.preventDefault();(event.shiftKey?candidates.at(-1):candidates[0])?.focus();}
    }
  },true);
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');
    if(visual()&&!nativeErrorForwarding&&b?.dataset.label==='Show Errors'){
      event.preventDefault();event.stopImmediatePropagation();showValidation(b);return;
    }
    if(visual()&&working&&b?.textContent.trim()==='Salva'){
      event.preventDefault();event.stopImmediatePropagation();
      if(!saveRequested){saveRequested=true;ready(()=>!working).then(()=>{saveRequested=false;if(b.isConnected)b.click();}).catch(()=>{saveRequested=false;});}
      return;
    }
    if(!visual()||!active?.querySelector('[contenteditable="true"]')||b?.textContent.trim()!=='Salva')return;const remaining=250-(performance.now()-lastInput);if(remaining>0){event.preventDefault();event.stopImmediatePropagation();setTimeout(()=>{if(b.isConnected)b.click();},remaining);}},true);
  let scheduled=false;new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance();});}).observe(document.body,{childList:true,subtree:true});enhance();
})();
