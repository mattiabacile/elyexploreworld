const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const base=process.env.SITE_URL||'http://localhost:4173',root=path.resolve(__dirname,'..');
(async()=>{const browser=await chromium.launch({channel:'chrome'});try{
for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/racconti.html');await page.locator('html[data-content-ready=true]').waitFor();
 await page.locator('.stories-archive .story-card-link').first().click();await page.locator('html[data-content-ready=true]').waitFor();
 assert.equal(await page.locator('a[href*="facebook"],[data-share-link=facebook]').count(),0);
 const email=new URL(await page.getByRole('link',{name:'Condividi via email'}).getAttribute('href'));
 assert.equal(email.protocol,'mailto:');assert.equal(email.searchParams.get('body'),page.url());assert.equal(email.searchParams.get('subject'),await page.title());
 await page.evaluate(()=>{window.copied=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.copied.push(text)}});Object.defineProperty(navigator,'share',{configurable:true,value:undefined});});
 await page.getByRole('button',{name:'Copia il link',exact:true}).click();await page.waitForFunction(()=>window.copied.length===1);
 assert.equal(await page.evaluate(()=>window.copied[0]),page.url());assert.equal(await page.locator('.copy-status').isVisible(),true);assert.match(await page.locator('.copy-status').innerText(),/copiato/);
 await page.getByRole('button',{name:'Condividi il racconto',exact:true}).click();await page.waitForFunction(()=>window.copied.length===2);
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Denied')}}}));
 await page.getByRole('button',{name:'Copia il link',exact:true}).click();const manual=page.getByRole('textbox',{name:'Link del racconto da copiare'});await manual.waitFor({state:'visible'});
 assert.equal(await manual.inputValue(),page.url());assert.equal(await manual.evaluate(n=>n===document.activeElement&&n.selectionEnd-n.selectionStart===n.value.length),true);assert.equal(await page.locator('.copy-status').isVisible(),true);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.locator('.share-controls').scrollIntoViewIfNeeded();await page.screenshot({path:root+'/.impeccable/review/sharing-'+width+'.png'});
 await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.shared=data}}));
 await page.getByRole('button',{name:'Condividi il racconto',exact:true}).click();await page.waitForFunction(()=>window.shared);assert.equal(await page.evaluate(()=>window.shared.url),page.url());
 await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.copied.push(text)}});Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancel','AbortError')}})});
 await page.getByRole('button',{name:'Condividi il racconto',exact:true}).click();assert.equal(await page.evaluate(()=>window.copied.length),2);
 await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw Error('Unavailable')}}));
 await page.getByRole('button',{name:'Condividi il racconto',exact:true}).click();await page.waitForFunction(()=>window.copied.length===3);await manual.waitFor({state:'hidden'});
 assert.equal(await page.getByRole('button',{name:'Condividi il racconto',exact:true}).isEnabled(),true);assert.deepEqual(errors,[]);await page.close();
 console.log('PASS: archive to article, email URL, copying, visible manual fallback, native sharing, cancellation and recovery at '+width+'px.');
}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
