// Regression checks for history, keyboard navigation, image loading and sharing.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.SITE_URL || 'http://localhost:4173';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(base);
    for (const hash of ['#servizi', '#contatti']) {
      await page.locator('#mobile-menu-toggle').click();
      await page.locator(`#primary-nav .menu-nav-inner > a[href="${hash}"]`).click();
    }
    await page.locator('#mobile-menu-toggle').click();
    await page.waitForFunction(() => document.activeElement === document.querySelector('#primary-nav a'));
    // Tab wraps in both directions while the underlying page is inert.
    await page.locator('#primary-nav a').last().focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#mobile-menu-toggle').evaluate(e => e === document.activeElement), true);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('#primary-nav a').last().evaluate(e => e === document.activeElement), true);
    await page.goBack();
    await page.waitForFunction(() => !document.querySelector('main').inert && scrollY > 0);
    assert.equal(new URL(page.url()).hash, '#servizi');
    assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'false');
    await page.goForward();
    assert.equal(new URL(page.url()).hash, '#contatti');
    await page.setViewportSize({ width: 1024, height: 768 });
    assert.ok(await page.locator('input[name="nome"]').evaluate(e => parseFloat(getComputedStyle(e).fontSize) >= 16 && e.clientHeight >= 44));
    const radio = page.locator('input[name="servizio"]').first();
    await radio.focus();
    await page.keyboard.press('Space');
    assert.equal(await radio.isChecked(), true);
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.locator('input[name="servizio"]').nth(1).isChecked(), true);

    const images = [];
    page.on('request', request => { if (request.resourceType() === 'image' && request.url().includes('/assets/')) images.push(request.url()); });
    await page.goto(base + '/racconto.html?story=bali');
    await page.locator('html[data-content-ready=true]').waitFor();
    assert.ok(images[0].endsWith('/bali-retouched.webp'), `Wrong first article image: ${images[0]}`);
    await page.evaluate(() => {
      window.copyCalls = 0;
      Object.defineProperty(navigator, 'share', { configurable: true, value: () => Promise.reject(new DOMException('Cancelled', 'AbortError')) });
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { window.copyCalls++; } } });
    });
    await page.locator('[data-share="native"]').click();
    assert.equal(await page.evaluate(() => window.copyCalls), 0);
    await page.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: () => Promise.reject(new Error('Unavailable')) }));
    await page.locator('[data-share="native"]').click();
    await page.waitForFunction(() => window.copyCalls === 1);
    assert.match(await page.locator('.copy-status').textContent(), /copiato/);
    assert.deepEqual(errors, []);
    console.log('PASS: history with open menu, bidirectional focus trap, tablet form, keyboard radios, first article image and native sharing fallbacks.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
