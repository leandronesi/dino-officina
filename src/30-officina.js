/* The workshop: four rows of pieces on the left, the vehicle on the lift on
   the right, and PROVA.
   A new mission starts from an empty frame and any piece can go on: the road
   decides. A wrong piece is not refused here — the vehicle just will not
   climb the hill, float on the river or clear the ravine, and the road says
   why and offers 'Aggiusta'.
   Piccolo: a framed picture of the vehicle ('il progetto') to copy; a green
   tick marks every row that matches it. Grande: no picture; the mission shows
   what is on the road (hill, river, ravine, wall), and working out which
   pieces it needs is the game. */
(function () {
  'use strict';
  var C = G.C, W = G.W, H = G.H;
  var S = {}, CARD = { w: 94, h: 112, gap: 8, x0: 126 }, ROWS = [118, 268, 418, 568];
  var LABEL = { telaio: 'Telaio', ruote: 'Ruote', motore: 'Motore', extra: 'Extra' };
  var PART_TIP = {
    auto: 'La macchina va più veloce sulla terra.', barca: 'La barca galleggia sull’acqua.',
    piccole: 'Le ruote piccole corrono in piano.', grandi: 'Le ruote grandi scalano le salite.', cingoli: 'I cingoli salgono anche sui pendii più ripidi.',
    normale: 'Il motore va bene per una gita.', turbo: 'Il turbo ti fa andare più veloce.', elica: 'L’elica spinge la barca in acqua.',
    niente: 'Il veicolo è più semplice, senza extra.', razzo: 'Tocca il razzo per volare sopra gli ostacoli.', ali: 'Le ali ti fanno planare dopo una rampa.',
    palloncini: 'I palloncini ti fanno scendere piano.', molla: 'Tocca la molla per saltare in alto.'
  };

  G.officinaSave = function () {
    var s = G.save.officina || (G.save.officina = {});
    s.open = s.open || 0; s.stars = s.stars || {}; s.builds = s.builds || {};
    return s;
  };
  function mission() { return S.mi >= 0 ? G.percorsi.MISSIONS[S.mi] : G.percorsi.freeTrack(S.track); }
  // the project is a picture to copy, never a lock: any piece can go on, and the road decides
  function matches(slot) { return S.mi >= 0 && G.level === 1 && S.v[slot] === mission().sol[slot]; }
  function complete() { return G.officina.SLOTS.every(function (s) { return !!S.v[s]; }); }
  var EMPTY = function () { return { telaio: null, ruote: null, motore: null, extra: null }; };

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
    S = { mi: o.mi === undefined ? -1 : o.mi, hint: o.hint || null, track: sv.track || 'colline', snap: {}, tip: '', preview: 0 };
    m = mission();
    var prev = sv.builds[S.mi];
    S.v = prev ? Object.assign(EMPTY(), prev) : EMPTY();
    var current = S;
    if (!G.mute) setTimeout(function () {
      if (G.current !== 'officina' || S !== current || S.tip) return;
      if (S.mi < 0) G.say('Monta quello che vuoi, poi provalo!');
      else if (G.level === 1) G.say('Guarda il progetto e monta i pezzi!');
      else G.say(m.name + '. Guarda cosa c\'è sulla strada e scegli i pezzi.');
    }, 300);
  }
  function saveBuild() {
    G.officinaSave().builds[S.mi] = Object.assign({}, S.v);
    G.saveNow();
  }
  function choose(slot, id) {
    S.v[slot] = id; S.snap[slot] = .35; S.preview = 0; S.hint = null;
    S.tip = PART_TIP[id]; saveBuild(); G.sfx('pop');
    var missing = G.officina.SLOTS.find(function (s) { return !S.v[s]; });
    G.say(S.tip + (!missing ? ' Puoi provare su strada.' : missing === 'extra' ? ' Scegli un extra, oppure Nessuno.' : ''));
  }
  function chooseTrack(key) {
    S.track = key; S.hint = null; S.tip = '';
    G.officinaSave().track = key; G.saveNow();
    G.say(G.percorsi.freeTrack(key).tip);
  }
  function prova() {
    if (!complete()) {
      var missing = G.officina.SLOTS.find(function (slot) { return !S.v[slot]; });
      S.tip = 'Scegli un pezzo nella riga ' + LABEL[missing] + '.';
      G.sfx('tap'); G.say(S.tip); return;
    }
    G.go('strada', { mi: S.mi, v: Object.assign({}, S.v), track: S.track });
  }

  function draw(c) {
    var m = mission(), OF = G.officina;
    // the workshop: wall, pegboard, floor
    c.fillStyle = '#1c3446'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#27485b'; G.roundRect(c, 675, 104, 589, 600, 26); c.fill();
    c.fillStyle = '#365a6d';
    for (var x = 700; x < 1240; x += 26) c.fillRect(x, 112, 1, 572);
    for (var y0 = 126; y0 < 698; y0 += 26) c.fillRect(682, y0, 575, 1);
    c.fillStyle = '#304f60'; G.roundRect(c, 16, 104, 650, 600, 26); c.fill();
    // top bar
    c.fillStyle = '#122c3a'; c.fillRect(0, 0, W, 96);
    G.ui.button({ id: 'of-map', x: 16, y: 8, w: 200, h: 80, r: 24, color: C.water, label: 'Mappa', fontSize: 30, onTap: function () { G.go('menu'); } });
    G.text(S.mi >= 0 ? (G.percorsi.RACCOLTE[m.r].name + ' · ' + m.name) : 'Officina libera', 640, 48, { size: 34, color: C.sun, maxWidth: 760 });
    if (OF.SLOTS.some(function (slot) { return !!S.v[slot]; })) {
      G.ui.button({ id: 'of-clear', x: 1072, y: 16, w: 188, h: 64, r: 20, color: '#39596b', label: 'Smonta tutto', fontSize: 23, onTap: function () {
        S.v = EMPTY(); S.preview = 0; S.hint = null; S.tip = 'Scegli i pezzi per il prossimo veicolo.'; saveBuild();
      } });
    }
    // the rows of pieces
    OF.SLOTS.forEach(function (slot, r) {
      var y = ROWS[r], ok = matches(slot);
      c.fillStyle = S.v[slot] ? '#3e6575' : '#234454'; G.roundRect(c, 26, y - 8, 630, CARD.h + 16, 20); c.fill();
      G.text(LABEL[slot], 74, y + CARD.h / 2, { size: 21, color: C.cream, maxWidth: 96 });
      if (ok) { c.fillStyle = C.leaf; c.beginPath(); c.arc(74, y + 20, 14, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.moveTo(67, y + 20); c.lineTo(73, y + 26); c.lineTo(82, y + 14); c.stroke(); }
      OF.PARTS[slot].forEach(function (p, i) {
        var cx = CARD.x0 + i * (CARD.w + CARD.gap), sel = S.v[slot] === p.id;
        c.fillStyle = sel ? '#fff0ad' : '#e4edf1'; G.roundRect(c, cx, y, CARD.w, CARD.h, 18); c.fill();
        if (sel) { c.strokeStyle = '#f4b646'; c.lineWidth = 5; G.roundRect(c, cx + 3, y + 3, CARD.w - 6, CARD.h - 6, 16); c.stroke(); }
        OF.drawPart(c, slot, p.id, cx + CARD.w / 2, y + 46, 62);
        G.text(p.name.replace('Ruote ', ''), cx + CARD.w / 2, y + CARD.h - 16, { size: 16, color: C.ink, maxWidth: CARD.w - 8 });
        G.ui.button({ id: 'pc-' + slot + i, ghost: true, x: cx, y: y, w: CARD.w, h: CARD.h, r: 18, onTap: function () { choose(slot, p.id); } });
      });
    });
    // the lift and the vehicle
    c.fillStyle = '#152e3e'; G.roundRect(c, 750, 551, 422, 30, 13); c.fill();
    c.fillStyle = '#f4b646';
    for (var stripe = 766; stripe < 1154; stripe += 38) c.fillRect(stripe, 560, 18, 9);
    var bounce = 0; OF.SLOTS.forEach(function (s) { if (S.snap[s] > 0) bounce = Math.max(bounce, S.snap[s]); });
    var active = S.preview > 0;
    var lift = active ? 56 * Math.sin(Math.PI * S.preview / 1.2) : 0;
    OF.drawVehicle(c, S.v, 1027 + (active ? (1.2 - S.preview) * 22 : 0), 552 - lift - Math.sin(bounce * 9) * 10 * bounce,
      { s: 1.43, t: G.t, happy: complete(), boost: active && S.v.extra === 'razzo', spring: active && S.v.extra === 'molla' });
    if (complete() && (S.v.extra === 'razzo' || S.v.extra === 'molla')) {
      G.ui.button({ id: 'of-preview', x: 692, y: 440, w: 157, h: 62, r: 18, color: C.plum, label: S.v.extra === 'razzo' ? 'Accendi razzo' : 'Prova molla', fontSize: 20,
        onTap: function () { S.preview = 1.2; G.sfx(S.v.extra === 'razzo' ? 'whoosh' : 'pop'); } });
    }
    // Piccolo: the picture to copy. Grande: what waits on the road.
    if (S.mi >= 0 && G.level === 1) {
      c.fillStyle = '#fff6e0'; G.roundRect(c, 760, 112, 340, 150, 20); c.fill(); c.strokeStyle = '#8a5a32'; c.lineWidth = 8; c.stroke();
      G.text('Il progetto', 930, 140, { size: 22, color: C.leafDeep });
      OF.drawVehicle(c, m.sol, 930, 249, { s: .65, t: G.t });
    } else if (S.mi >= 0) {
      c.fillStyle = 'rgba(255,246,224,.9)'; G.roundRect(c, 700, 112, 560, 150, 20); c.fill();
      G.text('Sulla strada:', 980, 140, { size: 22, color: C.leafDeep });
      var ks = obstacleKinds(m), x0 = 980 - (ks.length - 1) * 55;
      if (!ks.length) G.text('solo colline: buon viaggio!', 980, 205, { size: 22, color: C.ink });
      ks.forEach(function (k, i) { obstIcon(c, k, x0 + i * 110, 208, 1.05); });
    } else {
      G.text('Scegli la pista di prova', 970, 136, { size: 30, color: C.cream });
      Object.keys(G.percorsi.FREE_TRACKS).forEach(function (key, i) {
        var track = G.percorsi.FREE_TRACKS[key];
        G.ui.button({ id: 'track-' + key, x: 710 + i * 172, y: 167, w: 160, h: 75, r: 19,
          color: track === m ? C.plum : '#3d687b', label: track.name, fontSize: 27, onTap: function () { chooseTrack(key); } });
      });
    }
    var tip = S.hint ? G.strada.HINT[S.hint] : S.tip || (S.mi < 0 ? m.tip : '');
    if (tip) {
      c.fillStyle = '#1b3546'; G.roundRect(c, 700, 272, 540, 52, 16); c.fill();
      G.text(tip, 970, 298, { size: 22, color: C.cream, maxWidth: 511 });
    }
    var ready = complete();
    var count = OF.SLOTS.filter(function (s) { return !!S.v[s]; }).length;
    G.text(count + ' di 4 pezzi montati', 950, 600, { size: 22, color: '#fff6e0', stroke: '#59402f', strokeWidth: 5 });
    G.ui.button({ id: 'prova', x: 762, y: 617, w: 376, h: 90, r: 28, color: ready ? C.leaf : '#77695e', label: 'Prova su strada', fontSize: 34, onTap: prova });
  }

  G.scene('officina', {
    hud: false, back: false, enter: enter, draw: draw,
    update: function (dt) { S.preview = Math.max(0, S.preview - dt); for (var k in S.snap) S.snap[k] = Math.max(0, S.snap[k] - dt); }
  });
  G.officinaShop = { state: function () { return S; }, choose: choose, chooseTrack: chooseTrack, prova: prova, complete: complete, matches: matches };
})();
