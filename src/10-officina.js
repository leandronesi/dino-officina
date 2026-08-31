/* Monto → provo → aggiusto. Il banco interpreta qualsiasi scheda del catalogo. */
(function(){'use strict';var c=G.ctx,C=G.C,W=G.W,H=G.H;
  var COLORS=[C.red,C.blue,C.orange,C.green,C.plum,C.pink], ALL=['beam','wheel','block','cab','arm','hook','prop','seat','wing','bucket','sail','rocket','antenna','chimney','drum','claw'];
  var S={};
  function reset(arg){
    var id=(arg&&arg.id)||'libera',m=G.officinaCatalog.byId(id);
    if(!m){id='libera';m=G.officinaCatalog.byId(id);}
    S={id:id,m:m,placed:new Array(m.slots.length).fill(null),drag:null,state:'build',testT:0,result:false,wrong:[],hint:-1,celebrate:0};
    var tray=m.tray.slice();
    if(G.level===2&&!m.free){var spare=ALL.filter(function(type){return tray.indexOf(type)<0;});tray.push(G.pick(spare.length?spare:ALL));}
    S.pieces=tray.map(function(type,i){return{id:'p'+i,type:type,color:COLORS[i%COLORS.length],used:false};});G.say(m.ask);
  }
  function available(){return S.pieces.filter(function(p){return !p.used;});}
  function firstSlot(piece){for(var i=0;i<S.m.slots.length;i++)if(!S.placed[i]&&(S.m.free||S.m.slots[i][0]===piece.type))return i;return -1;}
  function install(piece,idx){if(idx<0)return false;if(S.placed[idx])S.placed[idx].used=false;piece.used=true;S.placed[idx]=piece;G.sfx('snap');S.hint=-1;return true;}
  function startDrag(piece,from,p){S.drag={piece:piece,from:from,x:p.x,y:p.y,sx:p.x,sy:p.y};if(from>=0)S.placed[from]=null;piece.used=false;G.dragMove=function(q){S.drag.x=q.x;S.drag.y=q.y;};G.dragEnd=function(q){var best=-1,bd=105;for(var i=0;i<S.m.slots.length;i++){if(S.placed[i])continue;var sl=S.m.slots[i],d=G.dist(q.x,q.y,sl[1],sl[2]);if(d<bd){if(G.level===1&&!S.m.free&&sl[0]!==piece.type)continue;best=i;bd=d;}}if(best<0&&G.dist(q.x,q.y,S.drag.sx,S.drag.sy)<22)best=firstSlot(piece);if(!install(piece,best)){if(from>=0)install(piece,from);else G.sfx('bad');}S.drag=null;};}
  function completeCount(){return S.placed.filter(Boolean).length;}
  function verify(){S.wrong=[];if(S.m.free)return completeCount()>=3;for(var i=0;i<S.m.slots.length;i++)if(!S.placed[i]||S.placed[i].type!==S.m.slots[i][0])S.wrong.push(i);return !S.wrong.length;}
  function test(){S.result=verify();S.state='testing';S.testT=0;G.say(S.result?'Proviamo! Funziona?':'Proviamo... qualcosa non va.');}
  function finishTest(){if(S.result){S.state='win';S.celebrate=0;if(!G.save.done[S.id])G.save.stars++;G.save.done[S.id]=true;if(S.id==='libera')G.save.freeBuilds++;G.saveNow();G.sfx('win');G.say('Funziona! Che invenzione!');}else{S.state='adjust';G.sfx('bad');G.say('Aggiustiamo i pezzi che lampeggiano.');}}
  function drawSlot(sl,i){var pulse=.62+.2*Math.sin(G.t*5+i),bad=S.state==='adjust'&&S.wrong.indexOf(i)>=0;c.save();c.globalAlpha=bad ? .42 : pulse;c.setLineDash([12,9]);c.strokeStyle=bad?C.red:(S.hint===i?C.sun:C.steel2);c.lineWidth=bad?10:6;c.beginPath();c.arc(sl[1],sl[2],58,0,G.TAU);c.stroke();c.setLineDash([]);if(!S.m.free)G.drawPiece(sl[0],sl[1],sl[2],.72,'#8aa1a8',.26,sl[3]);c.restore();}
  function drawMachine(offset){offset=offset||0;for(var i=0;i<S.m.slots.length;i++){var sl=S.m.slots[i],p=S.placed[i];if(!p)drawSlot(sl,i);else G.drawPiece(p.type,sl[1]+offset,sl[2]+(S.state==='testing'&&!S.result?Math.sin(G.t*23+i)*7:0),.88,p.color,1,sl[3]);}}
  function tray(){var list=available(),n=list.length,w=n>8?92:104,g=n>8?10:13,total=n*w+Math.max(0,n-1)*g,x=(W-total)/2;list.forEach(function(p,i){var bx=x+i*(w+g);G.ui.button({id:'tray-'+p.id,x:bx,y:588,w:w,h:104,r:20,color:C.cream,icon:function(){G.drawPiece(p.type,bx+w/2,640,n>8 ? .54 : .62,p.color);},onDown:function(q){startDrag(p,-1,q);}});});if(!list.length)G.text('Tutti i pezzi sono sul banco!',W/2,644,{size:25,color:C.cream});}
  function placedHits(){S.placed.forEach(function(p,i){if(!p)return;var sl=S.m.slots[i];G.ui.hit({id:'placed-'+i,x:sl[1]-62,y:sl[2]-62,w:124,h:124,onDown:function(q){if(S.state==='build'||S.state==='adjust')startDrag(p,i,q);}});});}
  G.scene('officina',{enter:reset,update:function(dt){if(S.state==='testing'){S.testT+=dt;if(S.testT>2.25)finishTest();}if(S.state==='win')S.celebrate+=dt;},draw:function(){
    G.workshopBg();c.fillStyle='rgba(15,43,51,.9)';c.fillRect(0,0,W,102);G.text(S.m.name,W/2,49,{size:40,color:C.sun,stroke:C.ink,sw:8,max:710});
    G.ui.button({id:'back',x:22,y:18,w:170,h:66,r:20,color:C.steel2,label:'← PROGETTI',fontSize:19,onTap:function(){if(S.m.family)G.catalogOpenFamily(S.m.family);else G.go('menu');}});
    if(S.state==='build'||S.state==='adjust'){G.ui.button({id:'help',x:1090,y:18,w:165,h:66,r:20,color:C.orange,textColor:C.ink,label:'AIUTO',fontSize:23,onTap:function(){var arr=[];for(var i=0;i<S.m.slots.length;i++)if(!S.placed[i])arr.push(i);S.hint=arr.length?arr[0]:0;G.say('Metti qui il prossimo pezzo.');}});}
    G.panel(245,126,690,402,'rgba(255,245,220,.93)',32);c.fillStyle='#9a7854';c.fillRect(270,500,640,25);c.fillStyle='#694b34';c.fillRect(310,525,34,63);c.fillRect(840,525,34,63);
    var off=S.state==='testing'&&S.result?Math.sin(S.testT*7)*18:0;drawMachine(off);placedHits();
    if(S.state==='build'||S.state==='adjust'){tray();var ready=S.m.free?completeCount()>=3:completeCount()===S.m.slots.length;G.ui.button({id:'test',x:970,y:345,w:250,h:122,r:30,color:ready?C.green:C.steel,label:'PROVA!',sub:ready?'Vediamo se va':'Mancano pezzi',fontSize:39,disabled:!ready,onTap:test});G.text(S.state==='adjust'?'AGGIUSTA I PEZZI ROSSI':S.m.ask,590,554,{size:23,color:S.state==='adjust'?C.red:C.cream,stroke:C.ink,sw:5,max:650});}
    if(S.state==='testing'){G.text(S.result?'BRUM... PROVIAMO!':'TAC... TOC...',1080,250,{size:29,color:S.result?C.green:C.red,stroke:C.cream,sw:5});}
    if(S.state==='win'){c.fillStyle='rgba(15,43,51,.78)';c.fillRect(0,0,W,H);G.text('FUNZIONA!',W/2,205,{size:86,color:C.sun,stroke:C.ink,sw:14});G.text('★',W/2,330,{size:112,color:C.sun,stroke:C.orange,sw:8});G.ui.button({id:'again',x:300,y:465,w:300,h:105,r:28,color:C.blue,label:'RIFALLO!',fontSize:34,onTap:function(){reset({id:S.id});}});G.ui.button({id:'done',x:680,y:465,w:300,h:105,r:28,color:C.green,label:S.m.family?'ALTRI PROGETTI':'MENU',fontSize:27,onTap:function(){if(S.m.family)G.catalogOpenFamily(S.m.family);else G.go('menu');}});}
    if(S.drag)G.drawPiece(S.drag.piece.type,S.drag.x,S.drag.y,1,S.drag.piece.color,.9);
  }});
  G.officinaState=function(){return{id:S.id,family:S.m.family||null,state:S.state,count:completeCount(),wrong:S.wrong.slice(),stars:G.save.stars};};
  G.officinaAutoBuild=function(wrong){S.pieces.forEach(function(p){p.used=false;});S.placed.fill(null);for(var i=0;i<S.m.slots.length;i++){var want=S.m.slots[i][0],p=null;if(wrong&&i===0)p=S.pieces.filter(function(q){return !q.used&&q.type!==want;})[0];if(!p)p=S.pieces.filter(function(q){return !q.used&&(S.m.free||q.type===want);})[0];if(p)install(p,i);}return completeCount();};
  G.officinaTest=test;
})();
