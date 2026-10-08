const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {focusField,readStories}=require('./cms-fields-helper.cjs');
const root=path.resolve(__dirname,'..'),base=process.env.SITE_URL||'http://localhost:4173';
const stories=readStories();
const files=Object.fromEntries(['categories','tags','placement'].map(name=>['content/'+name+'.json',{text:fs.readFileSync(root+'/content/'+name+'.json','utf8')} ]));
files['content/stories.json']={text:JSON.stringify(stories)};
for(const image of new Set(stories.flatMap(story=>[story.hero,...story.chapters.map(chapter=>chapter.image)]).filter(Boolean))) {
  if(!/^https?:/.test(image))files[image]={base64:fs.readFileSync(path.join(root,image)).toString('base64')};
}
(async()=>{
 const browser=await chromium.launch({channel:'chrome'}),context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 context.setDefaultTimeout(12000);
 const errors=[];
 context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
 await context.addInitScript(({files})=>{
  // Deliberately disable the optional CMS preference: this collection's
  // automatic draft protection must still work.
  if (window.top === window && /^https?:$/.test(location.protocol)) localStorage.setItem('sveltia-cms.prefs',JSON.stringify({useDraftBackup:false}));
  window.showDirectoryPicker=async()=>{
   const root=await navigator.storage.getDirectory();
   await root.getDirectoryHandle('.git',{create:true});
   await(await root.getDirectoryHandle('assets',{create:true})).getDirectoryHandle('uploads',{create:true});
   for(const [path,data] of Object.entries(files)){
    const parts=path.replace(/^\//,'').split('/'),name=parts.pop();let dir=root;
    for(const part of parts)dir=await dir.getDirectoryHandle(part,{create:true});
    try {await dir.getFileHandle(name);continue;}catch{}
    const file=await dir.getFileHandle(name,{create:true}),stream=await file.createWritable();
    await stream.write(data.base64?Uint8Array.from(atob(data.base64),c=>c.charCodeAt(0)):data.text);await stream.close();
   }
   return root;
  };
 },{files});
 const open=async()=>{const page=await context.newPage();await page.goto(base+'/admin/?local=1');const connect=page.getByRole('button',{name:/Lavora con Repository Locale/});await connect.click();await page.getByRole('button',{name:'Crea Nuova Voce',exact:true}).waitFor();return page;};
 const saved=page=>page.evaluate(async()=>{const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle('content');return JSON.parse(await(await(await dir.getFileHandle('stories.json')).getFile()).text());});
 const backup=page=>page.locator('.ely-backup-status').filter({hasText:'Bozza salvata'}).waitFor();
 const backups=page=>page.evaluate(async()=>{
  const database=await new Promise((resolve,reject)=>{const request=indexedDB.open('github:mattiabacile/elyexploreworld');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
  try {return await new Promise((resolve,reject)=>{const request=database.transaction('draft-backups').objectStore('draft-backups').getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});}finally{database.close();}
 });
 const restore=async page=>{const dialog=page.getByRole('alertdialog').filter({hasText:/Restore Draft|Ripristina Bozza|Ripristina bozza/});await dialog.waitFor();await dialog.getByRole('button',{name:/^(Restore|Ripristina)$/}).click();};
 try {
  let page=await open();await page.getByText(stories[0].title).first().click();await page.locator('.ely-save-bar').waitFor();
  await page.getByRole('textbox',{name:'Titolo',exact:true}).click();await page.getByRole('textbox',{name:'Titolo',exact:true}).fill('Racconto protetto automaticamente');
  await focusField(page,'intro');await page.getByRole('textbox',{name:'Apertura del racconto',exact:true}).fill('Un testo conservato dopo la chiusura della pagina.');
  await backup(page);
  // A blocked browser write must be visible and recoverable, without publishing.
  await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;window.allowDraftWrites=false;IDBObjectStore.prototype.put=function(...args){if(this.name==='draft-backups'&&!window.allowDraftWrites)throw new DOMException('Storage full','QuotaExceededError');return put.apply(this,args)};});
  await page.getByRole('textbox',{name:'Apertura del racconto',exact:true}).fill('Un testo conservato dopo la chiusura della pagina. Anche dopo un errore.');
  await page.locator('.ely-backup-status[data-phase=error]').waitFor();
  await page.evaluate(()=>{window.allowDraftWrites=true});await page.getByRole('button',{name:'Riprova',exact:true}).click();await backup(page);
  const before=await saved(page);assert.equal(before[0].title,stories[0].title);assert.equal(before[0].published,true);
  assert.equal((await backups(page))[0].slug,'ely-article:'+stories[0].id);
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:width===390?844:1000});
   const button=await page.getByRole('button',{name:'Salva',exact:true}).boundingBox();
   assert.ok(button.x+button.width<=width && button.x+button.width>=width-32);
   assert.ok(button.y> (width===390?844:1000)-130 && button.height>=52);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:root+'/.impeccable/review/autosave-'+width+'.png'});
  }
  await page.close();page=await open();await page.getByText(stories[0].title).first().click();await restore(page);
  await page.waitForFunction(()=>document.querySelector('.ely-title-input')?.textContent==='Racconto protetto automaticamente');
  assert.equal(await page.getByRole('textbox',{name:'Titolo',exact:true}).innerText(),'Racconto protetto automaticamente');
  await focusField(page,'intro');assert.match(await page.getByRole('textbox',{name:'Apertura del racconto',exact:true}).innerText(),/Anche dopo un errore/);
  await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});
  assert.equal((await saved(page))[0].title,'Racconto protetto automaticamente');
  assert.equal((await backups(page)).length,0);
  await page.getByText('Racconto protetto automaticamente').first().click();await page.locator('.ely-save-bar').waitFor();
  assert.equal(await page.getByRole('alertdialog').count(),0);assert.equal(await page.getByRole('button',{name:'Salva',exact:true}).isEnabled(),false);
  // Closing an unmodified article must not create a backup or change visibility.
  await page.close();page=await open();await page.getByRole('button',{name:'Crea Nuova Voce',exact:true}).click();await page.locator('.ely-save-bar').waitFor();
  await page.getByRole('textbox',{name:'Titolo',exact:true}).fill('Consiglio ancora incompleto');
  await page.getByRole('radio',{name:'Consiglio di viaggio',exact:true}).click();
  const hero=await focusField(page,'hero');await hero.locator('input[type=file]').first().setInputFiles(root+'/'+stories[0].hero);
  await page.waitForFunction(()=>document.querySelector('iframe.preview')?.contentDocument?.querySelector('.preview-cover-workspace img')?.getAttribute('src')?.startsWith('blob:'));
  await backup(page);assert.equal((await saved(page)).length,stories.length);
  await page.close();page=await open();await page.getByRole('button',{name:'Crea Nuova Voce',exact:true}).click();await restore(page);
  await page.waitForFunction(()=>document.querySelector('.ely-title-input')?.textContent==='Consiglio ancora incompleto');assert.equal(await page.getByRole('textbox',{name:'Titolo',exact:true}).innerText(),'Consiglio ancora incompleto');
  assert.equal(await page.getByRole('radio',{name:'Consiglio di viaggio',exact:true}).isChecked(),true);
  await focusField(page,'hero');await page.waitForFunction(()=>document.querySelector('iframe.preview')?.contentDocument?.querySelector('.preview-cover-workspace img')?.getAttribute('src')?.startsWith('blob:'));
  await focusField(page,'published');assert.equal(await page.locator('section.field[data-key-path=published] [role=switch]').getAttribute('aria-checked'),'false');
  assert.deepEqual(errors,[]);
  console.log('PASS: existing published article and incomplete advice survive closing the tab; autosave never writes public content; disabled backup preference cannot bypass protection; manual Save clears backup; desktop/mobile Save stays bottom right.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
