(async () => {
  const panel = document.querySelector('#cms-login');
  const form = document.querySelector('#cms-login-form');
  const status = document.querySelector('#cms-login-status');
  const button = form.querySelector('button');
  const retry=document.querySelector('#cms-retry');retry.addEventListener('click',()=>location.reload());
  const setupKey = new URLSearchParams(location.hash.slice(1)).get('setup');
  // A one-time setup key stays out of server access logs and referrer headers.
  if (setupKey) history.replaceState(null, '', location.pathname);
  let setup = false, active, exit, signingOut = false;
  const USER_KEY = 'sveltia-cms.user';
  const clear = () => {
    for (const key of [USER_KEY, 'netlify-cms-user', 'decap-cms-user']) localStorage.removeItem(key);
  };
  const request = async (path, options = {}) => {
    let response;
    try{response=await fetch('/cms/' + path, {cache: 'no-store', credentials: 'same-origin', signal:AbortSignal.timeout(15000), ...options});}
    catch(error){throw new Error(['TimeoutError','AbortError'].includes(error.name)?'La richiesta impiega troppo tempo. Riprova.':'Non riesco a collegarmi al pannello. Controlla la connessione e riprova.');}
    const data = await response.json().catch(()=>null);
    if (!response.ok || !data || typeof data!=='object') throw new Error(data?.message || 'Il pannello non è disponibile. Riprova tra poco.');
    return data;
  };
  const script = path => new Promise((resolve, reject) => {
    const node = document.createElement('script');
    const fail=()=>{clearTimeout(timer);node.remove();reject(new Error('Caricamento dell’editor non riuscito.'));};
    const timer=setTimeout(fail,30000);node.src=path;node.onload=()=>{clearTimeout(timer);resolve();};node.onerror=fail;document.body.append(node);
  });
  const loadEditor=async()=>{await script('vendor/sveltia-cms.js');await script('boot.js?v=c12444f25442');await window.elyCMSReady;};
  if (['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).get('local') === '1') {
    panel.hidden = true;clear();
    try{await loadEditor();}
    catch{panel.hidden=false;form.hidden=true;retry.hidden=false;status.textContent='Non riesco a caricare l’editor. Riprova ad aprire il pannello.';retry.focus();return;}return;
  }
  const logout = async () => {
    if (signingOut) return;
    signingOut = true;if(exit){exit.disabled=true;exit.textContent='Uscita in corso…';}
    try {await request('logout', {method: 'POST', headers: {Authorization: 'Bearer ' + active.token}});}
    catch {if(exit){exit.disabled=false;exit.textContent='Uscita non riuscita. Riprova';}else status.textContent='Non è stato possibile uscire. Riprova.';signingOut=false;return;}
    clear();location.reload();
  };
  const open = async data => {
    if(typeof data.token!=='string'||!data.token||!Number.isFinite(data.expiresAt)||data.expiresAt<=Date.now()/1000)throw new Error('Sessione non disponibile. Accedi di nuovo.');
    active = data;
    localStorage.setItem(USER_KEY, JSON.stringify({backendName: 'github', token: data.token}));
    panel.hidden = true;
    document.documentElement.dataset.cmsAccess = 'authenticated';
    try{await loadEditor();}
    catch{panel.hidden=false;form.hidden=true;retry.hidden=false;status.textContent='Non riesco a caricare l’editor. Riprova ad aprire il pannello.';retry.focus();return;}
    exit = document.createElement('button');exit.setAttribute('aria-live','polite');exit.className = 'cms-session';exit.textContent = 'Esci dal pannello';exit.addEventListener('click', logout);document.body.append(exit);
    // Sveltia's own sign-out also revokes the server session.
    const remove = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function (key) {
      remove.call(this, key);
      if (this === localStorage && key === USER_KEY && !signingOut) void logout();
    };
    const expire = () => {
      if (Date.now() / 1000 >= active.expiresAt) {signingOut = true;clear();location.reload();}
    };
    setTimeout(expire, Math.max(0, data.expiresAt * 1000 - Date.now()));
    document.addEventListener('visibilitychange', expire);
  };
  try {
    const state = await request('status');
    if (!state.configured) {clear();status.textContent = 'Il pannello è installato. Il gestore del sito deve completare l’attivazione dell’accesso.';return;}
    try { await open(await request('session'));return; } catch {clear();}
    if (!state.hasAccount) {
      if (!setupKey) {status.textContent = 'Il gestore del sito deve creare il primo accesso.';return;}
      setup = true;panel.querySelector('h1').textContent = 'Crea il tuo accesso.';
      document.querySelector('#cms-confirmation').hidden = false;
      document.querySelector('#cms-confirm').required = true;
      document.querySelector('#cms-password').autocomplete = 'new-password';
      button.textContent = 'Crea accesso';
    }
    status.textContent = '';form.hidden = false;
  } catch {status.textContent = 'Il pannello non è disponibile. Riprova tra poco.';retry.hidden=false;}
  form.addEventListener('submit', async event => {
    event.preventDefault();status.textContent = '';
    const values = new FormData(form);
    if (setup && values.get('password') !== values.get('confirm')) {status.textContent = 'Le due password non coincidono.';return;}
    button.disabled = true;button.textContent = setup ? 'Creazione dell’accesso…' : 'Accesso in corso…';
    try {
      const data = await request(setup ? 'setup' : 'login', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: values.get('username'), password: values.get('password'), ...(setup ? {setupKey} : {})})});
      form.reset();await open(data);
    } catch (error) {status.textContent = error.message;button.disabled = false;button.textContent = setup ? 'Crea accesso' : 'Accedi';}
  });
})();
