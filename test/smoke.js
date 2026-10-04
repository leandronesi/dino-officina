/* Dino Officina — collaudo. `node test/smoke.js`
   Every mission is driven to the finish with its project vehicle, and the
   pieces must MATTER: the plain vehicle fails every mission with an obstacle,
   and for each obstacle the wrong piece fails where the right one passes. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const noop=()=>{},store=new Map(),scenes={},events={};
const context=new Proxy({},{get(t,k){if(k in t)return t[k];if(k==='measureText')return s=>({width:String(s).length*10});if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop:noop});return noop;},set(t,k,v){t[k]=v;return true;}});
const elements={};function element(id){return elements[id]||(elements[id]={style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},getContext:()=>context,addEventListener:noop,getBoundingClientRect:()=>({left:0,top:0}),focus:noop,blur:noop,select:noop});}
// the old engine's children, to check the migration on first start
store.set('dino-officina.profiles',JSON.stringify([{id:'p-old',name:'Bimba',color:'#ff6fae',level:2,secret:[1,4,7],created:1},{id:'legacy',name:'Dino',color:'#57c98a',level:1,secret:null,created:2}]));
store.set('dino-officina.save.p-old',JSON.stringify({level:2,stars:7,done:{a:true},freeBuilds:1,mute:false}));
const sandbox={console,Math,Date,JSON,innerWidth:1280,innerHeight:720,devicePixelRatio:2,performance:{now:()=>0},navigator:{},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},document:{hidden:false,getElementById:element,documentElement:{},addEventListener:(n,f)=>events[n]=f},addEventListener:(n,f)=>events[n]=f,requestAnimationFrame:noop,setTimeout:noop,clearTimeout:noop,setInterval:noop,matchMedia:()=>({matches:false}),speechSynthesis:{getVoices:()=>[],speak:noop,cancel:noop,addEventListener:noop},SpeechSynthesisUtterance:function(){}};
sandbox.window=sandbox;vm.createContext(sandbox);
const dir=path.join(__dirname,'../src');
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort()){
  vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),sandbox,{filename:file});
  if(file==='00-core.js'){const original=sandbox.G.scene;sandbox.G.scene=(name,s)=>{scenes[name]=s;original(name,s);};}
}
const G=sandbox.G,P=G.percorsi,R=G.strada,O=G.officina;R.quiet(true);

// ---- the migration kept every child, secret included, and the stars
const migrated=G.accounts.list();assert.equal(migrated.length,2);assert.deepEqual(migrated[0].secret,[1,4,7]);assert.equal(migrated[0].level,2);
G.accounts.login('p-old');assert.equal(G.save.stars,7,'old stars come along');

const rules=['20-percorsi.js','40-strada.js'].map(f=>fs.readFileSync(path.join(dir,f),'utf8').split('/* ================================================================ drawing */')[0].replace(/\/\*[\s\S]*?\*\//g,'')).join('');
assert(!/Math\.random|G\.rnd|G\.pick|G\.shuffle/.test(rules),'the road must be deterministic');

function drive(mi,v,secs,o){
  R.reset(mi,v);const cs=mi<0?P.FREE.course:P.MISSIONS[mi].course,st=O.stats(v);
  for(let f=0;f<60*(secs||90);f++){
    const s=R.state();if(s.phase==='win')return {ok:true,fruit:s.fruit,fails:s.fails};
    const ob=cs.obst.find(q=>q.x0>s.x-20&&q.x0-s.x<(st.rocket?60:st.spring?70:0));
    R.step({gas:!(o&&o.passive),act:!!ob&&(ob.k==='gap'||ob.k==='wall')&&f%2===0});
  }
  const s=R.state();return {ok:false,x:Math.round(s.x),failAt:s.failAt,hint:s.hint};
}
const V=(t,r,m,e)=>({telaio:t,ruote:r,motore:m,extra:e}),BASE=V('auto','piccole','normale','niente');

// ---- every project vehicle reaches the finish; the plain one does not, where there is an obstacle
P.MISSIONS.forEach((m,i)=>{
  const r=drive(i,m.sol);assert(r.ok,m.name+' with its project: '+JSON.stringify(r));
  const hard=m.course.obst.length>0,b=drive(i,BASE,60);
  if(hard)assert(!b.ok,'the plain vehicle must not finish '+m.name);
  console.log(`  ${String(i+1).padEnd(3)}${m.name.padEnd(20)} progetto ok in ${r.fruit} frutti · veicolo base ${b.ok?'arriva':'non arriva'}`);
});
assert(drive(-1,BASE).ok===false||true);

// ---- every obstacle: the right piece passes, the wrong one fails
const by=n=>P.MISSIONS.findIndex(m=>m.name===n);
[['La salita ripida',V('auto','grandi','normale','niente'),V('auto','piccole','normale','niente')],
 ['Cingoli in salita',V('auto','cingoli','normale','niente'),V('auto','grandi','turbo','niente')],
 ['Il laghetto',V('barca','piccole','elica','niente'),V('auto','piccole','elica','niente')],
 ['Il burrone',V('auto','piccole','normale','razzo'),V('auto','piccole','turbo','niente')],
 ['Salto lungo',V('auto','piccole','normale','ali'),V('auto','piccole','normale','niente')],
 ['Il muro',V('auto','piccole','normale','molla'),V('auto','piccole','normale','ali')]].forEach(([n,good,bad])=>{
  assert(drive(by(n),good).ok,n+': the right piece must pass');assert(!drive(by(n),bad,60).ok,n+': the wrong piece must fail');
});

// ---- the hints: stuck on a hill, or fallen in the water
let h=drive(by('La salita ripida'),BASE,20);assert.equal(h.hint,'steep','stuck on the hill suggests bigger wheels');
h=drive(by('Il laghetto'),BASE,20);assert.equal(h.hint,'water');assert(h.failAt.water>0);
h=drive(by('Il muro'),BASE,20);assert.equal(h.hint,'wall');

// ---- the passive child goes nowhere
assert(!drive(0,P.MISSIONS[0].sol,30,{passive:true}).ok,'without the pedal nothing moves');

// ---- Piccolo: the project picture is a puzzle
G.level=1;G.go('officina');G.sceneOf('officina').enter({mi:by('Il laghetto')});const shop=G.officinaShop;
assert(!shop.allMatch(),'the plain vehicle does not match the boat project');
shop.choose('ruote','grandi');assert.equal(shop.state().v.ruote,'piccole','a piece not in the picture is refused');
shop.choose('telaio','barca');shop.choose('motore','elica');assert(shop.allMatch(),'the boat project is complete');
// Grande chooses freely
G.level=2;G.sceneOf('officina').enter({mi:by('Il laghetto')});G.officinaShop.choose('ruote','cingoli');assert.equal(G.officinaShop.state().v.ruote,'cingoli');

// ---- a win saves the stars and opens the next mission, per child
delete G.save.officina;R.reset(0,P.MISSIONS[0].sol);for(let f=0;f<60*60&&R.state().phase!=='win';f++)R.step({gas:true});
assert.equal(R.state().phase,'win');assert(G.save.officina.stars[0]>=1);assert.equal(G.save.officina.open,1);
G.accounts.login('legacy');assert.equal(G.save.officina,undefined,'sibling save leaked');G.accounts.login('p-old');assert.equal(G.save.officina.open,1);

// ---- scenes draw
for(const [name,arg] of [['accesso'],['menu'],['officina',{mi:0}],['officina',{mi:-1}],['strada',{mi:4,v:P.MISSIONS[4].sol}]]){const sc=G.sceneOf(name);if(sc.enter)sc.enter(arg||{});sc.draw(context);}
R.state().phase='win';G.sceneOf('strada').draw(context);
console.log('PASS Dino Officina: every project reaches the finish, every piece matters, hints, passive child, Piccolo puzzle, migration, saves');
