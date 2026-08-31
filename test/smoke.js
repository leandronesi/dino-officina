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
try{vm.createContext(sandbox);vm.runInContext(code,sandbox,{filename:'bundle.js'});}catch(e){console.error('✗ avvio: '+e.stack);process.exit(1);}
const G=sandbox.G;
function pump(n){for(let i=0;i<n;i++){clock+=16.7;try{raf(clock);}catch(e){errors.push(e.stack);break;}}}
function check(ok,msg){if(!ok)errors.push(msg);}
pump(5);check(G.current==='accesso','accesso non avviato');check(draw>100,'accesso non disegnato');
check(G.accounts&&G.accounts.list().length===1,'migrazione del vecchio salvataggio non ha creato un profilo');
check(G.save.stars===7,'la migrazione non ha conservato le stelline');
check(G.accounts.login('legacy'),'login del profilo migrato fallisce'); pump(2); check(G.current==='menu','login non porta al menu');
var sibling=G.accounts.create({name:'Sorella',color:G.C.pink,level:1,secret:null});
G.accounts.login(sibling.id); check(G.save.stars===0,'i salvataggi dei profili non sono separati'); G.accounts.login('legacy'); pump(2);
['monopattino','gru','vento'].forEach(function(id){G.go('officina',{id:id});pump(3);check(G.officinaAutoBuild(false)>3,id+': montaggio incompleto');G.officinaTest();pump(150);let s=G.officinaState();check(s.state==='win',id+': prova non arriva alla vittoria ('+s.state+')');});
G.go('officina',{id:'libera'});pump(2);G.officinaAutoBuild(false);G.officinaTest();pump(150);check(G.officinaState().state==='win','libera non funziona');
G.level=2;G.go('officina',{id:'gru'});pump(2);G.officinaAutoBuild(true);G.officinaTest();pump(150);check(G.officinaState().state==='adjust','errore Grande non porta ad aggiusta');check(G.officinaState().wrong.length>0,'pezzo sbagliato non evidenziato');
if(errors.length){console.error('✗ collaudo fallito\n - '+errors.slice(0,30).join('\n - '));process.exit(1);}console.log('✓ Dino Officina: menu, 3 missioni, libera e ciclo aggiusta puliti');
