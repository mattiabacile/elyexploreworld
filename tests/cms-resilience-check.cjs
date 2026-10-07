const {chromium}=require('playwright'), fs=require('fs'), assert=require('assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const stories=JSON.parse(fs.readFileSync(root+'/content/stories.json'));
stories[0].appearance={theme:'ocean',textStyle:'journal',coverFormat:'natural',showContents:true,dropCap:false};
stories[0].travelFacts={duration:'Dieci giorni',season:'Primavera'};
stories[0].gallery=[{image:stories[0].hero,alt:'Foto della galleria',caption:'Il viaggio in immagini'}];
stories[0].conclusion='Una **riflessione finale**.';
while(stories[0].chapters.length<16){const number=stories[0].chapters.length+1;stories[0].chapters.push({...stories[0].chapters[0],title:'Tappa '+number,body:'Un capitolo aggiuntivo del viaggio.'});}
const files={'content/stories.json':{text:JSON.stringify(stories),type:'application/json'}};
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
    const parts=path.split('/');const name=parts.pop();let dir=root;
    for(const part of parts)dir=await dir.getDirectoryHandle(part,{create:true});
    const file=await dir.getFileHandle(name,{create:true});const stream=await file.createWritable();
    await stream.write(data.base64?Uint8Array.from(atob(data.base64),c=>c.charCodeAt(0)):data.text);await stream.close();
  }
  return root;
 };
},{files});
await page.route('**/article-links.js?*',route=>route.request().url().includes('/admin/')?route.continue():route.fulfill({status:404,body:'Missing'}));
await page.goto((process.env.SITE_URL || 'http://localhost:4173') + '/admin/?local=1');await page.getByRole('button',{name:/Lavora con Repository Locale/}).click();
await page.getByText(/Giappone: tra templi/).first().waitFor({timeout:30000});await page.getByText(/Giappone: tra templi/).first().click();
await page.locator('.ely-word-count').filter({hasText:/\d+ parole/}).waitFor();

await page.getByRole('button',{name:'Pagina',exact:true}).click();
await page.frameLocator('iframe').getByRole('heading',{name:/Giappone: tra templi/}).waitFor();
const preview=page.frameLocator('iframe.preview');
await preview.locator('.preview-contents a').first().click();
await page.waitForFunction(()=>{const doc=document.querySelector('iframe.preview')?.contentDocument,target=doc?.getElementById('preview-chapter-0');return target===doc?.activeElement&&target.getBoundingClientRect().top<100;});
await preview.locator('.preview-contents a').nth(1).press('Enter');
await page.waitForFunction(()=>document.querySelector('iframe.preview')?.contentDocument?.activeElement?.id==='preview-chapter-1');
await preview.locator('[data-key-path="deck"]').click();await page.locator('.ely-on-page-field[data-key-path="deck"]').waitFor({state:'visible'});
const rich=page.locator('.ely-on-page-field [contenteditable=true]');await rich.fill('Un link nel racconto');await rich.press('ControlOrMeta+a');
await page.locator('.ely-on-page-field').getByRole('button',{name:'Link',exact:true}).click();
await page.getByRole('dialog',{name:'Inserisci Link',exact:true}).getByRole('textbox',{name:'URL',exact:true}).fill('https://example.com/viaggio');
await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'Inserisci Link',exact:true}).waitFor({state:'detached'});
assert.equal(await page.locator('.ely-on-page-field[data-key-path="deck"]').isVisible(),true);
await rich.press('ControlOrMeta+a');await page.locator('.ely-on-page-field').getByRole('button',{name:'Link',exact:true}).click();
await page.getByRole('dialog',{name:'Inserisci Link',exact:true}).getByRole('textbox',{name:'URL',exact:true}).fill('https://example.com/viaggio');
await page.getByRole('dialog',{name:'Inserisci Link',exact:true}).getByRole('button',{name:'Inserisci',exact:true}).click();
await page.getByRole('button',{name:'Fine',exact:true}).click();
await preview.locator('[data-key-path="deck"] a').waitFor();
await preview.locator('[data-key-path="deck"] a').click();
await page.locator('.ely-on-page-field[data-key-path="deck"]').waitFor({state:'visible'});
assert.match(await page.locator('iframe.preview').getAttribute('src'),/^blob:http:\/\/localhost/);
await page.getByRole('button',{name:'Fine',exact:true}).click();
const longTitle='Una tappa molto lontana — città, 日本 e 🌍 '+ 'Un dettaglio da raccontare '.repeat(12);
await preview.locator('[data-key-path="chapters.15.title"]').press('Enter');
await page.locator('.ely-on-page-field [contenteditable=true]').fill(longTitle);await page.getByRole('button',{name:'Fine',exact:true}).click();
await preview.locator('[data-key-path="chapters.15.title"]').filter({hasText:'Una tappa molto lontana'}).waitFor();
assert.ok(await preview.locator('html').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
await page.getByText('Informazioni dell’articolo',{exact:true}).click();
await page.getByRole('button',{name:'Racconto o consiglio',exact:true}).click();
await page.locator('.ely-on-page-field').getByRole('radio',{name:'Consiglio di viaggio',exact:true}).check();
await page.getByRole('button',{name:'Fine',exact:true}).click();
await page.getByRole('button',{name:'Consiglio in preparazione',exact:true}).click();
await page.locator('.ely-on-page-field [role=switch]').click();await page.getByRole('button',{name:'Fine',exact:true}).click();
await page.getByText('Dopo Salva: scheda in preparazione nell’archivio, senza articolo completo o slideshow.',{exact:true}).waitFor();
await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});
const saved=await page.evaluate(async()=>{const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle('content');return JSON.parse(await(await(await dir.getFileHandle('stories.json')).getFile()).text())[0]});
assert.equal(saved.chapters[15].title,longTitle.trim());assert.equal(saved.deck,'[Un link nel racconto](https://example.com/viaggio)');assert.equal(saved.kind,'consiglio');assert.equal(saved.preparing,true);
await page.getByText(/Giappone: tra templi/).first().click();await page.getByRole('button',{name:'Pagina',exact:true}).click();
await page.frameLocator('iframe.preview').getByRole('button',{name:'Aggiungi capitolo',exact:true}).waitFor();
await page.evaluate(async()=>{const doc=document.querySelector('iframe.preview').contentDocument;[...doc.querySelectorAll('button')].find(b=>b.textContent==='Aggiungi capitolo').click();await new Promise(resolve=>setTimeout(resolve,50));document.querySelector('button[aria-label="Annulla Modifica"]').click();});
await page.getByText(/Bali: l’isola/).first().click();await page.locator('.ely-word-count').filter({hasText:/\d+ parole/}).waitFor();
await page.waitForTimeout(500);
assert.equal(await page.getByRole('button',{name:'Salva',exact:true}).isEnabled(),false);
assert.equal(await page.locator('.ely-on-page-field').count(),0);assert.equal(await page.locator('.ely-action-status').innerText(),'');
assert.deepEqual(errors,[]);console.log('PASS: keyboard and pointer contents navigation, native inline link dialog, Escape, safe preview clicks, clear preparing status, long multilingual fields, 16 virtualized chapters and persisted link formatting.');
} catch(error) {console.error(error);if(await page.locator('.content-editor').count()){console.log(await page.locator('.content-editor').evaluate(e=>({feedback:e.querySelector('.ely-page-feedback')?.textContent,keys:[...e.querySelectorAll('section.field')].map(s=>s.dataset.keyPath),active:e.querySelector('.ely-on-page-field')?.outerHTML.slice(0,400)})));await page.screenshot({path:root+'/.impeccable/review/page-error.png'});}throw error;} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
