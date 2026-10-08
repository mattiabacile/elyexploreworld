const {focusField}=require('./cms-fields-helper.cjs');
const {chromium}=require('playwright'), fs=require('fs'), assert=require('assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const stories=require('./cms-fields-helper.cjs').readStories();
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
await page.goto((process.env.SITE_URL || 'http://localhost:4173')+'/admin/?local=1');await page.getByRole('button',{name:/Lavora con Repository Locale/}).click();
const list=()=>page.locator('section[data-key-path="chapters"] > .field-wrapper .item-list');
const openItem=async index=>{
 const item=list().locator(':scope > *').nth(index);await item.scrollIntoViewIfNeeded();
 await item.locator('button[aria-controls$="-body"]').waitFor({state:'attached'});
 assert.equal(await item.locator('button[aria-controls$="-body"]').isVisible(),false);
 assert.equal(await item.locator('button[aria-controls$="-body"]').getAttribute('aria-expanded'),'true');
 return item;
};
await page.getByText(/Giappone: tra templi/).first().click();await page.setViewportSize({width:Number(process.env.CMS_WIDTH||1440),height:Number(process.env.CMS_WIDTH||1440)<900?844:1000});await focusField(page,'chapters');
assert.equal(await list().locator(':scope > *').count(),3);
for(let index=0;index<3;index++)await openItem(index);
assert.equal(await page.getByRole('button',{name:'Salva',exact:true}).isEnabled(),false);

const preview=page.frameLocator('iframe.preview'),mobile=Number(process.env.CMS_WIDTH||1440)<900;
const togglePreview=()=>page.getByRole('button',{name:'Anteprima',exact:true}).click();
await page.getByRole('button',{name:'Copertina',exact:true}).click();
if(mobile)await togglePreview();
await preview.locator('.preview-cover-workspace').waitFor({state:'visible'});assert.equal(await preview.locator('.preview-story').isVisible(),false);
await page.getByRole('button',{name:'Articolo',exact:true}).click();if(mobile)await togglePreview();await focusField(page,'reuseCover');
await page.getByRole('radio',{name:'No, scegli una foto diversa',exact:true}).check();
if(mobile){
 const choice=page.locator('section[data-key-path=reuseCover]'),photo=page.locator('section[data-key-path=articleHero]');
 await photo.waitFor({state:'visible'});
 await choice.getByRole('radio',{name:'Sì',exact:true}).check();await photo.waitFor({state:'hidden'});
 await choice.getByRole('radio',{name:'Sì',exact:true}).press('ArrowRight');await photo.waitFor({state:'visible'});
 assert.equal(await choice.getByRole('radio',{name:'No, scegli una foto diversa',exact:true}).getAttribute('aria-checked'),'true');
}
await focusField(page,'articleHero');await page.locator('section[data-key-path=articleHero] input[type=file]').first().setInputFiles(root+'/'+stories[1].hero);
await page.locator('section[data-key-path=articleHero] [role=textbox]').filter({hasText:/uploads/}).waitFor();
await focusField(page,'articleHeroAlt');await page.getByLabel('Descrizione della prima foto',{exact:true}).fill('Prima foto indipendente');
await focusField(page,'tags');
await page.locator('section[data-key-path=tags]').getByRole('button',{name:/Aggiungi.*Tag/}).click();

await page.getByLabel('Nome del tag',{exact:true}).fill('Prova persistente');await page.getByRole('dialog').getByRole('button',{name:'Aggiungi',exact:true}).click();
await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});
const saved=await page.evaluate(async()=>{const root=await navigator.storage.getDirectory();const dir=await root.getDirectoryHandle('content');return {stories:JSON.parse(await(await(await dir.getFileHandle('stories.json')).getFile()).text()),tags:JSON.parse(await(await(await dir.getFileHandle('tags.json')).getFile()).text())};});
assert.ok(saved.tags.some(t=>t.name==='Prova persistente'));assert.ok(saved.stories[0].tags.includes('Prova persistente'));assert.equal(saved.stories[0].reuseCover,'no');assert.match(saved.stories[0].articleHero,/uploads/);assert.equal(saved.stories[0].hero,stories[0].hero);
await page.getByText(/Giappone: tra templi/).first().click();await focusField(page,'tags');assert.match(await page.locator('section[data-key-path=tags] [role=grid]').innerText(),/Prova persistente/);
if(!mobile)await page.getByRole('button',{name:'Pagina',exact:true}).click();
await page.getByRole('button',{name:'Copertina',exact:true}).click();
if(mobile){
 assert.equal(await page.getByRole('button',{name:'Pagina',exact:true}).isVisible(),false);
 await focusField(page,'title');await page.locator('section[data-key-path=title] [contenteditable=true]').fill('Titolo modificato dalla copertina');await page.getByRole('button',{name:'Copertina',exact:true}).click();await togglePreview();
}else{
 await preview.locator('.preview-cover-card img').waitFor();await preview.locator('.preview-cover-card h2').click();await page.locator('.ely-on-page-field[data-key-path=title] [contenteditable=true]').fill('Titolo modificato dalla copertina');await page.getByRole('button',{name:'Fine',exact:true}).click();
}
await preview.locator('.preview-cover-card h2').filter({hasText:'Titolo modificato dalla copertina'}).waitFor({state:'visible'});assert.equal(await page.locator('.content-editor').getAttribute('data-workspace'),'cover');
await page.getByRole('button',{name:'Articolo',exact:true}).click();await preview.locator('.preview-cover img').waitFor();assert.equal(await preview.locator('.preview-cover img').getAttribute('alt'),'Prima foto indipendente');
if(mobile)await togglePreview();else await page.getByRole('button',{name:'Campi',exact:true}).click();
await page.getByRole('button',{name:'Annulla Modifica',exact:true}).click();await page.getByRole('button',{name:'Crea Nuova Voce',exact:true}).click();await focusField(page,'tags');await page.getByRole('combobox',{name:'Tag',exact:true}).click();await page.getByRole('option',{name:'Prova persistente',exact:true}).waitFor({state:'visible'});
assert.deepEqual(errors,[]);
console.log('PASS: native persistent tag creation saved with article, reusable tags, independent opening photo and separate cover/article previews in both modes.');
} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
