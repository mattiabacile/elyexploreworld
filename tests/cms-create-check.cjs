const {chromium}=require('playwright'), fs=require('fs'), assert=require('assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const stories=JSON.parse(fs.readFileSync(root+'/content/stories.json'));
stories[0].appearance={theme:'ocean',textStyle:'journal',coverFormat:'natural',showContents:true,dropCap:false};
stories[0].travelFacts={duration:'Dieci giorni',season:'Primavera'};
stories[0].gallery=[{image:stories[0].hero,alt:'Foto della galleria',caption:'Il viaggio in immagini'}];
stories[0].conclusion='Una **riflessione finale**.';
const files={'content/stories.json':{text:JSON.stringify(stories),type:'application/json'}};
for(const source of new Set(stories.flatMap(s=>[s.hero,...s.chapters.map(c=>c.image)]).filter(Boolean)))files[source]={base64:fs.readFileSync(root+'/'+source).toString('base64'),type:'image/webp'};
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
await page.goto((process.env.SITE_URL || 'http://localhost:4173') + '/admin/?local=1');await page.getByRole('button',{name:/Lavora con Repository Locale/}).click();
await page.getByRole('button',{name:'Crea Nuova Voce',exact:true}).click();
await page.setViewportSize({width:Number(process.env.CMS_WIDTH || 1440),height:Number(process.env.CMS_WIDTH || 1440)<768?844:1000});
await page.getByRole('button',{name:'Pagina',exact:true}).click();
const pick=async key=>{
 await page.frameLocator('iframe.preview').locator(`[data-key-path="${key}"]`).first().click();
 await page.locator(`.ely-on-page-field[data-key-path="${key}"]`).waitFor({state:'visible'});
 assert.equal(await page.locator('.content-editor.ely-page-mode').count(),1);
};
const done=async()=>{await page.getByRole('button',{name:'Fine',exact:true}).click();await page.locator('iframe.preview').waitFor();};
const fill=async(key,value)=>{await pick(key);await page.locator('.ely-on-page-field input, .ely-on-page-field textarea').first().fill(value);await done();};
const rich=async(key,value)=>{await pick(key);await page.locator('.ely-on-page-field [contenteditable="true"]').fill(value);await done();};
await fill('title','Un articolo nato nell’anteprima');
await fill('destination','Portogallo');await fill('deck','Un viaggio scritto interamente sulla pagina.');
await fill('date','2026-10-06');
await pick('hero');await page.locator('.ely-on-page-field input[type="file"]').first().setInputFiles(root+'/'+stories[0].hero);
await page.locator('.ely-on-page-field [role="textbox"]').filter({hasText:/assets\/uploads/}).waitFor();await done();
await fill('heroAlt','La copertina del viaggio');await fill('heroCaption','Un nuovo inizio');
await rich('intro','L’apertura del racconto creata direttamente sulla pagina.');
await pick('chapters');
await page.locator('.ely-on-page-field').getByRole('button',{name:/Aggiungi/}).first().click();await done();
await fill('chapters.0.title','Una nuova tappa');await rich('chapters.0.body','Il capitolo nasce qui.');
await fill('chapters.0.quote','Un ricordo da conservare');await rich('chapters.0.note','Un consiglio pratico.');
await pick('travelFacts');await page.locator('.ely-on-page-field').getByText(/Aggiungi/).click();await page.getByLabel('Durata',{exact:true}).fill('Una settimana');await done();
await pick('gallery');
await page.locator('.ely-on-page-field').getByRole('button',{name:/Aggiungi/}).first().click();await done();
await pick('chapters.0.image');await page.locator('.ely-on-page-field input[type="file"]').first().setInputFiles(root+'/'+stories[0].hero);
await page.locator('.ely-on-page-field [role="textbox"]').filter({hasText:/assets\/uploads/}).waitFor();await done();
await fill('chapters.0.imageAlt','La foto del capitolo');await fill('chapters.0.caption','La prima tappa del viaggio');
await pick('gallery.0.image');await page.locator('.ely-on-page-field input[type="file"]').first().setInputFiles(root+'/'+stories[0].hero);
await page.locator('.ely-on-page-field [role="textbox"]').filter({hasText:/assets\/uploads/}).waitFor();await done();
await fill('gallery.0.alt','Foto della galleria');await fill('gallery.0.caption','La prima tappa');
await rich('conclusion','La conclusione scritta in anteprima.');
await page.getByRole('button',{name:'Aspetto',exact:true}).click();await page.locator('.ely-on-page-field[data-key-path="appearance"]').waitFor();
await page.getByRole('radio',{name:'Blu oceano',exact:true}).check();await done();
await page.getByRole('button',{name:'Pubblica',exact:true}).click();await page.locator('.ely-on-page-field[data-key-path="published"]').waitFor();
await page.locator('.ely-on-page-field').getByRole('switch').check();await done();
assert.equal(await page.getByRole('button',{name:'Pagina',exact:true}).getAttribute('aria-pressed'),'true');
await page.frameLocator('iframe.preview').getByRole('heading',{name:'Un articolo nato nell’anteprima',exact:true}).scrollIntoViewIfNeeded();
await page.screenshot({path:root+'/.impeccable/review/page-created-'+(process.env.CMS_WIDTH || '1440')+'.png'});
// Save straight from the open rich editor, immediately after typing.
await pick('intro');await page.locator('.ely-on-page-field [contenteditable="true"]').fill('Anche l’ultima frase viene salvata dalla pagina.');
await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});
const saved=await page.evaluate(async()=>{const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle('content');return JSON.parse(await(await(await dir.getFileHandle('stories.json')).getFile()).text()).find(s=>s.title==='Un articolo nato nell’anteprima')});
assert.equal(saved.intro,'Anche l’ultima frase viene salvata dalla pagina.');assert.equal(saved.published,true);assert.equal(saved.appearance.theme,'ocean');assert.equal(saved.chapters[0].title,'Una nuova tappa');assert.equal(saved.chapters[0].body,'Il capitolo nasce qui.');assert.equal(saved.chapters[0].quote,'Un ricordo da conservare');assert.equal(saved.chapters[0].note,'Un consiglio pratico.');assert.equal(saved.gallery[0].caption,'La prima tappa');assert.equal(saved.travelFacts.duration,'Una settimana');assert.match(saved.hero,/assets\/uploads/);assert.match(saved.chapters[0].image,/assets\/uploads/);assert.equal(saved.conclusion,'La conclusione scritta in anteprima.');assert.deepEqual(errors,[]);
console.log('PASS: complete article created exclusively in page mode, new uploads, chapters, gallery, optional fields, appearance, visibility and saved JSON.');
} catch(error) {console.error(await page.locator('.content-editor').evaluate(e=>({feedback:e.querySelector('.ely-page-feedback')?.textContent,keys:[...e.querySelectorAll('section.field')].map(s=>s.dataset.keyPath),gallery:e.querySelector('section.field[data-key-path="gallery"]')?.outerHTML.slice(0,14000)})).catch(()=>''));throw error;} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
