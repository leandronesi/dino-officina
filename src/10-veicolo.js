/* The vehicle: four slots, and every piece changes how it drives.
     telaio  auto (fast on land) | barca (floats, a bit slower on land)
     ruote   piccole (fast, climbs little) | grandi (climbs hills) | cingoli (climbs anything, slow)
     motore  normale | turbo (faster, a little more grip) | elica (pushes in water)
     extra   niente | razzo (button: thrust) | ali (glide) | palloncini (light) | molla (button: jump)
   The numbers are what the courses are built around: a 'ripida' hill is 26°,
   piccole hold 16° (21° with the turbo), grandi 30°, cingoli 44°. */
(function () {
  'use strict';
  var C = G.C;
  var SLOTS = ['telaio', 'ruote', 'motore', 'extra'];
  var PARTS = {
    telaio: [{ id: 'auto', name: 'Macchina' }, { id: 'barca', name: 'Barca' }],
    ruote: [{ id: 'piccole', name: 'Ruote piccole' }, { id: 'grandi', name: 'Ruote giganti' }, { id: 'cingoli', name: 'Cingoli' }],
    motore: [{ id: 'normale', name: 'Motore' }, { id: 'turbo', name: 'Turbo' }, { id: 'elica', name: 'Elica' }],
    extra: [{ id: 'niente', name: 'Niente' }, { id: 'razzo', name: 'Razzo' }, { id: 'ali', name: 'Ali' }, { id: 'palloncini', name: 'Palloncini' }, { id: 'molla', name: 'Molla' }]
  };
  var WHEEL_R = { piccole: 19, grandi: 31, cingoli: 22 };

  function stats(v) {
    var w = v.ruote, m = v.motore;
    return {
      speed: 330 * ({ piccole: 1.15, grandi: .95, cingoli: .7 })[w] * ({ normale: 1, turbo: 1.35, elica: .85 })[m] * (v.telaio === 'barca' ? .88 : 1) * (v.extra === 'palloncini' ? .9 : 1),
      accel: 430 * ({ normale: 1, turbo: 1.3, elica: .9 })[m],
      climb: ({ piccole: 16, grandi: 30, cingoli: 44 })[w] + (m === 'turbo' ? 5 : 0),
      floats: v.telaio === 'barca', swim: m === 'elica' ? 1.15 : .6,
      gravity: v.extra === 'palloncini' ? .55 : 1, glide: v.extra === 'ali', rocket: v.extra === 'razzo', spring: v.extra === 'molla',
      wheel: WHEEL_R[w]
    };
  }

  /* ---------------------------------------------------------------- drawing
     (x, y) = the ground under the middle of the vehicle; s = scale (1 = road size). */
  function wheel(c, x, y, r, rot) {
    c.fillStyle = '#2b2b33'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.fillStyle = '#c9ced4'; c.beginPath(); c.arc(x, y, r * .5, 0, 7); c.fill();
    c.strokeStyle = '#6e7780'; c.lineWidth = r * .14;
    for (var k = 0; k < 3; k++) { var a = rot + k * 2.094; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .5); c.stroke(); }
  }
  function drawVehicle(c, v, x, y, o) {
    o = o || {};
    var s = o.s || 1, ang = o.ang || 0, rot = o.rot || 0, t = o.t || G.t, col = o.color || (G.account && G.account.color) || C.dino;
    var r = WHEEL_R[v.ruote] || 20, bodyY = -r - 8;
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(ang);
    if (o.ghost) c.globalAlpha = .28;
    // palloncini above everything else, on strings
    if (v.extra === 'palloncini') {
      [[-30, -150, C.berry], [8, -168, C.sun], [40, -146, C.blueberry]].forEach(function (b, i) {
        var bob = Math.sin(t * 2 + i) * 4;
        c.strokeStyle = '#6e7780'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, bodyY - 40); c.lineTo(b[0], b[1] + 26 + bob); c.stroke();
        c.fillStyle = b[2]; c.beginPath(); c.ellipse(b[0], b[1] + bob, 20, 25, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(b[0] - 7, b[1] - 8 + bob, 5, 8, -.4, 0, 7); c.fill();
      });
    }
    if (v.extra === 'ali') {
      c.fillStyle = '#e9f3f7'; c.strokeStyle = '#7fa6b5'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-60, bodyY - 30); c.quadraticCurveTo(-10, bodyY - 70, 75, bodyY - 44); c.lineTo(70, bodyY - 30); c.quadraticCurveTo(0, bodyY - 42, -60, bodyY - 30); c.fill(); c.stroke();
    }
    // the driver: a little dino behind the dashboard
    if (window.A && A.dino) A.dino(c, 4, bodyY - 18, 64, { facing: 1, pose: o.happy ? 'happy' : 'idle', t: t, color: col, hat: null });
    // engine at the back
    if (v.motore === 'elica') {
      c.fillStyle = '#6e7780'; c.fillRect(-92, bodyY - 30, 14, 18);
      c.save(); c.translate(-96, bodyY - 21); c.scale(.35, 1); c.rotate(t * 30);
      c.fillStyle = '#8a5a32'; c.fillRect(-4, -30, 8, 60); c.fillRect(-30, -4, 60, 8); c.restore();
    } else {
      c.fillStyle = v.motore === 'turbo' ? '#e8362b' : '#7b8188'; G.roundRect(c, -96, bodyY - 36, 30, 28, 6); c.fill();
      c.fillStyle = '#4a4f55'; c.fillRect(-104, bodyY - 20, 12, 7);
      if (v.motore === 'turbo') { c.fillStyle = C.sun; c.beginPath(); c.moveTo(-84, bodyY - 36); c.lineTo(-80, bodyY - 48); c.lineTo(-76, bodyY - 36); c.fill(); }
      if (o.gas) { c.fillStyle = 'rgba(200,200,200,.6)'; c.beginPath(); c.arc(-112 - (t * 60 % 20), bodyY - 18, 7, 0, 7); c.fill(); }
    }
    // body
    if (v.telaio === 'barca') {
      c.fillStyle = '#b07a44'; c.beginPath(); c.moveTo(-82, bodyY - 30); c.lineTo(84, bodyY - 30); c.lineTo(66, bodyY + 6); c.lineTo(-70, bodyY + 6); c.closePath(); c.fill();
      c.fillStyle = '#8a5a32'; c.fillRect(-82, bodyY - 30, 166, 8);
      c.fillStyle = '#fff6e0'; c.beginPath(); c.arc(50, bodyY - 12, 7, 0, 7); c.fill(); c.strokeStyle = C.berry; c.lineWidth = 3; c.stroke();
    } else {
      c.fillStyle = col; G.roundRect(c, -82, bodyY - 32, 166, 40, 16); c.fill();
      c.fillStyle = G.shade ? G.shade(col, -40) : col; c.fillRect(-82, bodyY - 4, 166, 8);
      c.fillStyle = '#bfe7f5'; G.roundRect(c, 40, bodyY - 56, 30, 28, 8); c.fill();
      c.fillStyle = C.sun; c.beginPath(); c.arc(78, bodyY - 16, 6, 0, 7); c.fill();
    }
    if (v.extra === 'razzo') {
      c.fillStyle = '#e9e2d0'; G.roundRect(c, -60, bodyY - 56, 70, 22, 11); c.fill();
      c.fillStyle = C.berry; c.beginPath(); c.moveTo(10, bodyY - 56); c.lineTo(28, bodyY - 45); c.lineTo(10, bodyY - 34); c.fill();
      c.fillStyle = C.berry; c.fillRect(-60, bodyY - 60, 12, 30);
      if (o.boost) { c.fillStyle = C.tangerine; c.beginPath(); c.moveTo(-60, bodyY - 52); c.lineTo(-100 - Math.sin(t * 40) * 10, bodyY - 45); c.lineTo(-60, bodyY - 38); c.fill(); c.fillStyle = C.sun; c.beginPath(); c.moveTo(-60, bodyY - 49); c.lineTo(-80, bodyY - 45); c.lineTo(-60, bodyY - 41); c.fill(); }
    }
    if (v.extra === 'molla') {
      c.strokeStyle = '#4d80e4'; c.lineWidth = 5; c.beginPath();
      var sq = o.spring ? 6 : 14;
      for (var k = 0; k <= 6; k++) c.lineTo(-30 + (k % 2) * 14, bodyY + 6 + k * sq / 6 * (r / 14));
      c.stroke();
    }
    // wheels / tracks
    if (v.ruote === 'cingoli') {
      c.fillStyle = '#3a3d44'; G.roundRect(c, -64, -2 * r, 128, 2 * r, r); c.fill();
      c.strokeStyle = '#6e7780'; c.lineWidth = 3; c.setLineDash ? c.setLineDash([6, 6]) : 0; c.lineDashOffset = -rot * 10;
      G.roundRect(c, -64, -2 * r, 128, 2 * r, r); c.stroke(); if (c.setLineDash) c.setLineDash([]);
      wheel(c, -42, -r, r * .7, rot); wheel(c, 42, -r, r * .7, rot); wheel(c, 0, -r, r * .55, rot);
    } else { wheel(c, -52, -r, r, rot); wheel(c, 52, -r, r, rot); }
    c.restore();
  }

  /* one piece alone, for the cards in the workshop */
  function drawPart(c, cat, id, x, y, sz) {
    var f = sz / 60, base = { telaio: 'auto', ruote: 'piccole', motore: 'normale', extra: 'niente' };
    c.save(); c.translate(x, y); c.scale(f, f);
    if (cat === 'ruote') {
      if (id === 'cingoli') { c.fillStyle = '#3a3d44'; G.roundRect(c, -40, -16, 80, 32, 16); c.fill(); wheel(c, -24, 0, 12, 0); wheel(c, 24, 0, 12, 0); }
      else wheel(c, 0, 0, WHEEL_R[id] * 1.15, .5);
    } else if (cat === 'extra') {
      if (id === 'niente') { c.strokeStyle = '#b9ada0'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 22, 0, 7); c.moveTo(-15, 15); c.lineTo(15, -15); c.stroke(); }
      else { var v = { telaio: 'none', ruote: 'none', motore: 'none', extra: id }; drawExtraIcon(c, id); }
    } else if (cat === 'motore') {
      if (id === 'elica') { c.fillStyle = '#8a5a32'; c.save(); c.rotate(.5); c.fillRect(-6, -34, 12, 68); c.fillRect(-34, -6, 68, 12); c.restore(); c.fillStyle = '#6e7780'; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.fill(); }
      else { c.fillStyle = id === 'turbo' ? '#e8362b' : '#7b8188'; G.roundRect(c, -30, -22, 60, 44, 10); c.fill(); c.fillStyle = '#4a4f55'; c.fillRect(-42, 0, 14, 9); if (id === 'turbo') { c.fillStyle = C.sun; c.beginPath(); c.moveTo(-6, -22); c.lineTo(0, -40); c.lineTo(6, -22); c.fill(); } }
    } else {
      if (id === 'barca') { c.fillStyle = '#b07a44'; c.beginPath(); c.moveTo(-44, -14); c.lineTo(44, -14); c.lineTo(32, 16); c.lineTo(-34, 16); c.closePath(); c.fill(); c.fillStyle = '#8a5a32'; c.fillRect(-44, -14, 88, 6); }
      else { c.fillStyle = (G.account && G.account.color) || C.dino; G.roundRect(c, -44, -14, 88, 28, 10); c.fill(); c.fillStyle = '#bfe7f5'; G.roundRect(c, 14, -30, 20, 18, 5); c.fill(); }
    }
    c.restore();
  }
  function drawExtraIcon(c, id) {
    if (id === 'razzo') { c.rotate(-.6); c.fillStyle = '#e9e2d0'; G.roundRect(c, -30, -11, 56, 22, 11); c.fill(); c.fillStyle = C.berry; c.beginPath(); c.moveTo(26, -11); c.lineTo(42, 0); c.lineTo(26, 11); c.fill(); c.fillStyle = C.tangerine; c.beginPath(); c.moveTo(-30, -7); c.lineTo(-48, 0); c.lineTo(-30, 7); c.fill(); }
    else if (id === 'ali') { c.fillStyle = '#e9f3f7'; c.strokeStyle = '#7fa6b5'; c.lineWidth = 4; c.beginPath(); c.moveTo(-44, 8); c.quadraticCurveTo(0, -36, 44, -4); c.lineTo(40, 10); c.quadraticCurveTo(0, -6, -44, 8); c.fill(); c.stroke(); }
    else if (id === 'palloncini') { [[-16, -6, C.berry], [6, -18, C.sun], [20, 0, C.blueberry]].forEach(function (b) { c.fillStyle = b[2]; c.beginPath(); c.ellipse(b[0], b[1], 14, 18, 0, 0, 7); c.fill(); }); c.strokeStyle = '#6e7780'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 34); c.lineTo(-16, 12); c.moveTo(0, 34); c.lineTo(6, 0); c.moveTo(0, 34); c.lineTo(20, 18); c.stroke(); }
    else if (id === 'molla') { c.strokeStyle = '#4d80e4'; c.lineWidth = 7; c.beginPath(); for (var k = 0; k <= 6; k++) c.lineTo(k % 2 ? 18 : -18, 30 - k * 10); c.stroke(); c.fillStyle = C.berry; G.roundRect(c, -24, -36, 48, 10, 5); c.fill(); }
  }

  G.officina = { SLOTS: SLOTS, PARTS: PARTS, stats: stats, drawVehicle: drawVehicle, drawPart: drawPart, WHEEL_R: WHEEL_R };
})();
