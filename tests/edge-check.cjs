const {chromium}=require('playwright');const assert=require('node:assert/strict');
const base = process.env.SITE_URL || 'http://localhost:4173';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({reducedMotion:'reduce'});const problems=[];page.on('pageerror',e=>problems.push(e.message));
try {
for(const size of [{width:844,height:390},{width:320,height:568}]){
 await page.setViewportSize(size);await page.goto(base + '/#contatti');await page.evaluate(()=>document.fonts.ready);
 console.log('Anchor',size,await page.locator('#contatti').evaluate(e=>e.getBoundingClientRect().top));
 await page.locator('#mobile-menu-toggle').click();
 const links=page.locator('#primary-nav a:visible');
 for(let i=0;i<await links.count();i++){
  await links.nth(i).focus();await links.nth(i).scrollIntoViewIfNeeded();
  assert.ok(await links.nth(i).evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));
 }
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('main').evaluate(e=>e.inert),false);
}
for(const route of ['/','/racconti.html','/racconto.html?story=japan','/racconto.html?story=bali','/racconto.html?story=singapore']){
 await page.goto(base + route);
 const images=page.locator('img');for(let i=0;i<await images.count();i++){
  await images.nth(i).evaluate(e=>{e.loading='eager';return e.decode();});
 }
 console.log('Decoded',route,await images.count());
}
assert.deepEqual(problems,[]);console.log('PASS: short-screen menu, all HTML images decoded, direct contact anchors.');
} finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
