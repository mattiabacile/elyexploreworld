import { parse, valueFromASTUntyped } from './vendor/graphql.js';

const REPO = 'mattiabacile/elyexploreworld';
const [OWNER, NAME] = REPO.split('/');
const COOKIE = '__Host-ely_cms';
const DURATION = 8 * 60 * 60;
const encoder = new TextEncoder();
const hex = bytes => [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
const random = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const hash = async value => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
const equal = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
};
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow'
};
const json = (data, status = 200, extra = {}) => Response.json(data, {status, headers: {...headers, ...extra}});
const cookie = (token, seconds = DURATION) => `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${seconds}`;
const trusted = request => {
  const origin = new URL(request.url).origin;
  const received = request.headers.get('Origin');
  if (received && received !== origin) return false;
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') return false;
  return ['GET', 'HEAD'].includes(request.method) || received === origin;
};
const ready = env => !!(env.CMS_DB && env.CMS_SECRET?.length >= 32 && (env.CMS_GITHUB_TOKEN || env.CMS_GITHUB_APP_ID && env.CMS_GITHUB_INSTALLATION_ID && env.CMS_GITHUB_PRIVATE_KEY));
let appAccess;
const base64URL = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
export async function publishingToken(env) {
  if (env.CMS_GITHUB_TOKEN) return env.CMS_GITHUB_TOKEN;
  if (appAccess?.installation === env.CMS_GITHUB_INSTALLATION_ID && appAccess.expires > Date.now() + 60000) return appAccess.token;
  const now = Math.floor(Date.now() / 1000);
  const header = base64URL(encoder.encode(JSON.stringify({alg: 'RS256', typ: 'JWT'})));
  const payload = base64URL(encoder.encode(JSON.stringify({iat: now - 60, exp: now + 540, iss: env.CMS_GITHUB_APP_ID})));
  const pem = env.CMS_GITHUB_PRIVATE_KEY.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), character => character.charCodeAt(0)), {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['sign']);
  const signature = base64URL(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(header + '.' + payload)));
  const response = await fetch('https://api.github.com/app/installations/' + encodeURIComponent(env.CMS_GITHUB_INSTALLATION_ID) + '/access_tokens', {
    method: 'POST',
    headers: {Authorization: 'Bearer ' + header + '.' + payload + '.' + signature, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'ElyExploreWorld-CMS', 'X-GitHub-Api-Version': '2022-11-28'},
    body: JSON.stringify({repositories: [NAME], permissions: {contents: 'write'}}),
    // Workers supports manual redirects; reject non-success responses below.
    redirect: 'manual'
  });
  if (!response.ok) throw new Error('Publishing connection unavailable');
  const data = await response.json();
  if (!data.token || !data.expires_at || data.permissions?.contents !== 'write') throw new Error('Invalid publishing connection');
  appAccess = {token: data.token, expires: Date.parse(data.expires_at), installation: env.CMS_GITHUB_INSTALLATION_ID};
  return data.token;
}

export async function passwordHash(password, salt, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password + '\0' + secret), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 100000}, key, 256));
}
async function readJSON(request, max = 8192) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new Error('json');
  if (Number(request.headers.get('Content-Length')) > max) throw new Error('size');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('body');
  let size = 0; const chunks = [];
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {await reader.cancel(); throw new Error('size');}
    chunks.push(value);
  }
  const data = new Uint8Array(size);let offset = 0;
  for (const chunk of chunks) {data.set(chunk, offset);offset += chunk.length;}
  return JSON.parse(new TextDecoder().decode(data));
}
async function limited(request, env) {
  const now = Math.floor(Date.now() / 1000);
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const key = await hash(ip + '\0' + env.CMS_SECRET);
  const increment = value => env.CMS_DB.prepare(`
    INSERT INTO cms_attempts(key,count,resets_at) VALUES (?,1,?)
    ON CONFLICT(key) DO UPDATE SET
      count=CASE WHEN resets_at<=? THEN 1 ELSE count+1 END,
      resets_at=CASE WHEN resets_at<=? THEN excluded.resets_at ELSE resets_at END
    RETURNING count,resets_at
  `).bind(value, now + 900, now, now).first();
  const global = await increment('all');
  const blocked = global.count > 60 || (await increment(key)).count > 10;
  if (!blocked) await env.CMS_DB.prepare('DELETE FROM cms_attempts WHERE resets_at<=?').bind(now).run();
  return blocked ? json({message: 'Troppi tentativi. Attendi 15 minuti e riprova.'}, 429, {'Retry-After': '900'}) : null;
}
async function session(request, env) {
  const token = request.headers.get('Cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const tokenHash = await hash(token);
  const row = await env.CMS_DB.prepare('SELECT csrf,expires_at FROM cms_sessions WHERE token_hash=? AND expires_at>?').bind(tokenHash, Math.floor(Date.now() / 1000)).first();
  if (!row) return null;
  const admin = await env.CMS_DB.prepare('SELECT username FROM cms_admin WHERE id=1').first();
  return admin ? {...row, username: admin.username, tokenHash} : null;
}
async function startSession(env, username) {
  const token = random(), csrf = random(), expires = Math.floor(Date.now() / 1000) + DURATION;
  await env.CMS_DB.batch([
    env.CMS_DB.prepare('DELETE FROM cms_sessions WHERE expires_at<=?').bind(Math.floor(Date.now() / 1000)),
    env.CMS_DB.prepare('INSERT INTO cms_sessions(token_hash,csrf,expires_at) VALUES (?,?,?)').bind(await hash(token), csrf, expires)
  ]);
  return json({username, token: csrf, expiresAt: expires}, 200, {'Set-Cookie': cookie(token)});
}
// Sveltia retains Unicode and typographic apostrophes in generated filenames.
// Keep those uploads within a single safe basename and the image allowlist.
const writable = path => typeof path === 'string' && (['content/stories.json', 'content/tags.json', 'content/categories.json', 'content/placement.json'].includes(path) || /^assets\/uploads\/[^/\\<>:"|?*#%\s\u0000-\u001f\u007f]+\.(?:webp|jpe?g|png|avif|gif)$/iu.test(path) && !path.split('/').at(-1).startsWith('.'));

export function validateGraphQL(body) {
  if (!body || typeof body.query !== 'string' || body.query.length > 128000) return false;
  let document;
  try {document = parse(body.query, {maxTokens: 20000});} catch {return false;}
  const operations = document.definitions.filter(node => node.kind === 'OperationDefinition');
  if (operations.length !== 1 || document.definitions.some(node => node.kind !== 'OperationDefinition')) return false;
  const operation = operations[0]; const fields = operation.selectionSet.selections;
  if (!fields.length || fields.some(field => field.kind !== 'Field')) return false;
  const variables = body.variables || {};
  if (operation.operation === 'query') {
    return fields.every(field => {
      if (field.name.value !== 'repository') return false;
      const args = Object.fromEntries((field.arguments || []).map(arg => [arg.name.value, valueFromASTUntyped(arg.value, variables)]));
      return args.owner === OWNER && args.name === NAME;
    });
  }
  if (operation.operation !== 'mutation' || fields.length !== 1 || fields[0].name.value !== 'createCommitOnBranch') return false;
  const inputArg = fields[0].arguments?.find(arg => arg.name.value === 'input');
  const input = inputArg && valueFromASTUntyped(inputArg.value, variables);
  if (!input || input.branch?.repositoryNameWithOwner !== REPO || input.branch?.branchName !== 'main' || input.branch?.id) return false;
  if (!/^[0-9a-f]{40}$/.test(input.expectedHeadOid || '')) return false;
  const additions = input.fileChanges?.additions || [], deletions = input.fileChanges?.deletions || [];
  if (!Array.isArray(additions) || !Array.isArray(deletions) || !additions.length && !deletions.length) return false;
  if (additions.length + deletions.length > 100) return false;
  return additions.every(file => file && writable(file.path) && typeof file.contents === 'string' && /^[A-Za-z0-9+/]*={0,2}$/.test(file.contents)) && deletions.every(file => file && writable(file.path));
}
async function proxy(request, env, active) {
  const token = request.headers.get('Authorization')?.replace(/^(?:Bearer|token) /i, '');
  if (!equal(token, active.csrf)) return json({message: 'Accesso non valido.'}, 401);
  const url = new URL(request.url);let target, body;
  const profile = {id: 1, name: active.username, login: active.username, email: null, avatar_url: '', html_url: url.origin + '/admin/'};
  if (url.pathname === '/cms/api/v3/user' && request.method === 'GET') return json(profile);
  if (url.pathname === '/cms/api/graphql' && request.method === 'POST') {
    const payload = await readJSON(request, 20 * 1024 * 1024);
    if (!validateGraphQL(payload)) return json({message: 'Operazione non consentita.'}, 403);
    target = 'https://api.github.com/graphql';body = JSON.stringify(payload);
  } else {
    const prefix = '/cms/api/v3/repos/' + REPO;
    const endpoint = url.pathname.slice(prefix.length);
    if (request.method !== 'GET' || !url.pathname.startsWith(prefix) || !/^(?:|\/git\/(?:trees|blobs)\/[\w-]+|\/branches\/main|\/contents(?:\/[^?]*)?|\/commits(?:\/[\w-]+)?|\/deployments(?:\/[\d]+\/statuses)?)$/.test(endpoint)) return json({message: 'Operazione non consentita.'}, 403);
    target = 'https://api.github.com/repos/' + REPO + endpoint + url.search;
  }
  const upstream = await fetch(target, {
    method: request.method,
    headers: {'Authorization': 'Bearer ' + await publishingToken(env), 'User-Agent': 'ElyExploreWorld-CMS', 'Accept': request.headers.get('Accept') || 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28'},
    body,
    redirect: 'manual'
  });
  if (upstream.status >= 300 && upstream.status < 400) throw new Error('Unexpected publishing redirect');
  const outputHeaders = new Headers(headers);
  for (const key of ['content-type', 'etag', 'x-ratelimit-remaining', 'retry-after']) if (upstream.headers.has(key)) outputHeaders.set(key, upstream.headers.get(key));
  // Keep API pagination on this origin rather than exposing the publishing credential.
  const link = upstream.headers.get('Link');
  if (link) outputHeaders.set('Link', link.replaceAll('https://api.github.com/', url.origin + '/cms/api/v3/'));
  if (upstream.ok && !env.CMS_GITHUB_TOKEN && url.pathname === '/cms/api/v3/repos/' + REPO) {
    const repository = await upstream.json();
    if (repository.full_name !== REPO) throw new Error('Unexpected publishing repository');
    // Installation tokens do not describe a human user's push permission.
    // Report the editor's capability after minting a contents-write token;
    // every write still passes the repository, branch and file restrictions.
    repository.permissions = {...repository.permissions, push: true, pull: true};
    return json(repository);
  }
  return new Response(upstream.body, {status: upstream.status, headers: outputHeaders});
}

export async function handleCMS({request, env}) {
  if (!trusted(request)) return json({message: 'Richiesta non consentita.'}, 403);
  const route = new URL(request.url).pathname;
  if (route === '/cms/status' && request.method === 'GET') {
    if (!ready(env)) return json({configured: false, hasAccount: false});
    const admin = await env.CMS_DB.prepare('SELECT username FROM cms_admin WHERE id=1').first();
    return json({configured: true, hasAccount: !!admin});
  }
  if (!ready(env)) return json({message: 'Il pannello deve essere attivato dal gestore del sito.'}, 503);
  try {
    if (['/cms/login', '/cms/setup'].includes(route) && request.method === 'POST') {
      const rate = await limited(request, env);if (rate) return rate;
      const data = await readJSON(request);
      const username = typeof data.username === 'string' ? data.username.trim() : '';
      const password = typeof data.password === 'string' ? data.password : '';
      if (!/^[a-zA-Z0-9._-]{3,50}$/.test(username) || password.length < 14 || password.length > 256) return json({message: route === '/cms/setup' ? 'Usa un nome di almeno 3 caratteri e una password di almeno 14 caratteri.' : 'Nome utente o password non corretti.'}, 400);
      const admin = await env.CMS_DB.prepare('SELECT * FROM cms_admin WHERE id=1').first();
      if (route === '/cms/setup') {
        if (admin || !equal(data.setupKey, env.CMS_SECRET)) return json({message: 'Attivazione non consentita.'}, 403);
        const salt = random();const encoded = await passwordHash(password, salt, env.CMS_SECRET);
        const result = await env.CMS_DB.prepare('INSERT OR IGNORE INTO cms_admin(id,username,password_hash,salt,created_at) VALUES (1,?,?,?,?)').bind(username, encoded, salt, Math.floor(Date.now() / 1000)).run();
        if (result.meta.changes !== 1) return json({message: 'Il pannello è già stato attivato.'}, 409);
      } else {
        const encoded = await passwordHash(password, admin?.salt || 'invalid-account-salt', env.CMS_SECRET);
        if (!admin || !equal(username, admin.username) || !equal(encoded, admin.password_hash)) return json({message: 'Nome utente o password non corretti.'}, 401);
      }
      return await startSession(env, username);
    }
    const active = await session(request, env);
    if (!active) return json({message: 'Accedi al pannello.'}, 401);
    if (route === '/cms/session' && request.method === 'GET') return json({username: active.username, token: active.csrf, expiresAt: active.expires_at});
    if (route === '/cms/logout' && request.method === 'POST') {
      if (!equal(request.headers.get('Authorization'), 'Bearer ' + active.csrf)) return json({message: 'Richiesta non consentita.'}, 403);
      await env.CMS_DB.prepare('DELETE FROM cms_sessions WHERE token_hash=?').bind(active.tokenHash).run();
      return json({ok: true}, 200, {'Set-Cookie': cookie('', 0)});
    }
    if (route.startsWith('/cms/api/')) return await proxy(request, env, active);
    return json({message: 'Pagina non trovata.'}, 404);
  } catch (error) {
    // Return only the exception type, never credentials or upstream payloads.
    return json({message: 'Impossibile completare la richiesta. Riprova tra poco.', code: error.name}, 503);
  }
}
