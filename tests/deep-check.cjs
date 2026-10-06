// Additional lifecycle and failure checks. API requests are intercepted locally.
const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.SITE_URL || 'http://localhost:4173';
const engine = process.env.BROWSER_ENGINE || 'chromium';
assert.ok(['chromium', 'webkit'].includes(engine), 'Choose chromium or webkit');

(async () => {
  const browser = await (engine === 'webkit' ? webkit.launch({ headless: true }) : chromium.launch({ channel: 'chrome', headless: true }));
  const errors = [];
  const observed = new Set();
  const watch = page => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      if (response.url().startsWith('https://api.web3forms.com/')) observed.add(response.url());
    });
  };
  const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', hasTouch: true });
    watch(page);
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    for (const [width, height] of [[767, 900], [768, 900], [950, 500], [950, 501], [951, 500], [1440, 900]]) {
      await page.setViewportSize({ width, height });
      await settle(page);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Overflow at ${width} × ${height}`);
      await page.locator('#mobile-menu-toggle').click();
      assert.equal(await page.locator('main').evaluate(node => node.inert), true);
      await page.setViewportSize({ width: width === 1440 ? 390 : 1440, height: 900 });
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('main').evaluate(node => node.inert), false);
      assert.equal(await page.locator('#primary-nav').evaluate(node => node.inert), true);
      assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.evaluate(() => document.body.classList.contains('menu-open')), false);
    }
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await settle(page);
      // Closing and reopening in one turn exercises queued native close events.
      for (let repeat = 0; repeat < 5; repeat++) {
        await page.evaluate(() => {
          const buttons = document.querySelectorAll('.mobile-service-more');
          buttons[0].click();
          document.querySelector('.preview-close').click();
          buttons[1].click();
        });
        await settle(page);
        assert.equal(await page.locator('#content-preview').evaluate(node => node.open), true);
        assert.match(await page.locator('#content-preview-title').textContent(), /Road Map/);
        assert.equal(await page.locator('.service-preview-copy p').count(), 2);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.mobile-service-more').nth(1).evaluate(node => node === document.activeElement), true);
      }
      await page.locator('.mobile-service-more').first().click();
      await page.setViewportSize({ width: width === 390 ? 1440 : 390, height: 900 });
      await settle(page);
      assert.equal(await page.locator('#content-preview').evaluate(node => node.open), false);
      assert.equal(await page.locator('#content-preview .service-preview-card').count(), 0);
      assert.equal(await page.locator('.mobile-service-more').first().evaluate(node => node === document.activeElement), true);
      await page.locator('[data-preview]').click();
      assert.equal(await page.locator('#content-preview .itinerary-card').count(), 1);
      assert.equal(await page.locator('#content-preview-title').count(), 1);
      await page.keyboard.press('Escape');
      await page.locator('.bio-more-button').click();
      for (const certificate of await page.locator('.bio-certificate-open').all()) {
        await certificate.click();
        assert.equal(await page.locator('.bio-certificate-viewer').isVisible(), true);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#bio-dialog').evaluate(node => node.open), true);
        assert.equal(await certificate.evaluate(node => node === document.activeElement), true);
      }
      await page.keyboard.press('Escape');
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('.contact-date-trigger').click();
    await page.locator('.calendar-next').click();
    await page.locator('.contact-calendar-days button:not(:disabled)').last().click();
    const desktopDate = await page.locator('#departure-date').inputValue();
    await page.setViewportSize({ width: 390, height: 844 });
    await settle(page);
    assert.equal(await page.locator('.mobile-date-display').textContent(), desktopDate);
    await page.locator('#mobile-departure-date').fill('2028-01-05');
    await page.locator('#mobile-departure-date').dispatchEvent('change');
    await page.setViewportSize({ width: 1440, height: 900 });
    await settle(page);
    assert.match(await page.locator('#departure-date').inputValue(), /^0?5\/0?1\/2028$/);
    assert.equal(await page.locator('#departure-value').textContent(), await page.locator('#departure-date').inputValue());
    await page.locator('.travelers-minus').evaluate(node => { for (let repeat = 0; repeat < 8; repeat++) node.click(); });
    assert.equal(await page.locator('#traveler-count').inputValue(), '1');
    assert.equal(await page.locator('.travelers-minus').isDisabled(), true);
    for (const slug of ['', 'invalid', 'constructor', '__proto__', 'toString', '<img src=x onerror=alert(1)>', 'bali&story=singapore']) {
      await page.goto(`${base}/racconto.html?story=${encodeURIComponent(slug)}`);
      await page.waitForFunction(() => document.documentElement.dataset.contentReady === 'true');
      assert.equal(await page.locator('html').getAttribute('data-story'), slug ? 'not-found' : 'japan');
      assert.equal(await page.locator('[data-list="related"] article').count(), slug ? 0 : 3);
    }
    await page.close();

    // Keep the production 5-second callbacks, but trigger them deterministically.
    const slides = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    watch(slides);
    await slides.addInitScript(() => {
      const intervals = new Map();
      let next = 0;
      window.setInterval = (callback, delay, ...args) => { const id = ++next; intervals.set(id, { callback: () => callback(...args), source: new Error().stack }); return id; };
      window.clearInterval = id => intervals.delete(id);
      window.auditTick = script => [...intervals.values()].filter(timer => !script || timer.source.includes(script)).forEach(timer => timer.callback());
      window.auditTimers = script => [...intervals.values()].filter(timer => !script || timer.source.includes(script)).length;
      window.auditHidden = false;
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.auditHidden });
    });
    await slides.goto(base);
    await slides.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.querySelectorAll('img')].map(async image => { image.loading = 'eager'; await image.decode(); }));
    });
    await slides.waitForFunction(() => window.auditTimers('panorama-slideshow.js') === 1);
    const firstHero = await slides.locator('.panorama-hero-slide.is-active img').getAttribute('src');
    await slides.evaluate(() => window.auditTick('panorama-slideshow.js'));
    assert.notEqual(await slides.locator('.panorama-hero-slide.is-active img').getAttribute('src'), firstHero);
    await slides.locator('#blog').evaluate(node => node.scrollIntoView({ behavior: 'instant' }));
    await slides.mouse.move(0, 0);
    await slides.waitForFunction(() => window.auditTimers('panorama-slideshow.js') === 0);
    await slides.waitForFunction(() => window.auditTimers('stories.js') === 1);
    const firstStory = await slides.locator('.stories-slide.is-active').getAttribute('id');
    await slides.evaluate(() => window.auditTick('stories.js'));
    assert.notEqual(await slides.locator('.stories-slide.is-active').getAttribute('id'), firstStory);
    await slides.waitForFunction(() => {
      const link = document.querySelector('.stories-slide.is-active a');
      link.focus();
      return document.activeElement === link;
    });
    await slides.waitForFunction(() => window.auditTimers('stories.js') === 0);
    await slides.evaluate(() => document.activeElement.blur());
    await slides.waitForFunction(() => window.auditTimers('stories.js') === 1);
    await slides.emulateMedia({ reducedMotion: 'reduce' });
    await slides.waitForFunction(() => window.auditTimers('stories.js') === 0);
    await slides.emulateMedia({ reducedMotion: 'no-preference' });
    await slides.waitForFunction(() => window.auditTimers('stories.js') === 1);
    await slides.locator('#mobile-menu-toggle').click();
    await slides.waitForFunction(() => window.auditTimers('stories.js') === 0);
    await slides.keyboard.press('Escape');
    await slides.waitForFunction(() => window.auditTimers('stories.js') === 1);
    await slides.setViewportSize({ width: 390, height: 844 });
    await slides.waitForFunction(() => window.auditTimers('stories.js') === 0);
    await slides.setViewportSize({ width: 1440, height: 900 });
    await slides.locator('#contatti').evaluate(node => node.scrollIntoView({ behavior: 'instant' }));
    await slides.evaluate(() => document.activeElement.blur());
    await slides.waitForFunction(() => window.auditTimers('stories.js') === 0);
    assert.equal(await slides.locator('.contact-background-photo').count(), 1);
    const photo = await slides.locator('.contact-background-photo').getAttribute('src');
    assert.match(photo, /contact-ocean-waves(?:-\d+)?\.webp$/);
    await slides.evaluate(() => window.auditTick());
    assert.equal(await slides.locator('.contact-background-photo').getAttribute('src'), photo);
    await slides.waitForFunction(() => window.auditTimers() === 0);
    assert.equal(await slides.evaluate(() => window.auditTimers()), 0);
    await slides.locator('#contact-form input[name="nome"]').focus();
    await slides.evaluate(() => { window.auditHidden = true; document.dispatchEvent(new Event('visibilitychange')); });
    await slides.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await slides.locator('.contact-background-photo').getAttribute('src'), photo);
    await slides.close();

    for (const width of [390, 1440]) {
      const formPage = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      watch(formPage);
      // Only accelerate the submission timeout, keeping all other timers intact.
      await formPage.addInitScript(() => {
        const nativeTimeout = window.setTimeout.bind(window);
        window.setTimeout = (callback, delay, ...args) => nativeTimeout(callback, delay === 20000 ? 50 : delay, ...args);
      });
      let mode = 'malformed';
      let requests = 0;
      await formPage.route('https://api.web3forms.com/submit', async route => {
        requests++;
        if (mode === 'timeout') return;
        await route.fulfill({ status: mode === 'empty' ? 204 : 200, contentType: 'application/json', body: mode === 'malformed' ? '{broken' : mode === 'empty' ? '' : JSON.stringify({ success: mode === 'string' ? 'true' : false }) });
      });
      await formPage.goto(base);
      await formPage.locator('input[name="nome"]').fill('Verifica locale');
      await formPage.locator('input[name="email"]').fill('audit@example.invalid');
      await formPage.locator('input[name="destinazione"]').fill('Bali');
      await formPage.locator('textarea').fill('Test locale: nessun messaggio inviato.');
      await formPage.locator('.contact-option-grid > label').first().click();
      await formPage.locator('input[name="access_key"]').evaluate(node => { node.value = 'local-test-key'; });
      for (const failure of ['malformed', 'empty', 'false', 'string', 'timeout']) {
        mode = failure;
        await formPage.locator('#contact-form button[type="submit"]').click();
        await formPage.waitForFunction(() => document.querySelector('#contact-status').textContent.startsWith('Non riesco a confermare'));
        assert.equal(await formPage.locator('#contact-form').getAttribute('aria-busy'), null);
        assert.equal(await formPage.locator('#contact-form button[type="submit"]').isEnabled(), true);
        assert.equal(await formPage.locator('textarea').inputValue(), 'Test locale: nessun messaggio inviato.');
      }
      assert.equal(requests, 5);
      await formPage.close();
    }
    assert.deepEqual(errors, []);
    assert.deepEqual([...observed], ['https://api.web3forms.com/submit']);
    console.log(`PASS (${engine}): breakpoints, resize with menu/dialog open, rapid popup reopening, certificates, date transfer, article fallbacks, slideshow lifecycle and malformed/unconfirmed/timed-out form responses; no real submission.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
