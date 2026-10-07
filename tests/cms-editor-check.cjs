const {focusField}=require('./cms-fields-helper.cjs');
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
await page.locator('.ely-editor-content section.field[data-key-path=title]').waitFor();
const noExtras=async()=>{
 assert.equal(await page.locator('.ely-studio, .ely-editor-nav, .ely-editor-guide, .ely-editor-section, .ely-writing-prompts, .ely-publish-checks').count(),0);
 for(const name of ['Inizia','Copertina','Scrivi','Aspetto','Pubblica'])assert.equal(await page.getByRole('button',{name,exact:true}).count(),0);
};
await noExtras();
assert.equal(await page.getByRole('button',{name:'Salva',exact:true}).isEnabled(),false);
fs.mkdirSync(root+'/.impeccable/review',{recursive:true});
await page.screenshot({path:root+'/.impeccable/review/fields-desktop.png'});
await focusField(page,'published');
await page.locator('section.field[data-key-path="published"] [role="switch"]').click();
await focusField(page,'title');
await page.getByRole('textbox',{name:'Titolo',exact:true}).fill('Giappone: verifica editor');
await page.frameLocator('iframe').getByRole('heading',{name:'Giappone: verifica editor',exact:true}).waitFor();
await page.getByRole('button',{name:'Solo scrittura',exact:true}).click();
assert.equal(await page.locator('iframe').isVisible(),false);
await focusField(page,'intro');
await page.getByRole('textbox',{name:'Apertura del racconto',exact:true}).fill('Una giornata tra templi e piccoli rituali. Il viaggio comincia qui.');
await page.getByRole('button',{name:'Mostra anteprima',exact:true}).click();
await focusField(page,'intro');
await page.waitForFunction(()=>document.querySelector('iframe.preview')?.contentDocument?.querySelector('[data-key-path="intro"]')?.classList.contains('ely-field-highlight'));
await page.getByRole('button',{name:'Telefono',exact:true}).click();
assert.ok((await page.locator('iframe').boundingBox()).width<=390);
await page.getByRole('button',{name:'Desktop',exact:true}).click();
await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});
const readSaved=()=>page.evaluate(async()=>{const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle('content');return JSON.parse(await(await(await dir.getFileHandle('stories.json')).getFile()).text())[0];});
let saved=await readSaved();assert.equal(saved.title,'Giappone: verifica editor');assert.equal(saved.published,false);assert.match(saved.intro,/Una giornata tra templi/);assert.equal(saved.appearance.theme,'ocean');assert.equal(saved.gallery.length,1);
await page.getByText(/Giappone: verifica editor/).first().click();
await page.locator('.ely-editor-content section.field[data-key-path=title]').waitFor();
await page.setViewportSize({width:390,height:844});await focusField(page,'title');await noExtras();
await page.screenshot({path:root+'/.impeccable/review/fields-mobile.png'});
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
await page.getByRole('textbox',{name:'Titolo',exact:true}).fill('Giappone: editor mobile');
await focusField(page,'intro');
await page.getByRole('textbox',{name:'Apertura del racconto',exact:true}).fill('Un nuovo ricordo scritto dal telefono.');
await focusField(page,'kind');await page.getByRole('radio',{name:'Consiglio di viaggio',exact:true}).check();
await focusField(page,'preparing');assert.equal(await page.locator('section.field[data-key-path=preparing]').isVisible(),true);
await focusField(page,'kind');await page.getByRole('radio',{name:'Racconto di viaggio',exact:true}).check();
// Rerender/mount preparing only for advice, while retaining the native value.
await page.locator('.ely-editor-content').evaluate(e=>e.scrollTop=e.scrollHeight);await page.waitForTimeout(200);
assert.equal(await page.locator('section.field[data-key-path=preparing]').isVisible(),false);
await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});
saved=await readSaved();assert.equal(saved.title,'Giappone: editor mobile');assert.match(saved.intro,/Un nuovo ricordo scritto dal telefono/);assert.equal(saved.kind,'racconto');
assert.deepEqual(errors,[]);console.log('PASS: clean native fields on desktop and phone, no introductory blocks or shortcut navigation, preview sync, draft visibility, conditional advice fields and persisted edits.');

} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
