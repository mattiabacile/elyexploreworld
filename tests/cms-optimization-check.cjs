const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {focusField}=require('./cms-fields-helper.cjs');
const root=path.resolve(__dirname,'..'),base=process.env.SITE_URL||'http://localhost:4173';
const stories=require('./cms-fields-helper.cjs').readStories();
stories[0].reuseCover='no';stories[0].articleHero=stories[0].hero;stories[0].articleHeroAlt='Una prima foto indipendente';
stories[0].gallery=[{image:stories[0].hero,alt:'Prima foto',caption:'Prima didascalia'},{image:stories[0].hero,alt:'Seconda foto',caption:'Seconda didascalia'}];
const files=Object.fromEntries(['stories','tags','categories'].map(name=>['content/'+name+'.json',fs.readFileSync(path.join(root,'content',name+'.json'),'utf8')]));
while(stories[0].chapters.length<16)stories[0].chapters.push({...stories[0].chapters[0],title:'Tappa '+(stories[0].chapters.length+1),body:'Un capitolo del viaggio.'});
files['content/stories.json']=JSON.stringify(stories);
for(const source of new Set(stories.flatMap(story=>[story.hero,story.articleHero,...story.chapters.map(chapter=>chapter.image)]).filter(Boolean)))files[source]={base64:fs.readFileSync(path.join(root,source)).toString('base64')};
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
     const stream=await(await dir.getFileHandle(name,{create:true})).createWritable();await stream.write(typeof text==='string'?text:Uint8Array.from(atob(text.base64),char=>char.charCodeAt(0)));await stream.close();
    }
    return root;
   };
  },{files});
  await page.goto(base+'/admin/?local=1');await page.getByRole('button',{name:/Lavora con Repository Locale/}).click();
  const open=async()=>{await page.getByText(/Giappone:/).first().click();await page.locator('.ely-editor-content section[data-key-path=title]').waitFor();};
  const save=async()=>{await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});};
  const saved=()=>page.evaluate(async()=>{const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle('content');return JSON.parse(await(await(await dir.getFileHandle('stories.json')).getFile()).text())[0];});
  await open();
  await page.evaluate(()=>{
   window.cmsWork={toolbarReads:0,buttonScans:0,buttonsVisited:0,fieldScans:0};
   const query=Document.prototype.querySelectorAll,rect=Element.prototype.getBoundingClientRect,fields=Element.prototype.querySelectorAll;
   Document.prototype.querySelectorAll=function(selector){const result=query.call(this,selector);if(selector==='button,[role=menuitem]'||selector.includes('button[aria-label*="cronologia"')){cmsWork.buttonScans++;cmsWork.buttonsVisited+=result.length;}return result;};
   Element.prototype.getBoundingClientRect=function(){if(this.matches('.content-editor > .primary'))cmsWork.toolbarReads++;return rect.call(this);};
   Element.prototype.querySelectorAll=function(selector){if(selector==='section.field[data-field-type="richtext"]'||selector.includes('#first-pane-body > .content > section.field'))cmsWork.fieldScans++;return fields.call(this,selector);};
  });
  await focusField(page,'intro');const textbox=page.locator('section[data-key-path=intro] [contenteditable=true]');
  await textbox.fill('Il viaggio comincia qui.');await page.waitForTimeout(500);
  await page.evaluate(()=>Object.keys(cmsWork).forEach(key=>cmsWork[key]=0));
  await textbox.pressSequentially(' Una nuova riga di testo per il racconto.',{delay:40});await page.waitForTimeout(700);
  console.log('TYPING WORK',await page.evaluate(()=>cmsWork));
  await page.getByRole('button',{name:'Pagina',exact:true}).click();
  await page.waitForTimeout(350);await page.evaluate(()=>Object.keys(cmsWork).forEach(key=>cmsWork[key]=0));await page.frameLocator('iframe.preview').locator('.preview-story .preview-cover [data-key-path="articleHero"]').first().click();
  await page.locator('.ely-on-page-field').waitFor({state:'visible'});await page.waitForTimeout(400);
  await page.screenshot({path:root+'/output/editor-simplify-after-desktop.png'});
  const work=await page.evaluate(()=>cmsWork);console.log('Photo editing work:',work);
  assert.ok(work.buttonsVisited<50,'Opening a photo must avoid scanning every native button');
  assert.ok(work.toolbarReads<=4,'Toolbar height should only be read for actual field placement');
  assert.ok((await page.locator('.ely-inspector').boundingBox()).height<=400,'Photo controls should leave more of the article visible');
  assert.equal(await page.locator('.ely-inspector h2').innerText(),'Prima foto dell’articolo');
  assert.equal(await page.getByRole('button',{name:'Torna alla pagina',exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:'Fine',exact:true}).count(),1);
  assert.equal(await page.locator('.ely-live-hint').getAttribute('aria-live'),'polite');
  assert.ok((await page.locator('.ely-live-hint').boundingBox()).width<=1,'The live hint should leave the editing controls visible');
  await page.getByRole('button',{name:'Fine',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('iframe.preview')?.contentDocument?.activeElement?.dataset.keyPath==='articleHero');
  await page.setViewportSize({width:940,height:1000});await page.waitForTimeout(250);
  const bounds=await page.locator('.content-editor').evaluate(node=>({toolbar:node.querySelector(':scope > .primary').getBoundingClientRect().bottom,settings:node.querySelector('.ely-page-settings').getBoundingClientRect().top}));
  assert.ok(Math.abs(bounds.toolbar-bounds.settings)<=1,'Settings must follow the current toolbar height');
  await page.getByRole('button',{name:'Campi',exact:true}).click();
  await page.locator('.content-editor > .primary button[aria-haspopup=menu]').click();
  assert.equal(await page.getByRole('menuitem',{name:/Cronologia|History/}).filter({visible:true}).count(),0);
  await page.keyboard.press('Escape');
  await save();
  const story=await saved();assert.equal(story.chapters.length,16);assert.equal(story.intro,'Il viaggio comincia qui. Una nuova riga di testo per il racconto.');
  await open();
  await page.setViewportSize({width:390,height:844});await focusField(page,'title');
  await page.screenshot({path:root+'/output/editor-simplify-after-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PASS: one close action, uncluttered photo popup, preserved keyboard focus, responsive settings, bounded DOM work, hidden history and persisted writing.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

