(function(){'use strict';
  Object.assign(G.C,{dino:'#57c98a',blueberry:'#4d80e4',pinkPop:'#ff6fae',tangerine:'#ff9f43',water:'#52b9d8',berry:'#ef6571',mint:'#38b997',leaf:'#4d9850',leafLight:'#91c55b',leafDeep:'#183f37',bark:'#815b3a'});
  var round=G.roundRect;
  G.roundRect=function(){var a=Array.prototype.slice.call(arguments);if(typeof a[0]==='object')a.shift();return round.apply(G,a);};
})();
