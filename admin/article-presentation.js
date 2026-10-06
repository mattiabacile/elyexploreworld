(() => {
  const choose = (value, choices, fallback) => choices.includes(value) ? value : fallback;
  const palettes = {clay: '#9f4933', forest: '#254535', ocean: '#286274'};
  const appearance = value => {
    const input = value && typeof value === 'object' ? value : {};
    const theme = choose(input.theme, Object.keys(palettes), 'clay');
    return {theme, accent: palettes[theme],
      coverFormat: choose(input.coverFormat, ['panoramic', 'landscape', 'natural'], 'panoramic'),
      coverPosition: choose(input.coverPosition, ['center', 'top', 'bottom'], 'center'),
      textStyle: choose(input.textStyle, ['modern', 'journal'], 'modern'),
      dropCap: input.dropCap !== false, showContents: input.showContents === true};
  };
  const chapter = (value, index) => ({
    layout: ['right', 'left', 'wide'].includes(value.layout) ? {right: 'opening', left: 'closing', wide: 'wide'}[value.layout] : ['opening', 'landscape', 'closing'][index % 3],
    format: choose(value.imageFormat, ['landscape', 'portrait', 'square', 'natural'], ['portrait', 'landscape', 'square'][index % 3])
  });
  window.ElyArticle = {appearance, chapter};
})();
