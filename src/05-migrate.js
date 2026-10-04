/* The old Dino Officina ran on its own small engine and kept its children in
   'dino-officina.profiles'. The new one shares the engine of Dino Run and
   Super Dino ('do.' keys). On the first start we carry every child over —
   same id, name, colour, age and three-figure secret — so nobody has to make
   their dino again, and the stars they earned come along. Runs once. */
(function () {
  'use strict';
  try {
    if (localStorage.getItem('do.accounts')) return;
    var old = JSON.parse(localStorage.getItem('dino-officina.profiles') || '[]');
    if (!Array.isArray(old) || !old.length) return;
    var list = old.map(function (p) {
      return { id: p.id, name: String(p.name || 'Dino').slice(0, 14), color: p.color || G.C.dino, level: p.level === 2 ? 2 : 1,
        secret: p.secret && p.secret.length === 3 ? p.secret : null, created: p.created || Date.now() };
    });
    list.forEach(function (p) {
      var prev = {};
      try { prev = JSON.parse(localStorage.getItem('dino-officina.save.' + p.id) || '{}') || {}; } catch (e) {}
      localStorage.setItem('do.save.' + p.id, JSON.stringify({ fruits: 0, stars: Math.max(0, prev.stars | 0), mute: !!prev.mute, hat: null, hats: [], conta: {}, fili: {}, nido: {}, seen: {}, playSec: 0, updated: 0 }));
    });
    localStorage.setItem('do.accounts', JSON.stringify(list));
    var last = localStorage.getItem('dino-officina.last');
    if (last) localStorage.setItem('do.last', JSON.stringify(last));
  } catch (e) { /* a broken old save must never stop the game from starting */ }
})();
