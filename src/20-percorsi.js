/* Courses: a ground line sampled every 8 px, built from segments. The
   obstacles are what makes a piece necessary:
     steep (26°)    -> ruote grandi or cingoli       vsteep (38°) -> cingoli
     water          -> the barca                       gap          -> razzo, ali (or a fast ramp jump)
     wall           -> molla or razzo
   Every mission has a `sol`: the vehicle Piccolo sees as a silhouette, and the
   one test/smoke.js drives to the finish. */
(function () {
  'use strict';
  var STEP = 8, BASE = 520;

  function build(segs) {
    var ys = [], zone = [], obst = [], cps = [0], fruits = [], waters = [], y = BASE, x = 0;
    function put(yy, z) { ys.push(yy); zone.push(z || 0); x += STEP; }
    function fruitsAlong(x0, x1, lift) { for (var fx = x0 + 60; fx < x1 - 40; fx += 140) fruits.push({ x: fx, dy: lift || 70 }); }
    function smooth(t) { return t * t * (3 - 2 * t); }
    segs.forEach(function (s) {
      var k = s[0], L = s[1] || 0, h = s[2] || 0, x0 = x, i, n = Math.round(L / STEP);
      if (k !== 'flat' && k !== 'hills' && k !== 'down' && k !== 'finish') cps.push(Math.max(0, x0 - 160));
      if (k === 'flat') { for (i = 0; i < n; i++) put(y); fruitsAlong(x0, x); }
      else if (k === 'hills') { var bumps = Math.max(1, Math.round(L / 400)); for (i = 0; i < n; i++) put(y - h * (1 - Math.cos(Math.PI * 2 * bumps * i / n)) / 2); fruitsAlong(x0, x, 70 + h); }
      else if (k === 'up' || k === 'steep' || k === 'vsteep') { for (i = 0; i < n; i++) put(y - h * smooth(i / n)); y -= h; if (k !== 'up') obst.push({ k: k === 'vsteep' ? 'vsteep' : 'steep', x0: x0, x1: x }); fruitsAlong(x0, x, 60); }
      else if (k === 'down') { for (i = 0; i < n; i++) put(y + h * smooth(i / n)); y += h; fruitsAlong(x0, x, 60); }
      // a ramp is a kicker: straight, so it throws you at the lip, and any wheel can take it
      else if (k === 'ramp') { n = Math.round(150 / STEP); for (i = 0; i < n; i++) put(y - h * (i + 1) / n, 'ramp'); }
      else if (k === 'gap') {
        var top = ys[ys.length - 1];
        for (i = 0; i < n; i++) { put(9999, 'gap'); if (i % 6 === 3) fruits.push({ x: x - STEP / 2, y: top - 140 * Math.sin(Math.PI * (i + .5) / n) - 30, abs: true }); }
        y += h; obst.push({ k: 'gap', x0: x0, x1: x });
      }
      else if (k === 'water') {
        var wl = y, bank = 10, depth = h || 90; waters.push({ x0: x0, x1: x0 + L, level: wl });
        for (i = 0; i < n; i++) { var u = i < bank ? smooth(i / bank) : i > n - bank ? smooth((n - i) / bank) : 1; put(wl + depth * u, 'water'); }
        for (var wx = x0 + 120; wx < x - 80; wx += 130) fruits.push({ x: wx, y: wl - 70, abs: true });
        obst.push({ k: 'water', x0: x0, x1: x });
      }
      else if (k === 'wall') { put(y); y -= h; put(y); obst.push({ k: 'wall', x0: x0, x1: x }); }
      else if (k === 'finish') { for (i = 0; i < Math.round(700 / STEP); i++) put(y); }
    });
    fruits.forEach(function (f) { if (!f.abs) { var i = Math.min(ys.length - 1, Math.floor(f.x / STEP)); f.y = ys[i] - f.dy; } });
    return { ys: ys, zone: zone, obst: obst, cps: cps, fruits: fruits, waters: waters, len: x, finish: x - 500 };
  }

  var V = function (telaio, ruote, motore, extra) { return { telaio: telaio, ruote: ruote, motore: motore, extra: extra }; };
  var RACCOLTE = [
    { name: 'Prime gite', color: '#f5b82e', sky: ['#8fd8e8', '#e3f6f7'], missions: [
      { name: 'La prima gita', segs: [['flat', 400], ['hills', 1200, 26], ['flat', 300], ['hills', 800, 30], ['finish']], sol: V('auto', 'piccole', 'normale', 'niente') },
      { name: 'Su e giù', segs: [['flat', 300], ['up', 500, 85], ['down', 500, 85], ['hills', 800, 30], ['up', 400, 70], ['down', 400, 70], ['finish']], sol: V('auto', 'grandi', 'normale', 'niente') },
      { name: 'La rampa', segs: [['flat', 500], ['hills', 400, 20], ['flat', 200], ['ramp', 0, 90], ['gap', 230], ['flat', 400], ['ramp', 0, 90], ['gap', 250], ['flat', 400], ['finish']], sol: V('auto', 'piccole', 'turbo', 'niente') },
      { name: 'La salita ripida', segs: [['flat', 400], ['steep', 500, 165], ['flat', 300], ['down', 500, 165], ['flat', 200], ['steep', 450, 150], ['flat', 300], ['finish']], sol: V('auto', 'grandi', 'normale', 'niente') }] },
    { name: 'Acqua', color: '#4d80e4', sky: ['#7fd0f0', '#dff4fb'], missions: [
      { name: 'Il laghetto', segs: [['flat', 400], ['hills', 400, 24], ['water', 500, 90], ['flat', 400], ['finish']], sol: V('barca', 'piccole', 'elica', 'niente') },
      { name: 'Fiume e collina', segs: [['flat', 300], ['water', 400, 90], ['flat', 200], ['steep', 450, 150], ['down', 400, 150], ['water', 500, 90], ['flat', 300], ['finish']], sol: V('barca', 'grandi', 'elica', 'niente') },
      { name: 'Il fiume largo', segs: [['flat', 300], ['water', 1100, 100], ['flat', 200], ['hills', 500, 24], ['water', 700, 90], ['flat', 300], ['finish']], sol: V('barca', 'piccole', 'elica', 'niente') },
      { name: 'La cascata', segs: [['flat', 300], ['up', 400, 110], ['flat', 150], ['down', 300, 110], ['water', 600, 100], ['steep', 400, 135], ['flat', 300], ['finish']], sol: V('barca', 'grandi', 'elica', 'niente') }] },
    { name: 'Cielo', color: '#8f5bd6', sky: ['#b9a8f0', '#f0eaff'], missions: [
      { name: 'Il burrone', segs: [['flat', 400], ['hills', 400, 20], ['flat', 200], ['gap', 260, 60], ['flat', 400], ['finish']], sol: V('auto', 'piccole', 'normale', 'razzo') },
      { name: 'Salto lungo', segs: [['flat', 500], ['ramp', 0, 120], ['gap', 380, 100], ['flat', 500], ['finish']], sol: V('auto', 'piccole', 'normale', 'ali') },
      { name: 'Il muro', segs: [['flat', 400], ['wall', 0, 110], ['flat', 300], ['wall', 0, 110], ['flat', 300], ['finish']], sol: V('auto', 'piccole', 'normale', 'molla') },
      { name: 'Nuvole', segs: [['flat', 400], ['ramp', 0, 100], ['gap', 300, 60], ['flat', 250], ['wall', 0, 100], ['flat', 250], ['gap', 260, 60], ['flat', 300], ['finish']], sol: V('auto', 'piccole', 'normale', 'razzo') }] },
    { name: 'Montagna', color: '#2f9e57', sky: ['#a8d8c8', '#eef8f2'], missions: [
      { name: 'Cingoli in salita', segs: [['flat', 300], ['vsteep', 420, 220], ['flat', 300], ['down', 600, 220], ['flat', 200], ['vsteep', 380, 200], ['flat', 300], ['finish']], sol: V('auto', 'cingoli', 'normale', 'niente') },
      { name: 'Sassi e salite', segs: [['flat', 300], ['hills', 900, 30], ['steep', 500, 165], ['down', 400, 165], ['hills', 600, 28], ['steep', 450, 150], ['flat', 300], ['finish']], sol: V('auto', 'grandi', 'turbo', 'niente') },
      { name: 'Il ponte rotto', segs: [['flat', 300], ['steep', 450, 150], ['flat', 250], ['gap', 260, 60], ['flat', 250], ['down', 400, 90], ['flat', 300], ['finish']], sol: V('auto', 'grandi', 'normale', 'razzo') },
      { name: 'La vetta', segs: [['flat', 300], ['steep', 450, 150], ['flat', 200], ['vsteep', 380, 200], ['flat', 250], ['wall', 0, 100], ['flat', 300], ['finish']], sol: V('auto', 'cingoli', 'turbo', 'molla') }] },
    { name: 'Gran tour', color: '#ff6fae', sky: ['#ffc98a', '#fff1dc'], missions: [
      { name: 'Lago e collina', segs: [['flat', 300], ['water', 600, 90], ['flat', 200], ['steep', 450, 150], ['down', 450, 150], ['flat', 300], ['finish']], sol: V('barca', 'grandi', 'elica', 'niente') },
      { name: 'Fiume e burrone', segs: [['flat', 300], ['water', 500, 90], ['flat', 300], ['gap', 260, 60], ['flat', 300], ['finish']], sol: V('barca', 'piccole', 'elica', 'razzo') },
      { name: 'Palloncini', segs: [['flat', 600], ['ramp', 0, 110], ['gap', 520, 150], ['flat', 500], ['finish']], sol: V('auto', 'piccole', 'turbo', 'palloncini') },
      { name: 'Il gran tour', segs: [['flat', 300], ['hills', 500, 26], ['steep', 450, 150], ['down', 400, 150], ['water', 500, 90], ['flat', 250], ['gap', 260, 60], ['flat', 250], ['wall', 0, 100], ['flat', 300], ['finish']], sol: V('barca', 'grandi', 'turbo', 'razzo') }] }
  ];
  var MISSIONS = [];
  RACCOLTE.forEach(function (r, ri) { r.missions.forEach(function (m, mi) { m.r = ri; m.n = mi; m.idx = MISSIONS.length; m.course = build(m.segs); MISSIONS.push(m); }); });
  // free driving: a bit of everything, no stars
  var FREE = { name: 'Giro libero', r: 4, n: -1, idx: -1, segs: [['flat', 300], ['hills', 800, 26], ['ramp', 0, 80], ['gap', 120], ['flat', 300], ['up', 400, 100], ['down', 400, 100], ['water', 400, 80], ['flat', 300], ['hills', 600, 24], ['finish']] };
  FREE.course = build(FREE.segs);

  function groundAt(cs, x) {
    var f = x / STEP, i = Math.floor(f);
    if (i < 0) return { y: cs.ys[0], slope: 0, zone: 0 };
    if (i >= cs.ys.length - 1) return { y: cs.ys[cs.ys.length - 1], slope: 0, zone: 0 };
    var a = cs.ys[i], b = cs.ys[i + 1], z = cs.zone[i];
    if (z === 'gap' || a > 5000 || b > 5000) return { y: 99999, slope: 0, zone: 'gap' };
    return { y: a + (b - a) * (f - i), slope: (b - a) / STEP, zone: z };
  }
  function waterAt(cs, x) { for (var i = 0; i < cs.waters.length; i++) { var w = cs.waters[i]; if (x >= w.x0 && x <= w.x1) return w; } return null; }
  function obstacleAt(cs, x) { var best = null; cs.obst.forEach(function (o) { if (x >= o.x0 - 260 && x <= o.x1 + 60) best = o; }); return best; }

  G.percorsi = { RACCOLTE: RACCOLTE, MISSIONS: MISSIONS, FREE: FREE, groundAt: groundAt, waterAt: waterAt, obstacleAt: obstacleAt, STEP: STEP };
})();
