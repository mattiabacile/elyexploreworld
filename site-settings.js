/* Public contact settings, shared with the CMS validation. */
(() => {
  const defaults = {web3formsAccessKey: '', calendlyUrl: 'https://calendly.com/elyexploreworld/30min'};
  const source = new URL('content/settings.json', document.currentScript.src);
  const validKey = value => typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.trim());
  const calendly = value => {
    if (typeof value !== 'string') return '';
    try {
      const url = new URL(value.trim());
      return url.protocol === 'https:' && ['calendly.com', 'www.calendly.com'].includes(url.hostname) && !url.port && !url.username && !url.password && url.pathname !== '/' ? url.href : '';
    } catch { return ''; }
  };
  const normalize = value => ({
    web3formsAccessKey: validKey(value?.web3formsAccessKey) ? value.web3formsAccessKey.trim() : '',
    calendlyUrl: calendly(value?.calendlyUrl) || defaults.calendlyUrl
  });
  let current = defaults, request;
  const applyLinks = (host = document) => host.querySelectorAll('[data-calendly]').forEach(link => { link.href = current.calendlyUrl; });
  const load = () => request ??= (async () => {
    const response = await fetch(source, {cache: 'no-cache', signal: AbortSignal.timeout(8000)});
    const data = response.status === 404 ? defaults : response.ok ? await response.json() : null;
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Impostazioni non disponibili');
    current = normalize(data);
    applyLinks();
    const key = document.querySelector('#contact-form input[name="access_key"]');
    if (key) key.value = current.web3formsAccessKey;
    return current;
  })().catch(error => { request = undefined; throw error; });
  window.ElySettings = {load, normalize, validKey, calendly, applyLinks};
})();
