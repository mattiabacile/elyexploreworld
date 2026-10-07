const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const root=path.resolve(__dirname,'..'),records=JSON.parse(fs.readFileSync(root+'/content/stories.json')).slice(0,3);
records[0].reuseCover='no';records[0].articleHero=records[1].hero;records[0].articleHeroAlt='Foto dentro l’articolo';records[0].tags=['Montagna & mare'];records[1].kind='consiglio';records[1].tags=['montagna & mare'];records[2].tags=['Altro'];
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage();try{
await page.route('**/content/stories.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(records)}));
const site=process.env.SITE_URL||'http://localhost:4173';await page.goto(site+'/racconto.html?story='+records[0].id);await page.locator('html[data-content-ready=true]').waitFor();
assert.equal(await page.locator('[data-image=hero]').getAttribute('alt'),'Foto dentro l’articolo');assert.ok((await page.locator('[data-image=hero]').getAttribute('src')).endsWith(records[1].hero));
await page.locator('[data-list=tags] a').click();await page.locator('html[data-content-ready=true]').waitFor();assert.equal(await page.locator('.story-card').count(),2);assert.equal(await page.locator('.stories-archive .story-card').count(),1);assert.equal(await page.locator('.tips-grid .story-card').count(),1);assert.match(await page.locator('.archive-tag-filter').innerText(),/2 articoli/);
await page.getByRole('link',{name:'Mostra tutti',exact:true}).click();await page.locator('html[data-content-ready=true]').waitFor();assert.equal(await page.locator('.story-card').count(),3);
records[0].articleHero='';await page.goto(site+'/racconto.html?story='+records[0].id);await page.locator('html[data-content-ready=true]').waitFor();assert.equal(await page.locator('.hero-figure').isVisible(),false);
await page.goto(site+'/racconti.html?tag='+encodeURIComponent('<tag inesistente>'));await page.locator('html[data-content-ready=true]').waitFor();assert.equal(await page.locator('.story-card').count(),0);assert.equal(await page.locator('.archive-tag-filter tag').count(),0);
console.log('PASS: independent article photo, tag links filter stories and tips ignoring case, clear filter, absent opening photo and safe empty results.');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
