const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),base=process.env.SITE_URL||'http://localhost:4173';
const originals=require('./cms-fields-helper.cjs').readStories();
const tip={...originals[0],id:'consiglio-pronto',title:'Consiglio pronto',kind:'consiglio',preparing:false};
const preparing={...tip,id:'in-preparazione',title:'Consiglio in preparazione',preparing:true};
const draft={...tip,id:'bozza',title:'Bozza riservata',published:false};
const records=[...originals,tip,preparing,draft];
const settings={slideshowKind:'both',slideshowSelection:'selected',slideshow:['japan','bali','consiglio-pronto'],archiveSelection:'selected',archive:['bali','japan','in-preparazione']};
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const files=Object.fromEntries(['tags','categories'].map(name=>['content/'+name+'.json',fs.readFileSync(root+'/content/'+name+'.json','utf8')]));
  files['content/stories.json']=JSON.stringify(records);files['content/placement.json']=JSON.stringify(settings);
  await page.addInitScript(files=>{window.showDirectoryPicker=async()=>{
   const dir=await navigator.storage.getDirectory();await dir.getDirectoryHandle('.git',{create:true});
   const content=await dir.getDirectoryHandle('content',{create:true});
   for(const [name,text] of Object.entries(files)){const file=await content.getFileHandle(name.split('/')[1],{create:true}),stream=await file.createWritable();await stream.write(text);await stream.close();}return dir;
  };},files);
  await page.goto(base+'/admin/?local=1');await page.getByRole('button',{name:/Lavora con Repository Locale/}).click();
  if(!await page.getByText('Selezione e ordine',{exact:true}).first().isVisible())await page.getByText('Slideshow e archivio',{exact:true}).filter({visible:true}).first().click();await page.getByText('Selezione e ordine',{exact:true}).filter({visible:true}).first().click();
  const field=key=>page.locator(`section.field[data-key-path="${key}"]`);
  await field('slideshowKind').waitFor();
  assert.equal(await page.locator('.ely-mode-switch,.ely-page-settings').count(),0);
  assert.equal(await page.getByRole('button',{name:'Salva',exact:true}).isEnabled(),false);
  // Selection and reordering use native draft controls, including on phones.
  await field('slideshow').getByRole('button',{name:'Sposta dopo',exact:true}).first().click();
  await field('slideshowKind').getByRole('radio',{name:'Solo consigli',exact:true}).check();
  await field('archive').locator(':scope > .field-wrapper .toolbar.add button').click();
  const chooser=field('archive.3').getByRole('combobox');await chooser.click();
  await page.getByRole('option',{name:/Consiglio pronto/}).click();
  await field('archive.3').scrollIntoViewIfNeeded();
  await field('archive').getByRole('button',{name:'Sposta prima',exact:true}).last().click();
  await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});
  const saved=await page.evaluate(async()=>{const content=await(await navigator.storage.getDirectory()).getDirectoryHandle('content');return JSON.parse(await(await(await content.getFileHandle('placement.json')).getFile()).text());});
  assert.equal(saved.slideshowKind,'consiglio');assert.deepEqual(saved.slideshow.slice(0,3),['bali','japan','consiglio-pronto']);
  assert.deepEqual(saved.archive,['bali','japan','consiglio-pronto','in-preparazione']);
  if(!await page.getByText('Selezione e ordine',{exact:true}).first().isVisible())await page.getByText('Slideshow e archivio',{exact:true}).filter({visible:true}).first().click();await page.getByText('Selezione e ordine',{exact:true}).filter({visible:true}).first().click();await field('slideshowKind').waitFor();
  assert.equal(await field('slideshowKind').getByRole('radio',{name:'Solo consigli',exact:true}).getAttribute('aria-checked'),'true');
  assert.equal(await page.getByRole('button',{name:'Salva',exact:true}).isEnabled(),false);
  if(width===1440){
   const preview=page.frameLocator('iframe.preview');await preview.locator('.preview-placement').waitFor();
   assert.equal(await preview.locator('section[data-key-path=slideshow] li').count(),1);
   assert.match(await preview.locator('section[data-key-path=slideshow]').innerText(),/Consiglio pronto/);
   assert.equal(await preview.locator('section[data-key-path=archive] li').count(),4);
  }
  // Make the first viewport meaningful on both sizes without overflowing.
  await field('slideshowKind').scrollIntoViewIfNeeded();await page.waitForTimeout(500);assert.equal(await page.getByText('Collezione non trovata.',{exact:true}).isVisible(),false);await page.screenshot({path:root+'/.impeccable/review/placement-'+width+'.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await context.route('**/content/stories.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(records)}));
  let preferences=saved,preferenceStatus=200;
  await context.route('**/content/placement.json',route=>route.fulfill({status:preferenceStatus,contentType:'application/json',body:JSON.stringify(preferences)}));
  const visit=async url=>{await page.goto(base+url);await page.waitForFunction(()=>document.documentElement.dataset.contentReady==='true');};
  await visit('/');assert.equal(await page.locator('.stories-slide').count(),1);assert.equal(await page.locator('.stories-slide').getAttribute('id'),'story-consiglio-pronto');
  assert.equal(await page.locator('.stories-controls').isVisible(),false);
  await visit('/racconti.html');assert.deepEqual(await page.locator('.stories-archive h3').allTextContents(),[originals[1].title,originals[0].title]);assert.equal(await page.locator('.tips-grid .story-card').count(),2);assert.deepEqual(await page.locator('.tips-grid h3').allTextContents(),['Consiglio pronto','Consiglio in preparazione']);
  // A slideshow-only article keeps its complete reading page.
  preferences={...saved,slideshowKind:'racconto',slideshow:['singapore'],archive:['japan']};
  await visit('/');assert.equal(await page.locator('.stories-slide').getAttribute('id'),'story-singapore');
  await visit('/racconti.html');assert.equal(await page.locator('.story-card').count(),1);
  await visit('/racconto.html?story=singapore');assert.match(await page.locator('h1').innerText(),/Singapore/);
  // Empty, deleted, repeated and unpublished references do not produce slides.
  preferences={...saved,slideshowKind:'both',slideshow:['bozza','in-preparazione','rimosso'],archive:[]};
  await visit('/');assert.equal(await page.locator('.stories-slide').count(),0);assert.equal(await page.locator('.stories-controls').isVisible(),false);
  await visit('/racconti.html');assert.equal(await page.locator('.story-card').count(),0);
  preferences={...saved,slideshowKind:'both',slideshow:['singapore','singapore','bali']};
  await visit('/');assert.deepEqual(await page.locator('.stories-slide').evaluateAll(nodes=>nodes.map(n=>n.id)),['story-singapore','story-bali']);
  preferences={slideshowSelection:'all',slideshowKind:'racconto',slideshow:['singapore']};
  await visit('/');assert.deepEqual(await page.locator('.stories-slide').evaluateAll(nodes=>nodes.map(n=>n.id)),['story-singapore','story-japan','story-bali']);
  preferences={};await visit('/racconti.html');assert.equal(await page.locator('.story-card').count(),5);
  preferenceStatus=404;await visit('/');assert.equal(await page.locator('.stories-slide').count(),4);
  preferenceStatus=503;await page.goto(base+'/');await page.getByRole('button',{name:'Riprova',exact:true}).waitFor();assert.equal(await page.locator('.stories-slide').count(),0);
  preferenceStatus=200;preferences=[];await page.goto(base+'/racconti.html');await page.getByRole('button',{name:'Riprova',exact:true}).waitFor();assert.equal(await page.locator('.story-card').count(),0);
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS: desktop and phone placement editing, relation choice, native reordering, save/reopen, matching previews, type filters, independent archive selection/order, readable slideshow-only articles, defaults, duplicates, drafts, removed references and empty lists.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
