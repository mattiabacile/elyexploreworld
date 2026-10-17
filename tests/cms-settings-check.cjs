// Real CMS persistence in isolated browser storage, followed by public behavior.
// Web3Forms requests are intercepted; no messages or settings are published.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.SITE_URL||'http://localhost:4173',root=path.resolve(__dirname,'..');
const key='12345678-1234-1234-1234-123456789abc',url='https://calendly.com/elyexploreworld/consulenza-test?month=2027-04';
const defaults=JSON.parse(fs.readFileSync(path.join(root,'content/settings.json')));
const fillContact=async page=>{
 await page.locator('input[name=nome]').fill('Verifica locale');
 await page.locator('input[name=email]').fill('audit@example.invalid');
 await page.locator('input[name=destinazione]').fill('Bali');
 await page.locator('textarea').fill('Prova locale senza invio reale.');
 await page.locator('.contact-option-grid > label').first().click();
};
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 try{
  for(const width of [1440,390]){
   const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   const files=Object.fromEntries(['stories','tags','categories','placement','settings'].map(name=>[name+'.json',fs.readFileSync(path.join(root,'content',name+'.json'),'utf8')]));
   await page.addInitScript(files=>{window.showDirectoryPicker=async()=>{
    const dir=await navigator.storage.getDirectory();await dir.getDirectoryHandle('.git',{create:true});
    const content=await dir.getDirectoryHandle('content',{create:true});
    for(const [name,text] of Object.entries(files)){const stream=await(await content.getFileHandle(name,{create:true})).createWritable();await stream.write(text);await stream.close();}
    return dir;
   };},files);
   await page.goto(base+'/admin/?local=1');await page.getByRole('button',{name:/Lavora con Repository Locale/}).click();
   const open=async()=>{
    if(!await page.getByText('Contatti e consulenza',{exact:true}).filter({visible:true}).count())await page.getByText('Impostazioni sito',{exact:true}).filter({visible:true}).first().click();
    await page.getByText('Contatti e consulenza',{exact:true}).filter({visible:true}).first().click();
    await page.getByLabel('Chiave Web3Forms',{exact:true}).waitFor();
   };
   const saved=()=>page.evaluate(async()=>{const dir=await(await navigator.storage.getDirectory()).getDirectoryHandle('content');return JSON.parse(await(await(await dir.getFileHandle('settings.json')).getFile()).text());});
   const save=async()=>{await page.getByRole('button',{name:'Salva',exact:true}).click();await page.locator('.content-editor').waitFor({state:'detached'});};
   await open();
   assert.equal(await page.locator('.ely-mode-switch,.ely-page-settings,.ely-workspace-switch,.ely-save-bar').count(),0);
   assert.equal(await page.getByLabel('Link consulenza Calendly',{exact:true}).inputValue(),defaults.calendlyUrl);
   await page.getByLabel('Chiave Web3Forms',{exact:true}).fill(key);
   await page.getByLabel('Link consulenza Calendly',{exact:true}).fill(url);
   if(process.env.SCREENSHOT_DIR){fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});await page.waitForTimeout(500);await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'settings-'+width+'.png'),animations:'disabled'});}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await save();let settings=await saved();assert.deepEqual(settings,{web3formsAccessKey:key,calendlyUrl:url});
   await open();assert.equal(await page.getByLabel('Chiave Web3Forms',{exact:true}).inputValue(),key);
   assert.equal(await page.getByLabel('Link consulenza Calendly',{exact:true}).inputValue(),url);
   await page.getByLabel('Link consulenza Calendly',{exact:true}).fill('https://calendly.com.evil.example/event');
   await page.getByRole('button',{name:'Salva',exact:true}).click();await page.waitForTimeout(250);
   assert.equal(await page.locator('.content-editor').count(),1);assert.deepEqual(await saved(),settings);
   await page.getByLabel('Link consulenza Calendly',{exact:true}).fill(url);
   await page.getByLabel('Chiave Web3Forms',{exact:true}).fill('not-a-web3forms-key');
   await page.getByRole('button',{name:'Salva',exact:true}).click();await page.waitForTimeout(250);
   assert.equal(await page.locator('.content-editor').count(),1);assert.deepEqual(await saved(),settings);
   await page.getByLabel('Chiave Web3Forms',{exact:true}).fill('');await save();
   assert.equal((await saved()).web3formsAccessKey||'','');
   await open();await page.getByLabel('Chiave Web3Forms',{exact:true}).fill(key);await save();settings=await saved();
   await context.route('**/content/settings.json',route=>route.fulfill({json:settings}));
   await context.route('https://calendly.com/**',route=>route.fulfill({contentType:'text/html',body:'<title>Prenotazione di prova</title>'}));
   const book=async link=>{const opened=page.waitForEvent('popup');await link.click();const popup=await opened;await popup.waitForLoadState();assert.equal(popup.url(),url);await popup.close();};
   let submissions=0;
   await context.route('https://api.web3forms.com/submit',route=>{submissions++;assert.equal(route.request().postDataJSON().access_key,key);return route.fulfill({json:{success:true}});});
   await page.goto(base+'/');await page.waitForFunction(key=>document.querySelector('input[name=access_key]').value===key,key);
   assert.deepEqual(await page.locator('[data-calendly]').evaluateAll(nodes=>nodes.map(node=>node.href)),[url,url]);
   await book(page.locator('.consultation-button'));await book(page.locator('.travel-service-consultation [data-calendly]'));
   await page.locator('.mobile-service-more').first().click();
   assert.equal(await page.locator('#content-preview [data-calendly]').getAttribute('href'),url);await book(page.locator('#content-preview [data-calendly]'));await page.keyboard.press('Escape');
   await fillContact(page);await page.locator('#contact-form button[type=submit]').click();
   await page.waitForFunction(()=>document.querySelector('#contact-status').textContent.startsWith('Messaggio inviato.'));
   assert.equal(submissions,1);assert.deepEqual(errors,[]);await context.close();
   console.log('PASS: settings edit/save/reopen, validation, empty key, every Calendly link and form submission at '+width+'px.');
  }
  // A submission and an already-open service popup must wait for initial settings.
  const page=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));let release,submissions=0;
  await page.route('**/content/settings.json',async route=>{await new Promise(resolve=>release=resolve);await route.fulfill({json:{web3formsAccessKey:key,calendlyUrl:url}});});
  await page.route('https://api.web3forms.com/submit',route=>{submissions++;assert.equal(route.request().postDataJSON().access_key,key);return route.fulfill({json:{success:true}});});
  await page.goto(base+'/');await page.locator('.mobile-service-more').first().click();
  assert.equal(await page.locator('#content-preview [data-calendly]').getAttribute('href'),defaults.calendlyUrl);
  await page.keyboard.press('Escape');await fillContact(page);
  await page.locator('#contact-form').evaluate(form=>{for(let i=0;i<2;i++)form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
  assert.equal(submissions,0);assert.equal(await page.locator('#contact-form button[type=submit]').isDisabled(),true);
  await page.locator('.mobile-service-more').first().click();
  release();await page.waitForFunction(()=>document.querySelector('#contact-status').textContent.startsWith('Messaggio inviato.'));
  assert.equal(submissions,1);assert.equal(await page.locator('#content-preview [data-calendly]').getAttribute('href'),url);await page.keyboard.press('Escape');
  await page.locator('.mobile-service-more').first().click();assert.equal(await page.locator('#content-preview [data-calendly]').getAttribute('href'),url);await page.keyboard.press('Escape');
  await page.unroute('**/content/settings.json');let mode='failed';
  await page.route('**/content/settings.json',route=>route.fulfill({status:mode==='failed'?503:200,json:{web3formsAccessKey:key,calendlyUrl:url}}));
  await page.goto(base+'/');await page.waitForLoadState('networkidle');mode='ready';await fillContact(page);await page.locator('#contact-form button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#contact-status').textContent.startsWith('Messaggio inviato.'));assert.equal(submissions,2);
  await page.unroute('**/content/settings.json');
  for(const settings of [{web3formsAccessKey:'invalid',calendlyUrl:'javascript:alert(1)'},[]]){
   await page.route('**/content/settings.json',route=>route.fulfill({json:settings}));await page.goto(base+'/');await page.waitForLoadState('networkidle');
   assert.equal(await page.locator('.consultation-button').getAttribute('href'),defaults.calendlyUrl);
   await fillContact(page);await page.locator('#contact-form button[type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#contact-form button[type=submit]').disabled);assert.equal(submissions,2);
   await page.unroute('**/content/settings.json');
  }
  assert.deepEqual(errors,[]);await page.close();console.log('PASS: slow settings, duplicate prevention, popup freshness, failed-load retry and unsafe/malformed settings; no real submissions.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
