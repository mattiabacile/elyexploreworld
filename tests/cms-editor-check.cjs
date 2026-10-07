const {chromium}=require('playwright'), fs=require('fs'), assert=require('assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const stories=JSON.parse(fs.readFileSync(root+'/content/stories.json'));
stories[0].appearance={theme:'ocean',textStyle:'journal',coverFormat:'natural',showContents:true,dropCap:false};
stories[0].travelFacts={duration:'Dieci giorni',season:'Primavera'};
stories[0].gallery=[{image:stories[0].hero,alt:'Foto della galleria',caption:'Il viaggio in immagini'}];
stories[0].conclusion='Una **riflessione finale**.';
const files={'content/stories.json':{text:JSON.stringify(stories),type:'application/json'}};
for(const source of new Set(stories.flatMap(s=>[s.hero,...s.chapters.map(c=>c.image)]).filter(source=>source && !/^https?:\/\//.test(source))))files[source]={base64:fs.readFileSync(root+'/'+source).toString('base64'),type:'image/webp'};
(async()=>{
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',error=>errors.push(error.stack));
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
await page.getByText(/Giappone: tra templi/).first().waitFor({timeout:30000});await page.getByText(/Giappone: tra templi/).first().click();
await page.locator('.ely-word-count').filter({hasText:/\d+ parole/}).waitFor();
assert.equal(await page.locator('.ely-studio').count(),1);
assert.equal(await page.locator('.ely-editor-nav button').count(),5);
assert.equal(await page.locator('.ely-chapter-count').innerText(),'3 capitoli');
assert.match(await page.locator('.ely-check-summary').innerText(),/da rivedere/);
assert.match(await page.locator('.ely-visibility').innerText(),/Dopo Salva: visibile/);
fs.mkdirSync(root+'/.impeccable/review',{recursive:true});
await page.evaluate(async()=>{await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});
await page.screenshot({path:root+'/.impeccable/review/desktop.png'});
await page.getByRole('button',{name:'Pubblica',exact:true}).click();
await page.locator('.ely-publish-checks').waitFor();
assert.equal(await page.locator('.ely-publish-checks li').count(),6);
assert.match(await page.locator('.ely-publish-checks li').nth(4).innerText(),/testi provvisori/);
await page.screenshot({path:root+'/.impeccable/review/publish.png'});
await page.locator('section.field[data-key-path="published"] [role="switch"]').click();
await page.waitForFunction(()=>document.querySelector('.ely-visibility')?.textContent==='Dopo Salva: bozza');
assert.match(await page.locator('.ely-publish-status').innerText(),/fuori dall’archivio/);
await page.getByRole('button',{name:'Inizia',exact:true}).click();
await page.getByLabel('Titolo', {exact:true}).fill('Giappone: verifica editor');
await page.frameLocator('iframe').getByRole('heading', {name:'Giappone: verifica editor', exact:true}).waitFor({timeout:15000});
assert.equal(await page.frameLocator('iframe').locator('[data-text-style="journal"]').count(),1);
assert.equal(await page.frameLocator('iframe').locator('.preview-gallery img').count(),1);
assert.equal(await page.frameLocator('iframe').locator('.preview-contents a').count(),3);
assert.match(await page.frameLocator('iframe').locator('.preview-facts').innerText(),/Dieci giorni/);
assert.match(await page.frameLocator('iframe').locator('.preview-conclusion').innerText(),/riflessione finale/);
await page.getByRole('button',{name:'Solo scrittura',exact:true}).click();
assert.equal(await page.locator('iframe').isVisible(),false);
await page.getByRole('button',{name:'Scrivi',exact:true}).click();
const introduction=page.locator('section.field[data-key-path="intro"] [contenteditable="true"]');
await introduction.fill('Una giornata tra templi e piccoli rituali. Il viaggio comincia qui.');
await page.waitForFunction(()=>document.querySelector('.ely-word-count')?.textContent!=='— parole');
await page.screenshot({path:root+'/.impeccable/review/writing.png'});
await page.getByRole('button',{name:'Mostra anteprima',exact:true}).click();
await page.getByRole('button',{name:'Telefono',exact:true}).click();
await page.waitForFunction(()=>document.querySelector('iframe')?.getBoundingClientRect().width<=390,{},{timeout:15000});
assert.ok((await page.locator('iframe').boundingBox()).width<=390);
await page.getByRole('button',{name:'Inizia',exact:true}).click();
await page.locator('.ely-editor-content').evaluate(e=>e.scrollTop=0);
const downloadPromise=page.waitForEvent('download');
await page.getByRole('button',{name:'Scarica il testo',exact:true}).click();
const download=await downloadPromise;
const markdown=fs.readFileSync(await download.path(),'utf8');
assert.match(markdown,/# Giappone: verifica editor/);
assert.match(markdown,/Una giornata tra templi e piccoli rituali/);
assert.match(markdown,/Una \*\*riflessione finale\*\*/);
await page.getByRole('button',{name:'Desktop',exact:true}).click();
await page.getByRole('button',{name:'Salva',exact:true}).click();
let saved;
for(let attempt=0;attempt<100;attempt++){
 saved=await page.evaluate(async()=>{
  try{const root=await navigator.storage.getDirectory();const dir=await root.getDirectoryHandle('content');const file=await(await dir.getFileHandle('stories.json')).getFile();return JSON.parse(await file.text())[0];}catch{return null;}
 });
 if(saved?.title==='Giappone: verifica editor')break;
 await page.waitForTimeout(50);
}
assert.equal(saved?.title,'Giappone: verifica editor');
assert.equal(saved.published,false);
assert.match(saved.intro,/Una giornata tra templi/);
assert.equal(saved.appearance.theme,'ocean');
assert.equal(saved.gallery.length,1);

await page.locator('.content-editor').waitFor({state:'detached'});
await page.getByText(/Giappone: verifica editor/).first().click();
await page.getByLabel('Titolo',{exact:true}).waitFor();
// The same authoring tools stay usable at a phone width, with live draft statistics.
await page.setViewportSize({width:390,height:844});
await page.locator('.ely-editor-content').evaluate(e=>e.scrollTop=0);
await page.evaluate(async()=>{await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});
await page.screenshot({path:root+'/.impeccable/review/mobile.png'});
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
assert.equal(await page.locator('.ely-download').isVisible(),true);
await page.getByRole('button',{name:'Pubblica',exact:true}).click();
await page.locator('.ely-publish-checks').waitFor({state:'visible'});
await page.getByRole('button',{name:'Inizia',exact:true}).click();
await page.getByLabel('Titolo',{exact:true}).fill('Giappone: editor mobile');
await page.getByRole('button',{name:'Scrivi',exact:true}).click();
await page.locator('section.field[data-key-path="intro"] [contenteditable="true"]').fill('Un nuovo ricordo scritto dal telefono.');
await page.getByRole('button',{name:'Inizia',exact:true}).click();
await page.locator('.ely-editor-content').evaluate(e=>e.scrollTop=0);
const mobileDownloadPromise=page.waitForEvent('download');
await page.locator('.ely-download').click();
const mobileMarkdown=fs.readFileSync(await(await mobileDownloadPromise).path(),'utf8');
assert.match(mobileMarkdown,/# Giappone: editor mobile/);
assert.match(mobileMarkdown,/Un nuovo ricordo scritto dal telefono/);
// The native rich-text control serializes changes asynchronously before a viewport change unmounts it.
await page.waitForTimeout(250);
await page.setViewportSize({width:1440,height:1000});
await page.evaluate(()=>document.documentElement.dataset.theme='dark');
await page.screenshot({path:root+'/.impeccable/review/dark.png'});

await page.getByRole('button',{name:'Salva',exact:true}).click();
let mobileSaved;
for(let attempt=0;attempt<100;attempt++){mobileSaved=await page.evaluate(async()=>{try{const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle('content');return JSON.parse(await(await(await dir.getFileHandle('stories.json')).getFile()).text())[0];}catch{return null;}});if(mobileSaved?.title==='Giappone: editor mobile')break;await page.waitForTimeout(50);}
assert.equal(mobileSaved.title,'Giappone: editor mobile');
assert.match(mobileSaved.intro,/Un nuovo ricordo scritto dal telefono/);
assert.deepEqual(errors,[]);console.log('PASS: live writing tools, placeholder checklist, draft visibility, focus mode, phone preview, current Markdown export, mobile editing and JSON save in an isolated local repository.');

} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
