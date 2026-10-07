const {focusField}=require('./cms-fields-helper.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url'),{DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..');
const createDB=()=>{
 const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(root,'server/cms-schema.sql'),'utf8'));
 return {db,prepare(sql){let values=[];return {bind(...args){values=args;return this},async first(){return db.prepare(sql).get(...values)||null},async run(){return {meta:{changes:Number(db.prepare(sql).run(...values).changes)}}},async all(){return {results:db.prepare(sql).all(...values)}}}},async batch(statements){db.exec('BEGIN');try{const results=await Promise.all(statements.map(s=>s.all()));db.exec('COMMIT');return results}catch(error){db.exec('ROLLBACK');throw error}}};
};
(async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ely-cms-access-')),upstream=global.fetch;
 try{
 fs.cpSync(path.join(root,'server'),path.join(temp,'server'),{recursive:true});fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
 const {handleCMS,validateGraphQL,publishingToken}=await import(pathToFileURL(path.join(temp,'server/cms-access.js')));
 const keys=require('node:crypto').generateKeyPairSync('rsa',{modulusLength:2048});
 let minted=0;
 global.fetch=async(url,options)=>{
   minted++;assert.equal(url,'https://api.github.com/app/installations/987/access_tokens');
   assert.equal(options.redirect,'manual');
   assert.deepEqual(JSON.parse(options.body),{repositories:['elyexploreworld'],permissions:{contents:'write'}});
   const jwt=options.headers.Authorization.slice(7),parts=jwt.split('.');
   assert.ok(require('node:crypto').verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),keys.publicKey,Buffer.from(parts[2],'base64url')));
   const claims=JSON.parse(Buffer.from(parts[1],'base64url'));assert.equal(claims.iss,'123');assert.ok(claims.exp-Math.floor(Date.now()/1000)<=540);
   return Response.json({token:'test-app-token',expires_at:new Date(Date.now()+3600000).toISOString(),permissions:{contents:'write'}});
 };
 const appEnv={CMS_GITHUB_APP_ID:'123',CMS_GITHUB_INSTALLATION_ID:'987',CMS_GITHUB_PRIVATE_KEY:keys.privateKey.export({type:'pkcs8',format:'pem'})};
 assert.equal(await publishingToken(appEnv),'test-app-token');assert.equal(await publishingToken(appEnv),'test-app-token');assert.equal(minted,1);
 global.fetch=upstream;
 const env={CMS_DB:createDB(),CMS_SECRET:'test-setup-secret-'.repeat(3),CMS_GITHUB_TOKEN:'test-publishing-secret'},origin='https://cms.example';
 const call=(route,{method='GET',data,headers={}}={})=>handleCMS({env,request:new Request(origin+route,{method,headers:{...(method==='POST'?{Origin:origin,'Content-Type':'application/json'}:{}),...headers},body:data===undefined?undefined:JSON.stringify(data)})});
 const input={branch:{repositoryNameWithOwner:'mattiabacile/elyexploreworld',branchName:'main'},expectedHeadOid:'a'.repeat(40),fileChanges:{additions:[{path:'content/stories.json',contents:'W10='}],deletions:[]},message:{headline:'CMS test'}};
 const mutation={query:'mutation($input:CreateCommitOnBranchInput!){createCommitOnBranch(input:$input){commit{oid}}}',variables:{input}};
 assert.equal(validateGraphQL(mutation),true);
 for(const change of [i=>i.branch.branchName='other',i=>i.branch.repositoryNameWithOwner='attacker/repo',i=>i.fileChanges.additions[0].path='index.html',i=>i.fileChanges.additions[0].path='assets/uploads/../evil.webp',i=>i.fileChanges.additions[0].path='assets/uploads/evil.svg']){const bad=structuredClone(mutation);change(bad.variables.input);assert.equal(validateGraphQL(bad),false)}
 assert.equal(validateGraphQL({query:'mutation {deleteRepository(input:{repositoryId:"x"}){clientMutationId}}'}),false);
 assert.equal(validateGraphQL({query:'query {repository(owner:"attacker",name:"other"){name}}'}),false);
 assert.equal((await call('/cms/api/v3/user')).status,401);
 assert.equal((await call('/cms/login',{method:'POST',headers:{Origin:'https://evil.example'},data:{}})).status,403);
 const account={username:'cliente',password:'a secure password for tests',setupKey:env.CMS_SECRET};
 assert.equal((await call('/cms/setup',{method:'POST',data:{...account,setupKey:'wrong'}})).status,403);
 const setup=await call('/cms/setup',{method:'POST',data:account});assert.equal(setup.status,200);
 const active=await setup.json(),cookie=setup.headers.get('Set-Cookie').split(';')[0];
 assert.ok(setup.headers.get('Set-Cookie').includes('HttpOnly; Secure; SameSite=Strict'));
 const stored=env.CMS_DB.db.prepare('SELECT * FROM cms_admin').get();assert.notEqual(stored.password_hash,account.password);assert.equal(stored.password_hash.length,64);
 assert.equal((await call('/cms/setup',{method:'POST',data:account})).status,403);
 const headers={Cookie:cookie,Authorization:'Bearer '+active.token};
 assert.equal((await call('/cms/session',{headers})).status,200);
 assert.equal((await call('/cms/api/v3/user',{headers})).status,200);
 assert.equal((await call('/cms/api/v3/user',{headers:{Cookie:cookie,Authorization:'Bearer wrong'}})).status,401);
 global.fetch=async(url,options)=>{
   assert.equal(url,'https://api.github.com/repos/mattiabacile/elyexploreworld');
   assert.equal(options.headers.Authorization,'Bearer test-app-token');
   return Response.json({full_name:'mattiabacile/elyexploreworld',permissions:{admin:false,push:false,pull:false}});
 };
 const appRepository=await handleCMS({env:{...env,CMS_GITHUB_TOKEN:undefined,...appEnv},request:new Request(origin+'/cms/api/v3/repos/mattiabacile/elyexploreworld',{headers})});
 assert.equal(appRepository.status,200);
 assert.deepEqual((await appRepository.json()).permissions,{admin:false,push:true,pull:true});
 const forwarded=[];global.fetch=async(url,options)=>{forwarded.push({url,options});return Response.json({data:{createCommitOnBranch:{commit:{oid:'b'.repeat(40)}}}})};
 assert.equal((await call('/cms/api/graphql',{method:'POST',headers,data:mutation})).status,200);
 assert.equal(forwarded[0].url,'https://api.github.com/graphql');assert.equal(forwarded[0].options.headers.Authorization,'Bearer '+env.CMS_GITHUB_TOKEN);
 assert.equal(forwarded[0].options.redirect,'manual');
 assert.equal((await call('/cms/api/graphql',{method:'POST',headers,data:{...mutation,query:'mutation {deleteRepository(input:{repositoryId:"x"}){clientMutationId}}'}})).status,403);
 assert.equal(forwarded.length,1);
 assert.equal((await call('/cms/api/v3/repos/attacker/other',{headers})).status,403);
 assert.equal((await call('/cms/api/v3/repos/mattiabacile/elyexploreworld/contents/index.html',{method:'POST',headers,data:{}})).status,403);
 assert.equal((await call('/cms/logout',{method:'POST',headers})).status,200);assert.equal((await call('/cms/session',{headers})).status,401);
 const login=await call('/cms/login',{method:'POST',data:account});assert.equal(login.status,200);
 env.CMS_DB.db.prepare('UPDATE cms_sessions SET expires_at=0').run();
 assert.equal((await call('/cms/session',{headers:{Cookie:login.headers.get('Set-Cookie').split(';')[0]}})).status,401);
 env.CMS_DB.db.prepare('DELETE FROM cms_attempts').run();
 for(let i=0;i<10;i++)assert.equal((await call('/cms/login',{method:'POST',data:{username:'cliente',password:'a wrong password for tests'}})).status,401);
 assert.equal((await call('/cms/login',{method:'POST',data:account})).status,429);
  env.CMS_DB.db.prepare('DELETE FROM cms_attempts').run();
  const {parse,valueFromASTUntyped}=await import(pathToFileURL(path.join(temp,'server/vendor/graphql.js')));
  let records=JSON.parse(fs.readFileSync(path.join(root,'content/stories.json'))),head='a'.repeat(40);
  const sources=new Map();
  for(const image of new Set(records.flatMap(s=>[s.hero,...s.chapters.map(c=>c.image)]).filter(source=>source && !/^https?:\/\//.test(source)))) sources.set(image.replace(/^\//,''),fs.readFileSync(path.join(root,image)));
  const source=()=>{sources.set('content/stories.json',Buffer.from(JSON.stringify(records)));return sources};
  const sha=value=>require('node:crypto').createHash('sha1').update(value).digest('hex');
  const blob=key=>{const data=source().get(key);return data?{__typename:'Blob',oid:sha(data),text:data.toString(),isBinary:key!=='content/stories.json',byteSize:data.length}:null};
  const commit=()=>({__typename:'Commit',oid:head,message:'CMS integration test',committedDate:new Date().toISOString(),file:({path})=>blob(path),history:()=>({nodes:[{oid:head,message:'CMS integration test',author:{name:'CMS',email:'cms@example.test',avatarUrl:'',user:{login:'cliente'}},committedDate:new Date().toISOString()}]})});
  const repository={ref:()=>({target:commit(),refUpdateRule:null}),object:({oid,expression})=>{for(const [key,value] of source())if(sha(value)===oid||expression==='main:'+key)return blob(key);return null},defaultBranchRef:{name:'main'}};
  const select=(set,value,variables)=>{
    if(value==null)return value;if(Array.isArray(value))return value.map(item=>select(set,item,variables));const output={};
    for(const field of set.selections){if(field.kind==='InlineFragment'){Object.assign(output,select(field.selectionSet,value,variables));continue}
      const key=field.name.value,args=Object.fromEntries((field.arguments||[]).map(a=>[a.name.value,valueFromASTUntyped(a.value,variables)]));
      let result=typeof value[key]==='function'?value[key](args):value[key];
      if(field.selectionSet)result=select(field.selectionSet,result,variables);output[field.alias?.value||key]=result;
    }return output;
  };
  global.fetch=async(url,options)=>{
    assert.ok(url.startsWith('https://api.github.com/'));assert.equal(options.headers.Authorization,'Bearer '+env.CMS_GITHUB_TOKEN);
    if(url.endsWith('/graphql')){
      const body=JSON.parse(options.body),operation=parse(body.query).definitions[0];
      return Response.json({data:select(operation.selectionSet,{repository,createCommitOnBranch:({input})=>{
        for(const file of input.fileChanges.additions||[])if(file.path==='content/stories.json')records=JSON.parse(Buffer.from(file.contents,'base64'));else sources.set(file.path,Buffer.from(file.contents,'base64'));
        head='b'.repeat(40);return {commit:commit()};
      }},body.variables||{})});
    }
    const endpoint=new URL(url).pathname.split('/elyexploreworld')[1];
    if(endpoint==='')return Response.json({id:1,name:'elyexploreworld',full_name:'mattiabacile/elyexploreworld',default_branch:'main',permissions:{push:true}});
    if(endpoint.startsWith('/git/trees/'))return Response.json({sha:head,truncated:false,tree:[...source()].map(([path,data])=>({path,type:'blob',sha:sha(data),size:data.length}))});
    if(endpoint.startsWith('/git/blobs/')){const id=endpoint.split('/').pop();for(const [key,data] of source())if(sha(data)===id)return options.headers.Accept.includes('raw')?new Response(data,{headers:{'Content-Type':'application/octet-stream'}}):Response.json({content:data.toString('base64'),encoding:'base64',size:data.length,sha:id});}
    if(endpoint.startsWith('/deployments'))return Response.json([]);
    return Response.json({message:'Mock endpoint not found: '+endpoint},{status:404});
  };
  const server=require('node:http').createServer(async(req,res)=>{
    try{
      const origin='http://localhost:'+server.address().port;
      let response;if(req.url.startsWith('/cms/')){
        const chunks=[];for await(const chunk of req)chunks.push(chunk);
        response=await handleCMS({env,request:new Request(origin+req.url,{method:req.method,headers:req.headers,body:chunks.length?Buffer.concat(chunks):undefined})});
      }else{
        const pathname=new URL(req.url,origin).pathname,filename=path.join(root,pathname.endsWith('/')?pathname+'index.html':pathname);
        const type=filename.endsWith('.html')?'text/html':filename.endsWith('.js')?'text/javascript':filename.endsWith('.css')?'text/css':filename.endsWith('.json')?'application/json':filename.endsWith('.webp')?'image/webp':'application/octet-stream';
        response=pathname.startsWith('/assets/uploads/')&&sources.has(pathname.slice(1))?new Response(source().get(pathname.slice(1)),{headers:{'Content-Type':'image/webp'}}):filename.startsWith(root+path.sep)&&fs.existsSync(filename)?new Response(fs.readFileSync(filename),{headers:{'Content-Type':type}}):new Response('',{status:404});
      }
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
    }catch(error){res.writeHead(500);res.end(error.message)}
  });
  await new Promise(resolve=>server.listen(0,'localhost',resolve));
  const browser=await require('playwright').chromium.launch({channel:'chrome'});
  try{
    const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:'+server.address().port+'/admin/');await page.getByRole('button',{name:'Accedi',exact:true}).waitFor();
    await page.screenshot({path:'/tmp/ely-direct-login.png'});
    await page.getByLabel('Nome utente',{exact:true}).fill(account.username);await page.getByLabel('Password',{exact:true}).fill(account.password);await page.getByRole('button',{name:'Accedi',exact:true}).click();
    await page.getByText(/Giappone: tra templi/).first().waitFor({timeout:30000});
    assert.equal(await page.getByRole('button',{name:/Accedi con.*GitHub/}).count(),0);
    await page.screenshot({path:'/tmp/ely-direct-editor.png'});
    await page.getByText(/Giappone: tra templi/).first().click();await page.getByRole('button',{name:'Pagina',exact:true}).click();await page.frameLocator('iframe.preview').getByRole('heading',{name:/Giappone: tra templi/,level:1}).click();await page.locator('section.field[data-key-path="title"] [contenteditable="true"]').fill('Giappone: accesso diretto verificato');
    await page.route('**/cms/api/graphql',route=>{if(route.request().postData()?.includes('createCommitOnBranch'))return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({errors:[{message:'Pubblicazione temporaneamente non disponibile'}]})});return route.continue();});
    await page.getByRole('button',{name:'Salva',exact:true}).click();await page.getByRole('alertdialog',{name:'Errore',exact:true}).waitFor({state:'visible'});assert.match(await page.getByRole('alertdialog').innerText(),/Pubblicazione temporaneamente non disponibile/);
    assert.equal(await page.locator('.content-editor').isVisible(),true);assert.equal(await page.locator('section.field[data-key-path="title"] [contenteditable=true]').innerText(),'Giappone: accesso diretto verificato');
    assert.equal(await page.locator('.content-editor.ely-page-mode').count(),1);assert.notEqual(records[0].title,'Giappone: accesso diretto verificato');
    await page.unroute('**/cms/api/graphql');
    await page.getByRole('alertdialog').getByRole('button',{name:'OK',exact:true}).click();
    await page.getByRole('button',{name:'Salva',exact:true}).click();
    for(let i=0;i<200&&records[0].title!=='Giappone: accesso diretto verificato';i++)await new Promise(resolve=>setTimeout(resolve,20));
    assert.equal(records[0].title,'Giappone: accesso diretto verificato');
    assert.deepEqual(errors,[]);
    await page.waitForTimeout(500);
    await page.route('**/admin/boot.js?*',route=>route.fulfill({status:503,body:'Temporarily unavailable'}));
    await page.goto('http://localhost:'+server.address().port+'/admin/');
    await page.getByRole('button',{name:'Riprova ad aprire il pannello',exact:true}).waitFor({state:'visible'});
    assert.match(await page.locator('#cms-login-status').innerText(),/caricare l’editor/);
    await page.unroute('**/admin/boot.js?*');
    await page.getByRole('button',{name:'Riprova ad aprire il pannello',exact:true}).click();
    await page.getByRole('button',{name:'Crea Nuova Voce',exact:true}).click();
    await page.locator('section.field[data-key-path="title"] [contenteditable="true"]').fill('Nuovo racconto dal pannello');
    await page.getByLabel('Destinazione',{exact:true}).fill('Portogallo');
    await page.locator('section.field[data-key-path="deck"] [contenteditable="true"]').fill('Una nuova storia creata dalla cliente.');
    await page.locator('input[type=file]').first().setInputFiles(path.join(root,records[0].hero));
    await page.getByText(/^\/assets\/uploads\//).first().waitFor();
    await focusField(page,'published');
    assert.match(await page.getByLabel('Data del racconto',{exact:true}).inputValue(),/^\d{4}-\d{2}-\d{2}$/);
    await page.getByLabel('Data del racconto',{exact:true}).fill('2026-10-06');
    await page.locator('section[data-key-path="heroAlt"]').getByLabel('Descrizione della foto',{exact:true}).fill('Una fotografia del viaggio.');
    await focusField(page,'intro');
    await page.getByRole('textbox',{name:'Apertura del racconto',exact:true}).fill('Il testo completo della nuova storia.');
    await focusField(page,'chapters');
    for(let index=0;index<3;index++){
      await page.locator('section[data-key-path="chapters"] > .field-wrapper .item-list > *').nth(index).scrollIntoViewIfNeeded();await page.waitForTimeout(150);
      const item=page.locator('section[data-key-path="chapters.'+index+'.title"] [contenteditable=true]');await item.scrollIntoViewIfNeeded();await item.fill('Capitolo '+(index+1));await page.waitForTimeout(300);
      const body=page.locator('section[data-key-path="chapters.'+index+'.body"] [contenteditable=true]');await body.scrollIntoViewIfNeeded();await body.fill('Testo del capitolo '+(index+1));await page.waitForTimeout(300);
    }
    await focusField(page,'appearance');
    const appearance=page.locator('section[data-key-path="appearance"]');
    const expandAppearance=appearance.locator(':scope > .field-wrapper button[aria-controls^="object-"][aria-expanded="false"]');
    await appearance.waitFor({state:'visible'});await appearance.locator(':scope > .field-wrapper button[aria-controls^="object-"]').waitFor();if(await expandAppearance.count())await expandAppearance.click();
    await page.getByRole('radio',{name:'Blu oceano',exact:true}).check();
    await page.getByRole('radio',{name:'Diario di viaggio',exact:true}).check();
    await page.frameLocator('iframe').locator('[data-text-style="journal"]').waitFor();
    for(const [width,height,label] of [[1440,1000,'desktop'],[390,844,'mobile']]){
      await page.setViewportSize({width,height});
      await focusField(page,'title');
      assert.equal(await page.locator('.ely-studio, .ely-editor-nav, .ely-editor-guide, .ely-editor-section').count(),0);
      await page.screenshot({path:'/tmp/ely-editor-'+label+'.png'});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.getByRole('button',{name:'Salva',exact:true}).click();
    for(let i=0;i<200&&!records.some(r=>r.title==='Nuovo racconto dal pannello');i++)await new Promise(resolve=>setTimeout(resolve,20));
    const created=records.find(r=>r.title==='Nuovo racconto dal pannello');
    assert.ok(created);assert.equal(created.chapters.length,3);assert.equal(created.chapters[2].title,'Capitolo 3');assert.equal(created.published,false);assert.equal(created.destination,'Portogallo');
    assert.match(created.id,/^[a-f0-9-]{36}$/);assert.match(created.hero,/^\/assets\/uploads\/.+\.webp$/);
    assert.ok(sources.has(created.hero.slice(1)));assert.match(created.intro,/testo completo/);
    assert.equal(created.appearance.theme,'ocean');assert.equal(created.appearance.textStyle,'journal');
    console.log('PASS: real Sveltia creates a draft with automatic ID and uploads an optimized cover through the restricted proxy.');
    assert.deepEqual(errors,[]);
    await page.route('**/cms/logout',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Riprova'})}));
    await page.getByRole('button',{name:'Esci dal pannello',exact:true}).click();
    await page.getByRole('button',{name:'Uscita non riuscita. Riprova',exact:true}).waitFor({state:'visible'});
    assert.ok(await page.evaluate(()=>localStorage.getItem('sveltia-cms.user')));
    await page.unroute('**/cms/logout');
    await page.getByRole('button',{name:'Uscita non riuscita. Riprova',exact:true}).click();await page.getByRole('button',{name:'Accedi',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>localStorage.getItem('sveltia-cms.user')),null);
    console.log('PASS: direct username/password login opens real Sveltia, edits and saves through protected proxy, and logout revokes the session.');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}

 console.log('PASS: setup/login, password hashing, secure revocable sessions, expiry, rate limiting, CSRF, repository/path restrictions and server-only publishing secret.');
 }finally{global.fetch=upstream;fs.rmSync(temp,{recursive:true,force:true})}
})().catch(error=>{console.error(error);process.exitCode=1});
