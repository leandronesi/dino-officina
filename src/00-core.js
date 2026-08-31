/* Dino Officina — piccolo motore canvas, senza dipendenze. */
(function () {
  'use strict';
  var W = 1280, H = 720, TAU = Math.PI * 2;
  var G = window.G = { W:W, H:H, TAU:TAU, t:0, dt:0, frame:0 };
  G.C = { navy:'#163c45', navy2:'#0f2b33', steel:'#6e8790', steel2:'#435b63', cream:'#fff5dc', ink:'#26343a', sun:'#ffcb4c', orange:'#ef8b45', red:'#ef735d', green:'#48b878', blue:'#4e9ed6', plum:'#9b6dcc', pink:'#ef78a8', floor:'#d5b98c', shadow:'rgba(20,25,25,.24)' };
  G.clamp = function (v,a,b) { return Math.max(a,Math.min(b,v)); };
  G.lerp = function (a,b,t) { return a+(b-a)*t; };
  G.pick = function (a) { return a[Math.floor(Math.random()*a.length)]; };
  G.rndi = function (a,b) { return Math.floor(a+Math.random()*(b-a+1)); };
  G.shuffle = function (a) { a=a.slice(); for(var i=a.length-1;i;i--){var j=Math.floor(Math.random()*(i+1)),q=a[i];a[i]=a[j];a[j]=q;} return a; };
  G.dist = function (a,b,c,d) { return Math.hypot(a-c,b-d); };

  var cv=document.getElementById('c'), c=G.ctx=cv.getContext('2d',{alpha:false}), view=G.view={s:1,ox:0,oy:0,dpr:1};
  function resize(){ var cw=innerWidth,ch=innerHeight,dpr=Math.min(devicePixelRatio||1,2.5); view.s=Math.min(cw/W,ch/H); view.ox=(cw-W*view.s)/2; view.oy=(ch-H*view.s)/2; view.dpr=dpr; cv.width=Math.max(1,Math.round(cw*dpr)); cv.height=Math.max(1,Math.round(ch*dpr)); cv.style.width=cw+'px';cv.style.height=ch+'px'; var r=document.getElementById('rot'); if(r)r.classList.toggle('on',ch>cw*1.08); }
  addEventListener('resize',resize); addEventListener('orientationchange',function(){setTimeout(resize,120);}); resize();
  G.roundRect=function(x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();};
  G.panel=function(x,y,w,h,color,r){c.save();c.shadowColor=G.C.shadow;c.shadowBlur=18;c.shadowOffsetY=8;G.roundRect(x,y,w,h,r||28);c.fillStyle=color||G.C.cream;c.fill();c.shadowColor='transparent';c.restore();};
  G.text=function(s,x,y,o){o=o||{};c.save();c.font=(o.weight||900)+' '+(o.size||32)+'px "Trebuchet MS","Segoe UI",sans-serif';c.textAlign=o.align||'center';c.textBaseline=o.base||'middle';if(o.stroke){c.lineJoin='round';c.lineWidth=o.sw||8;c.strokeStyle=o.stroke;c.strokeText(String(s),x,y,o.max);}c.fillStyle=o.color||G.C.ink;c.fillText(String(s),x,y,o.max);c.restore();};
  G.shade=function(hex,n){var v=parseInt(hex.slice(1),16),r=G.clamp((v>>16)+n,0,255),g=G.clamp(((v>>8)&255)+n,0,255),b=G.clamp((v&255)+n,0,255);return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);};

  var AC=null;
  G.sfx=function(name){try{var C=window.AudioContext||window.webkitAudioContext;if(!C)return;if(!AC)AC=new C();var notes=name==='win'?[523,659,784,1046]:name==='bad'?[240,190]:name==='snap'?[620,900]:[500];notes.forEach(function(f,i){var o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+i*.08;o.type='triangle';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.14,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+.14);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.16);});}catch(e){}};
  G.say=function(s){try{if(!speechSynthesis||!s)return;speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(s);u.lang='it-IT';u.rate=.92;u.pitch=1.12;speechSynthesis.speak(u);}catch(e){}};

  var save;
  try{save=JSON.parse(localStorage.getItem('dino-officina.save')||'null');}catch(e){}
  if(!save||typeof save!=='object')save={level:1,stars:0,done:{},freeBuilds:0,mute:false};
  G.save=save; G.level=save.level===2?2:1;
  G.saveNow=function(){save.level=G.level;try{localStorage.setItem('dino-officina.save',JSON.stringify(save));}catch(e){}};

  var hot=[],next=[],pressed=null,pointer={x:0,y:0,down:false};G.pointer=pointer;G.ui={};
  function logical(e){var r=cv.getBoundingClientRect();return{x:(e.clientX-r.left-view.ox)/view.s,y:(e.clientY-r.top-view.oy)/view.s};}
  cv.addEventListener('pointerdown',function(e){var p=logical(e);pointer.x=p.x;pointer.y=p.y;pointer.down=true;for(var i=hot.length-1;i>=0;i--){var b=hot[i];if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h&&!b.disabled){pressed=b.id;if(b.onDown)b.onDown(p);break;}}if(cv.setPointerCapture)try{cv.setPointerCapture(e.pointerId);}catch(q){}e.preventDefault();});
  cv.addEventListener('pointermove',function(e){var p=logical(e);pointer.x=p.x;pointer.y=p.y;if(pointer.down&&G.dragMove)G.dragMove(p);e.preventDefault();});
  cv.addEventListener('pointerup',function(e){var p=logical(e);pointer.x=p.x;pointer.y=p.y;pointer.down=false;if(G.dragEnd){var fn=G.dragEnd;G.dragEnd=null;G.dragMove=null;fn(p);}else for(var i=hot.length-1;i>=0;i--){var b=hot[i];if(b.id===pressed&&p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h&&!b.disabled){if(b.onTap)b.onTap();break;}}pressed=null;e.preventDefault();});
  G.ui.button=function(o){o.id=o.id||o.label+'@'+o.x+','+o.y;next.push(o);c.save();var down=pressed===o.id&&pointer.down;c.translate(0,down?4:0);c.globalAlpha=o.disabled ? .45 : 1;G.roundRect(o.x,o.y,o.w,o.h,o.r||22);c.fillStyle=o.color||G.C.green;c.fill();c.lineWidth=o.border||4;c.strokeStyle=o.stroke||'rgba(38,52,58,.55)';c.stroke();if(o.icon)o.icon(c,o.x+o.w/2,o.y+o.h/2-(o.label?12:0));if(o.label)G.text(o.label,o.x+o.w/2,o.y+o.h/2+(o.sub? -10:0),{size:o.fontSize||30,color:o.textColor||G.C.cream,max:o.w-20});if(o.sub)G.text(o.sub,o.x+o.w/2,o.y+o.h/2+27,{size:o.subSize||18,color:o.textColor||G.C.cream,weight:750,max:o.w-16});c.restore();};
  G.ui.hit=function(o){o.id=o.id||'hit'+o.x+','+o.y;next.push(o);};

  var scenes={},cur=null;G.current='';
  G.scene=function(name,o){scenes[name]=o;};
  G.go=function(name,arg){if(cur&&cur.leave)cur.leave();G.current=name;cur=scenes[name];hot=[];next=[];G.dragMove=null;G.dragEnd=null;if(!cur)throw new Error('scena mancante: '+name);if(cur.enter)cur.enter(arg);};
  G.start=function(name){G.go(name);requestAnimationFrame(loop);};
  function loop(ms){var now=ms/1000||0;G.dt=G.t?Math.min(.05,now-G.t):1/60;G.t=now;G.frame++;next=[];c.setTransform(view.dpr,0,0,view.dpr,0,0);c.clearRect(0,0,cv.width,cv.height);c.translate(view.ox,view.oy);c.scale(view.s,view.s);if(cur&&cur.update)cur.update(G.dt);if(cur&&cur.draw)cur.draw(c);hot=next;requestAnimationFrame(loop);}
  G.workshopBg=function(){var g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#4d9eaa');g.addColorStop(.58,'#b9e2df');g.addColorStop(.59,'#c8a879');g.addColorStop(1,'#8e6f4e');c.fillStyle=g;c.fillRect(0,0,W,H);c.fillStyle='rgba(255,255,255,.16)';for(var x=35;x<W;x+=95){c.fillRect(x,80,8,260);}c.fillStyle='#7a5539';c.fillRect(0,548,W,18);};
})();
