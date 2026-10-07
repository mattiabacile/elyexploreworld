// Reach native virtualized fields by scrolling the form, without product shortcuts.
const keys=['title','kind','date','destination','deck','hero','heroAlt','heroCaption','intro','chapters','travelFacts','category','tags','gallery','conclusion','appearance','titleAccent','slideText','published','preparing'];
exports.focusField=async(page,key)=>{
 await page.waitForTimeout(300); // Native rich text finishes serialization before scrolling it out.
 const content=page.locator('.ely-editor-content'),section=content.locator(`section.field[data-key-path="${key}"]`);
 for(let attempt=0;attempt<80;attempt++){
  if(await section.count()){
   await section.scrollIntoViewIfNeeded();await page.waitForTimeout(75);
   const expand=section.locator(':scope > .field-wrapper button[aria-controls][aria-expanded="false"]');
   if(await section.getAttribute('data-field-type')==='object' && await expand.count())await expand.first().click();
   const control=section.locator(':scope > .field-wrapper input:not([type=file]), :scope > .field-wrapper [contenteditable=true], :scope > .field-wrapper [role=switch], :scope > .field-wrapper [role=radio], :scope > .field-wrapper textarea');
   if(await control.count()){await control.first().focus();return section;}
  }else await content.evaluate((node,{key,keys})=>{const first=node.querySelector(':scope > section.field')?.dataset.keyPath;node.scrollTop+=(keys.indexOf(key)<keys.indexOf(first)?-1:1)*node.clientHeight*.6;},{key,keys});
  await page.waitForTimeout(75);
 }
 throw new Error('Native field did not mount: '+key);
};
