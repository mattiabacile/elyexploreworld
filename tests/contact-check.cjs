// Exercise submission states locally; every Web3Forms request is intercepted.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.SITE_URL || 'http://localhost:4173';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [390,1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let requests = 0;
      let mode = 'success';
      let release;
      let payload;
      await page.route('https://api.web3forms.com/submit', async route => {
        requests++;
        payload = route.request().postDataJSON();
        if (mode === 'hold') await new Promise(resolve => { release = resolve; });
        if (mode === 'offline') return route.abort('failed');
        await route.fulfill({ status: mode === 'error' ? 500 : 200, contentType: 'application/json', body: JSON.stringify({ success: mode !== 'error' }) });
      });
      await page.goto(base);
      const form = page.locator('#contact-form');
      const submit = form.locator('button[type="submit"]');
      await submit.click();
      assert.equal(requests, 0, 'Invalid form must not be submitted');
      await form.locator('input[name="nome"]').fill('Verifica locale');
      await form.locator('input[name="email"]').fill('audit@example.invalid');
      await form.locator('input[name="destinazione"]').fill('Bali');
      await form.locator('textarea').fill('Verifica del modulo, senza invio reale.');
      await form.locator('.contact-option-grid > label').nth(1).click();
      if (width === 390) {
        await page.locator('#mobile-departure-date').fill('2027-04-12');
        await page.locator('#mobile-departure-date').dispatchEvent('change');
      } else {
        await page.locator('.contact-date-trigger').click();
        await page.locator('.calendar-today').click();
      }
      await page.locator('.travelers-plus').click();
      await submit.click();
      assert.equal(requests, 0, 'Missing access key must not send a request');
      assert.match(await page.locator('#contact-status').textContent(), /non è ancora disponibile/);
      // Set a fake key in this browser only, after checking the current fallback.
      await form.locator('input[name="access_key"]').evaluate(node => { node.value = 'local-test-key'; });
      mode = 'hold';
      await submit.click();
      await page.waitForFunction(() => document.querySelector('#contact-form').getAttribute('aria-busy') === 'true');
      assert.equal(await submit.isDisabled(), true);
      await form.evaluate(node => node.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      assert.equal(requests, 1, 'Repeated submission must not send duplicate requests');
      mode = 'success';
      release();
      await page.waitForFunction(() => document.querySelector('#contact-status').textContent.startsWith('Messaggio inviato.'));
      assert.equal(payload.name, 'Verifica locale');
      assert.equal(payload.email, 'audit@example.invalid');
      assert.match(payload.message, /Destinazione: Bali/);
      assert.match(payload.message, /Viaggiatori: 2/);
      assert.match(payload.message, /Servizio: Itinerario day by day/);
      assert.equal(await form.getAttribute('aria-busy'), null);
      assert.equal(await submit.isEnabled(), true);
      for (const failure of ['error','offline']) {
        mode = failure;
        await submit.click();
        await page.waitForFunction(() => document.querySelector('#contact-status').textContent.startsWith('Non riesco a confermare'));
        assert.equal(await submit.isEnabled(), true);
        assert.equal(await form.locator('textarea').inputValue(), 'Verifica del modulo, senza invio reale.');
      }
      const sent = requests;
      await form.locator('input[name="botcheck"]').evaluate(node => { node.checked = true; });
      await submit.click();
      assert.equal(requests, sent, 'Honeypot must block submission');
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('PASS: mobile and desktop form validation, data, duplicate prevention, success, server failure, offline failure and honeypot; no real submission.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
