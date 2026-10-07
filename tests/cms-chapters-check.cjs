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
 assert.equal(await item.locator('.ely-chapter-label').count(),1);assert.equal(await item.getByRole('button',{name:'Sposta capitolo prima',exact:true}).count(),1);
 return item;
};
await page.getByText(/Giappone: tra templi/).first().click();await page.setViewportSize({width:Number(process.env.CMS_WIDTH||1440),height:Number(process.env.CMS_WIDTH||1440)<900?844:1000});await focusField(page,'chapters');
assert.equal(await list().locator(':scope > *').count(),3);
for(let index=0;index<3;index++)await openItem(index);
assert.equal(await page.getByRole('button',{name:'Salva',exact:true}).isEnabled(),false);
await (await openItem(0)).getByRole('button',{name:'Sposta capitolo dopo',exact:true}).click();await page.waitForTimeout(300);await openItem(0);assert.equal((await page.locator('section[data-key-path="chapters.0.title"] [contenteditable=true]').innerText()).trim(),stories[0].chapters[1].title);
await page.getByRole('button',{name:'Annulla Modifica',exact:true}).click();
await page.getByRole('button',{name:'Crea Nuova Voce',exact:true}).click();await focusField(page,'chapters');
assert.equal(await list().locator(':scope > *').count(),1);
for(let index=0;index<1;index++){
 await openItem(index);
 assert.equal((await page.locator('section[data-key-path="chapters.'+index+'.title"] [contenteditable=true]').innerText()).trim(),'');
}
await (await openItem(0)).evaluate(node=>node.scrollIntoView({block:'start'}));await page.waitForTimeout(150);await page.screenshot({path:root+'/.impeccable/review/chapters-open-'+(process.env.CMS_WIDTH||1440)+'.png'});
await page.locator('section[data-key-path="chapters"] > .field-wrapper .toolbar.add button').click();
await page.waitForFunction(()=>document.querySelector('section[data-key-path=chapters] .item-list')?.children.length===2);
const fourth=await openItem(1);await fourth.getByRole('button',{name:'Rimuovi',exact:true}).click();
await page.waitForFunction(()=>document.querySelector('section[data-key-path=chapters] .item-list')?.children.length===1);
for(let index=0;index>=0;index--){const item=await openItem(index);await item.getByRole('button',{name:'Rimuovi',exact:true}).click();}
await page.waitForFunction(()=>!document.querySelector('section[data-key-path=chapters] .item-list')?.children.length);
assert.deepEqual(errors,[]);
console.log('PASS: flat chapters have no visible collapse controls, reorder with direct arrows, start with one empty chapter, and allow free addition/removal, at '+(process.env.CMS_WIDTH||1440)+'px.');
} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
