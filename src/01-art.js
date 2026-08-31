/* Pezzi e macchine: forme originali disegnate a canvas. */
(function(){'use strict';var c=G.ctx,C=G.C,T=G.TAU;
  function bolt(x,y,r){c.fillStyle=C.cream;c.beginPath();c.arc(x,y,r,0,T);c.fill();c.strokeStyle=C.ink;c.lineWidth=Math.max(2,r*.3);c.stroke();c.beginPath();c.moveTo(x-r*.55,y);c.lineTo(x+r*.55,y);c.stroke();}
  G.drawPiece=function(type,x,y,scale,color,alpha,rot){scale=scale||1;color=color||C.red;c.save();c.translate(x,y);c.rotate(rot||0);c.globalAlpha=alpha===undefined?1:alpha;c.lineJoin='round';c.lineCap='round';c.strokeStyle=C.ink;c.lineWidth=5*scale;c.fillStyle=color;
    if(type==='beam'){G.roundRect(-62*scale,-19*scale,124*scale,38*scale,13*scale);c.fill();c.stroke();[-42,0,42].forEach(function(q){bolt(q*scale,0,7*scale);});}
    if(type==='wheel'){c.fillStyle=C.ink;c.beginPath();c.arc(0,0,43*scale,0,T);c.fill();c.fillStyle=color;c.beginPath();c.arc(0,0,27*scale,0,T);c.fill();c.stroke();bolt(0,0,8*scale);}
    if(type==='block'){G.roundRect(-43*scale,-34*scale,86*scale,68*scale,12*scale);c.fill();c.stroke();[-22,22].forEach(function(q){bolt(q*scale,0,7*scale);});}
    if(type==='cab'){G.roundRect(-50*scale,-35*scale,100*scale,70*scale,13*scale);c.fill();c.stroke();c.fillStyle='#aee6ef';G.roundRect(-28*scale,-23*scale,56*scale,34*scale,7*scale);c.fill();c.stroke();}
    if(type==='arm'){G.roundRect(-18*scale,-70*scale,36*scale,140*scale,12*scale);c.fill();c.stroke();[-48,0,48].forEach(function(q){bolt(0,q*scale,7*scale);});}
    if(type==='hook'){c.strokeStyle=color;c.lineWidth=20*scale;c.beginPath();c.moveTo(0,-45*scale);c.lineTo(0,20*scale);c.arc(22*scale,20*scale,22*scale,Math.PI,0);c.stroke();c.strokeStyle=C.ink;c.lineWidth=5*scale;c.stroke();}
    if(type==='prop'){c.fillStyle=color;for(var i=0;i<3;i++){c.rotate(T/3);c.beginPath();c.ellipse(0,-33*scale,14*scale,36*scale,0,0,T);c.fill();c.stroke();}bolt(0,0,9*scale);}
    if(type==='seat'){G.roundRect(-48*scale,-26*scale,96*scale,52*scale,14*scale);c.fill();c.stroke();c.fillStyle=G.shade(color,-25);G.roundRect(-41*scale,-65*scale,34*scale,55*scale,10*scale);c.fill();c.stroke();}
    c.restore();
  };
  G.drawDino=function(x,y,s){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=C.green;c.strokeStyle=C.ink;c.lineWidth=6;c.beginPath();c.ellipse(0,0,62,54,0,0,T);c.fill();c.stroke();c.beginPath();c.arc(42,-57,45,0,T);c.fill();c.stroke();c.fillStyle=C.cream;c.beginPath();c.ellipse(57,-45,28,18,0,0,T);c.fill();c.stroke();c.fillStyle=C.ink;c.beginPath();c.arc(52,-70,6,0,T);c.fill();c.strokeStyle=C.ink;c.lineWidth=8;c.beginPath();c.moveTo(-34,40);c.lineTo(-38,78);c.moveTo(32,40);c.lineTo(38,78);c.stroke();c.restore();};
})();
