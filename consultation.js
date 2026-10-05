(() => {
  const banner = document.querySelector('.consultation-banner');
  if (!banner) return;
  const backdrop = banner.querySelector('.consultation-backdrop');
  const picker = banner.querySelector('.consultation-photo-picker');
  const label = picker.querySelector('.consultation-photo-name');
  const photos = [
    ['door', 'La porta viola', '50% 42%', '50% 45%'],
    ['city', 'Tokyo al crepuscolo', '50% 78%', '50% 72%'],
    ['blossoms', 'Ciliegi in fiore', '50% 35%', '50% 38%'],
    ['lanterns', 'Il vicolo delle lanterne', '50% 34%', '50% 35%'],
    ['bridge', 'Il laghetto con le carpe', '50% 70%', '50% 56%'],
    ['stream', 'Il ruscello nel verde', '50% 54%', '50% 58%'],
  ];
  let current = 0;
  let request = 0;
  function show(index) {
    const next = (index + photos.length) % photos.length;
    const [file, name, desktop, mobile] = photos[next];
    const token = ++request;
    const image = new Image();
    image.onload = () => {
      if (token !== request) return;
      backdrop.style.backgroundImage = `linear-gradient(90deg, rgba(22, 43, 32, .78), rgba(22, 43, 32, .62) 48%, rgba(22, 43, 32, .76)), url("${image.src}")`;
      banner.style.setProperty('--photo-position', desktop);
      banner.style.setProperty('--photo-position-mobile', mobile);
      label.textContent = `${next + 1} / ${photos.length} · ${name}`;
    };
    image.onerror = () => { if (token === request) label.textContent = 'Foto non disponibile. Prova la successiva.'; };
    image.src = `assets/consultation-japan-${file}-retouched.webp`;
    current = next;
  }
  picker.hidden = false;
  picker.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => show(current + Number(button.dataset.photoStep)));
  });
  picker.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(current + (event.key === 'ArrowRight' ? 1 : -1));
  });
})();
