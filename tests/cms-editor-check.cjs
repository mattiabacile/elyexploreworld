const {chromium}=require('playwright'), fs=require('fs'), assert=require('assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const stories=JSON.parse(fs.readFileSync(root+'/content/stories.json'));
const files={'content/stories.json':{text:JSON.stringify(stories),type:'application/json'}};
for(const source of new Set(stories.flatMap(s=>[s.hero,...s.chapters.map(c=>c.image)]).filter(Boolean)))files[source]={base64:fs.readFileSync(root+'/'+source).toString('base64'),type:'image/webp'};
(async()=>{
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
try {
await page.addInitScript(({files})=>{
 window.showDirectoryPicker=async()=>{
  const root=await navigator.storage.getDirectory();
  await root.getDirectoryHandle('.git',{create:true});
  await (await root.getDirectoryHandle('assets',{create:true})).getDirectoryHandle('uploads',{create:true});
  for(const [path,data] of Object.entries(files)){
    const parts=path.split('/');const name=parts.pop();let dir=root;
    for(const part of parts)dir=await dir.getDirectoryHandle(part,{create:true});
    const file=await dir.getFileHandle(name,{create:true});const stream=await file.createWritable();
    await stream.write(data.base64?Uint8Array.from(atob(data.base64),c=>c.charCodeAt(0)):data.text);await stream.close();
  }
  return root;
 };
},{files});
await page.goto((process.env.SITE_URL || 'http://localhost:4173') + '/admin/?local=1');await page.getByRole('button',{name:/Lavora con Repository Locale/}).click();
await page.getByText(/Giappone: tra templi/).first().waitFor({timeout:30000});await page.getByText(/Giappone: tra templi/).first().click();
await page.getByLabel('Titolo', {exact:true}).fill('Giappone: verifica editor');
await page.frameLocator('iframe').getByRole('heading', {name:'Giappone: verifica editor', exact:true}).waitFor({timeout:15000});
await page.getByRole('button',{name:'Salva',exact:true}).click();
await page.waitForFunction(async()=>{
 try {const root=await navigator.storage.getDirectory();const dir=await root.getDirectoryHandle('content');const file=await (await dir.getFileHandle('stories.json')).getFile();
 return JSON.parse(await file.text())[0].title==='Giappone: verifica editor';} catch {return false;}
});

assert.deepEqual(errors,[]);console.log('PASS: real Sveltia editor, article preview and JSON save in an isolated local repository.');

} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
