#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..'),SRC=path.join(ROOT,'src'),NOOP=function(){},errors=[];
let draw=0,clock=0,raf=null;
function gradient(){return{addColorStop:NOOP};}
const ctx=new Proxy({}, {get:function(t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return gradient;if(k==='measureText')return s=>({width:String(s).length*9});if(k==='getLineDash')return()=>[];if(k==='canvas')return canvas;return function(){draw++;for(const v of arguments)if(typeof v==='number'&&!Number.isFinite(v))errors.push('canvas '+String(k)+' ha ricevuto '+v);};},set:function(t,k,v){if(typeof v==='number'&&!Number.isFinite(v))errors.push('canvas '+String(k)+' = '+v);t[k]=v;return true;}});
function classes(){const a=new Set();return{add:x=>a.add(x),remove:x=>a.delete(x),toggle:(x,on)=>on?a.add(x):a.delete(x),contains:x=>a.has(x)};}
const listeners={},canvas={style:{},width:0,height:0,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:1600,height:900}),addEventListener:(n,f)=>(listeners[n]=listeners[n]||[]).push(f),setPointerCapture:NOOP};
const els={c:canvas,rot:{classList:classes()}};
const store=new Map();
// Seed the old single-save format: boot must migrate it into a profile.
store.set('dino-officina.save', JSON.stringify({level:2,stars:7,done:{gru:true},freeBuilds:1,mute:false}));
const sandbox={innerWidth:1600,innerHeight:900,devicePixelRatio:2,console:{log:NOOP,warn:(...a)=>errors.push(a.join(' ')),error:(...a)=>errors.push(a.join(' '))},Math,JSON,Date,performance:{now:()=>clock},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},navigator:{wakeLock:null},matchMedia:()=>({matches:false}),speechSynthesis:{cancel:NOOP,speak:NOOP},SpeechSynthesisUtterance:function(s){this.text=s;},AudioContext:function(){const n=()=>({connect:NOOP,start:NOOP,stop:NOOP,frequency:{setValueAtTime:NOOP},gain:{setValueAtTime:NOOP}});this.currentTime=0;this.destination=n();this.createOscillator=n;this.createGain=n;},document:{hidden:false,fullscreenElement:null,documentElement:{requestFullscreen:()=>Promise.resolve()},getElementById:id=>els[id]||{classList:classes()},addEventListener:NOOP},addEventListener:NOOP,requestAnimationFrame:f=>(raf=f,1),setTimeout:(f)=>{f();return 1;},clearTimeout:NOOP};
sandbox.window=sandbox;sandbox.self=sandbox;sandbox.globalThis=sandbox;
const code=fs.readdirSync(SRC).filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(path.join(SRC,f),'utf8')).join('\n;\n');
const accountSource=fs.readFileSync(path.join(SRC,'90-account.js'),'utf8');
check(!/\bprompt\s*\(/.test(accountSource),'il login usa ancora un prompt nativo');
const bodySource=fs.readFileSync(path.join(ROOT,'body.html'),'utf8');
['profile-overlay','profile-name','profile-next-name','profile-next-color','profile-next-level','profile-skip-secret','profile-create'].forEach(function(id){check(bodySource.indexOf('id="'+id+'"')>=0,'wizard profili incompleto: manca '+id);});
check(bodySource.indexOf('class="profile-shapes"')>=0,'wizard profili incompleto: manca griglia delle nove figure');
try{vm.createContext(sandbox);vm.runInContext(code,sandbox,{filename:'bundle.js'});}catch(e){console.error('✗ avvio: '+e.stack);process.exit(1);}
const G=sandbox.G;
function pump(n){for(let i=0;i<n;i++){clock+=16.7;try{raf(clock);}catch(e){errors.push(e.stack);break;}}}
function tap(x,y){var e={clientX:G.view.ox+x*G.view.s,clientY:G.view.oy+y*G.view.s,pointerId:1,preventDefault:NOOP};(listeners.pointerdown||[]).forEach(function(f){f(e);});pump(1);(listeners.pointerup||[]).forEach(function(f){f(e);});pump(1);}
function check(ok,msg){if(!ok)errors.push(msg);}
pump(5);check(G.current==='accesso','accesso non avviato');check(draw>100,'accesso non disegnato');
check(G.accounts&&G.accounts.list().length===1,'migrazione del vecchio salvataggio non ha creato un profilo');
check(G.save.stars===7,'la migrazione non ha conservato le stelline');
check(G.accounts.login('legacy'),'login del profilo migrato fallisce'); pump(2); check(G.current==='menu','login non porta al menu');
var sibling=G.accounts.create({name:'Sorella',color:G.C.pink,level:1,secret:null});
G.accounts.login(sibling.id); check(G.save.stars===0,'i salvataggi dei profili non sono separati'); G.accounts.login('legacy'); pump(2);
var protectedProfile=G.accounts.create({name:'Protetto',color:G.C.blue,level:2,secret:[3,4,8]});
G.accounts.login(protectedProfile.id); pump(2); check(G.current==='segreto','il segreto non apre la schermata protetta');
tap(742,382);tap(914,382);tap(1086,554);pump(2);check(G.current==='menu'&&G.account.id===protectedProfile.id,'il segreto con figure 4-9 non sblocca il profilo');
G._profileLogin('legacy'); G.go('menu'); pump(2);
var catalog=G.officinaCatalog, all=catalog&&catalog.projects||[], ids=new Set(all.map(function(p){return p.id;}));
// Sottrarre minX/minY rende invisibile una traslazione globale: due progetti
// uguali spostati di pochi pixel devono quindi collidere e far fallire il test.
function structureSignature(p){
  var minX=Math.min.apply(Math,p.slots.map(function(q){return q[1];}));
  var minY=Math.min.apply(Math,p.slots.map(function(q){return q[2];}));
  return p.slots.map(function(q){
    var rot=Math.round((((q[3]%(Math.PI*2))+(Math.PI*2))%(Math.PI*2))*1000)/1000;
    return q[0]+'@'+Math.round((q[1]-minX)*100)/100+','+Math.round((q[2]-minY)*100)/100+','+rot;
  }).sort().join('|');
}
var structures=new Set(all.map(structureSignature));
check(catalog&&catalog.families.length===10,'il catalogo non ha 10 raccolte');
check(all.length===100,'il catalogo non ha 100 progetti: '+all.length);
check(ids.size===100,'gli id dei cento progetti non sono unici');
check(structures.size===100,'due o piu progetti hanno la stessa struttura, anche ignorando una traslazione globale: '+structures.size+' di 100');
catalog.families.forEach(function(f){check(catalog.inFamily(f.id).length===10,f.id+': la raccolta non ha 10 progetti');});
all.forEach(function(p){
  check(catalog.byId(p.id)===p,p.id+': non e selezionabile per id');
  check(p.slots.length>=4&&p.slots.length<=7,p.id+': numero di pezzi fuori misura');
  check(p.tray.length===p.slots.length,p.id+': vassoio e agganci non coincidono');
  G.go('officina',{id:p.id});pump(2);
  check(G.officinaState().id===p.id,p.id+': il banco ha aperto il progetto sbagliato');
  check(G.officinaAutoBuild(false)===p.slots.length,p.id+': montaggio incompleto');
  G.officinaTest();pump(140);var state=G.officinaState();
  check(state.state==='win',p.id+': prova non arriva alla vittoria ('+state.state+')');
});
check(Object.keys(G.save.done).filter(function(id){return catalog.byId(id)&&id!=='libera';}).length===100,'non tutti i cento progetti risultano completati e rigiocabili');
G.go('officina',{id:'libera'});pump(2);G.officinaAutoBuild(false);G.officinaTest();pump(150);check(G.officinaState().state==='win','libera non funziona');
G.level=2;G.go('officina',{id:'gru'});pump(2);G.officinaAutoBuild(true);G.officinaTest();pump(150);check(G.officinaState().state==='adjust','errore Grande non porta ad aggiusta');check(G.officinaState().wrong.length>0,'pezzo sbagliato non evidenziato');
G.go('famiglie');pump(3);check(G.current==='famiglie','album raccolte non apribile');tap(1140,656);check(G.catalogViewState().familyPage===1,'seconda pagina raccolte non raggiungibile');
G.catalogOpenFamily('spazio');pump(3);check(G.current==='progetti'&&G.catalogViewState().family==='spazio','raccolta spazio non apribile');tap(1140,656);tap(1140,656);check(G.catalogViewState().projectPage===2,'terza pagina progetti non raggiungibile');
if(errors.length){console.error('✗ collaudo fallito\n - '+errors.slice(0,30).join('\n - '));process.exit(1);}console.log('✓ Dino Officina: 100 progetti, 10 raccolte, libera, profili e ciclo aggiusta puliti');
