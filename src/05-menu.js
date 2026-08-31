/* Il tavolo delle commesse e la scelta Piccolo / Grande. */
(function(){'use strict';var c=G.ctx,C=G.C,W=G.W,H=G.H;
  var cards=[
    {id:'libera',name:'Costruisci tu!',sub:'Pezzi liberi · nessun errore',color:C.plum,icon:'prop'},
    {id:'monopattino',name:'Il Dino-mobile',sub:'4 pezzi · ruote e sedile',color:C.green,icon:'wheel'},
    {id:'gru',name:'La Gru Gialla',sub:'5 pezzi · alza la cassa',color:C.sun,icon:'hook'},
    {id:'vento',name:'La Macchina del Vento',sub:'5 pezzi · gira l’elica',color:C.blue,icon:'prop'}
  ];
  G.scene('menu',{enter:function(){setTimeout(function(){if(G.current==='menu')G.say('Che cosa montiamo oggi?');},250);},draw:function(){
    G.workshopBg();c.fillStyle='rgba(15,43,51,.88)';c.fillRect(0,0,W,116);
    G.text('DINO OFFICINA',W/2,58,{size:54,color:C.sun,stroke:C.ink,sw:10});
    G.drawDino(1110,113,.62);G.text('★ '+G.save.stars,1180,52,{size:32,color:C.sun});
    G.ui.button({id:'small',x:28,y:24,w:190,h:70,r:22,color:G.level===1?C.green:C.steel2,label:'Piccolo',fontSize:27,onTap:function(){G.level=1;G.saveNow();G.sfx('snap');}});
    G.ui.button({id:'big',x:228,y:24,w:190,h:70,r:22,color:G.level===2?C.red:C.steel2,label:'Grande',fontSize:27,onTap:function(){G.level=2;G.saveNow();G.sfx('snap');}});
    G.ui.button({id:'profile',x:980,y:24,w:270,h:70,r:22,color:C.steel2,label:(G.account&&G.account.name)||'Profilo',fontSize:24,onTap:function(){G.go('genitori');}});
    var gap=20,w=285,x0=(W-(w*4+gap*3))/2;
    cards.forEach(function(o,i){var x=x0+i*(w+gap),done=G.save.done[o.id];G.panel(x,164,w,425,C.cream,28);c.fillStyle=o.color;G.roundRect(x+18,182,w-36,190,22);c.fill();G.drawPiece(o.icon,x+w/2,275,1.15,o.id==='gru'?C.orange:C.red);G.text(o.name,x+w/2,413,{size:29,color:C.ink,max:w-32});G.text(o.sub,x+w/2,461,{size:19,color:C.steel2,weight:750,max:w-30});if(done)G.text('★ FATTA!',x+w/2,506,{size:23,color:C.orange});
      G.ui.button({id:'job-'+o.id,x:x+32,y:530,w:w-64,h:76,r:23,color:o.color,textColor:o.id==='gru'?C.ink:C.cream,label:o.id==='libera'?'APRI IL BANCO':'MONTIAMO!',fontSize:22,onTap:function(){G.go('officina',{id:o.id});}});
    });
  }});
})();
