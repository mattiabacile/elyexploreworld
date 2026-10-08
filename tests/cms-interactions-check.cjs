const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {focusField}=require('./cms-fields-helper.cjs');
const root=path.resolve(__dirname,'..'),base=process.env.SITE_URL||'http://localhost:4173';
const stories=require('./cms-fields-helper.cjs').readStories();
stories[0].reuseCover='no';stories[0].articleHero=stories[0].hero;stories[0].articleHeroAlt='Una prima foto indipendente';
stories[0].gallery=[{image:stories[0].hero,alt:'Prima foto',caption:'Prima didascalia'},{image:stories[0].hero,alt:'Seconda foto',caption:'Seconda didascalia'}];
const files=Object.fromEntries(['stories','tags','categories'].map(name=>['content/'+name+'.json',fs.readFileSync(path.join(root,'content',name+'.json'),'utf8')]));
files['content/stories.json']=JSON.stringify(stories);
const failures=[];
async function check(name,run){try{await run();console.log('PASS:',name);}catch(error){failures.push({name,error});console.error('FAIL:',name,error.stack);}}
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
  page.setDefaultTimeout(10000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(({files})=>{
   window.showDirectoryPicker=async()=>{
    const root=await navigator.storage.getDirectory();await root.getDirectoryHandle('.git',{create:true});
    await(await root.getDirectoryHandle('assets',{create:true})).getDirectoryHandle('uploads',{create:true});
    for(const [path,text] of Object.entries(files)){
     const parts=path.split('/'),name=parts.pop();let dir=root;
     for(const part of parts)dir=await dir.getDirectoryHandle(part,{create:true});
     const stream=await(await dir.getFileHandle(name,{create:true})).createWritable();await stream.write(text);await stream.close();
    }
    return root;
   };
  },{files});
  await page.goto(base+'/admin/?local=1');await page.getByRole('button',{name:/Lavora con Repository Locale/}).click();
  const open=async()=>{await page.getByText(/Giappone:/).first().click();await page.locator('.ely-editor-content section[data-key-path=title]').waitFor();};
  const save=async()=>{await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});};
  const saved=()=>page.evaluate(async()=>{const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle('content');return JSON.parse(await(await(await dir.getFileHandle('stories.json')).getFile()).text())[0];});
  await open();

  await check('native chapter reorder preserves the latest rich text',async()=>{
   const text='Un dettaglio appena scritto prima di spostare il capitolo.';
   await focusField(page,'chapters');await focusField(page,'chapters.0.body');await page.locator('section[data-key-path="chapters.0.body"] [contenteditable=true]').fill(text);
   await page.evaluate(()=>document.querySelector('section[data-key-path="chapters"] .ely-chapter-moves [data-direction=down]').click());
   await page.waitForTimeout(400);await save();const chapters=(await saved()).chapters;await open();
   assert.equal(chapters[0].title,stories[0].chapters[1].title);assert.equal(chapters[1].body,text);
  });
  await check('keyboard chapter reorder preserves the latest rich text',async()=>{
   const text='Un testo appena scritto prima del riordino da tastiera.';
   await focusField(page,'chapters');await focusField(page,'chapters.0.body');await page.locator('section[data-key-path="chapters.0.body"] [contenteditable=true]').fill(text);
   await page.getByRole('button',{name:'Sposta capitolo dopo',exact:true}).first().press('Enter');
   await page.waitForTimeout(400);await save();const chapters=(await saved()).chapters;await open();assert.equal(chapters[1].body,text);
  });
  await check('native chapter removal preserves the latest text in the following chapter',async()=>{
   const text='Un testo appena scritto nel capitolo che resterà.';
   await focusField(page,'chapters');await focusField(page,'chapters.1.body');await page.locator('section[data-key-path="chapters.1.body"] [contenteditable=true]').fill(text);
   await page.evaluate(()=>document.querySelector('section[data-key-path="chapters"] .item-wrapper button[aria-label="Rimuovi"]').click());
   await page.waitForTimeout(400);await save();const chapters=(await saved()).chapters;await open();assert.equal(chapters.length,2);assert.equal(chapters[0].body,text);
  });
  await check('preview device controls retain their state after resizing',async()=>{
   await page.getByRole('button',{name:'Telefono',exact:true}).click();
   await page.setViewportSize({width:390,height:844});
   await page.getByRole('button',{name:'Anteprima',exact:true}).click();
   await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(350);
   assert.equal(await page.locator('.content-editor').evaluate(node=>node.classList.contains('ely-phone-preview')),true);
   assert.equal(await page.getByRole('button',{name:'Telefono',exact:true}).getAttribute('aria-pressed'),'true');
   assert.equal(await page.getByRole('button',{name:'Desktop',exact:true}).getAttribute('aria-pressed'),'false');
   await page.getByRole('button',{name:'Desktop',exact:true}).click();
  });
  await check('native gallery keyboard reorder preserves the latest caption',async()=>{
   const text='Una didascalia appena scritta prima del riordino da tastiera.';
   await focusField(page,'gallery');const expand=page.locator('section[data-key-path="gallery"] > .field-wrapper button[aria-controls$="-item-list"][aria-expanded="false"]');
   if(await expand.count())await expand.click();
   await page.locator('section[data-key-path=gallery] .item-wrapper').first().locator('button[aria-controls$="-body"][aria-expanded="false"]').click();
   await focusField(page,'gallery.0.caption');await page.locator('section[data-key-path="gallery.0.caption"] [contenteditable=true]').fill(text);
   const handle=page.locator('section[data-key-path=gallery] .item-wrapper').first().locator('[data-action=reorder]');
   assert.equal(await handle.isVisible(),true);await handle.press('End');
   await page.waitForTimeout(400);await save();const gallery=(await saved()).gallery;await open();assert.equal(gallery[1].caption,text);
  });
  await check('native gallery removal preserves the latest caption in the following photo',async()=>{
   const text='Una didascalia appena scritta prima di eliminare la foto precedente.';
   await focusField(page,'gallery');const expand=page.locator('section[data-key-path="gallery"] > .field-wrapper button[aria-controls$="-item-list"][aria-expanded="false"]');
   if(await expand.count())await expand.click();
   await page.locator('section[data-key-path=gallery] .item-wrapper').nth(1).locator('button[aria-controls$="-body"][aria-expanded="false"]').click();await focusField(page,'gallery.1.caption');await page.locator('section[data-key-path="gallery.1.caption"] [contenteditable=true]').fill(text);
   await page.evaluate(()=>document.querySelector('section[data-key-path="gallery"] .item-wrapper button[aria-label="Rimuovi"]').click());
   await page.waitForTimeout(400);await save();const gallery=(await saved()).gallery;await open();assert.equal(gallery.length,1);assert.equal(gallery[0].caption,text);
  });
  await check('switching to fields during chapter creation keeps focus in the chosen mode',async()=>{
   for(const delay of [0,150,250]){
   await page.getByRole('button',{name:'Pagina',exact:true}).click();await page.waitForTimeout(350);
   const before=await page.frameLocator('iframe.preview').locator('.preview-chapter').count();
   await page.evaluate(async delay=>{
    const doc=document.querySelector('iframe.preview').contentDocument;
    [...doc.querySelectorAll('button')].find(node=>node.textContent==='Aggiungi capitolo').click();
    if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
    document.querySelector('.ely-mode-switch [data-mode=fields]').click();
   },delay);
   await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')==='false');await page.waitForTimeout(500);
   assert.equal(await page.frameLocator('iframe.preview').locator('.preview-chapter').count(),before+1);
   assert.equal(await page.locator('.content-editor').evaluate(node=>node.classList.contains('ely-page-mode')),false);
   assert.equal(await page.locator('.content-editor').evaluate(node=>node.classList.contains('ely-inspector-open')),false);
   assert.equal(await page.evaluate(()=>document.querySelector('iframe.preview')===document.activeElement),false);
   }
  });
  await check('title paste preserves literal punctuation and remains a single line',async()=>{
   await focusField(page,'title');const textbox=page.getByRole('textbox',{name:'Titolo',exact:true});
   await textbox.fill('Giappone: titolo prima di incollare');await textbox.press('ControlOrMeta+a');
   await textbox.evaluate(node=>{
    const clipboard=new DataTransfer();clipboard.setData('text/plain','Giappone: *testo*\nseconda riga <mare> & sole');
    node.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:clipboard}));
   });
   await page.waitForTimeout(350);assert.equal(await textbox.innerText(),'Giappone: *testo* seconda riga <mare> & sole');
   assert.equal(await page.frameLocator('iframe.preview').locator('.preview-story h1').innerText(),'Giappone: *testo* seconda riga <mare> & sole');
   await textbox.press('ControlOrMeta+a');await textbox.evaluate(node=>{
    const clipboard=new DataTransfer();clipboard.setData('text/plain','Giappone:\rSeconda\u2028Terza\u2029Quarta');
    node.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:clipboard}));
   });
   await page.waitForTimeout(350);assert.equal(await textbox.textContent(),'Giappone: Seconda Terza Quarta');
   assert.equal(await page.frameLocator('iframe.preview').locator('.preview-story h1').innerText(),'Giappone: Seconda Terza Quarta');
  });
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
 if(failures.length)throw new Error(failures.length+' CMS interaction checks failed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
