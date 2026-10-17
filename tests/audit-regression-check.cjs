// Regression checks for incomplete content and synchronized form controls.
// Content responses stay isolated in the browser; no forms are submitted.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_URL||'http://localhost:4173';
const engine=process.env.BROWSER_ENGINE||'chromium';
assert.ok(['chromium','webkit'].includes(engine),'Choose chromium or webkit');
const originals=JSON.parse(fs.readFileSync(path.join(__dirname,'../content/stories.json')));
(async()=>{
 const browser=await (engine==='webkit'?webkit.launch({headless:true}):chromium.launch({channel:'chrome',headless:true}));
 const failures=[];
 const check=async(name,run)=>{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  try{await run(page);assert.deepEqual(errors,[]);console.log('PASS: '+name);}
  catch(error){failures.push(name+': '+error.message);console.error('FAIL: '+name+': '+error.message);}
  finally{await page.close();}
 };
 try{
  for(const invalid of [{title:42},{title:{}},{date:20261016},{date:'2026-02-30'}]){
   await check('ignore invalid article '+JSON.stringify(invalid),async page=>{
    const record={...originals[0],id:'invalid-article',...invalid};
    await page.route('**/content/stories.json',route=>route.fulfill({json:[...originals,record]}));
    await page.goto(base+'/racconti.html');
    await page.waitForFunction(()=>document.documentElement.dataset.contentReady==='true'||document.querySelector('.content-status'));
    assert.ok(await page.locator('.story-card a[href]').count()>0,'Valid articles must remain available');
    assert.equal(await page.locator('a[href*="invalid-article"], a[href*="2026-02-30"]').count(),0);
    const loaded=await page.evaluate(()=>ElyContent.load());
    assert.equal(loaded.some(story=>story.id==='invalid-article'),false,'Invalid record must be excluded');
   });
  }
  await check('incomplete chapters keep the article and its contents usable',async page=>{
   const record=structuredClone(originals.find(story=>story.id==='japan'));
   record.chapters=[null,record.chapters[0],null,record.chapters[1]];
   record.appearance={...record.appearance,showContents:true};
   await page.route('**/content/stories.json',route=>route.fulfill({json:[record]}));
   await page.goto(base+'/racconto.html?story=japan');
   await page.waitForFunction(()=>document.documentElement.dataset.contentReady==='true',null,{timeout:5000});
   assert.equal(await page.locator('.chapter').count(),2);
   for(const href of await page.locator('.story-contents a').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href'))))assert.equal(await page.locator(href).count(),1);
  });
  for(const width of [390,1440])await check('form reset at '+width+'px',async page=>{
   await page.setViewportSize({width,height:900});await page.goto(base);
   await page.locator('html[data-content-ready=true]').waitFor();
   if(width===390){await page.locator('#mobile-departure-date').fill('2027-04-12');await page.locator('#mobile-departure-date').dispatchEvent('change');}
   else{await page.locator('.contact-date-trigger').click();await page.locator('.calendar-today').click();}
   await page.locator('.travelers-plus').click();await page.locator('.travelers-plus').click();
   await page.locator('#contact-form').evaluate(form=>form.reset());
   await page.waitForTimeout(100);
   assert.equal(await page.locator('#departure-date').inputValue(),'');
   assert.equal(await page.locator('#departure-value').textContent(),'Quando pensi di partire?');
   assert.equal(await page.locator('#mobile-departure-date').inputValue(),'');
   assert.equal(await page.locator('#traveler-count').inputValue(),'1');
   assert.equal(await page.locator('.travelers-value').textContent(),'1');
   assert.equal(await page.locator('.travelers-minus').isDisabled(),true);
   await page.locator('.contact-date-trigger').evaluate(button=>button.click());
   assert.equal(await page.locator('.contact-calendar-days [aria-pressed=true]').count(),0);
  });
  await check('selected mobile date is reflected in the desktop calendar',async page=>{
   await page.setViewportSize({width:390,height:900});await page.goto(base);
   await page.locator('#mobile-departure-date').fill('2027-04-12');
   await page.locator('#mobile-departure-date').dispatchEvent('change');
   await page.setViewportSize({width:1440,height:900});
   await page.locator('.contact-date-trigger').click();
   assert.match(await page.locator('.calendar-month').textContent(),/aprile 2027/);
   assert.equal(await page.locator('.contact-calendar-days [aria-pressed=true]').textContent(),'12');
  });
  assert.deepEqual(failures,[]);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
