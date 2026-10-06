import authenticator from '../server/sveltia-auth.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  // This public site's login must never request access to private repositories.
  if (url.pathname === '/auth') url.searchParams.set('scope', 'public_repo');
  const response = await authenticator.fetch(new Request(url, request), {
    ...env,
    ALLOWED_DOMAINS: env.ALLOWED_DOMAINS || 'elyexploreworld.pages.dev'
  });
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  return new Response(response.body, { status: response.status, headers });
}
