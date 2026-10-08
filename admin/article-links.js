(() => {
  const slug = title => ElyArticle.plain(title).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,140).replace(/-$/,'') || 'articolo';
  // Reserve legacy identifiers too: a new title must not steal an existing URL.
  const assign = records => {
    const used=new Map(records.map(record=>[record.id,record.id]));
    const addresses=new Map();
    [...records].sort((a,b)=>a.id.localeCompare(b.id)).forEach(record=>{
      const base=slug(record.title);let candidate=base,index=2;
      while(used.has(candidate)&&used.get(candidate)!==record.id)candidate=base+'-'+index++;
      used.set(candidate,record.id);addresses.set(record.id,candidate);
    });
    return records.map(record=>({...record,publicSlug:addresses.get(record.id)}));
  };
  const href = story => 'racconto.html?story='+encodeURIComponent(story.publicSlug || slug(story.title));
  window.ElyLinks={slug,assign,href};
})();
