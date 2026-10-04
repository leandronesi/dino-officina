/* The workshop: four rows of pieces on the left, the vehicle on the lift on
   the right, and PROVA.
   Piccolo: a framed picture of the vehicle to build ("il progetto"); the rows
   that do not match it blink, a wrong card is gently refused, and PROVA
   lights up when the vehicle matches the picture — the old Officina puzzle.
   Grande: free choice. The mission shows what is on the road (hill, river,
   ravine, wall) as pictures, and working out which pieces it needs is the game. */
(function () {
  'use strict';
  var C = G.C, W = G.W, H = G.H;
  var S = {}, CARD = { w: 94, h: 112, gap: 8, x0: 126 }, ROWS = [118, 268, 418, 568];
  var LABEL = { telaio: 'Telaio', ruote: 'Ruote', motore: 'Motore', extra: 'Extra' };

  G.officinaSave = function () {
    var s = G.save.officina || (G.save.officina = {});
    s.open = s.open || 0; s.stars = s.stars || {}; s.builds = s.builds || {};
    return s;
  };
  function mission() { return S.mi >= 0 ? G.percorsi.MISSIONS[S.mi] : G.percorsi.FREE; }
  function matches(slot) { return S.mi < 0 || G.level !== 1 || S.v[slot] === mission().sol[slot]; }
  function allMatch() { return G.officina.SLOTS.every(matches); }

  function obstacleKinds(m) { var k = []; m.course.obst.forEach(function (o) { if (k.indexOf(o.k) < 0) k.push(o.k); }); return k; }
  function obstIcon(c, k, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#9fd18a'; G.roundRect(c, -40, -32, 80, 64, 14); c.fill();
    if (k === 'steep' || k === 'vsteep') { c.fillStyle = '#9a6b3f'; c.beginPath(); c.moveTo(-36, 28); c.lineTo(k === 'vsteep' ? 14 : 30, -22); c.lineTo(36, -22); c.lineTo(36, 28); c.fill(); c.fillStyle = '#4fae4a'; c.fillRect(-36, 24, 72, 6); }
    else if (k === 'water') { c.fillStyle = '#9a6b3f'; c.fillRect(-36, 6, 72, 22); c.fillStyle = '#3fa9d6'; c.fillRect(-24, 0, 48, 28); c.fillStyle = '#fff'; c.fillRect(-18, 6, 14, 3); c.fillRect(4, 12, 14, 3); }
    else if (k === 'gap') { c.fillStyle = '#9a6b3f'; c.fillRect(-36, 4, 24, 24); c.fillRect(12, 4, 24, 24); c.fillStyle = '#2b1d12'; c.fillRect(-12, 10, 24, 18); }
    else if (k === 'wall') { c.fillStyle = '#c8703a'; c.fillRect(-6, -24, 30, 52); c.strokeStyle = '#7a3b1a'; c.lineWidth = 3; for (var i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-6, -12 + i * 12); c.lineTo(24, -12 + i * 12); c.stroke(); } c.fillStyle = '#9a6b3f'; c.fillRect(-36, 20, 72, 8); }
    c.restore();
  }
  G.officinaObstIcon = obstIcon; G.officinaObstacleKinds = obstacleKinds;

  function enter(o) {
    o = o || {};
    var sv = G.officinaSave(), m;
    S = { mi: o.mi === undefined ? -1 : o.mi, refuse: 0, refuseSlot: null, hint: o.hint || null, snap: {} };
    m = mission();
    var prev = sv.builds[S.mi];
    if (o.keep && prev) S.v = JSON.parse(JSON.stringify(prev));
    else if (G.level === 1 && S.mi >= 0) S.v = { telaio: 'auto', ruote: 'piccole', motore: 'normale', extra: 'niente' };
    else S.v = prev ? JSON.parse(JSON.stringify(prev)) : { telaio: 'auto', ruote: 'piccole', motore: 'normale', extra: 'niente' };
    if (!G.mute) setTimeout(function () {
      if (G.current !== 'officina') return;
      if (S.mi < 0) G.say('Monta quello che vuoi, poi provalo!');
      else if (G.level === 1) G.say('Guarda il progetto e monta i pezzi giusti!');
      else G.say(m.name + '. Guarda cosa c\'è sulla strada e scegli i pezzi.');
    }, 300);
  }
  function choose(slot, id) {
    if (G.level === 1 && S.mi >= 0 && mission().sol[slot] !== id) {
      S.refuse = .6; S.refuseSlot = slot; G.sfx('bad'); G.say('Guarda il progetto!'); return;
    }
    S.v[slot] = id; S.snap[slot] = .35; G.sfx('pop');
    if (G.level === 1 && allMatch()) G.say('Perfetto! Ora tocca PROVA.');
  }
  function prova() {
    if (!allMatch()) { G.sfx('bad'); G.say('Mancano dei pezzi: guarda il progetto.'); return; }
    var sv = G.officinaSave(); sv.builds[S.mi] = JSON.parse(JSON.stringify(S.v)); G.saveNow();
    G.go('strada', { mi: S.mi, v: JSON.parse(JSON.stringify(S.v)) });
  }

  function draw(c) {
    var m = mission(), OF = G.officina;
    // the workshop: wall, pegboard, floor
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#4d9eaa'); g.addColorStop(.62, '#b9e2df'); g.addColorStop(.63, '#c8a879'); g.addColorStop(1, '#8e6f4e');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.12)'; for (var x = 30; x < W; x += 90) c.fillRect(x, 96, 6, 340);
    c.fillStyle = '#e9d3a8'; G.roundRect(c, 16, 104, 650, 600, 26); c.fill();
    c.fillStyle = 'rgba(122,74,38,.25)'; for (var px = 40; px < 650; px += 36) for (var py = 124; py < 690; py += 36) { c.beginPath(); c.arc(px, py, 3, 0, 7); c.fill(); }
    // top bar
    c.fillStyle = 'rgba(23,63,55,.92)'; c.fillRect(0, 0, W, 96);
    G.ui.button({ id: 'of-map', x: 16, y: 8, w: 200, h: 80, r: 24, color: C.water, label: 'Mappa', fontSize: 30, onTap: function () { G.go('menu'); } });
    G.text(S.mi >= 0 ? (G.percorsi.RACCOLTE[m.r].name + ' · ' + m.name) : 'Officina libera', 640, 48, { size: 34, color: C.sun, maxWidth: 760 });
    // the rows of pieces
    OF.SLOTS.forEach(function (slot, r) {
      var y = ROWS[r], ok = matches(slot), blink = !ok && Math.sin(G.t * 8) > 0;
      c.fillStyle = blink ? 'rgba(255,159,67,.45)' : 'rgba(255,255,255,.35)'; G.roundRect(c, 26, y - 8, 630, CARD.h + 16, 20); c.fill();
      G.text(LABEL[slot], 74, y + CARD.h / 2, { size: 21, color: C.leafDeep, maxWidth: 96 });
      if (G.level === 1 && S.mi >= 0 && ok) { c.fillStyle = C.leaf; c.beginPath(); c.arc(74, y + 20, 14, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.moveTo(67, y + 20); c.lineTo(73, y + 26); c.lineTo(82, y + 14); c.stroke(); }
      OF.PARTS[slot].forEach(function (p, i) {
        var cx = CARD.x0 + i * (CARD.w + CARD.gap), sel = S.v[slot] === p.id, shake = S.refuse > 0 && S.refuseSlot === slot ? Math.sin(G.t * 60) * 4 : 0;
        c.fillStyle = sel ? '#fff6e0' : 'rgba(255,246,224,.75)'; G.roundRect(c, cx + shake, y, CARD.w, CARD.h, 18); c.fill();
        if (sel) { c.strokeStyle = C.leaf; c.lineWidth = 6; G.roundRect(c, cx + 3, y + 3, CARD.w - 6, CARD.h - 6, 16); c.stroke(); }
        OF.drawPart(c, slot, p.id, cx + CARD.w / 2 + shake, y + 46, 62);
        G.text(p.name.replace('Ruote ', ''), cx + CARD.w / 2, y + CARD.h - 16, { size: 16, color: C.ink, maxWidth: CARD.w - 8 });
        G.ui.button({ id: 'pc-' + slot + i, ghost: true, x: cx, y: y, w: CARD.w, h: CARD.h, r: 18, onTap: function () { choose(slot, p.id); } });
      });
    });
    // the lift and the vehicle
    c.fillStyle = '#6e7780'; c.fillRect(760, 560, 340, 22); c.fillRect(920, 582, 20, 40);
    var bounce = 0; OF.SLOTS.forEach(function (s) { if (S.snap[s] > 0) bounce = Math.max(bounce, S.snap[s]); });
    OF.drawVehicle(c, S.v, 930, 560 - Math.sin(bounce * 9) * 10 * bounce, { s: 1.3, t: G.t, happy: G.level === 1 && allMatch() });
    // Piccolo: the picture to copy. Grande: what waits on the road.
    if (S.mi >= 0 && G.level === 1) {
      c.fillStyle = '#fff6e0'; G.roundRect(c, 760, 112, 340, 210, 20); c.fill(); c.strokeStyle = '#8a5a32'; c.lineWidth = 8; c.stroke();
      G.text('Il progetto', 930, 140, { size: 22, color: C.leafDeep });
      OF.drawVehicle(c, m.sol, 930, 300, { s: .72, t: G.t });
    } else if (S.mi >= 0) {
      c.fillStyle = 'rgba(255,246,224,.9)'; G.roundRect(c, 700, 112, 560, 150, 20); c.fill();
      G.text('Sulla strada:', 980, 140, { size: 22, color: C.leafDeep });
      var ks = obstacleKinds(m), x0 = 980 - (ks.length - 1) * 55;
      if (!ks.length) G.text('solo colline: buon viaggio!', 980, 205, { size: 22, color: C.ink });
      ks.forEach(function (k, i) { obstIcon(c, k, x0 + i * 110, 208, 1.05); });
      if (S.hint) { c.fillStyle = C.tangerine; G.roundRect(c, 700, 270, 560, 54, 18); c.fill(); G.text(G.strada.HINT[S.hint], 980, 297, { size: 21, color: '#fff', maxWidth: 540 }); }
    }
    var ready = allMatch();
    G.ui.button({ id: 'prova', x: 800, y: 612, w: 300, h: 96, r: 28, color: ready ? C.leaf : '#b9ada0', label: 'PROVA!', fontSize: 44, onTap: prova });
  }

  G.scene('officina', {
    hud: false, back: false, enter: enter, draw: draw,
    update: function (dt) { S.refuse = Math.max(0, S.refuse - dt); for (var k in S.snap) S.snap[k] = Math.max(0, S.snap[k] - dt); }
  });
  G.officinaShop = { state: function () { return S; }, choose: choose, prova: prova, allMatch: allMatch };
})();
