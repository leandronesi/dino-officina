/* Bridge the smaller workshop engine to the family account UI. Saves stay local. */
(function(){'use strict';
  G.accounts.byId=function(id){return G.accounts.list().filter(function(p){return p.id===id;})[0]||null;};
  G.familyLogin=G._profileLogin;
  G.accounts.login=function(id){var p=G.accounts.byId(id);if(!p)return false;if(p.secret&&p.secret.length){G.go('segreto',{id:id});return true;}G._profileLogin(id);G.go('menu');return true;};
  var create=G.accounts.create;
  G.accounts.create=function(o){var p=create(o);p.secretVersion=2;try{localStorage.setItem(G._profilesKey,JSON.stringify(G._profiles));}catch(e){}return p;};
  G.hush=function(){if(window.speechSynthesis)speechSynthesis.cancel();};
  G.shake=function(){};
  G.fx={confetti:function(){}};
  var button=G.ui.button,text=G.text;
  G.text=function(s,x,y,o){o=Object.assign({},o);o.max=o.max||o.maxWidth;o.sw=o.sw||o.strokeWidth;return text(s,x,y,o);};
  G.ui.button=function(o){if(o.ghost){G.ui.hit(o);return;}button(o);};
  G.ui.round=function(o){G.ui.button(Object.assign({},o,{x:o.x-o.r,y:o.y-o.r,w:o.r*2,h:o.r*2,r:o.r,icon:o.icon?function(c,x,y){o.icon(c,x,y,o.r);}:null}));};
  G.prompt=function(title,value,done){
    var overlay=document.getElementById('family-name-dialog'),input=document.getElementById('family-name-input');
    overlay.classList.add('open');input.value=value||'';
    var previous=document.activeElement;
    function finish(v){overlay.classList.remove('open');done(v);if(previous&&previous.focus)previous.focus();}
    document.getElementById('family-name-ok').onclick=function(){var v=input.value.trim();if(v)finish(v);else input.focus();};
    document.getElementById('family-name-cancel').onclick=function(){finish(null);};
    input.onkeydown=function(e){if(e.key==='Enter')document.getElementById('family-name-ok').onclick();if(e.key==='Escape')finish(null);};
    setTimeout(function(){input.focus();},50);
  };
})();
