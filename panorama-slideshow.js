(() => {
  const hero = document.querySelector('.panorama-hero');
  const controls = document.querySelector('.panorama-slideshow-controls');
  if (!hero || !controls) return;

  const image = hero.querySelector('.panorama-hero-image');
  const count = controls.querySelector('.panorama-slide-count');
  const pause = controls.querySelector('[data-hero-pause]');
  const photos = [
    ['IMG_20230830_094751_265.jpg', 'Risaie e fiori rossi', '40% 56%', '52% 54%', 'Risaie terrazzate a Bali, con fiori rossi in primo piano'],
    ['IMG_20230830_094751_122.jpg', 'Tra le risaie', '43% 42%', '43% 46%', 'Una persona cammina tra le risaie e le palme di Bali'],
    ['IMG_20230830_094751_184.jpg', 'Terrazze nel verde', '51% 59%', '51% 58%', 'Risaie terrazzate immerse nella vegetazione tropicale'],
    ['IMG_20230830_094751_223.jpg', 'Palme e montagne', '53% 48%', '49% 51%', 'Palme e piante rosse davanti alle risaie di Bali'],
    ['IMG_20230830_094751_371.jpg', 'Il padiglione sul laghetto', '55% 54%', '54% 55%', 'Padiglione balinese e fiori di loto sul laghetto'],
    ['IMG20250815100744.jpg', 'La piscina a Bali', '51% 59%', '50% 58%', 'Piscina turchese vista attraverso una porta balinese intagliata'],
    ['IMG20250815122849.jpg', 'Il sentiero tra le palme', '50% 63%', '50% 58%', 'Sentiero che attraversa un palmeto a Bali'],
    ['IMG20250815123639.jpg', 'Le palme da cocco', '53% 38%', '52% 42%', 'Cocchi maturi su una palma in un giardino balinese'],
    ['IMG20250815122942.jpg', 'La strada nel villaggio', '52% 57%', '50% 56%', 'Sentiero nel villaggio tra palme e campi verdi'],
    ['../bali-rice-terraces.webp', 'Le risaie di Tegallalang', '50% 46%', '61% 50%', 'Risaie terrazzate e palme nella valle di Tegallalang, Bali'],
  ];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let timer;
  let paused = reduceMotion.matches;
  let request = 0;

  function schedule() {
    clearInterval(timer);
    if (!paused) timer = setInterval(() => show(current + 1), 6500);
  }

  function show(index) {
    const next = (index + photos.length) % photos.length;
    const [file, title, desktop, mobile, alt] = photos[next];
    const token = ++request;
    const preload = new Image();
    preload.onload = () => {
      if (token !== request) return;
      image.src = preload.src;
      image.alt = alt;
      image.style.setProperty('--hero-focus', desktop);
      image.style.setProperty('--hero-focus-mobile', mobile);
      count.textContent = `${next + 1} / ${photos.length} · ${title}`;
      current = next;
      schedule();
    };
    preload.onerror = () => {
      if (token !== request) return;
      count.textContent = 'Foto non disponibile';
      schedule();
    };
    preload.src = `assets/indonesia-slideshow/${file}`;
  }

  controls.querySelector('[data-hero-prev]').addEventListener('click', () => show(current - 1));
  controls.querySelector('[data-hero-next]').addEventListener('click', () => show(current + 1));
  pause.addEventListener('click', () => {
    paused = !paused;
    pause.textContent = paused ? '▶' : 'Ⅱ';
    pause.setAttribute('aria-label', paused ? 'Riprendi lo slideshow' : 'Metti in pausa lo slideshow');
    schedule();
  });
  reduceMotion.addEventListener('change', event => {
    paused = event.matches;
    pause.textContent = paused ? '▶' : 'Ⅱ';
    pause.setAttribute('aria-label', paused ? 'Riprendi lo slideshow' : 'Metti in pausa lo slideshow');
    schedule();
  });
  if (paused) {
    pause.textContent = '▶';
    pause.setAttribute('aria-label', 'Riprendi lo slideshow');
  }
  schedule();
})();

(() => {
  const banner = document.querySelector('.itinerary-preview');
  const controls = document.querySelector('.itinerary-slideshow-controls');
  if (!banner || !controls) return;

  const count = controls.querySelector('.itinerary-slide-count');
  const pause = controls.querySelector('[data-itinerary-pause]');
  const photos = [
    ['assets/nusa-penida-kelingking.jpg', 'Nusa Penida', '50% 52%', '50% 50%'],
    ['assets/indonesia-slideshow/IMG_20230830_094751_265.jpg', 'Risaie e fiori rossi', '40% 56%', '52% 54%'],
    ['assets/indonesia-slideshow/IMG_20230830_094751_122.jpg', 'Tra le risaie', '43% 42%', '43% 46%'],
    ['assets/indonesia-slideshow/IMG_20230830_094751_184.jpg', 'Terrazze nel verde', '51% 59%', '51% 58%'],
    ['assets/indonesia-slideshow/IMG_20230830_094751_223.jpg', 'Palme e montagne', '53% 48%', '49% 51%'],
    ['assets/indonesia-slideshow/IMG_20230830_094751_371.jpg', 'Il padiglione sul laghetto', '55% 54%', '54% 55%'],
    ['assets/indonesia-slideshow/IMG20250815100744.jpg', 'La piscina a Bali', '51% 59%', '50% 58%'],
    ['assets/indonesia-slideshow/IMG20250815122849.jpg', 'Il sentiero tra le palme', '50% 63%', '50% 58%'],
    ['assets/indonesia-slideshow/IMG20250815123639.jpg', 'Le palme da cocco', '53% 38%', '52% 42%'],
    ['assets/indonesia-slideshow/IMG20250815122942.jpg', 'La strada nel villaggio', '52% 57%', '50% 56%'],
  ];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let paused = reduceMotion.matches;
  let timer;
  let request = 0;

  function schedule() {
    clearInterval(timer);
    if (!paused) timer = setInterval(() => show(current + 1), 6500);
  }

  function show(index) {
    const next = (index + photos.length) % photos.length;
    const [source, title, desktop, mobile] = photos[next];
    const token = ++request;
    const preload = new Image();
    preload.onload = () => {
      if (token !== request) return;
      banner.style.setProperty('--itinerary-photo', `url("${source}")`);
      banner.style.setProperty('--itinerary-focus', desktop);
      banner.style.setProperty('--itinerary-focus-mobile', mobile);
      count.textContent = `${next + 1} / ${photos.length} · ${title}`;
      current = next;
      schedule();
    };
    preload.onerror = () => {
      if (token !== request) return;
      count.textContent = 'Foto non disponibile';
      schedule();
    };
    preload.src = source;
  }

  controls.querySelector('[data-itinerary-prev]').addEventListener('click', () => show(current - 1));
  controls.querySelector('[data-itinerary-next]').addEventListener('click', () => show(current + 1));
  pause.addEventListener('click', () => {
    paused = !paused;
    pause.textContent = paused ? '▶' : 'Ⅱ';
    pause.setAttribute('aria-label', paused ? 'Riprendi lo slideshow' : 'Metti in pausa lo slideshow');
    schedule();
  });
  reduceMotion.addEventListener('change', event => {
    paused = event.matches;
    pause.textContent = paused ? '▶' : 'Ⅱ';
    pause.setAttribute('aria-label', paused ? 'Riprendi lo slideshow' : 'Metti in pausa lo slideshow');
    schedule();
  });
  if (paused) {
    pause.textContent = '▶';
    pause.setAttribute('aria-label', 'Riprendi lo slideshow');
  }
  schedule();
})();
