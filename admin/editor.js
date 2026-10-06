(() => {
  const groups = [
    ['title', 'L’essenziale', 'Titolo, destinazione e descrizione per l’archivio.'],
    ['hero', 'La copertina', 'Carica una foto e descrivi ciò che si vede.'],
    ['intro', 'Il racconto', 'Scrivi un testo breve oppure dividilo in capitoli.'],
    ['travelFacts', 'Arricchisci l’articolo', 'Informazioni pratiche, galleria e conclusione sono facoltative.'],
    ['appearance', 'Personalizza l’aspetto', 'Scegli il risultato e guardalo nell’anteprima.'],
    ['published', 'Salva e pubblica', 'Scegli se tenere una bozza o renderla visibile sul sito.']
  ];
  const field = key => document.querySelector(`section.field[data-key-path="${key}"]`);
  let scheduled = false;
  const jump = key => {
    const title = field('title');
    const content = title?.parentElement;
    const target = field(key);
    const reveal = section => {
      section.scrollIntoView({block: 'start', behavior: 'instant'});
      // Field virtualization adjusts heights after mounting and expanding.
      for (const delay of [100, 250]) setTimeout(() => {
        if (section.isConnected) section.scrollIntoView({block: 'start', behavior: 'instant'});
      }, delay);
      const control = section.querySelector('input:not([type="file"]), textarea, [contenteditable], button');
      control?.focus({preventScroll: true});
    };
    if (target) {reveal(target);return;}
    // Sveltia mounts lower fields as they enter the editor viewport.
    let pane = content;
    while (pane && pane.scrollHeight <= pane.clientHeight) pane = pane.parentElement;
    if (!pane) return;
    pane.scrollTop = pane.scrollHeight;
    let attempts = 0;
    const find = () => {
      const section = field(key);
      if (section) reveal(section);
      else if (++attempts < 20) setTimeout(find, 50);
    };
    requestAnimationFrame(find);
  };
  const enhance = () => {
    scheduled = false;
    const title = field('title');
    if (!title) return;
    const content = title.parentElement;
    content.classList.add('ely-editor-content');
    if (!content.querySelector('.ely-editor-guide')) {
      const guide = document.createElement('details');
      guide.className = 'ely-editor-guide';
      guide.innerHTML = '<summary>Come creare e pubblicare un articolo</summary><ol><li>Inserisci titolo, destinazione, introduzione breve e copertina.</li><li>Scrivi il racconto. Aggiungi capitoli o una galleria se ti servono.</li><li>Controlla l’anteprima. Lascia “Visibile sul sito” disattivato per una bozza, oppure attivalo e premi Salva per pubblicare.</li></ol><p>Puoi tornare a modificare tutto in qualsiasi momento. Il sito si aggiorna in qualche minuto dopo il salvataggio.</p>';
      const nav = document.createElement('nav');nav.className = 'ely-editor-nav';nav.setAttribute('aria-label', 'Sezioni dell’editor');
      for (const [key, label] of [['title','Inizia'],['intro','Scrivi'],['appearance','Personalizza'],['published','Pubblica']]) {
        const button = document.createElement('button');button.type = 'button';button.textContent = label;
        button.addEventListener('click', () => jump(key));nav.append(button);
      }
      content.prepend(guide, nav);
    }
    for (const [key, label, hint] of groups) {
      const section = field(key);
      if (!section || section.querySelector(':scope > .ely-editor-section')) continue;
      const heading = document.createElement('div');heading.className = 'ely-editor-section';
      const h2 = document.createElement('h2');h2.textContent = label;
      const text = document.createElement('p');text.textContent = hint;
      heading.append(h2, text);section.prepend(heading);
    }
  };
  new MutationObserver(() => {
    if (!scheduled) {scheduled = true;requestAnimationFrame(enhance);}
  }).observe(document.body, {childList: true, subtree: true});
  enhance();
})();
