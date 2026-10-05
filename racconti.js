(() => {
  document.querySelector('.archive-back')?.addEventListener('click', () => {
    const previous = document.referrer ? new URL(document.referrer, location.href) : null;
    if (previous && previous.origin === location.origin && history.length > 1) {
      history.back();
    } else {
      location.href = 'index.html#blog';
    }
  });
})();
