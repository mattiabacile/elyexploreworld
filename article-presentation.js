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
  // Short editorial fields use the same safe inline Markdown on every surface.
  const inline = (value, {links=true}={}) => {
    const clean=DOMPurify.sanitize(marked.parseInline(String(value ?? ''), {breaks:true}), {
      ALLOWED_TAGS:['strong','em','s','br','code',...(links?['a']:[])],ALLOWED_ATTR:['href','title'],ALLOW_DATA_ATTR:false
    });
    if(!links)return clean;
    const template=document.createElement('template');template.innerHTML=clean;
    template.content.querySelectorAll('a').forEach(node=>{
      const target=node.getAttribute('href') ?? '';
      if(!/^(?:https?:\/\/|mailto:|#|\/?[\w.-]+(?:[/?#]|$))/i.test(target)||target.startsWith('//'))node.removeAttribute('href');
      if(/^https?:\/\//i.test(target))node.rel='noreferrer noopener';
    });
    return template.innerHTML;
  };
  const plain = value => {
    const template=document.createElement('template');template.innerHTML=inline(value,{links:false});
    return template.content.textContent.replace(/\s+/g,' ').trim();
  };
  const heading = (value, accent) => {
    const source=String(value ?? '');
    // Older articles keep their title accent until the author edits the title.
    if(accent && source===plain(source) && source.includes(accent)){
      const index=source.lastIndexOf(accent);
      return inline(source.slice(0,index),{links:false})+'<em>'+inline(accent,{links:false})+'</em>'+inline(source.slice(index+accent.length),{links:false});
    }
    return inline(source,{links:false});
  };
  window.ElyArticle = {appearance, chapter, inline, plain, heading};
})();
