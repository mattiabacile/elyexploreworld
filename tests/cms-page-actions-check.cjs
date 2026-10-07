const {chromium}=require('playwright'), fs=require('fs'), assert=require('assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const stories=JSON.parse(fs.readFileSync(root+'/content/stories.json'));
stories[0].appearance={theme:'ocean',textStyle:'journal',coverFormat:'natural',showContents:true,dropCap:false};
stories[0].travelFacts={duration:'Dieci giorni',season:'Primavera'};
stories[0].gallery=[{image:stories[0].hero,alt:'Foto della galleria',caption:'Il viaggio in immagini'}];
stories[0].conclusion='Una **riflessione finale**.';
const files={'content/categories.json':{text:fs.readFileSync(root+'/content/categories.json','utf8'),type:'application/json'},'content/tags.json':{text:fs.readFileSync(root+'/content/tags.json','utf8'),type:'application/json'},'content/stories.json':{text:JSON.stringify(stories),type:'application/json'}};
for(const source of new Set(stories.flatMap(s=>[s.hero,...s.chapters.map(c=>c.image)]).filter(source=>source && !/^https?:\/\//.test(source))))files[source]={base64:fs.readFileSync(root+'/'+source).toString('base64'),type:'image/webp'};
(async()=>{
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
try {
await page.addInitScript(({files})=>{
 window.showDirectoryPicker=async()=>{
  const root=await navigator.storage.getDirectory();
  await root.getDirectoryHandle('.git',{create:true});
  await (await root.getDirectoryHandle('assets',{create:true})).getDirectoryHandle('uploads',{create:true});
  for(const [path,data] of Object.entries(files)){
    const parts=path.replace(/^\//,'').split('/');const name=parts.pop();let dir=root;
    for(const part of parts)dir=await dir.getDirectoryHandle(part,{create:true});
    const file=await dir.getFileHandle(name,{create:true});const stream=await file.createWritable();
    await stream.write(data.base64?Uint8Array.from(atob(data.base64),c=>c.charCodeAt(0)):data.text);await stream.close();
  }
  return root;
 };
},{files});
await page.goto((process.env.SITE_URL || 'http://localhost:4173') + '/admin/?local=1');await page.getByRole('button',{name:/Lavora con Repository Locale/}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await page.getByText(/Giappone: tra templi/).first().waitFor({timeout:30000});await page.getByText(/Giappone: tra templi/).first().click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await page.locator('.ely-editor-content section.field[data-key-path=title]').waitFor();


const width=Number(process.env.CMS_WIDTH || 1440);
await page.setViewportSize({width,height:width<768?844:1000});
await page.getByRole('button',{name:'Pagina',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
const preview=()=>page.frameLocator('iframe.preview');
const finish=async()=>{await page.getByRole('button',{name:'Fine',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');await page.locator('iframe.preview').waitFor();};
const addChapter=async title=>{
 await preview().getByRole('button',{name:'Aggiungi capitolo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
 await page.locator('.ely-on-page-field[data-key-path$=".title"]').waitFor({state:'visible'});
 assert.equal(await page.locator('.ely-inspector').getAttribute('role'),'region');
 assert.equal(await page.locator('.ely-on-page-field[data-key-path="chapters"]').count(),0);
 await page.locator('.ely-on-page-field [contenteditable=true]').fill(title);await finish();
 await preview().getByRole('heading',{name:title,exact:true}).waitFor();
};
await addChapter('Un capitolo aggiunto sul posto');
await addChapter('Una seconda tappa');
assert.equal(await preview().locator('.preview-chapter').count(),5);
const chapter= index=>preview().locator(`[data-chapter-index="${index}"]`);
const options=async (scope,label)=>{const summary=scope.locator(':scope > details > summary').filter({hasText:label});if(!await summary.evaluate(e=>e.parentElement.open))await summary.click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');};
await page.locator('.content-editor[aria-busy="false"]').waitFor();
await options(chapter(4),'Opzioni del capitolo');
assert.equal(await chapter(4).getByRole('button',{name:'Sposta dopo',exact:true}).isDisabled(),true);
await chapter(4).getByRole('button',{name:'Sposta prima',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await chapter(3).getByRole('heading',{name:'Una seconda tappa',exact:true}).waitFor();
assert.equal(await page.locator('.ely-inspector').isVisible(),false);
await page.locator('.content-editor[aria-busy="false"]').waitFor();
await options(chapter(3),'Opzioni del capitolo');
await chapter(3).getByRole('button',{name:'Sposta dopo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await chapter(4).getByRole('heading',{name:'Una seconda tappa',exact:true}).waitFor();
await page.locator('.content-editor[aria-busy="false"]').waitFor();
await options(chapter(4),'Opzioni del capitolo');
await chapter(4).getByRole('button',{name:'Elimina capitolo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await chapter(4).getByRole('button',{name:'Annulla',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
assert.equal(await preview().locator('.preview-chapter').count(),5);
await chapter(4).getByRole('button',{name:'Elimina capitolo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await chapter(4).getByRole('button',{name:'Elimina',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await preview().locator('.preview-chapter').last().getByRole('heading',{name:'Un capitolo aggiunto sul posto',exact:true}).waitFor();
assert.equal(await preview().locator('.preview-chapter').count(),4);
assert.equal(await page.locator('.ely-inspector').isVisible(),false);
await preview().locator('[data-key-path="chapters.3.body"]').click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await page.locator('.ely-on-page-field [contenteditable="true"]').fill('Testo scritto senza aprire un popup.');
await finish();
await preview().locator('.preview-chapter').last().filter({hasText:'Testo scritto senza aprire un popup.'}).waitFor();
await chapter(3).scrollIntoViewIfNeeded();
await page.screenshot({path:root+'/.impeccable/review/page-actions-'+width+'.png'});
await preview().getByRole('button',{name:'Aggiungi foto alla galleria',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await page.locator('.ely-on-page-field[data-key-path="gallery.1.image"]').waitFor({state:'visible'});
assert.equal(await page.locator('.ely-on-page-field[data-key-path="gallery"]').count(),0);
await page.locator('.ely-on-page-field input[type="file"]').first().setInputFiles(root+'/'+stories[0].hero);
await page.locator('.ely-on-page-field').waitFor({state:'detached'});await page.locator('iframe.preview').waitFor();
await preview().locator('[data-key-path="gallery.1.alt"]').click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await page.locator('.ely-on-page-field input').fill('Il Monte Fuji con i ciliegi');await finish();
await preview().locator('[data-key-path="gallery.1.caption"]').click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await page.locator('.ely-on-page-field [contenteditable=true]').fill('La foto aggiunta direttamente alla galleria');await finish();
const photo=index=>preview().locator(`[data-gallery-index="${index}"]`);
await options(photo(1),'Opzioni della foto');
await photo(1).getByRole('button',{name:'Sposta prima',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await photo(0).getByText('La foto aggiunta direttamente alla galleria',{exact:true}).waitFor();
await options(photo(1),'Opzioni della foto');
await photo(1).getByRole('button',{name:'Elimina foto',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await photo(1).getByRole('button',{name:'Elimina',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await page.waitForFunction(()=>document.querySelector('iframe.preview')?.contentDocument?.querySelectorAll('.preview-gallery figure').length===1);
assert.equal(await preview().locator('.preview-gallery figure').count(),1);
assert.equal(await page.locator('.ely-inspector').isVisible(),false);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')==='false');
// Keyboard editing returns to the article without trapping focus in an invisible dialog.
await preview().locator('[data-key-path="chapters.3.title"]').press('Enter');
await page.locator('.ely-on-page-field [contenteditable=true]').waitFor({state:'visible'});
await page.keyboard.press('Escape');
await page.locator('.ely-on-page-field').waitFor({state:'detached'});
// A failed save points back to the article, even with the native sidebar removed.
await preview().locator('.preview-story [data-key-path="title"]').click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await page.locator('.ely-on-page-field [contenteditable=true]').fill('');await finish();
await page.getByRole('button',{name:'Salva',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await page.getByRole('button',{name:'Mostra cosa manca',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
if(width<768){await page.locator('.entry-sidebar-sheet button.ref').filter({hasText:'Titolo'}).click();}
else {await preview().locator('.preview-validation').getByRole('button',{name:'Titolo',exact:true}).click();}
await page.locator('.ely-on-page-field[data-key-path="title"] [contenteditable=true]').fill('Giappone: verifica dei comandi in pagina');
assert.equal(await page.locator('.ely-inspector').getAttribute('role'),'region');await finish();
await page.getByRole('button',{name:'Salva',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.content-editor')?.getAttribute('aria-busy')!=='true');
await page.locator('.content-editor').waitFor({state:'detached'});
const saved=await page.evaluate(async()=>{const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle('content');return JSON.parse(await(await(await dir.getFileHandle('stories.json')).getFile()).text())[0]});
assert.equal(saved.chapters.length,4);
assert.equal(saved.chapters[3].title,'Un capitolo aggiunto sul posto');
assert.equal(saved.chapters[3].body,'Testo scritto senza aprire un popup.');
assert.equal(saved.gallery.length,1);
assert.equal(saved.gallery[0].caption,'La foto aggiunta direttamente alla galleria');
assert.match(saved.gallery[0].image,/assets\/uploads/);
assert.deepEqual(errors,[]);
console.log('PASS: direct chapter creation, inline writing, direct gallery creation, reorder, inline delete confirmation/cancel, keyboard return, validation recovery and saved ordering at '+width+'px.');
} catch(error){await page.screenshot({path:root+'/.impeccable/review/page-actions-error-'+(process.env.CMS_WIDTH||1440)+'.png'});if(await page.locator('.ely-action-status').count())console.error(await page.locator('.ely-action-status').textContent());console.error(await page.evaluate(()=>[...document.querySelectorAll('[role=dialog], [role=menu]')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility==='visible').map(e=>({role:e.getAttribute('role'),hidden:e.getAttribute('aria-hidden'),label:e.getAttribute('aria-label'),class:e.className}))));throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
