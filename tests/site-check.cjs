// Run with Node and Playwright available: node tests/site-check.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.SITE_URL || 'http://localhost:4173';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  try {
    for (const route of ['/', '/racconti.html', '/racconto.html?story=japan', '/racconto.html?story=bali', '/racconto.html?story=singapore', '/racconto.html?story=constructor', '/racconto.html?story=__proto__']) {
      await page.goto(base + route);
      await page.evaluate(() => document.fonts.ready);
      for (const width of [320, 390, 768, 900, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1, null, { timeout: 3000 });
        const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1, duplicates: [...document.querySelectorAll('[id]')].map(e => e.id).filter((id, i, ids) => ids.indexOf(id) !== i) }));
        assert.equal(layout.overflow, false, `${route} overflows at ${width}px`);
        assert.deepEqual(layout.duplicates, [], `${route} duplicate IDs`);
      }
      await page.evaluate(() => scrollTo({ top: 500, behavior: 'instant' }));
      const y = await page.evaluate(() => scrollY);
      await page.locator('#mobile-menu-toggle').click();
      assert.equal(await page.locator('main').evaluate(e => e.inert), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('main').evaluate(e => e.inert), false);
      assert.ok(Math.abs(await page.evaluate(() => scrollY) - y) < 2, `${route}: scroll restored`);
      assert.equal(await page.locator('#mobile-menu-toggle').evaluate(e => e === document.activeElement), true);
      // Every same-site link and fragment must resolve.
      const links = await page.locator('a[href]').evaluateAll(nodes => nodes.map(n => n.href));
      for (const href of new Set(links)) {
        const url = new URL(href);
        if (url.origin !== new URL(base).origin) continue;
        const response = await context.request.get(url.href);
        assert.equal(response.ok(), true, `Broken link: ${href}`);
        if (url.hash) assert.ok((await response.text()).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `Missing anchor: ${href}`);
      }
    }
    await page.goto(base);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (let index = 0; index < await page.locator('[data-preview]').count(); index++) {
        await page.locator('[data-preview]').nth(index).click();
        assert.equal(await page.locator('#content-preview').evaluate(e => e.open), true, `preview ${index} at ${width}: ${errors.join('; ')}`);
        assert.equal(await page.locator('#content-preview-title').count(), 1);
        assert.equal(await page.locator('#content-preview').evaluate(e => e.scrollWidth > e.clientWidth + 1), false);
        await page.keyboard.press('Escape');
      }
      for (const trigger of await page.locator('.mobile-service-more').all()) {
        await trigger.focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('#content-preview').evaluate(dialog => dialog.open), true);
        assert.equal(await page.locator('#content-preview').evaluate(dialog => dialog.scrollWidth > dialog.clientWidth + 1), false);
        assert.equal(await page.locator('#content-preview-title').count(), 1);
        assert.equal(await page.locator('#content-preview .service-preview-card').count(), 1);
        await page.keyboard.press('Escape');
        assert.equal(await trigger.evaluate(node => node === document.activeElement), true);
      }
      await page.locator('[data-service-contact="road"]').click();
      assert.equal(await page.locator('input[name="servizio"]:checked').inputValue(), 'Itinerario day by day');
      await page.waitForFunction(() => document.querySelector('#contact-form input[name="nome"]') === document.activeElement);
      assert.equal(await page.locator('.travel-service-consultation a').getAttribute('href'), 'https://calendly.com/elyexploreworld/30min');
      await page.locator('.bio-more-button').click();
      await page.keyboard.press('Escape');
    }
    await page.locator('#mobile-menu-toggle').click();
    await page.locator('#primary-nav a[href="#servizi"]').click();
    assert.equal(new URL(page.url()).hash, '#servizi');
    assert.equal(await page.locator('#servizi').evaluate(e => e === document.activeElement), true);
    await page.locator('.stories-next').click();
    assert.equal(await page.locator('.stories-slide.is-active').getAttribute('id'), 'story-bali');
    await page.waitForFunction(() => { const link = document.querySelector('.stories-slide.is-active a'); link.focus(); return document.activeElement === link; });
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.stories-slide.is-active').getAttribute('id'), 'story-singapore');
    assert.equal(await page.locator('#stories-track').evaluate(e => e === document.activeElement), true);
    assert.equal(await page.locator('.stories-pause').count(), 0);
    // Clipboard denial must report a fallback, never falsely claim success.
    await page.goto(base + '/racconto.html?story=bali');
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true }));
    await page.locator('[data-share="copy"]').click();
    assert.match(await page.locator('.copy-status').textContent(), /barra degli indirizzi/);
    assert.deepEqual(errors, []);
    console.log('PASS: 7 routes, 5 widths, links, anchors, menu, previews, carousel, clipboard and JavaScript errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
