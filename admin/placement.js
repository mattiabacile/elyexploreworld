/* Preferences use native CMS fields, relations, draft protection and saving. */
(() => {
  const enhance = () => {
    const editor = document.querySelector('.content-editor');
    if (!editor || !editor.classList.contains('ely-placement-editor') && !editor.querySelector('section.field[data-key-path=slideshowKind]')) return;
    editor.classList.add('ely-placement-editor');
    for (const root of editor.querySelectorAll('section.field[data-key-path=slideshow], section.field[data-key-path=archive]')) {
      const list = root.querySelector(':scope > .field-wrapper .item-list');
      const items = [...(list?.children || [])];
      items.forEach((item, index) => {
        const header = item.querySelector('.item > .header');
        if (!header) return;
        let moves = header.querySelector('.ely-placement-moves');
        if (!moves) {
          moves = document.createElement('span'); moves.className = 'ely-placement-moves';
          for (const direction of ['up', 'down']) {
            const button = document.createElement('button'); button.type = 'button'; button.dataset.direction = direction;
            button.setAttribute('aria-label', direction === 'up' ? 'Sposta prima' : 'Sposta dopo');
            button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="' + (direction === 'up' ? 'M12 20V4m-7 7 7-7 7 7' : 'M12 4v16m-7-7 7 7 7-7') + '"/></svg>';
            button.addEventListener('click', () => {
              const handle = item.querySelector('[data-action=reorder]');
              if (handle) { handle.focus({preventScroll:true}); handle.dispatchEvent(new KeyboardEvent('keydown', {key:direction === 'up' ? 'ArrowUp' : 'ArrowDown', bubbles:true, cancelable:true, composed:true})); }
            });
            moves.append(button);
          }
          header.append(moves);
        }
        moves.querySelector('[data-direction=up]').disabled = index === 0;
        moves.querySelector('[data-direction=down]').disabled = index === items.length - 1;
      });
    }
  };
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true; requestAnimationFrame(() => { scheduled = false; enhance(); });
  }).observe(document.body, { childList:true, subtree:true });
  window.ElyPlacementEditor = { register: () => {
    const { createElement: h, useState, useEffect } = CMS.React;
    const Preview = ({ entry, getCollection, getAsset }) => {
      const [records, setRecords] = useState(null), [error, setError] = useState(false);
      useEffect(() => {
        let active = true;
        getCollection('racconti').then(entries => {
          if (active) setRecords(entries.map(record => record.get('data').toJS()));
        }).catch(() => { if (active) setError(true); });
        return () => { active = false; };
      }, [getCollection]);
      const settings = entry.get('data').toJS();
      return h('div', { className: 'preview-placement' },
        h('h1', {}, 'Slideshow e archivio'),
        h('p', {}, 'Controlla la selezione prima di salvare. Foto e testi si modificano in Racconti e consigli, nella sezione Copertina.'),
        error ? h('p', { role: 'status' }, 'Non riesco a caricare l’anteprima. Chiudi e riapri questa sezione per riprovare.') :
        records === null ? h('p', { role: 'status' }, 'Caricamento degli articoli…') :
        ['slideshow', 'archive'].map(surface => {
          const selected = ElyPlacement.select(records, settings, surface);
          return h('section', { key: surface, 'data-key-path': surface, tabIndex: 0 },
            h('h2', {}, surface === 'slideshow' ? 'Slideshow nella home' : 'Tutti i racconti'),
            h('p', {}, selected.length + (selected.length === 1 ? ' articolo visibile' : ' articoli visibili')),
            selected.length ? h('ol', {}, selected.map(story => h('li', { key: story.id },
              h('img', { src: getAsset(story.hero)?.url || story.hero, alt: '', loading: 'lazy' }),
              h('div', {}, h('strong', {}, ElyArticle.plain(story.title)), h('p', {}, (story.kind === 'consiglio' ? 'Consiglio' : 'Racconto') + (story.preparing ? ' · In preparazione' : '') + ' · ' + story.destination))
            ))) : h('p', {}, surface === 'slideshow' ? 'Lo slideshow non mostrerà articoli.' : 'L’archivio non mostrerà articoli.')
          );
        })
      );
    };
    CMS.registerPreviewTemplate('placement', Preview);
  } };
})();
