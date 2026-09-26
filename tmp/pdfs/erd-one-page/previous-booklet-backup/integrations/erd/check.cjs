const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=process.env.ERD_DOC_ROOT?path.resolve(process.env.ERD_DOC_ROOT):path.resolve(__dirname,'../..');
const model=require(path.join(root,'assets/erd/model.js')),tables=new Map(model.tables.map(t=>[t.name,t]));
const pdfjsRoot=process.env.PDFJS_ROOT||'C:/Users/Eurika/AppData/Local/npm-cache/_npx/7673eca99d5dbcb2/node_modules/pdfjs-dist';
const field=(table,name)=>tables.get(table).fields.find(f=>f.name===name);
assert.equal(model.tables.length,30);assert.equal(model.tables.flatMap(t=>t.fields.filter(f=>f.ref)).length,61);
assert.deepEqual(model.pages.flatMap(p=>p.tables).sort(),model.tables.map(t=>t.name).sort());
assert(!field('USER_ACCOUNT','password_hash'));
assert(field('USER_ACCOUNT','staff_lab_id').ref.table==='LABORATORY');
assert(field('LAB_ROOM','lab_id').ref.table==='LABORATORY');
assert(field('REGULAR_SCHEDULE','weekday'));
assert(field('REQUEST_REVISION','request_type').values.includes('STUDENT_ONLY'));
assert(field('REQUEST_REVISION','activity_type').values.includes('NON_LABORATORY_ACTIVITY'));
assert(field('REQUEST_REVISION','schedule_type').values.includes('OUT_OF_SCHEDULE'));
assert.equal(field('REQUEST_REVISION','request_id').ref.table,'SERVICE_REQUEST');
assert.equal(field('RESERVATION','revision_id').ref.table,'REQUEST_REVISION');
assert.equal(field('BORROWING','reservation_id').ref.table,'RESERVATION');
assert(field('APPROVAL','revision_id').unique);
assert(!field('APPROVAL','route_order'));assert(field('APPROVAL','remarks'));assert(field('REQUEST_ITEM','item_id').nullable);
assert.equal(field('BORROWING_MEMBER','request_member_id').ref.table,'REQUEST_MEMBER');
assert.equal(field('ITEM','lab_id').ref.table,'LABORATORY');assert(field('ITEM','stock_quantity'));assert(!tables.has('FORECAST'));
const docs=fs.readFileSync(path.join(root,'Docs.html'),'utf8');
const original=path.join(root,'Docs.html');
if(fs.existsSync(original)&&!root.startsWith(path.dirname(original))){const strip=text=>text.replace(/function ErdSection\([\s\S]*?(?=function ActivityDiagramsSection\()/,'ERD_BLOCK').replace(/\{ id:"erd-appendix",[\s\S]*?\]\s*\},/,'ERD_NAV');assert.equal(strip(docs),strip(fs.readFileSync(original,'utf8')),'Non-ERD paper content is preserved exactly');}
const parserFile=process.env.ERD_JSX_PARSER||path.resolve(root,'../System/node_modules/next/dist/compiled/babel/parser.js');if(fs.existsSync(parserFile))require(parserFile).parse(docs.match(/<script type="text\/plain" id="app-source">([\s\S]*?)<\/script>/)[1],{sourceType:'script',plugins:['jsx']});
for(const id of [...model.pages.map(page=>page.id),'relations-1','relations-2','relations-3','relations-4','rules'])assert(docs.includes('"erd-detail-'+id+'"'),'Main documentation navigation includes '+id);
for(const phrase of ['Supabase is not deployed','one selected reviewer','no new entity','Both Faculty branches include Schedule'])assert(docs.includes(phrase));
const qaFolder=process.env.ERD_QA_DIR||path.join(root,'tmp/erd-qa');fs.mkdirSync(qaFolder,{recursive:true});
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.pdf':'application/pdf'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local');if(url.pathname==='/pdf-review.html')return res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><html><body style="margin:0;background:white"><canvas id="page"></canvas></body></html>');const directory=url.pathname.startsWith('/pdfjs/')?pdfjsRoot:root;const suffix=url.pathname.startsWith('/pdfjs/')?url.pathname.slice(6):url.pathname;const file=path.resolve(directory,'.'+suffix);if(!file.startsWith(path.resolve(directory)+path.sep))return res.writeHead(403).end();fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);});});
(async()=>{let browser;await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));try{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',error=>errors.push(error.message));const base='http://127.0.0.1:'+server.address().port;
 for(const filename of ['ERD.html','ERD-A4.html','ERD-PRINT.html']){await page.goto(base+'/'+filename);await page.waitForFunction(()=>window.__erdReady);assert.equal(await page.locator('[data-full-table]').count(),30);assert.equal(await page.locator('[data-field]').count(),model.tables.reduce((sum,t)=>sum+t.fields.length,0));assert.equal(await page.locator('[data-relation-row]').count(),61);assert.equal(await page.locator('[data-overview-entity]').count(),30);assert.equal(await page.locator('.erd-sheet').count(),15);await page.getByRole('combobox').selectOption('1.5');assert.equal(await page.locator('#erd-sheets').evaluate(element=>getComputedStyle(element).getPropertyValue('--erd-zoom').trim()),'1.5');}
 // Check text-to-text overlap in table rows and relationship reference pairs.
 const collisions=await page.evaluate(()=>{const issues=[],overlap=(a,b)=>Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>.6&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>.6;for(const group of document.querySelectorAll('[data-field],[data-relation-row]')){const texts=[...group.querySelectorAll('text')];for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++)if(overlap(texts[i].getBBox(),texts[j].getBBox()))issues.push([group.dataset.field||group.dataset.relationRow,texts[i].textContent,texts[j].textContent]);}return issues;});assert.deepEqual(collisions,[],'Fields and relationship labels do not collide');
 await page.goto(base+'/pdf-review.html');
 const metadata=await page.evaluate(async()=>{const pdfjs=await import('/pdfjs/build/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc='/pdfjs/build/pdf.worker.mjs';window.reviewPdf=await pdfjs.getDocument({url:'/assets/erd/erd-a4-readable.pdf',standardFontDataUrl:'/pdfjs/standard_fonts/'}).promise;return {pages:window.reviewPdf.numPages};});assert.equal(metadata.pages,15,'Actual PDF has 15 A4 pages');
 let allText='',allItems=[];
 for(let number=1;number<=metadata.pages;number++){
  const result=await page.evaluate(async number=>{const p=await window.reviewPdf.getPage(number),view=p.getViewport({scale:1.5}),canvas=document.getElementById('page');canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);await p.render({canvasContext:canvas.getContext('2d'),viewport:view}).promise;const items=(await p.getTextContent()).items;return {dimensions:p.view,text:items.map(item=>item.str).join(' '),items:items.filter(item=>item.str.trim()).map(item=>({text:item.str,x:item.transform[4],y:item.transform[5],width:item.width}))};},number);
  assert(Math.abs(result.dimensions[2]-595.28)<1&&Math.abs(result.dimensions[3]-841.89)<1,'Portrait A4 page '+number);
  for(const item of result.items)assert(item.x>=15&&item.x+item.width<=580&&item.y>=10&&item.y<=835,'PDF text within margins: '+item.text);
  allText+=' '+result.text;allItems.push({page:number,...result});await page.locator('#page').screenshot({path:path.join(qaFolder,`page-${String(number).padStart(2,'0')}.png`)});
 }
 for(const t of model.tables){assert(allText.includes(t.name),'PDF includes entity '+t.name);for(const f of t.fields)assert(allText.includes(f.name),'PDF includes field '+t.name+'.'+f.name);}
 for(const phrase of ['SERVICE_REQUEST','REQUEST_REVISION','RESERVATION','Borrowing','no academic approval','Physics Staff','Circuits Staff','exactly one','rejection','not implemented'])assert(allText.includes(phrase),'PDF process coverage: '+phrase);
 fs.writeFileSync(path.join(qaFolder,'pdf-qa.json'),JSON.stringify({pages:metadata.pages,entities:model.tables.length,attributes:model.tables.reduce((sum,t)=>sum+t.fields.length,0),relationships:61,pageDetails:allItems.map(({items,...metadata})=>metadata)},null,2));
 assert.deepEqual(errors,[]);
 console.log(`Verified all ${metadata.pages} actual PDF pages: portrait A4, complete entity/field coverage, 61 relationships, no text collisions, and non-ERD paper content preserved. PNG renders saved for visual QA.`);
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}})().catch(error=>{console.error(error);process.exitCode=1;});
