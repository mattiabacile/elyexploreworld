const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const base = process.env.SITE_URL || 'http://localhost:4173';
const initial = JSON.parse(fs.readFileSync(require('node:path').join(__dirname, '../content/stories.json'))).filter(story => ['japan','bali','singapore'].includes(story.id));

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  let records = structuredClone(initial);
  let unavailable = false;
  const errors = [];
  await context.route('**/content/stories.json', route => route.fulfill({ status: unavailable ? 503 : 200, contentType: 'application/json', body: JSON.stringify(records) }));
  // Simulate a newly uploaded WebP, without pre-existing mobile variants.
  await context.route('**/assets/uploads/nuova-foto.webp', route => route.fulfill({ contentType: 'image/webp', body: fs.readFileSync(require('node:path').join(__dirname, '../assets/stories/bali-retouched.webp')) }));
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const visit = async route => { await page.goto(base + route); await page.waitForFunction(() => document.documentElement.dataset.contentReady === 'true'); };
  try {
    const added = { ...structuredClone(initial[0]), id: 'nuovo-racconto', title: 'Nuovo viaggio in Portogallo', destination: 'Portogallo', date: '2026-10-06', hero: '/assets/uploads/nuova-foto.webp', heroAlt: 'La nuova copertina', intro: 'Testo scritto dalla cliente.\n\n**Grassetto** e [link](https://example.com).\n\n<img src=x onerror="window.cmsXss=true"><script>window.cmsXss=true</script>', chapters: [{ title: 'Un capitolo nuovo', body: 'Paragrafo completo.\n\n- Prima tappa\n- Seconda tappa' }], tags: ['Europa'] };
    records.push(added, { ...added, id: 'bozza', published: false, title: 'Bozza nascosta' });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await visit('/racconti.html');
      assert.equal(await page.locator('.stories-archive .story-card').count(), 4);
      assert.match(await page.locator('.stories-archive .story-card').first().innerText(), /Portogallo/);
      assert.equal(await page.getByText('Bozza nascosta', { exact: true }).count(), 0);
      await visit('/');
      assert.equal(await page.locator('.stories-slide').count(), 4);
      assert.equal(await page.locator('.stories-slide.is-active').getAttribute('id'), 'story-nuovo-racconto');
      assert.equal(await page.locator('.stories-slide.is-active img').getAttribute('srcset'), null);
      await page.locator('.stories-next').click();
      assert.equal(await page.locator('.stories-slide.is-active').getAttribute('id'), 'story-japan');
      await visit('/racconto.html?story=nuovo-racconto');
      assert.equal(await page.locator('h1').innerText(), added.title);
      assert.equal(await page.locator('.chapter').count(), 1);
      assert.equal(await page.locator('.chapter-copy li').count(), 2);
      assert.equal(await page.locator('.article-intro strong').innerText(), 'Grassetto');
      assert.equal(await page.locator('.article-intro img, .article-intro script').count(), 0);
      assert.equal(await page.evaluate(() => window.cmsXss), undefined);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.locator('[data-image="hero"]').evaluate(image => image.decode());
      assert.equal(await page.locator('[data-image="hero"]').getAttribute('srcset'), null);
    }
    Object.assign(added,{appearance:{theme:'ocean',coverFormat:'natural',coverPosition:'top',textStyle:'journal',dropCap:false,showContents:true},travelFacts:{duration:'10 giorni',season:'Primavera'},gallery:[{image:added.hero,alt:'Foto uno',caption:'La prima tappa'},{image:initial[0].hero,alt:'Foto due',caption:'La seconda tappa'}],conclusion:'Una **riflessione finale**.'});
    added.chapters.push({title:'Un altro capitolo',body:'Il viaggio continua.',image:initial[0].hero,layout:'wide',imageFormat:'natural'});
    records[records.findIndex(item=>item.id===added.id)]=added;
    for(const width of [390,1440]){
      await page.setViewportSize({width,height:900});await visit('/racconto.html?story=nuovo-racconto');
      assert.equal(await page.locator('#racconto > article').getAttribute('data-text-style'),'journal');
      assert.equal(await page.locator('#racconto > article').evaluate(e=>e.style.getPropertyValue('--clay')),'#286274');
      assert.equal(await page.locator('.story-contents a').count(),2);
      assert.match(await page.locator('.story-facts').innerText(),/10 giorni/);
      assert.equal(await page.locator('.chapter-wide [data-photo-format="natural"]').count(),1);
      assert.equal(await page.locator('.story-conclusion strong').innerText(),'riflessione finale');
      const photo=page.getByRole('button',{name:'Apri foto: Foto uno',exact:true});await photo.click();
      assert.equal(await page.locator('dialog[open]').count(),1);await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('dialog img').getAttribute('alt'),'Foto due');
      await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);
      assert.equal(await photo.evaluate(e=>e===document.activeElement),true);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    }
    Object.assign(added,{title:'Un **nuovo** _racconto_',deck:'Un viaggio **speciale** con [link](https://example.com).',heroCaption:'La foto _preferita_.',slideText:'Una **nuova** avventura.'});
    Object.assign(added.chapters[0],{title:'Un **capitolo** nuovo',quote:'Un _ricordo_ da conservare',image:added.hero,caption:'Una **didascalia** con [link](https://example.com)'});
    added.gallery[0].caption='La **prima** tappa';
    await visit('/');assert.equal(await page.locator('.stories-slide.is-active .stories-deck strong').innerText(),'nuova');
    await visit('/racconti.html');const card=page.locator('.stories-archive .story-card').first();assert.equal(await card.locator('strong').first().innerText(),'nuovo');assert.doesNotMatch(await card.locator('a.story-card-link').getAttribute('aria-label'),/\*/);assert.equal(await card.locator('a').count(),1);
    await visit('/racconto.html?story=nuovo-racconto');
    assert.equal(await page.locator('h1 strong').innerText(),'nuovo');assert.equal(await page.locator('h1 em').innerText(),'racconto');assert.equal(await page.title(),'Un nuovo racconto — ElyExploreWorld');
    assert.equal(await page.locator('[data-field="deck"] strong').innerText(),'speciale');assert.equal(await page.locator('[data-field="heroCaption"] em').innerText(),'preferita');
    assert.equal(await page.locator('.chapter h2 strong').first().innerText(),'capitolo');assert.equal(await page.locator('.chapter blockquote em').innerText(),'ricordo');assert.equal(await page.locator('.chapter figcaption strong').innerText(),'didascalia');
    await page.getByRole('button',{name:'Apri foto: Foto uno',exact:true}).click();assert.equal(await page.locator('dialog figcaption strong').innerText(),'prima');await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>ElyArticle.inline('[bad](javascript:alert(1))<img src=x onerror=alert(1)><script>alert(1)</script>')), '<a>bad</a>');
    records.find(item => item.id === added.id).title = 'Titolo aggiornato dalla cliente';
    await visit('/racconti.html');
    assert.match(await page.locator('.stories-archive .story-card').first().innerText(), /Titolo aggiornato/);
    await visit('/racconto.html?story=nuovo-racconto');
    assert.equal(await page.locator('h1').innerText(), 'Titolo aggiornato dalla cliente');
    records = records.filter(item => item.id !== added.id);
    await visit('/'); assert.equal(await page.locator('.stories-slide').count(), 3);
    await visit('/racconti.html'); assert.equal(await page.locator('.stories-archive .story-card').count(), 3);
    for (const id of ['nuovo-racconto', 'bozza', '__proto__', 'constructor']) {
      await visit(`/racconto.html?story=${id}`);
      assert.equal(await page.locator('#racconto > article').isVisible(), false);
      assert.match(await page.locator('.content-status').innerText(), /non è disponibile/);
    }
    // Regression: the live CMS saved this cover URL successfully, but the
    // site's local-only image filter silently discarded the entire article.
    const external = {...initial[0], id:'copertina-esterna', title:'Articolo con copertina HTTPS', hero:'https://picsum.photos/id/839/1920/1280.webp', date:'2026-10-06'};
    await context.route('https://picsum.photos/**', route=>route.fulfill({contentType:'image/webp',body:fs.readFileSync(require('node:path').join(__dirname,'../assets/stories/bali-retouched.webp'))}));
    records = [external];
    await visit('/racconti.html');assert.equal(await page.locator('.stories-archive .story-card').count(),1);
    await visit('/');assert.equal(await page.locator('.stories-slide').count(),1);
    await visit('/racconto.html?story=copertina-esterna');assert.equal(await page.locator('h1').innerText(),external.title);
    assert.equal(await page.locator('[data-image="hero"]').getAttribute('src'),external.hero);
    for (const source of ['javascript:alert(1)','data:image/svg+xml,<svg/>','//example.com/pic.webp','https://user:secret@example.com/pic.webp','assets/../private.webp','assets/%2e%2e/private.webp','assets/%5cprivate.webp']) assert.equal(await page.evaluate(source=>ElyContent.image(source),source),'');
    for (const source of ['assets/uploads/un-articolo-nell’anteprima.webp','assets/uploads/città-di-lisbona.webp']) assert.equal(await page.evaluate(source=>ElyContent.image(source),source),source);
    records = [];
    await visit('/'); assert.match(await page.locator('.content-status').innerText(), /arriveranno presto/);
    assert.equal(await page.locator('.stories-controls').isVisible(), false);
    records = [initial[0]];
    await visit('/'); assert.equal(await page.locator('.stories-controls').isVisible(), false);
    await visit('/racconto.html?story=japan'); assert.equal(await page.locator('.story-pagination').isVisible(), false);
    records = [...initial, { ...initial[0], id: 'consiglio-nuovo', kind: 'consiglio', title: 'Nuovo consiglio', date: '2026-10-06' }];
    await visit('/racconti.html');
    assert.equal(await page.locator('.tips-grid .story-card').count(), 1);
    assert.equal(await page.locator('.tips-grid a').getAttribute('href'), 'racconto.html?story=consiglio-nuovo');
    await visit('/'); assert.equal(await page.locator('.stories-slide.is-active').getAttribute('id'), 'story-consiglio-nuovo');
    unavailable = true;
    await page.goto(base + '/racconti.html');
    await page.getByRole('button', { name: 'Riprova' }).waitFor();
    assert.equal(await page.locator('.stories-archive .story-card').count(), 0);
    assert.deepEqual(errors, []);
    unavailable = false;
    await context.route('**/cms/status', route => route.fulfill({contentType: 'application/json', body: JSON.stringify({configured: true, hasAccount: true})}));
    await context.route('**/cms/session', route => route.fulfill({status: 401, contentType: 'application/json', body: JSON.stringify({message: 'Accedi al pannello.'})}));
    await page.goto(base + '/admin/');
    await page.getByRole('button', { name: 'Accedi', exact: true }).waitFor();
    assert.doesNotMatch(await page.locator('body').innerText(), /errori nella configurazione|invalid value/i);
    console.log('PASS: add, edit, delete, unpublished stories, homepage rotation, mobile uploads, formatted chapters, XSS, empty/single archives, failures and Sveltia configuration.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
