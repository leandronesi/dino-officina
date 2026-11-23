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
  R.reset(mi,v,o?.track);const cs=mi<0?P.freeTrack(o?.track).course:P.MISSIONS[mi].course,st=O.stats(v);
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
assert(drive(-1,BASE,30,{track:'colline'}).ok);

// ---- every obstacle: the right piece passes, the wrong one fails
const by=n=>P.MISSIONS.findIndex(m=>m.name===n);
assert(drive(-1,P.MISSIONS[by('Il laghetto')].sol,30,{track:'acqua'}).ok);
assert(drive(-1,P.MISSIONS[by('Il burrone')].sol,30,{track:'salti'}).ok);
{
  const mi=by('Il burrone'), v=P.MISSIONS[mi].sol, road=G.sceneOf('strada');
  road.enter({mi,v});
  road.onDown({id:1,x:1170,y:580});
  road.onDown({id:2,x:306,y:612});
  road.onUp({id:2});
  road.update(1/60);
  assert(R.state().rt>0,'a quick rocket tap must survive between simulation frames');
  assert(R.state().vx>0,'accelerating and firing can use two fingers');
  road.onUp({id:1});
  R.state().phase='fail';R.state().timer=0;
  R.step({});
  assert.equal(R.state().rcd,0,'the rocket is ready after a retry');
}
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

// ---- the workshop: an empty frame, every piece allowed, the picture only as a hint
G.level=1;G.sceneOf('officina').enter({mi:by('Il laghetto')});const shop=G.officinaShop;
assert(!shop.complete(),'every mission starts from an empty frame');assert.equal(shop.state().v.telaio,null);
shop.choose('telaio','auto');assert.equal(shop.state().v.telaio,'auto','a piece that is not in the picture is NOT refused');assert(!shop.matches('telaio'));
shop.choose('ruote','piccole');shop.choose('motore','normale');assert(!shop.complete(),'three pieces are not a vehicle');shop.choose('extra','niente');assert(shop.complete());
shop.choose('telaio','barca');assert(shop.matches('telaio'),'the tick shows which rows match the picture');
G.sceneOf('officina').enter({mi:by('Il laghetto')});
assert.equal(shop.state().v.telaio,'barca','reopening a mission restores the saved build');
// Aggiusta keeps what was built
shop.prova();G.sceneOf('officina').enter({mi:by('Il laghetto'),keep:true});assert.equal(G.officinaShop.state().v.telaio,'barca','Aggiusta keeps the vehicle');
// Grande: same freedom, no picture
G.level=2;G.sceneOf('officina').enter({mi:by('Il laghetto')});G.officinaShop.choose('ruote','cingoli');assert.equal(G.officinaShop.state().v.ruote,'cingoli');

// The free garage remembers the chosen track and opens it with the built vehicle.
G.sceneOf('officina').enter({mi:-1});
for(const [slot,id] of Object.entries(P.MISSIONS[by('Il burrone')].sol)) shop.choose(slot,id);
shop.chooseTrack('salti');
shop.prova();
G.sceneOf('officina').enter({mi:-1});
assert.equal(shop.state().track,'salti');
assert(shop.complete());
R.reset(-1,shop.state().v,'salti');
assert.equal(R.state().track,'salti');
assert(P.FREE_TRACKS.salti.course.obst.some(o=>o.k==='gap'));

// ---- a win saves the stars and opens the next mission, per child
delete G.save.officina;R.reset(0,P.MISSIONS[0].sol);for(let f=0;f<60*60&&R.state().phase!=='win';f++)R.step({gas:true});
assert.equal(R.state().phase,'win');assert(G.save.officina.stars[0]>=1);assert.equal(G.save.officina.open,1);
G.accounts.login('legacy');assert.equal(G.save.officina,undefined,'sibling save leaked');G.accounts.login('p-old');assert.equal(G.save.officina.open,1);

// Rescue is offered from the normal menu and keeps each route and child separate.
{
  const buttons=new Map(), button=G.ui.button;
  G.ui.button=o=>buttons.set(o.id,o);
  try {
    G.sceneOf('menu').draw(context);
    assert(buttons.has('rescue'),'rescue is open from the main menu');
    const go=G.go;
    let opened;
    G.go=(scene,args)=>{opened={scene,args};};
    try { buttons.get('rescue').onTap(); } finally { G.go=go; }
    assert.equal(opened.scene,'officina');
    assert.equal(opened.args.mi,P.RESCUE_ID);
    G.sceneOf('officina').enter(opened.args);
    G.sceneOf('officina').draw(context);
    assert(buttons.has('rescue-fiume') && buttons.has('rescue-rampa'));
    shop.choose('telaio','barca');
    buttons.get('rescue-rampa').onTap();
    assert.equal(shop.state().track,'rampa');
    assert.equal(shop.state().v.telaio,null);
    buttons.get('rescue-fiume').onTap();
    assert.equal(shop.state().v.telaio,'barca');
    G.sceneOf('officina').enter({mi:P.RESCUE_ID,track:'rampa'});
    G.sceneOf('officina').enter({mi:P.RESCUE_ID});
    assert.equal(shop.state().track,'rampa','leaving the alternate route workshop returns to the same project');
  } finally { G.ui.button=button; }
}

for(const level of [1,2]) for(const [track,m] of Object.entries(P.RESCUE_ROUTES)){
  G.level=level;
  R.reset(P.RESCUE_ID,m.sol,track);
  let loaded=false, pickup=false, stopped=false, wobble=0, used=new Set();
  for(let f=0;f<60*45&&R.state().phase!=='win';f++){
    const s=R.state();
    if(s.phase==='island'&&!stopped){
      const x=s.x;
      for(let i=0;i<90;i++)R.step({gas:true});
      assert.equal(s.x,x,'gas alone cannot drive past the island');
      assert(!s.cargo);
      stopped=true;
    }
    if(s.phase==='pickup'){
      pickup=true;
      if(level===1) assert(!G.officinaSave().rescues[track],'the egg is not yet at the nest');
    }
    loaded ||= s.cargo;
    wobble=Math.max(wobble,Math.abs(s.wobble));
    const gap=m.course.obst.find(o=>o.k==='gap'&&o.x0-s.x>=0&&(level===1?s.assist:o.x0-s.x<=85));
    const fire=gap && !used.has(gap.x0);
    if(fire)used.add(gap.x0);
    R.step({gas:true,fire:fire||s.phase==='island',secure:s.cargo});
  }
  const s=R.state();
  assert.equal(s.phase,'win',track+' at age '+level+' must reach the nest ('+JSON.stringify({x:s.x,cargo:s.cargo,fails:s.failAt})+')');
  assert(stopped&&pickup&&loaded,'the child loads the egg at the island before driving back');
  assert(wobble>.008,'the cargo responds to driving even with its strap on');
  assert.equal(s.fails,0);
  assert.equal(G.officinaSave().rescues[track],1);
  assert.equal(G.officinaSave().open,1,'the rescue is independent of the original map');
}
{
  const m=P.RESCUE_ROUTES.rampa;
  const firstGap=m.course.obst.find(o=>o.k==='gap');
  let fired=false;
  R.reset(P.RESCUE_ID,m.sol,m.id);
  for(let f=0;f<60*25&&R.state().phase!=='fail';f++){
    const fire=!fired&&firstGap.x0-R.state().x<80;
    fired ||= fire;
    R.step({gas:true,fire:fire||R.state().phase==='island',secure:true});
  }
  assert.equal(R.state().phase,'fail','missing the second launch must be recoverable');
  assert(R.state().cargo,'the egg was picked up before the missed jump');
  for(let f=0;f<70;f++)R.step({});
  assert(R.state().cargo&&R.state().x>=m.course.pickup,'retry keeps the egg and restarts on the return');
  assert.equal(R.state().rcd,0,'retry recharges the rocket');
}
{
  const m=P.RESCUE_ROUTES.fiume;
  R.reset(P.RESCUE_ID,m.sol,m.id);
  for(let f=0;f<60*40&&['drive','island','pickup'].includes(R.state().phase);f++){
    R.step({gas:true,fire:R.state().phase==='island'});
  }
  assert.equal(R.state().lastFail,'cargo','taking every wave at full gas with no protection puts the egg at risk');
  const button=G.ui.button, buttons=[];
  G.ui.button=o=>buttons.push(o.id);
  try { G.sceneOf('strada').draw(context); } finally { G.ui.button=button; }
  assert(!buttons.includes('fix'),'a cargo bump must guide the child back to the road');
  for(let f=0;f<75;f++)R.step({});
  assert(R.state().cargo&&R.state().phase==='drive','the basket keeps the egg after a rough return');
  assert.equal(R.state().strain,0);
}
{
  const m=P.RESCUE_ROUTES.fiume, wave=m.course.waves[0];
  G.level=1;R.reset(P.RESCUE_ID,m.sol,m.id);
  let lift=0,noseUp=0,noseDown=0,beforeWave,slowest=Infinity;
  for(let f=0;f<60*35&&R.state().phase!=='win';f++){
    const x=R.state().x;
    R.step({gas:true,secure:true,fire:R.state().phase==='island'});
    const s=R.state(), speed=60*(s.x-x);
    if(s.x>=wave.x-115&&s.x<wave.x-90)beforeWave=speed;
    if(Math.abs(s.x-wave.x)<74){
      lift=Math.max(lift,wave.y-s.y);
      noseUp=Math.min(noseUp,s.ang);noseDown=Math.max(noseDown,s.ang);
      slowest=Math.min(slowest,speed);
    }
  }
  assert(lift>=40,'the loaded boat actually rises over the visible crest');
  assert(noseUp<-.18&&noseDown>.18,'the bow follows both faces of the wave');
  assert(beforeWave-slowest>28,'full throttle still loses momentum on the rising face');
  assert.equal(R.state().phase,'win','the waves remain passable with the propeller');
}
G.accounts.login('legacy');assert.equal(G.officinaSave().rescues.rampa,undefined,'the rescue belongs to the active child');G.accounts.login('p-old');

// The bench is a short build → test → adjust loop. It keeps the geometry a child assembled.
{
  const original=G.ui.button, buttons=new Map();
  G.ui.button=o=>buttons.set(o.id,o);
  try {
    G.sceneOf('menu').draw(context);
    assert(buttons.has('banco'),'the prototype opens from the main menu');
    const bench=G.banco, scene=G.sceneOf('banco');
    scene.enter();scene.draw(context);
    const starting=bench.build().wheels.slice();
    buttons.get('wheel-1').onTap();buttons.get('wheel-0').onTap();
    buttons.get('wheel-2').onTap();buttons.get('wheel-3').onTap();
    assert.deepEqual(Array.from(bench.build().wheels),[0,3]);
    scene.enter();assert.deepEqual(Array.from(bench.build().wheels),[0,3],'mounting points persist for the player');
    scene.draw(context);buttons.get('bench-try').onTap();
    assert.equal(bench.state().phase,'drive');
    for(let f=0;f<60*15&&bench.state().phase==='drive';f++)bench.step(false);
    assert.equal(bench.state().phase,'win','the outside wheelbase crosses the cut');
    scene.enter();scene.draw(context);
    buttons.get('wheel-0').onTap();buttons.get('wheel-1').onTap();
    buttons.get('wheel-3').onTap();buttons.get('wheel-2').onTap();
    assert.deepEqual(Array.from(bench.build().wheels),Array.from(starting));
    bench.start();
    for(let f=0;f<60*15&&bench.state().phase==='drive';f++)bench.step(false);
    assert.equal(bench.state().phase,'fail','the inner wheelbase has a different outcome');
    const attempts=[], rocketResults=[];
    for(const slot of [0,1]){
      scene.enter();scene.draw(context);buttons.get('rocket-'+slot).onTap();
      bench.start();bench.step(true);
      for(let f=0;f<18;f++)bench.step(false);
      attempts.push(bench.state().angle);
      bench.start();
      for(let f=0;f<60*15&&bench.state().phase==='drive';f++)bench.step(bench.state().x>=540);
      rocketResults.push(bench.state().phase);
    }
    assert(attempts[0]>.06&&attempts[1]<-.03,'the same rocket changes pitch when mounted at a different height');
    assert.deepEqual(rocketResults,['fail','win'],'changing only the rocket position changes the outcome');
    G.accounts.login('legacy');scene.enter();
    assert.equal(bench.build().rocket,null,'the rocket mount stays with the child’s save');
    G.accounts.login('p-old');
  } finally { G.ui.button=original; }
}

// ---- scenes draw
for(const [name,arg] of [['accesso'],['menu'],['officina',{mi:0}],['officina',{mi:-1}],['strada',{mi:4,v:P.MISSIONS[4].sol}]]){const sc=G.sceneOf(name);if(sc.enter)sc.enter(arg||{});sc.draw(context);}
R.state().phase='win';G.sceneOf('strada').draw(context);
console.log('PASS Dino Officina: wheel and rocket positions change the bench result, both rescue routes and existing missions');
