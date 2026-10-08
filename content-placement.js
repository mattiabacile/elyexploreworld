/* Shared placement rules for the website and the CMS preview. */
(() => {
  const select = (records, settings = {}, surface = 'slideshow') => {
    const ids = Array.isArray(settings[surface]) ? [...new Set(settings[surface].filter(id => typeof id === 'string'))] : [];
    const ranks = new Map(ids.map((id, index) => [id, index]));
    return records.filter(story => {
      if (story.published !== true) return false;
      if (settings[surface + 'Selection'] === 'selected' && !ranks.has(story.id)) return false;
      if (surface === 'slideshow') {
        if (story.preparing) return false;
        const kind = story.kind === 'consiglio' ? 'consiglio' : 'racconto';
        if (['racconto', 'consiglio'].includes(settings.slideshowKind) && kind !== settings.slideshowKind) return false;
      }
      return true;
    }).sort((a, b) => (ranks.get(a.id) ?? Infinity) - (ranks.get(b.id) ?? Infinity) || String(b.date ?? '').localeCompare(String(a.date ?? '')));
  };
  window.ElyPlacement = { select };
})();
