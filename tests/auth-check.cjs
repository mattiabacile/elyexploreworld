const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {pathToFileURL} = require('node:url');
(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ely-auth-test-'));
  try {
    for (const folder of ['functions', 'server']) fs.cpSync(path.join(__dirname, '..', folder), path.join(temp, folder), {recursive: true});
    fs.writeFileSync(path.join(temp, 'package.json'), '{"type":"module"}');
    const {onRequestGet} = await import(pathToFileURL(path.join(temp, 'functions/auth.js')));
    const origin = 'https://elyexploreworld.pages.dev';
    const env = {GITHUB_CLIENT_ID: 'test-client', GITHUB_CLIENT_SECRET: 'test-secret'};
    const call = (url, options = {}, settings = env) => onRequestGet({request: new Request(origin + url, options), env: settings});
    const start = await call('/auth?provider=github&site_id=elyexploreworld.pages.dev&scope=repo,user');
    assert.equal(start.status, 302);
    assert.equal(start.headers.get('Cache-Control'), 'no-store');
    const redirect = new URL(start.headers.get('Location'));
    assert.equal(redirect.origin, 'https://github.com');
    assert.equal(redirect.searchParams.get('scope'), 'public_repo');
    const state = redirect.searchParams.get('state');
    assert.match(state, /^[a-f0-9]{32}$/);
    const cookie = start.headers.get('Set-Cookie');
    for (const value of ['HttpOnly', 'SameSite=Lax', 'Secure', 'Max-Age=600']) assert.ok(cookie.includes(value));
    assert.match(await (await call('/auth?provider=github&site_id=evil.example')).text(), /UNSUPPORTED_DOMAIN/);
    assert.match(await (await call('/auth?provider=github&site_id=elyexploreworld.pages.dev', {}, {})).text(), /MISCONFIGURED_CLIENT/);
    const headers = {Cookie: cookie.split(';')[0]};
    assert.match(await (await call('/callback?code=test-code&state=wrong', {headers})).text(), /CSRF_DETECTED/);
    assert.match(await (await call('/callback?code=test-code&state=' + state)).text(), /UNSUPPORTED_BACKEND/);
    const originalFetch = global.fetch;
    let exchanges = 0;
    global.fetch = async (url, options) => {
      exchanges++;
      assert.equal(url, 'https://github.com/login/oauth/access_token');
      assert.equal(options.method, 'POST');
      assert.deepEqual(JSON.parse(options.body), {code: 'test-code', client_id: 'test-client', client_secret: 'test-secret'});
      return Response.json({access_token: 'test-access-token'});
    };
    let complete;
    try { complete = await call('/callback?code=test-code&state=' + state, {headers}); }
    finally { global.fetch = originalFetch; }
    assert.equal(exchanges, 1);
    assert.ok(complete.headers.get('Set-Cookie').includes('Max-Age=0'));
    const html = await complete.text();
    assert.ok(!html.includes('test-secret'));
    const messages = []; let listener;
    vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {
      URL,
      window: {addEventListener: (_, callback) => {listener = callback}, opener: {postMessage: (...args) => messages.push(args)}}
    });
    assert.equal(messages.length, 1);
    listener({data: 'authorizing:github', origin: 'https://elyexploreworld.pages.dev.evil.example'});
    assert.equal(messages.length, 1);
    listener({data: 'authorizing:github', origin});
    assert.equal(messages.length, 2);
    assert.equal(messages[1][1], origin);
    assert.ok(messages[1][0].includes('test-access-token'));
    console.log('PASS: public-only OAuth scope, allowed origin, CSRF protection, private secret exchange, trusted popup messages and noncached responses.');
  } finally { fs.rmSync(temp, {recursive: true, force: true}); }
})().catch(error => {console.error(error); process.exitCode = 1});
