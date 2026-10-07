// Check the current service cards and their shared, scrollable previews.
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
    await page.evaluate(() => document.fonts.ready);
    for (const [width, height] of [[320,568],[390,844],[768,900],[1024,768],[1280,720],[1366,768],[1470,801],[1440,900],[1920,1080]]) {
      await page.setViewportSize({ width, height });
      await page.locator('#mobile-menu-toggle').click();
      await page.locator('#primary-nav a[href="#servizi"]').click();
      const layout = await page.locator('#servizi').evaluate(section => ({
        overflow: section.scrollWidth > section.clientWidth + 1,
        photos: [...section.querySelectorAll('.travel-service-photo')].map(photo => getComputedStyle(photo, '::before').backgroundImage),
        cards: [...section.querySelectorAll('.travel-service')].map(card => {
          const r = card.getBoundingClientRect();
          const cta = card.querySelector('.travel-service-button').getBoundingClientRect();
          return { left: r.left, right: r.right, bottom: r.bottom, ctaBottom: cta.bottom };
        })
      }));
      assert.equal(layout.overflow, false, `${width}×${height}: overflowing service section`);
      assert.ok(layout.photos[0].includes('map-hd-retouched') && layout.photos[1].includes('agenda-hd-retouched'), 'Service photographs changed');
      for (const card of layout.cards) {
        assert.ok(card.left >= 0 && card.right <= width + 1, `${width}×${height}: card is outside the screen`);
        assert.ok(card.ctaBottom <= card.bottom, `${width}×${height}: CTA is outside the card`);
      }
      for (const trigger of await page.locator('.mobile-service-more').all()) {
        await trigger.click();
        const preview = page.locator('#content-preview');
        assert.equal(await preview.evaluate(dialog => dialog.open), true);
        const popup = await preview.evaluate(dialog => {
          const rect = dialog.getBoundingClientRect();
          const close = dialog.querySelector('.preview-close').getBoundingClientRect();
          const body = dialog.querySelector('.content-preview-body');
          const card = body.querySelector('.service-preview-card');
          return { overflow: body.scrollWidth > body.clientWidth + 1, top: rect.top, bottom: rect.bottom,
            closeTop: close.top, closeBottom: close.bottom, paragraphs: card.querySelectorAll('.service-preview-copy > p').length,
            photo: getComputedStyle(card.querySelector('.travel-service-photo'), '::before').backgroundImage };
        });
        assert.equal(popup.overflow, false, `${width}×${height}: popup overflows horizontally`);
        assert.ok(popup.top >= -1 && popup.bottom <= height + 1 && popup.closeTop >= 0 && popup.closeBottom <= height, 'Popup or close control is outside the screen');
        assert.equal(popup.paragraphs, 2, 'Incomplete service explanation');
        assert.match(popup.photo, /(?:map|agenda)-hd-retouched/);
        await page.keyboard.press('Escape');
        assert.equal(await trigger.evaluate(node => node === document.activeElement), true);
      }
    }
    await page.locator('.travel-service--road .mobile-service-more').click();
    await page.locator('#content-preview [data-service-contact="road"]').click();
    await page.waitForFunction(() => document.querySelector('#contact-form input[name="nome"]') === document.activeElement);
    assert.equal(await page.locator('#content-preview').evaluate(dialog => dialog.open), false);
    assert.equal(await page.locator('input[name="servizio"]:checked').inputValue(), 'Itinerario day by day');
    assert.deepEqual(errors, []);
    console.log('PASS: service cards and complete previews at 9 mobile, tablet and desktop viewports; photographs, CTAs, focus and popup-to-form navigation.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
