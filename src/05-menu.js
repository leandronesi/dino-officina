/* Home e album dei cento progetti. Mai più di cinque scelte grandi alla volta. */
(function () {
  'use strict';
  var c=G.ctx,C=G.C,W=G.W,H=G.H,cat=G.officinaCatalog;
  var familyPage=0, projectView={family:'ruote',page:0};

  function top(title, back) {
    G.workshopBg(); c.fillStyle='rgba(15,43,51,.9)'; c.fillRect(0,0,W,112);
    G.text(title,W/2,55,{size:48,color:C.sun,stroke:C.ink,sw:9,max:700});
    if(back)G.ui.button({id:'back',x:24,y:22,w:170,h:70,r:21,color:C.steel2,label:'← INDIETRO',fontSize:20,onTap:back});
    G.text('★ '+G.save.stars,1180,55,{size:31,color:C.sun});
  }

  function preview(p,cx,cy,scale) {
    p.slots.forEach(function(sl){G.drawPiece(sl[0],cx+(sl[1]-520)*scale,cy+(sl[2]-365)*scale,scale*.64,p.color,1,sl[3]);});
  }

  function openProject(p){if(p)G.go('officina',{id:p.id});}
  G.catalogOpenFamily=function(id){projectView.family=id;projectView.page=0;G.go('progetti');};
  G.catalogViewState=function(){return{familyPage:familyPage,family:projectView.family,projectPage:projectView.page};};

  G.scene('menu',{enter:function(){setTimeout(function(){if(G.current==='menu')G.say('Che cosa montiamo oggi?');},250);},draw:function(){
    top('DINO OFFICINA');
    G.ui.button({id:'small',x:28,y:22,w:172,h:70,r:22,color:G.level===1?C.green:C.steel2,label:'Piccolo',fontSize:25,onTap:function(){G.level=1;G.saveNow();G.sfx('snap');}});
    G.ui.button({id:'big',x:210,y:22,w:172,h:70,r:22,color:G.level===2?C.red:C.steel2,label:'Grande',fontSize:25,onTap:function(){G.level=2;G.saveNow();G.sfx('snap');}});
    G.ui.button({id:'profile',x:940,y:22,w:210,h:70,r:22,color:C.steel2,label:(G.account&&G.account.name)||'Profilo',fontSize:23,onTap:function(){G.go('genitori');}});
    var next=cat.next(G.save.done), cards=[
      {id:'free',name:'Costruisci tu!',sub:'Banco libero · nessun errore',color:C.plum,icon:'prop',tap:function(){openProject(cat.byId('libera'));}},
      {id:'album',name:'100 progetti',sub:'Scegli una raccolta',color:C.blue,icon:'beam',tap:function(){G.go('famiglie');}},
      {id:'continue',name:'Continua',sub:next.name,color:next.color,icon:next.icon,tap:function(){openProject(next);}},
      {id:'random',name:'Sorprendimi!',sub:'Un progetto a caso',color:C.orange,icon:'claw',tap:function(){openProject(cat.random());}}
    ],gap=22,w=285,x0=(W-(w*4+gap*3))/2;
    cards.forEach(function(o,i){var x=x0+i*(w+gap);G.panel(x,165,w,430,C.cream,28);c.fillStyle=o.color;G.roundRect(x+18,184,w-36,195,22);c.fill();G.drawPiece(o.icon,x+w/2,280,1.18,o.id==='continue'?C.red:C.cream);G.text(o.name,x+w/2,421,{size:31,color:C.ink,max:w-28});G.text(o.sub,x+w/2,468,{size:19,color:C.steel2,weight:750,max:w-30});if(o.id==='album'){var done=Object.keys(G.save.done||{}).filter(function(id){return id!=='libera'&&cat.byId(id);}).length;G.text(done+' / 100 fatti',x+w/2,511,{size:21,color:C.orange});}
      G.ui.button({id:'home-'+o.id,x:x+30,y:526,w:w-60,h:80,r:23,color:o.color,textColor:o.id==='continue'?C.cream:C.ink,label:o.id==='album'?'SFOGLIA':o.id==='free'?'APRI':'MONTIAMO!',fontSize:23,onTap:o.tap});
    });
  }});

  G.scene('famiglie',{enter:function(){familyPage=G.clamp(familyPage,0,1);},draw:function(){
    top('SCEGLI UNA RACCOLTA',function(){G.go('menu');});
    var start=familyPage*5,list=cat.families.slice(start,start+5),w=214,g=19,x0=(W-(w*5+g*4))/2;
    list.forEach(function(f,i){var x=x0+i*(w+g),pr=cat.progress(G.save.done,f.id);G.panel(x,158,w,438,C.cream,26);c.fillStyle=f.color;G.roundRect(x+16,176,w-32,182,20);c.fill();G.drawPiece(f.icon,x+w/2,267,1.05,C.cream);G.text(f.name,x+w/2,399,{size:27,color:C.ink,max:w-24});G.text(pr.done+' di '+pr.total+' fatti',x+w/2,449,{size:20,color:pr.done===pr.total?C.green:C.steel2});
      G.ui.button({id:'family-'+f.id,x:x+25,y:502,w:w-50,h:74,r:21,color:f.color,textColor:C.ink,label:'APRI',fontSize:23,onTap:function(){G.catalogOpenFamily(f.id);}});
    });
    G.ui.button({id:'fam-prev',x:32,y:620,w:200,h:72,r:22,color:C.steel2,label:'← PRIMA',fontSize:23,disabled:familyPage===0,onTap:function(){familyPage--;}});
    G.text('Pagina '+(familyPage+1)+' di 2',W/2,656,{size:23,color:C.cream,stroke:C.ink,sw:5});
    G.ui.button({id:'fam-next',x:W-232,y:620,w:200,h:72,r:22,color:C.steel2,label:'DOPO →',fontSize:23,disabled:familyPage===1,onTap:function(){familyPage++;}});
  }});

  G.scene('progetti',{enter:function(){var list=cat.inFamily(projectView.family),max=Math.max(0,Math.ceil(list.length/4)-1);projectView.page=G.clamp(projectView.page,0,max);},draw:function(){
    var family=cat.family(projectView.family),all=cat.inFamily(projectView.family),pages=Math.ceil(all.length/4),start=projectView.page*4,list=all.slice(start,start+4);
    top(family?family.name:'PROGETTI',function(){G.go('famiglie');});
    var w=274,g=23,x0=(W-(w*4+g*3))/2;
    list.forEach(function(p,i){var x=x0+i*(w+g),done=G.save.done&&G.save.done[p.id];G.panel(x,151,w,442,C.cream,27);c.fillStyle=p.color;G.roundRect(x+17,169,w-34,197,21);c.fill();preview(p,x+w/2,270,.72);G.text((start+i+1)+'. '+p.name,x+w/2,406,{size:27,color:C.ink,max:w-25});G.text(p.slots.length+' pezzi',x+w/2,451,{size:20,color:C.steel2});if(done)G.text('★ FATTO!',x+w/2,491,{size:21,color:C.orange});
      G.ui.button({id:'project-'+p.id,x:x+27,y:516,w:w-54,h:70,r:21,color:p.color,textColor:C.ink,label:done?'RIFALLO':'MONTA',fontSize:23,onTap:function(){openProject(p);}});
    });
    G.ui.button({id:'proj-prev',x:32,y:620,w:200,h:72,r:22,color:C.steel2,label:'← PRIMA',fontSize:23,disabled:projectView.page===0,onTap:function(){projectView.page--;}});
    G.text('Pagina '+(projectView.page+1)+' di '+pages,W/2,656,{size:23,color:C.cream,stroke:C.ink,sw:5});
    G.ui.button({id:'proj-next',x:W-232,y:620,w:200,h:72,r:22,color:C.steel2,label:'DOPO →',fontSize:23,disabled:projectView.page>=pages-1,onTap:function(){projectView.page++;}});
  }});
})();
