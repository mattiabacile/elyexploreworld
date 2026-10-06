const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const base = process.env.SITE_URL || 'http://localhost:4173';
const initial = JSON.parse(fs.readFileSync(require('node:path').join(__dirname, '../content/stories.json'))).filter(story => !story.preparing);

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
    await page.goto(base + '/admin/');
    await page.getByRole('button', { name: /Accedi con.*GitHub/ }).waitFor();
    assert.doesNotMatch(await page.locator('body').innerText(), /errori nella configurazione|invalid value/i);
    console.log('PASS: add, edit, delete, unpublished stories, homepage rotation, mobile uploads, formatted chapters, XSS, empty/single archives, failures and Sveltia configuration.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
