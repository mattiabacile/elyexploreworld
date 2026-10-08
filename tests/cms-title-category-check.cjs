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
const toggle=()=>page.getByRole('button',{name:'Anteprima',exact:true}).click();
await focusField(page,'title');const input=page.locator('section[data-key-path=title] [contenteditable=true]');
assert.equal(await page.locator('.ely-title-custom-color,input[type=color]').count(),0);
assert.equal(await page.getByRole('button',{name:'Salva',exact:true}).isEnabled(),false);
const selectTitle=async text=>{await input.evaluate((node,text)=>{const start=node.textContent.indexOf(text);if(start<0)throw Error('Missing selected text');const walk=document.createTreeWalker(node,NodeFilter.SHOW_TEXT),range=document.createRange();let leaf,offset=0,started=false;while(leaf=walk.nextNode()){const end=offset+leaf.data.length;if(!started&&start<end){range.setStart(leaf,start-offset);started=true;}if(started&&start+text.length<=end){range.setEnd(leaf,start+text.length-offset);break;}offset=end;}const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);},text);};
const selectTempli=()=>selectTitle('templi');
assert.equal(await input.locator('font[color]').innerText(),'tradizioni');
await selectTitle('tradizioni');await page.getByRole('button',{name:'Rimuovi colore',exact:true}).click();if(mobile)await toggle();await preview.locator('.preview-story h1 em').waitFor({state:'visible'});assert.equal(await preview.locator('.preview-story h1 em').evaluate(node=>getComputedStyle(node).color),await preview.locator('.preview-story h1').evaluate(node=>getComputedStyle(node).color));if(mobile)await toggle();
await selectTitle('tradizioni');await page.getByRole('button',{name:'Rimuovi formattazione',exact:true}).click();assert.equal(await input.innerText(),stories[0].title);assert.equal(await page.getByRole('button',{name:'Salva',exact:true}).isEnabled(),true);await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});
await page.getByText(/Giappone: tra templi/).first().click();await focusField(page,'title');assert.equal(await input.locator('font,em,i').count(),0);assert.equal(await page.getByRole('button',{name:'Salva',exact:true}).isEnabled(),false);
await input.fill('Viaggio tra templi e natura');
await selectTempli();await page.getByRole('button',{name:'Colore Blu oceano',exact:true}).click();await page.locator('section[data-key-path=title]').getByRole('button',{name:'Grassetto',exact:true}).click();
await page.locator('section[data-key-path=title]').getByRole('button',{name:'Corsivo',exact:true}).click();
await page.screenshot({path:root+'/.impeccable/review/title-category-'+(mobile?'390':'1440')+'.png'});
if(mobile)await toggle();
await preview.locator('.preview-story h1 span[data-title-color="#286274"]').waitFor();assert.equal(await preview.locator('.preview-story h1 span[data-title-color]').innerText(),'templi');
await page.getByRole('button',{name:'Copertina',exact:true}).click();await preview.locator('.preview-cover-card h2 span[data-title-color="#286274"]').waitFor({state:'visible'});
await page.getByRole('button',{name:'Articolo',exact:true}).click();if(mobile)await toggle();await focusField(page,'category');
await page.locator('section[data-key-path=category]').getByRole('button',{name:/Aggiungi.*Categoria/}).click();await page.getByLabel('Nome della categoria',{exact:true}).fill('Esperienze & natura');await page.getByRole('dialog').getByRole('button',{name:'Aggiungi',exact:true}).click();
await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});
assert.ok(!(await page.locator('body').innerText()).includes('data-title-color'),'The CMS list must show readable titles, without HTML markup');
const saved=await page.evaluate(async()=>{const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle('content');return {stories:JSON.parse(await(await(await dir.getFileHandle('stories.json')).getFile()).text()),categories:JSON.parse(await(await(await dir.getFileHandle('categories.json')).getFile()).text())};});
assert.ok(saved.categories.some(c=>c.name==='Esperienze & natura'));assert.equal(saved.stories[0].category,'Esperienze & natura');assert.match(saved.stories[0].title,/<span data-title-color="#286274">/);assert.match(saved.stories[0].title,/<strong>/);
await page.getByText(/Viaggio tra/).first().click();await focusField(page,'title');assert.equal(await input.locator('font[color]').innerText(),'templi');assert.equal(await page.getByRole('button',{name:'Salva',exact:true}).isEnabled(),false);
const checkBlueText=async expected=>{assert.equal(await input.evaluate(node=>{const walk=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let leaf,text='';while(leaf=walk.nextNode())if(getComputedStyle(leaf.parentElement).color==='rgb(40, 98, 116)')text+=leaf.data;return text;}),expected);if(!mobile)await page.waitForFunction(expected=>[...document.querySelector('iframe.preview')?.contentDocument?.querySelectorAll('.preview-story h1 [data-title-color="#286274"]')||[]].map(node=>node.textContent).join('')===expected,expected);};
await selectTitle('empl');await page.getByRole('button',{name:'Rimuovi colore',exact:true}).click();await checkBlueText('ti');
await input.press('ControlOrMeta+z');await checkBlueText('templi');
await selectTempli();await page.getByRole('button',{name:'Rimuovi colore',exact:true}).click();await checkBlueText('');assert.equal(await input.locator('strong,b').innerText(),'templi');assert.equal(await input.locator('em,i').innerText(),'templi');
await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});await page.getByText(/Viaggio tra/).first().click();await focusField(page,'title');assert.equal(await input.locator('font[color]').count(),0);assert.equal(await input.locator('strong,b').innerText(),'templi');assert.equal(await input.locator('em,i').innerText(),'templi');assert.equal(await page.getByRole('button',{name:'Salva',exact:true}).isEnabled(),false);
if(mobile)await toggle();await preview.locator('.preview-story h1 em').waitFor({state:'visible'});assert.equal(await preview.locator('.preview-story h1 em').evaluate(node=>getComputedStyle(node).color),await preview.locator('.preview-story h1').evaluate(node=>getComputedStyle(node).color));if(mobile)await toggle();
if(!mobile){
 await page.getByRole('button',{name:'Pagina',exact:true}).click();await preview.locator('.preview-story h1').click();await page.locator('.ely-on-page-field[data-key-path=title]').waitFor({state:'visible'});
 await selectTempli();await page.getByRole('button',{name:'Colore Verde foresta',exact:true}).click();
 await page.getByRole('button',{name:'Fine',exact:true}).click();await preview.locator('.preview-story h1 span[data-title-color="#254535"]').waitFor();
 await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});
 const title=await page.evaluate(async()=>{const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle('content');return JSON.parse(await(await(await dir.getFileHandle('stories.json')).getFile()).text())[0].title;});assert.match(title,/<span data-title-color="#254535">/);
 await page.getByText(/Viaggio tra/).first().click();await page.getByRole('button',{name:'Campi',exact:true}).click();await focusField(page,'title');
 await selectTempli();await page.getByRole('button',{name:'Rimuovi colore',exact:true}).click();assert.equal(await input.locator('strong,b').innerText(),'templi');await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});
 const cleared=await page.evaluate(async()=>{const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle('content');return JSON.parse(await(await(await dir.getFileHandle('stories.json')).getFile()).text())[0].title;});assert.ok(!cleared.includes('data-title-color'));assert.match(cleared,/<strong>/);await page.getByText(/Viaggio tra/).first().click();await focusField(page,'title');
}
await selectTempli();await page.getByRole('button',{name:'Rimuovi formattazione',exact:true}).click();assert.equal(await input.locator('font[color]').count(),0);await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});
await page.getByRole('button',{name:'Crea Nuova Voce',exact:true}).click();await focusField(page,'chapters');assert.equal(await page.locator('section[data-key-path=chapters] .item-list > *').count(),1);
await focusField(page,'category');await page.getByRole('combobox',{name:'Categoria',exact:true}).click();await page.getByRole('option',{name:'Esperienze & natura',exact:true}).waitFor({state:'visible'});await page.keyboard.press('Escape');
await focusField(page,'title');assert.equal(await page.getByRole('button',{name:'Colore Blu oceano',exact:true}).isEnabled(),false);
assert.deepEqual(errors,[]);
console.log('PASS: partial/full color removal preserving bold, native undo, saved/reopened title, palette colors without custom picker, both previews, reusable categories and one starter chapter.');
} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
