(function(){'use strict';
  var asked=false;addEventListener('pointerdown',function(){if(asked)return;asked=true;try{if(matchMedia('(pointer: coarse)').matches&&!document.fullscreenElement)document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(function(){});}catch(e){}},{passive:true});
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&navigator.wakeLock)navigator.wakeLock.request('screen').catch(function(){});});
  G.start('accesso');
})();
