/* Quiet geometry: no blur, textures, images or per-frame object allocation. */
(function(){'use strict';
  G.workshopBg=function(){
    var c=G.ctx;
    c.fillStyle='#b8d9d0';c.fillRect(0,0,1280,720);
    c.fillStyle='#8bb9af';c.fillRect(0,108,1280,16);
    c.fillStyle='#cfb38b';c.fillRect(0,548,1280,172);
    c.fillStyle='#a58a65';for(var y=580;y<720;y+=46)c.fillRect(0,y,1280,3);
    c.fillStyle='#e8d3ad';G.roundRect(26,147,185,356,18);c.fill();
    c.fillStyle='#a68c68';for(var row=0;row<8;row++)for(var col=0;col<4;col++){c.beginPath();c.arc(52+col*44,172+row*42,3,0,7);c.fill();}
    c.strokeStyle='#476b70';c.lineWidth=15;c.lineCap='round';
    for(var tool=0;tool<3;tool++){var x=66+tool*52;c.beginPath();c.moveTo(x,220);c.lineTo(x,310+tool*22);c.stroke();c.fillStyle=['#ef8b45','#4e9ed6','#48b878'][tool];G.roundRect(x-12,266+tool*22,24,60,8);c.fill();}
    c.fillStyle='#799d8b';G.roundRect(1010,150,224,158,18);c.fill();
    c.fillStyle='#daf2e5';G.roundRect(1022,162,200,134,12);c.fill();
    c.fillStyle='#9fcba0';c.beginPath();c.ellipse(1120,294,108,42,0,0,7);c.fill();
    c.fillStyle='#fff1bc';c.beginPath();c.arc(1172,194,20,0,7);c.fill();
    c.fillStyle='#a07955';c.fillRect(1002,306,240,12);
    c.fillStyle='#8b694b';c.fillRect(0,544,1280,12);
  };
})();
