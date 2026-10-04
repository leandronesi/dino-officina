/* The map: five collections of four missions, one page each; a mission opens
   when the previous one is done. Plus the free workshop, always open. */
(function () {
  'use strict';
  var C = G.C, W = G.W, H = G.H, page = -1;
  var CARD = { w: 252, h: 290, y: 176, gap: 20 };

  function card(c, m, i, x, y, open, stars) {
    var r = G.percorsi.RACCOLTE[m.r];
    c.fillStyle = '#123d29'; G.roundRect(c, x, y + 8, CARD.w, CARD.h, 26); c.fill();
    c.fillStyle = C.cream; G.roundRect(c, x, y, CARD.w, CARD.h, 26); c.fill();
    c.fillStyle = r.color; G.roundRect(c, x + 12, y + 12, CARD.w - 24, 150, 18); c.fill();
    // Piccolo sees the project (it is his puzzle); for Grande the right pieces are the riddle, so no spoiler
    if (G.level === 1) G.officina.drawVehicle(c, m.sol, x + CARD.w / 2, y + 140, { s: .62, t: G.t });
    else { G.officina.drawVehicle(c, { telaio: 'auto', ruote: 'piccole', motore: 'normale', extra: 'niente' }, x + CARD.w / 2 - 24, y + 140, { s: .58, t: G.t, ghost: true }); c.fillStyle = '#fff6e0'; c.beginPath(); c.arc(x + CARD.w - 56, y + 74, 30, 0, 7); c.fill(); G.text('?', x + CARD.w - 56, y + 76, { size: 44, color: r.color }); }
    G.text((i + 1) + '. ' + m.name, x + CARD.w / 2, y + 188, { size: 23, color: C.leafDeep, maxWidth: CARD.w - 20 });
    var ks = G.officinaObstacleKinds(m), x0 = x + CARD.w / 2 - (ks.length - 1) * 30;
    ks.forEach(function (k, j) { G.officinaObstIcon(c, k, x0 + j * 60, y + 228, .62); });
    if (!ks.length) G.text('una bella gita', x + CARD.w / 2, y + 228, { size: 19, color: C.ink });
    for (var s = 0; s < 3; s++) A.star(c, x + CARD.w / 2 - 36 + s * 36, y + 268, 13, s < stars ? C.sun : '#d8cdb8');
    if (!open) {
      c.fillStyle = 'rgba(23,63,55,.66)'; G.roundRect(c, x, y, CARD.w, CARD.h, 26); c.fill();
      c.strokeStyle = C.cream; c.lineWidth = 9; c.beginPath(); c.arc(x + CARD.w / 2, y + 128, 20, Math.PI, 0); c.stroke();
      c.fillStyle = C.cream; G.roundRect(c, x + CARD.w / 2 - 30, y + 128, 60, 46, 10); c.fill();
    }
  }

  G.scene('menu', {
    hud: false, back: false,
    draw: function (c) {
      var sv = G.officinaSave(), R = G.percorsi.RACCOLTE, all = G.percorsi.MISSIONS;
      if (page < 0) page = all[Math.min(sv.open, all.length - 1)].r;
      var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#4d9eaa'); g.addColorStop(.7, '#b9e2df'); g.addColorStop(.71, '#c8a879'); g.addColorStop(1, '#8e6f4e');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      G.text('DINO OFFICINA', 640, 62, { size: 66, color: C.cream, stroke: C.leafDeep, strokeWidth: 12 });
      G.text((page + 1) + ' · ' + R[page].name, 640, 136, { size: 32, color: C.cream, stroke: C.leafDeep, strokeWidth: 8 });
      var list = R[page].missions, x0 = (W - (4 * CARD.w + 3 * CARD.gap)) / 2;
      list.forEach(function (m, j) {
        var x = x0 + j * (CARD.w + CARD.gap), open = m.idx <= sv.open;
        card(c, m, m.idx, x, CARD.y, open, sv.stars[m.idx] || 0);
        G.ui.button({ id: 'm' + m.idx, ghost: true, x: x, y: CARD.y, w: CARD.w, h: CARD.h, r: 26, onTap: function () {
          if (open) G.go('officina', { mi: m.idx });
          else { G.sfx('bad'); G.say('Prima finisci ' + all[m.idx - 1].name); }
        } });
      });
      [[-1, 46], [1, 1234]].forEach(function (d) {
        var to = page + d[0]; if (to < 0 || to >= R.length) return;
        G.ui.round({ id: 'pg' + d[0], x: d[1], y: 320, r: 46, color: C.sun, icon: function (cc, x, y) { cc.fillStyle = C.leafDeep; cc.beginPath(); cc.moveTo(x + d[0] * 20, y); cc.lineTo(x - d[0] * 13, y - 20); cc.lineTo(x - d[0] * 13, y + 20); cc.fill(); }, onTap: function () { page = to; G.sfx('whoosh'); } });
      });
      G.ui.button({ id: 'profiles', x: 20, y: 600, w: 260, h: 100, color: C.water, label: 'Cambia dino', onTap: function () { G.accounts.logout(); G.go('accesso'); } });
      G.ui.button({ id: 'free', x: 300, y: 600, w: 300, h: 100, color: C.plum, label: 'Officina libera', fontSize: 30, onTap: function () { G.go('officina', { mi: -1 }); } });
      var next = Math.min(sv.open, all.length - 1);
      G.ui.button({ id: 'play', x: 620, y: 594, w: 360, h: 110, r: 30, color: C.leaf, label: 'GIOCA!', onTap: function () { G.go('officina', { mi: next }); } });
      G.ui.button({ id: 'parents', x: 1000, y: 600, w: 260, h: 100, color: C.bark, label: 'Genitori', onTap: function () { G.go('gate'); } });
    }
  });
})();
