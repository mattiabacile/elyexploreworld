// Smartphone regression checks. Run with Playwright available via NODE_PATH.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.SITE_URL || 'http://localhost:4173';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ isMobile: true, hasTouch: true, deviceScaleFactor: 2, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  try {
    for (const route of ['/', '/racconti.html', '/racconto.html?story=japan', '/racconto.html?story=bali', '/racconto.html?story=singapore', '/privacy.html', '/note-legali.html']) {
      await page.goto(base + route);
      await page.evaluate(() => document.fonts.ready);
      for (const width of [320, 360, 375, 390, 393, 414, 430, 480]) {
        await page.setViewportSize({ width, height: 844 });
        const layout = await page.evaluate(() => ({
          width: innerWidth, scroll: document.documentElement.scrollWidth,
          controls: [...document.querySelectorAll('.mobile-menu, .header-cta, .menu-socials a, .stories-arrow, .panorama-slideshow-controls button, .contact-stepper button, .share-list button, .share-list a, .site-footer-legal a, .site-footer-contact a')]
            .filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden')
            .map(e => ({ label: e.getAttribute('aria-label') || e.textContent, w: e.getBoundingClientRect().width, h: e.getBoundingClientRect().height }))
        }));
        assert.ok(layout.scroll <= width + 1 && layout.width === width, `${route} overflow at ${width}: ${JSON.stringify(layout)}`);
        if (route === '/') {
          const fields = await page.evaluate(() => {
            const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
            return {
              date: rect('#mobile-departure-date'), display: rect('.mobile-date-display'), travelers: rect('.contact-stepper'),
              placeholder: document.querySelector('.mobile-date-display').textContent,
              greeting: rect('.bio-title'), portrait: rect('.bio-portrait'),
              order: [...document.querySelector('main').children].filter(e => e.matches('section')).map(e => e.id),
              consultationHeight: rect('.consultation-banner').height,
              itineraryHeight: rect('#ispirazioni').height,
              copyBeforeExample: rect('.preview-copy-block').top < rect('.postcard-collage').top,
              imageHeight: rect('.stories-photo').height,
              storyPhoto: rect('.stories-photo'), storyCopy: rect('.stories-copy')
            };
          });
          assert.equal(fields.placeholder, 'Quando pensi di partire?');
          assert.ok(fields.date.right < fields.travelers.left, `Date overlaps travelers at ${width}`);
          assert.ok(Math.abs(fields.date.width - fields.display.width) < 1 && Math.abs(fields.date.height - 44) < 1, `Native date is not bounded at ${width}`);
          assert.ok(Math.abs(fields.date.top - fields.travelers.top) < 1, `Trip fields misaligned at ${width}`);
          assert.ok(fields.portrait.width <= 210 && fields.portrait.left >= fields.greeting.right - 1 && fields.portrait.top > fields.greeting.top, `Portrait placement at ${width}`);
          assert.ok(fields.order.indexOf('chi-sono') < fields.order.indexOf('servizi'));
          assert.ok(fields.consultationHeight < 350 && fields.itineraryHeight < 700 && fields.imageHeight <= 400, `Oversized mobile section at ${width}`);
          assert.ok(fields.storyCopy.top >= fields.storyPhoto.top && fields.storyCopy.bottom <= fields.storyPhoto.bottom + 1, `Story text is outside its photo at ${width}`);
          assert.equal(fields.copyBeforeExample, true);
          assert.equal(await page.locator('.consultation-photo-picker').count(), 0);
          assert.equal(await page.locator('.itinerary-slideshow-controls').count(), 0);
        }
        for (const control of layout.controls) assert.ok(control.w >= 43.9 && control.h >= 43.9, `${route} at ${width}: undersized ${JSON.stringify(control)}`);
        await page.locator('#mobile-menu-toggle').click();
        assert.equal(await page.locator('main').evaluate(e => e.inert), true);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('main').evaluate(e => e.inert), false);
      }
    }
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 480, height: 900 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await page.goto(base);
      await page.locator('[data-preview]').first().click();
      const dialog = page.locator('#content-preview');
      assert.equal(await dialog.evaluate(e => e.scrollWidth > e.clientWidth + 1), false);
      if (viewport.width <= 767 || viewport.height <= 500) {
        assert.equal(await dialog.locator('.itinerary-card').evaluate(e => getComputedStyle(e).zoom), '1');
        assert.ok(await dialog.locator('.timeline strong').first().evaluate(e => parseFloat(getComputedStyle(e).fontSize)) >= 16);
        await dialog.evaluate(e => { e.scrollTop = e.scrollHeight; });
        assert.ok(await dialog.locator('.preview-close').evaluate(e => { const r=e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }));
        await dialog.locator('.preview-close').click();
        assert.equal(await page.locator('[data-preview]').first().evaluate(e => e === document.activeElement), true);
        await page.locator('.bio-more-button').click();
        await page.locator('#bio-dialog').evaluate(e => { e.scrollTop = e.scrollHeight; });
        await page.locator('.bio-dialog-close').click();
        await page.locator('[data-service-contact="road"]').click();
        await page.waitForFunction(() => document.querySelector('input[name="nome"]') === document.activeElement);
        await page.waitForFunction(() => { const r=document.querySelector('input[name="nome"]').getBoundingClientRect(); return r.top >= document.querySelector('#main-header').getBoundingClientRect().bottom && r.bottom <= innerHeight; });
        await page.locator('#mobile-departure-date').fill('2027-04-12');
        assert.equal(await page.locator('#departure-date').inputValue(), '12/04/2027');
        assert.equal(await page.locator('.mobile-date-display').textContent(), '12/04/2027');
        await page.locator('.travelers-plus').click();
        assert.equal(await page.locator('#traveler-count').inputValue(), '2');
        const radio = page.locator('input[name="servizio"]').first();
        await radio.locator('..').click();
        assert.equal(await radio.isChecked(), true);
        assert.equal(await page.locator('#mobile-service-description').isVisible(), true);
        assert.equal(await page.locator('#mobile-service-description').textContent(), await page.locator('#help-full-immersion').textContent());
        assert.equal(await page.locator('.back-to-top').isVisible(), false);
      } else await page.keyboard.press('Escape');
      await page.locator('#mobile-menu-toggle').click();
      for (const link of await page.locator('#primary-nav a').all()) {
        await link.scrollIntoViewIfNeeded();
        assert.ok(await link.evaluate(e => { const r=e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }));
      }
      await page.keyboard.press('Escape');
    }
    await page.setViewportSize({width:390,height:844}); await page.goto(base);
    assert.equal(await page.locator('.panorama-hero-slide').count(), 3);
    assert.equal(await page.locator('[data-hero-prev], [data-hero-next], [data-hero-pause]').count(), 0);
    const firstHeroSource = await page.locator('.panorama-hero-slide.is-active img').evaluate(e => e.currentSrc);
    await page.waitForFunction(first => document.querySelector('.panorama-hero-slide.is-active img').currentSrc !== first, firstHeroSource, { timeout: 8000 });
    assert.match(await page.locator('.panorama-hero-slide.is-active img').evaluate(e => e.currentSrc), /assets\/mobile\/hero-sunset-mobile-/);
    await page.locator('.stories-next').click();
    assert.equal(await page.locator('.stories-slide.is-active').getAttribute('id'), 'story-bali');
    assert.equal(await page.locator('.mobile-stories-dots').count(), 0);
    await page.locator('#stories-track').dispatchEvent('pointerdown', {pointerType:'touch',pointerId:1,clientX:280,clientY:200});
    await page.locator('#stories-track').dispatchEvent('pointerup', {pointerType:'touch',pointerId:1,clientX:100,clientY:205});
    assert.equal(await page.locator('.stories-slide.is-active').getAttribute('id'), 'story-singapore');
    const bio = page.locator('.bio-portrait'); await bio.scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.bio-portrait-photo').count(), 1);
    assert.equal(await page.locator('.bio-slideshow-controls').count(), 0);
    assert.match(await page.locator('.bio-portrait-photo').getAttribute('href'), /assets\/mobile\/elisa-cocco-ristorante-retouched-/);
    await page.locator('#mobile-departure-date').fill('2027-04-12');
    await page.locator('#contact-form').evaluate(form => form.reset());
    await page.waitForFunction(() => document.querySelector('.mobile-date-display').textContent === 'Quando pensi di partire?');
    assert.equal(await page.locator('#departure-date').inputValue(), '');
    // Mobile keeps introductions short while preserving the original desktop content.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => document.querySelector('.bio-copy').children.length === 3);
    const readDesktopCopy = () => page.evaluate(() => ['.bio-copy', '.bio-dialog-copy', '#stories-track', ...Array.from(document.querySelectorAll('.travel-service-content')).map((_, i) => `.travel-service:nth-child(${i + 1}) .travel-service-content`)].map(selector => document.querySelector(selector).innerHTML));
    const desktopCopy = await readDesktopCopy();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('.bio-copy').children.length === 1);
    assert.equal(await page.locator('.bio-contacts').isVisible(), false);
    assert.equal(await page.locator('.travel-services-intro').isVisible(), false);
    assert.equal(await page.locator('.travel-service-prefix').first().isVisible(), false);
    assert.equal(await page.locator('#blog .stories-subtitle').isVisible(), false);
    await page.locator('.bio-more-button').click();
    assert.match(await page.locator('.bio-dialog-copy').innerText(), /Il mio obiettivo come Travel Designer/);
    assert.match(await page.locator('.bio-dialog-copy').innerText(), /Che tu voglia affidarmi/);
    await page.locator('.bio-dialog-close').click();
    for (const trigger of await page.locator('.mobile-service-more').all()) {
      const card = trigger.locator('xpath=ancestor::article');
      const height = await card.evaluate(node => node.getBoundingClientRect().height);
      const text = await card.locator('.travel-service-details > p').allTextContents();
      await trigger.focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#content-preview').evaluate(dialog => dialog.open), true);
      assert.deepEqual(await page.locator('.service-preview-copy > p').allTextContents(), text);
      assert.equal(await card.evaluate(node => node.getBoundingClientRect().height), height, 'Opening details must not grow the mobile card');
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('#content-preview').evaluate(dialog => dialog.contains(document.activeElement)), true);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('#content-preview').classList.contains('is-service-preview'));
      assert.equal(await trigger.evaluate(node => node === document.activeElement), true);
    }
    // Resizing while the mobile modal is open restores the desktop popup triggers.
    await page.locator('.mobile-service-more').first().click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => document.querySelector('.bio-copy').children.length === 3);
    assert.equal(await page.locator('#content-preview').evaluate(dialog => dialog.open), false);
    assert.equal(await page.locator('.mobile-service-more').count(), 2);
    assert.deepEqual(await readDesktopCopy(), desktopCopy, 'Original desktop copy and placement must be restored exactly');
    assert.deepEqual(errors, []);
    console.log('PASS: 7 pages × 8 smartphone widths, landscape, 44px controls, menu, readable scrolling dialogs, focused form, native date, traveler stepper, service explanations, responsive images and swipe.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
