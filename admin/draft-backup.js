/* Sveltia owns serialization, IndexedDB, attachments and restore. This adapter
   enables those backups for our array collection without ever invoking Save. */
(() => {
  const states = new WeakMap();
  let active = null, queue = Promise.resolve(), editor = null;
  const supports = draft => draft?.collectionName === 'racconti' && draft.collection?._file?.arrayFile;
  const report = (state, phase) => {
    state.phase = phase;
    if (state !== active) return;
    window.dispatchEvent(new CustomEvent('ely:draft-backup', {detail: {phase, savedAt: state.savedAt}}));
  };
  const update = () => {
    const status = editor?.querySelector('.ely-backup-status');
    if (!status) return;
    const {phase, savedAt} = window.elyDraftBackup.status();
    const messages = {
      ready: 'Salvataggio automatico attivo',
      pending: 'Salvataggio della bozza…',
      saved: 'Bozza salvata automaticamente' + (savedAt ? ' · ' + new Date(savedAt).toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'}) : ''),
      error: 'Bozza non salvata. Riprova o premi Salva.'
    };
    if (status.textContent !== messages[phase]) status.textContent = messages[phase];
    status.dataset.phase = phase;
    editor.querySelector('.ely-backup-retry').hidden = phase !== 'error';
  };
  const flush = state => {
    if (!state?.write || !state.draft.interacted || !state.pending) return queue;
    clearTimeout(state.timer);
    const revision = state.revision;
    state.pending = true;
    queue = queue.then(async () => {
      try {
        await state.write();
        if (revision !== state.revision) return;
        state.pending = false;
        state.savedAt = state.dirty ? Date.now() : null;
        report(state, state.dirty ? 'saved' : 'ready');
      } catch (error) {
        console.error('Salvataggio automatico della bozza:', error);
        report(state, 'error');
      }
    });
    return queue;
  };
  window.elyDraftBackup = {
    supports,
    // The array position and title can change. Use the saved article's id;
    // a new, incomplete article has a separate recovery slot.
    key: draft => supports(draft)
      ? draft.isNew ? 'ely-new-article' : 'ely-article:' + draft.originalEntry?.locales?.[draft.defaultLocale]?.content?.id
      : undefined,
    schedule(draft, write, dirty) {
      if (!draft) { active = null; return; }
      let state = states.get(draft);
      if (!state) {
        state = {draft, revision: 0, savedAt: null, phase: 'ready'};
        states.set(draft, state);
      }
      active = state;
      state.write = write;
      state.dirty = dirty;
      state.revision++;
      clearTimeout(state.timer);
      if (!write) { report(state, 'error'); return; }
      if (!draft.interacted) { report(state, 'ready'); return; }
      state.pending = true;
      report(state, 'pending');
      state.timer = setTimeout(() => flush(state), 100);
    },
    status: () => active ? {phase: active.phase, savedAt: active.savedAt} : {phase: 'ready'},
    touch: () => { if (active) active.draft.interacted = true; },
    retry: () => { if (active) { report(active, 'pending'); flush(active); } },
    beforeSave: () => flush(active),
    enhance(owner) {
      if (!owner.querySelector('section.field[data-key-path="title"]')) return;
      editor = owner;
      const save = [...owner.querySelectorAll(':scope > .primary button')].find(button => button.textContent.trim() === 'Salva');
      if (!save) return;
      save.classList.add('ely-save-button');
      save.setAttribute('aria-describedby', 'ely-backup-note');
      owner.classList.add('ely-draft-enabled');
      if (!owner.querySelector('.ely-save-bar')) {
        const bar = document.createElement('div');
        bar.className = 'ely-save-bar';
        bar.innerHTML = '<div class="ely-backup-copy"><p class="ely-backup-status" role="status" aria-live="polite"></p><p id="ely-backup-note">Bozza in questo browser. Pubblicazione solo dopo Salva.</p></div><button class="ely-backup-retry" type="button" hidden>Riprova</button>';
        bar.querySelector('button').addEventListener('click', window.elyDraftBackup.retry);
        owner.append(bar);
      }
      update();
    }
  };
  window.addEventListener('ely:draft-backup', update);
  // Flush the native snapshot when leaving or backgrounding the page. A
  // pending/error backup retains the CMS's unsaved-changes protection.
  window.addEventListener('pagehide', () => flush(active));
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(active); });
})();
