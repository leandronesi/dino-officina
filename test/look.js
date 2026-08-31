#!/usr/bin/env node
'use strict';
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const ROOT = path.join(__dirname, '..');
const CHROME_CHOICES = process.platform === 'win32'
  ? ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe']
  : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
const CHROME = CHROME_CHOICES.find(fs.existsSync);
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json' };
if (!CHROME) { console.log('– controllo visuale saltato: Chrome non trovato'); process.exit(0); }
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dino-officina-look-'));

const server = http.createServer((req, res) => {
  const rel = req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  const file = path.resolve(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const child = spawn(CHROME, ['--headless=new','--remote-debugging-port=0','--user-data-dir='+temp,'--no-first-run','--disable-gpu','--hide-scrollbars','--window-size=1600,900',url], { stdio:['ignore','ignore','pipe'], windowsHide:true });
  let browserWs = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { const m = chunk.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (m) browserWs = m[1]; });
  for (let i=0;i<80&&!browserWs;i++) await delay(100);
  if (!browserWs) throw new Error('Chrome non ha aperto DevTools');
  const port = new URL(browserWs).port;
  let targets=[];
  for (let i=0;i<40;i++) { targets=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json()); if(targets.some(t=>t.type==='page'))break; await delay(100); }
  const page=targets.find(t=>t.type==='page'); if(!page)throw new Error('Nessuna pagina Chrome');
  const ws=new WebSocket(page.webSocketDebuggerUrl); await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  let seq=0;const pending=new Map();
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}};
  function call(method,params){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,m=>m.error?reject(new Error(m.error.message)):resolve(m.result));ws.send(JSON.stringify({id,method,params:params||{}}));});}
  const dir=path.join(__dirname,'frames');fs.mkdirSync(dir,{recursive:true});
  async function shot(name, wait) { await delay(wait || 300); const image=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}); fs.writeFileSync(path.join(dir,name+'.png'),Buffer.from(image.data,'base64')); console.log('✓ '+name+'.png'); }
  async function run(expression){const out=await call('Runtime.evaluate',{expression,returnByValue:true});if(out.exceptionDetails)throw new Error('Setup pagina fallito');}

  await call('Page.enable');await call('Runtime.enable');await delay(700);
  await run("(function(){G.accounts.create({name:'Leo',color:G.C.green,level:1});G.accounts.create({name:'Teo',color:G.C.blue,level:2});G.go('accesso');return G.current;})()");
  await shot('accesso-profili',1200);
  await run("G.go('nuovo')");await shot('nuovo-profilo',500);
  await run("document.getElementById('profile-next-name').click();document.getElementById('profile-next-color').click();document.getElementById('profile-next-level').click()");await shot('segreto-profilo',250);

  await run("document.getElementById('profile-cancel').click();G.accounts.login(G.accounts.list()[0].id);G.save.stars=12;G.save.done={monopattino:true,gru:true,vento:true};if(document.getElementById('profile-overlay').classList.contains('on'))throw new Error('overlay profilo ancora aperto');");await shot('01-menu');
  await run("G.go('famiglie')");await shot('02-raccolte');
  await run("G.catalogOpenFamily('spazio')");await shot('03-progetti-spazio');
  await run("G.go('officina',{id:'spazio-1'});G.officinaAutoBuild(false)");await shot('04-banco-razzo');

  await run("(function(){window.__sheetPage=0;G.scene('_catalog_sheet',{draw:function(c){c.fillStyle=G.C.navy;c.fillRect(0,0,G.W,G.H);var list=G.officinaCatalog.projects.slice(window.__sheetPage*20,window.__sheetPage*20+20);list.forEach(function(p,i){var col=i%5,row=Math.floor(i/5),x=14+col*253,y=12+row*176,w=238,h=164;G.panel(x,y,w,h,G.C.cream,16);c.fillStyle=p.color;G.roundRect(x+7,y+7,w-14,112,12);c.fill();p.slots.forEach(function(q){G.drawPiece(q[0],x+w/2+(q[1]-520)*.28,y+63+(q[2]-365)*.28,.22,p.color,1,q[3]);});G.text((window.__sheetPage*20+i+1)+'. '+p.name,x+w/2,y+140,{size:16,color:G.C.ink,max:w-14});});}});G.go('_catalog_sheet');})()");
  for(let sheet=0;sheet<5;sheet++){await run('window.__sheetPage='+sheet);await shot('catalogo-'+(sheet+1),220);}

  ws.close();child.kill();server.close();
  await Promise.race([new Promise(resolve=>child.once('exit',resolve)),delay(2500)]);
  for(let i=0;i<8;i++){try{if(path.resolve(temp).startsWith(path.resolve(os.tmpdir())))fs.rmSync(temp,{recursive:true,force:true});break;}catch(e){if(i===7)console.warn('profilo Chrome temporaneo ancora occupato: '+temp);else await delay(250);}}
}
main().catch(err=>{console.error('✗ '+err.message);server.close();try{if(path.resolve(temp).startsWith(path.resolve(os.tmpdir())))fs.rmSync(temp,{recursive:true,force:true});}catch(e){}process.exit(1);});
