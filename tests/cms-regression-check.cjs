const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {focusField}=require('./cms-fields-helper.cjs');
const root=path.resolve(__dirname,'..'),base=process.env.SITE_URL||'http://localhost:4173';
const stories=JSON.parse(fs.readFileSync(path.join(root,'content/stories.json')));
stories[0].reuseCover='no';stories[0].articleHero=stories[0].hero;stories[0].articleHeroAlt='Una prima foto indipendente';
const files=Object.fromEntries(['stories','tags','categories'].map(name=>['content/'+name+'.json',fs.readFileSync(path.join(root,'content',name+'.json'),'utf8')]));
files['content/stories.json']=JSON.stringify(stories);
const failures=[];
async function check(name,run){try{await run();console.log('PASS:',name);}catch(error){failures.push({name,error});console.error('FAIL:',name,error.message);}}
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
  await check('initial publishing state matches the opened article',async()=>{
   await page.getByRole('button',{name:'Pagina',exact:true}).click();await page.waitForTimeout(300);
   const checked=await page.locator('input[name=ely-publication][value=visible]').isChecked();
   await page.getByRole('button',{name:'Campi',exact:true}).click();assert.equal(checked,stories[0].published);
  });
  await check('independent opening photo fields are available on first open',async()=>{
   await focusField(page,'articleHero');assert.equal(await page.locator('section[data-key-path=articleHero]').isVisible(),true);await focusField(page,'title');
  });
  await check('title punctuation stays literal through preview, save and reopen',async()=>{
   const text='Giappone: *stelle* _nomi_ [foto](https://example.com) `codice` \\ strada <mare> & sole 🌍';
   await page.getByRole('textbox',{name:'Titolo',exact:true}).fill(text);
   await page.waitForTimeout(350);
   assert.equal(await page.frameLocator('iframe.preview').locator('.preview-story h1').innerText(),text);
   await save();await open();
   assert.equal(await page.getByRole('textbox',{name:'Titolo',exact:true}).innerText(),text);
  });
  await check('writing mode button stays in sync after switching through Pagina',async()=>{
   await page.getByRole('button',{name:'Solo scrittura',exact:true}).click();
   await page.getByRole('button',{name:'Pagina',exact:true}).click();
   await page.getByRole('button',{name:'Campi',exact:true}).click();
   const button=page.locator('.ely-focus-toggle');
   await page.waitForTimeout(300);
   assert.equal(await button.textContent(),'Solo scrittura');assert.equal(await button.getAttribute('aria-pressed'),'false');
   await button.click();assert.equal(await page.locator('iframe.preview').isVisible(),false);await button.click();
  });
  await check('latest rich text survives an immediate save in Campi',async()=>{
   await page.getByRole('textbox',{name:'Titolo',exact:true}).fill('Giappone: salvataggio immediato');
   await focusField(page,'intro');
   const text='Ultimo testo scritto e salvato nello stesso istante.';
   await page.getByRole('textbox',{name:'Apertura del racconto',exact:true}).fill(text);
   await page.evaluate(()=>{
    [...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Salva').click();
   });
   await page.locator('.content-editor').waitFor({state:'detached'});const value=(await saved()).intro;await open();assert.equal(value,text);
  });
  await check('empty optional photo removal returns to the page',async()=>{
   await page.getByRole('button',{name:'Pagina',exact:true}).click();
   await page.frameLocator('iframe.preview').locator('.preview-chapter img').first().click();
   const active=page.locator('.ely-on-page-field');await active.waitFor({state:'visible'});
   await page.waitForTimeout(500);assert.equal(await active.count(),1,'Unchanged image editor closed by itself');
   await active.getByText('Rimuovi',{exact:true}).click();
   await page.waitForTimeout(600);
   assert.equal(await page.locator('.ely-on-page-field').count(),0);
   assert.equal(await page.frameLocator('iframe.preview').locator('.preview-chapter').first().getByRole('button',{name:'Aggiungi foto',exact:true}).isVisible(),true);
  });
  await check('composition completes before a pending save',async()=>{
   await page.getByRole('button',{name:'Campi',exact:true}).click();await focusField(page,'title');
   await page.evaluate(()=>{
    const node=document.querySelector('.ely-title-input');node.focus();node.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));node.textContent='Giappone: 日本語 🌍';node.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true,inputType:'insertCompositionText'}));
    [...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Salva').click();
   });
   await page.waitForTimeout(350);assert.equal(await page.locator('.content-editor').count(),1);
   await page.locator('.ely-title-input').evaluate(node=>node.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'日本語'})));
   await page.locator('.content-editor').waitFor({state:'detached'});const title=(await saved()).title;await open();assert.equal(title,'Giappone: 日本語 🌍');
  });
  await check('keyboard save captures the first edit in Campi',async()=>{
   await focusField(page,'intro');await page.getByRole('textbox',{name:'Apertura del racconto',exact:true}).fill('Un ricordo salvato dalla tastiera.');
   await page.keyboard.press('ControlOrMeta+s');await page.locator('.content-editor').waitFor({state:'detached'});const intro=(await saved()).intro;await open();assert.equal(intro,'Un ricordo salvato dalla tastiera.');
  });
  await check('scroll synchronization avoids measuring every field',async()=>{
   await page.getByRole('button',{name:'Campi',exact:true}).click();await focusField(page,'title');
   await page.evaluate(()=>{
    window.elyMeasurements=0;const original=Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect=function(){if(this.matches('section.field'))window.elyMeasurements++;return original.call(this);};
   });
   await page.waitForTimeout(450);await page.locator('.ely-editor-content').evaluate(node=>node.dispatchEvent(new Event('scroll')));await page.waitForTimeout(100);
   const count=await page.evaluate(()=>window.elyMeasurements);console.log('Field geometry reads per scroll:',count);assert.ok(count<=8,'Unnecessary field measurements: '+count);
  });
  await check('scrolling chapter fields follows the visible chapter in preview',async()=>{
   await focusField(page,'chapters');await page.waitForTimeout(450);
   for(const index of [1,2]){
    await page.locator('section[data-key-path="chapters"] > .field-wrapper .item-list > .item-wrapper').nth(index).evaluate(node=>node.scrollIntoView({block:'start'}));
    await page.waitForFunction(index=>document.querySelector('iframe.preview')?.contentDocument?.querySelector('.ely-field-highlight')?.dataset.keyPath?.startsWith('chapters.'+index+'.'),index,{timeout:3000});
   }
  });
  await check('editor has no unhandled browser errors',async()=>assert.deepEqual(errors,[]));
  await page.close();
  await check('configuration failure exposes the retry control',async()=>{
   const page=await browser.newPage();
   await page.route('**/admin/config.json',route=>route.fulfill({status:503,body:'Unavailable'}));
   await page.goto(base+'/admin/?local=1');await page.waitForTimeout(1200);
   assert.equal(await page.getByRole('button',{name:'Riprova ad aprire il pannello',exact:true}).isVisible(),true);
   await page.unroute('**/admin/config.json');await page.getByRole('button',{name:'Riprova ad aprire il pannello',exact:true}).click();await page.getByRole('button',{name:/Lavora con Repository Locale/}).waitFor();
   await page.close();
  });
  await check('non-JSON access failure gives a readable retryable error',async()=>{
   const page=await browser.newPage();
   await page.route('**/cms/status',route=>route.fulfill({json:{configured:true,hasAccount:true}}));
   await page.route('**/cms/session',route=>route.fulfill({status:401,json:{message:'Accedi'}}));
   await page.route('**/cms/login',route=>route.fulfill({status:503,contentType:'text/html',body:'<h1>Unavailable</h1>'}));
   await page.goto(base+'/admin/');await page.getByLabel('Nome utente',{exact:true}).fill('cliente');await page.getByLabel('Password',{exact:true}).fill('Una password di prova abbastanza lunga');await page.getByRole('button',{name:'Accedi',exact:true}).click();
   await page.getByText('Il pannello non è disponibile. Riprova tra poco.',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Accedi',exact:true}).isEnabled(),true);
   await page.unroute('**/cms/login');await page.route('**/cms/login',route=>route.abort('internetdisconnected'));await page.getByRole('button',{name:'Accedi',exact:true}).click();
   await page.getByText('Non riesco a collegarmi al pannello. Controlla la connessione e riprova.',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Accedi',exact:true}).isEnabled(),true);await page.close();
  });
  await check('first activation remains available after a failed request and retry',async()=>{
   const page=await browser.newPage();let requests=0,received;
   await page.route('**/cms/status',route=>++requests===1?route.fulfill({status:503,json:{message:'Unavailable'}}):route.fulfill({json:{configured:true,hasAccount:false}}));
   await page.route('**/cms/session',route=>route.fulfill({status:401,json:{message:'Accedi'}}));
   await page.route('**/cms/setup',route=>{received=route.request().postDataJSON();return route.fulfill({status:400,json:{message:'Richiesta di prova intercettata'}});});
   await page.goto(base+'/admin/?activation=retry#setup=isolated-setup-key');
   await page.getByRole('button',{name:'Riprova ad aprire il pannello',exact:true}).waitFor();assert.equal(new URL(page.url()).hash,'');
   await page.getByRole('button',{name:'Riprova ad aprire il pannello',exact:true}).click();
   await page.getByRole('button',{name:'Crea accesso',exact:true}).waitFor();
   assert.equal(new URL(page.url()).hash,'');assert.equal(new URL(page.url()).search,'?activation=retry');
   await page.getByLabel('Nome utente',{exact:true}).fill('cliente');
   await page.getByLabel('Password',{exact:true}).fill('Una password di prova abbastanza lunga');
   await page.getByLabel('Conferma password',{exact:true}).fill('Una password di prova abbastanza lunga');
   await page.getByRole('button',{name:'Crea accesso',exact:true}).click();await page.getByText('Richiesta di prova intercettata',{exact:true}).waitFor();
   assert.equal(received.setupKey,'isolated-setup-key');await page.close();
  });
 }finally{await browser.close();}
 if(failures.length)throw new Error(failures.length+' CMS regression checks failed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
