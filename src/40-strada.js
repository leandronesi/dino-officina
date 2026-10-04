/* The road: drive what you built. Side view, the vehicle is a point on the
   ground line with a velocity — simple enough to be sure about, rich enough
   that every piece shows: grip on hills, speed, floating, flying.

   No punishment: falling in a river or a ravine puts you back just before it,
   with a hint about the piece that would help; being stuck on a hill for a few
   seconds offers to go back to the workshop and fix the vehicle.
   All rules live in S (plain data, fixed 1/60 s step) for test/smoke.js. */
(function () {
  'use strict';
  var C = G.C, W = G.W, H = G.H, DT = 1 / 60, GRAV = 1400;
  var P = function () { return G.percorsi; }, O = function () { return G.officina; };
  var S = null, quiet = false, acc = 0, touches = {}, keys = {};

  var HINT = {
    steep: 'Troppo ripida! Servono ruote più grandi.',
    vsteep: 'Ripidissima! Solo i cingoli si arrampicano qui.',
    water: 'Splash! Per l\'acqua serve la barca.',
    gap: 'Il burrone è largo: prova il razzo, le ali o i palloncini.',
    wall: 'Il muro è alto: serve la molla o il razzo.'
  };

  function sfx(n) { if (!quiet) G.sfx(n); }
  function say(s) { if (!quiet) G.say(s); }
  function course() { return S.mi < 0 ? P().FREE.course : P().MISSIONS[S.mi].course; }
  function mission() { return S.mi < 0 ? P().FREE : P().MISSIONS[S.mi]; }

  function reset(mi, v) {
    var cs = (mi < 0 ? P().FREE : P().MISSIONS[mi]).course;
    S = { mi: mi, v: v, phase: 'drive', t: 0, x: 120, y: cs.ys[15], vx: 0, vy: 0, on: true, ang: 0, rot: 0, got: {}, fruit: 0, fails: 0, failAt: {},
      rt: 0, rcd: 0, spring: 0, maxX: 120, stuckT: 0, hint: null, msgT: 0, timer: 0, prevAct: false, lastFail: null };
    acc = 0; touches = {}; keys = {};
  }

  function fail(kind) {
    if (S.phase !== 'drive') return;
    S.phase = 'fail'; S.timer = 1.1; S.fails++; S.lastFail = kind;
    S.failAt[kind] = (S.failAt[kind] || 0) + 1;
    S.hint = kind; S.msgT = 3.5;
    sfx('bad'); say(HINT[kind] || 'Riproviamo!');
    if (!quiet) G.shake(5);
  }
  function respawn() {
    var cs = course(), cp = 0;
    cs.cps.forEach(function (c) { if (c < S.x - 30 && c > cp) cp = c; });
    S.x = Math.max(120, cp); S.y = P().groundAt(cs, S.x).y; S.vx = 0; S.vy = 0; S.on = true; S.rt = 0; S.phase = 'drive';
    S.maxX = S.x; S.stuckT = 0;
  }

  function step(inp) {
    S.t += DT; S.msgT = Math.max(0, S.msgT - DT);
    if (S.phase === 'fail') { if ((S.timer -= DT) <= 0) respawn(); return; }
    if (S.phase !== 'drive') return;
    var cs = course(), st = O().stats(S.v), g = GRAV * st.gravity, gr = P().groundAt(cs, S.x), w = P().waterAt(cs, S.x);
    var actEdge = inp.act && !S.prevAct; S.prevAct = !!inp.act;
    S.rcd = Math.max(0, S.rcd - DT); S.spring = Math.max(0, S.spring - DT);

    // buttons: rocket and spring
    if (actEdge && st.rocket && S.rcd <= 0) { S.rt = 1.1; S.rcd = 2.6; sfx('whoosh'); }
    if (actEdge && st.spring && S.on) { S.vy = -720; S.on = false; S.spring = .3; sfx('pop'); }
    if (S.rt > 0) { S.rt -= DT; S.on = false; S.vy -= 1900 * DT; S.vx = Math.min(st.speed * 1.6, S.vx + 700 * DT); }

    var inWater = w && gr.y > w.level + 2;   // the bed is under water here
    if (inWater && S.y >= w.level - 1 && S.rt <= 0) {
      if (!st.floats) { if (S.y > w.level + 6) { fail('water'); return; } }
      else {
        // afloat: the propeller pushes, wheels only paddle
        var top = st.speed * st.swim;
        if (inp.gas) S.vx = Math.min(top, S.vx + st.accel * .6 * DT); else S.vx *= Math.pow(.4, DT);
        if (inp.back) S.vx = Math.max(-top * .5, S.vx - st.accel * .5 * DT);
        S.x += S.vx * DT; S.y = w.level; S.vy = 0; S.on = true; S.ang *= .9;
        S.rot += S.vx * DT / st.wheel;
        return after(cs, inp);
      }
    }

    if (S.on && S.rt <= 0) {
      var ang = Math.atan(gr.slope), uphill = -ang * 180 / Math.PI, ramp = gr.zone === 'ramp', grip = ramp || uphill <= st.climb, a = 0;
      if (inp.gas && grip) {
        // wheels that hold: the engine wins, slower the steeper it gets
        var target = st.speed * (uphill > 0 && !ramp ? Math.max(.35, 1 - uphill / 80) : 1 + Math.max(0, -uphill) / 70);
        a = S.vx < target ? st.accel : -st.accel * .6;
      } else {
        if (inp.back) a -= st.accel * .8;
        if (!inp.gas && !inp.back) a -= Math.sign(S.vx) * Math.min(Math.abs(S.vx) / DT, 260);
        a += g * Math.sin(ang) * (ramp ? .2 : .9);      // no grip: it rolls back down
      }
      S.vx = G.clamp(S.vx + a * DT, -st.speed * .6, st.speed * 1.3);
      S.vy = S.vx * gr.slope;
      var nx = S.x + S.vx * DT, g2 = P().groundAt(cs, nx), by = S.y + S.vy * DT + .5 * g * DT * DT;
      if (g2.zone !== 'gap' && g2.y < S.y - 26) { S.vx = 0; S.vy = 0; }            // a wall: wheels stop against it
      else if (g2.zone === 'gap' || g2.y > by + 1) { S.x = nx; S.y = by; S.vy += g * DT; S.on = false; } // the ground falls away: we fly
      else { S.x = nx; S.y = g2.y; }
      S.ang += (Math.atan(P().groundAt(cs, S.x).slope) - S.ang) * .3;
    } else {
      S.vy += g * DT;
      if (st.glide && S.vy > 110 && S.rt <= 0) { S.vy = 110; S.vx = Math.max(S.vx, st.speed * .8); }
      if (inp.gas) S.vx = Math.min(Math.max(S.vx, 0) + 120 * DT, Math.max(S.vx, st.speed));
      var ax = S.x + S.vx * DT, ay = S.y + S.vy * DT, ga = P().groundAt(cs, ax), here = P().groundAt(cs, S.x);
      if (ga.zone !== 'gap' && ay >= ga.y) {
        if (here.zone !== 'gap' && here.y - ga.y > 26 && S.y > ga.y - 2) { S.vx = 0; S.x = S.x; S.y = ay; }   // hit the face of a wall
        else if (here.zone === 'gap' && S.y > ga.y + 20) { S.vx = 0; S.y = ay; }                            // under the far rim of a ravine
        else { S.x = ax; S.y = ga.y; S.on = true; S.vy = S.vx * ga.slope; if (!quiet && Math.abs(S.vy) < 600) sfx('tap'); }
      } else { S.x = ax; S.y = ay; }
      S.ang += (G.clamp(S.vy / 900, -.5, .5) - S.ang) * .08;
      if (S.y > lowest(cs) + 500) { fail('gap'); return; }
    }
    S.rot += S.vx * DT / st.wheel;
    after(cs, inp);
  }
  function after(cs, inp) {
    // fruit
    cs.fruits.forEach(function (f, i) { if (!S.got[i] && Math.hypot(f.x - S.x, f.y - (S.y - 50)) < 62) { S.got[i] = 1; S.fruit++; sfx('coin'); } });
    // stuck on a hill: offer to fix the vehicle instead of letting the child push forever
    if (S.x > S.maxX + 4) { S.maxX = S.x; S.stuckT = 0; }
    else if (inp.gas) S.stuckT += DT;
    if (S.stuckT > 3.5 && S.msgT <= 0) {
      var o = P().obstacleAt(cs, S.x); S.hint = o ? o.k : 'steep'; S.msgT = 4; S.stuckT = 0; say(HINT[S.hint]);
    }
    if (S.x >= cs.finish) win();
  }
  function lowest(cs) { if (cs.low === undefined) { cs.low = 0; cs.ys.forEach(function (y) { if (y < 5000 && y > cs.low) cs.low = y; }); } return cs.low; }
  function stars() { var n = course().fruits.length; var f = n ? S.fruit / n : 1; return f >= .8 ? 3 : f >= .45 ? 2 : 1; }
  function win() {
    S.phase = 'win'; sfx('win'); if (!quiet) G.fx.confetti();
    if (S.mi >= 0) {
      var sv = G.officinaSave(); sv.stars[S.mi] = Math.max(sv.stars[S.mi] || 0, stars()); sv.open = Math.max(sv.open, Math.min(P().MISSIONS.length - 1, S.mi + 1)); G.saveNow();
    }
    say('Ce l\'hai fatta! Che macchina!');
  }

  /* ================================================================ drawing */
  var camX = 0, camY = 0;
  function hash(n) { n = Math.imul(n ^ 0x5bd1e995, 0x27d4eb2d); n ^= n >>> 15; return ((n >>> 0) % 1000) / 1000; }
  function scenery(c) {
    var r = P().RACCOLTE[mission().r], g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, r.sky[0]); g.addColorStop(1, r.sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,247,208,.9)'; c.beginPath(); c.arc(1050, 130, 50, 0, 7); c.fill();
    var i, x;
    c.fillStyle = 'rgba(120,160,150,.45)';
    for (i = -1; i < 6; i++) { x = i * 360 - (camX * .15) % 360; c.beginPath(); c.moveTo(x - 220, 520); c.quadraticCurveTo(x, 200 - camY * .1, x + 220, 520); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.85)';
    for (i = 0; i < 5; i++) { x = ((i * 410 - camX * .08) % 1700 + 1700) % 1700 - 200; c.beginPath(); c.arc(x, 110 + (i % 3) * 40, 34, 0, 7); c.arc(x + 36, 100 + (i % 3) * 40, 28, 0, 7); c.arc(x + 66, 112 + (i % 3) * 40, 24, 0, 7); c.fill(); }
  }
  function terrain(c) {
    var cs = course(), x0 = Math.floor(camX / 8) * 8, sx, open = false, k;
    function close(endX) { c.lineTo(endX, H + 40); c.closePath(); c.fill(); open = false; }
    c.fillStyle = '#9a6b3f';
    for (sx = x0; sx <= camX + W + 16; sx += 8) {
      var gr = P().groundAt(cs, sx);
      if (gr.zone === 'gap') { if (open) close(sx - camX); continue; }
      if (!open) { c.beginPath(); c.moveTo(sx - camX, H + 40); open = true; }
      c.lineTo(sx - camX, gr.y - camY);
    }
    if (open) close(camX + W + 16 - camX);
    // grass on top
    c.strokeStyle = '#4fae4a'; c.lineWidth = 12; c.lineJoin = 'round'; c.beginPath(); open = false;
    for (sx = x0; sx <= camX + W + 16; sx += 8) {
      var g2 = P().groundAt(cs, sx);
      if (g2.zone === 'gap' || g2.zone === 'water') { open = false; continue; }
      if (!open) { c.moveTo(sx - camX, g2.y - camY); open = true; } else c.lineTo(sx - camX, g2.y - camY);
    }
    c.stroke();
    // water
    cs.waters.forEach(function (w) {
      if (w.x1 < camX || w.x0 > camX + W) return;
      c.fillStyle = 'rgba(63,169,214,.78)'; c.fillRect(w.x0 - camX, w.level - camY, w.x1 - w.x0, H);
      c.fillStyle = 'rgba(255,255,255,.55)';
      for (k = 0; k < (w.x1 - w.x0) / 60; k++) c.fillRect(w.x0 - camX + k * 60 + (Math.sin(S.t * 2 + k) * 8), w.level - camY + 6 + (k % 2) * 8, 26, 3);
    });
    // trees and flowers on flat ground
    for (k = Math.floor(camX / 220); k < (camX + W) / 220 + 1; k++) {
      var tx = k * 220 + hash(k) * 120, tg = P().groundAt(cs, tx);
      if (tg.zone || Math.abs(tg.slope) > .25 || tx > cs.finish) continue;
      var sx2 = tx - camX, sy = tg.y - camY + 4;
      if (hash(k * 3) < .5) { c.fillStyle = '#7a4a26'; c.fillRect(sx2 - 5, sy - 46, 10, 46); c.fillStyle = '#2f8f4e'; c.beginPath(); c.arc(sx2, sy - 60, 28, 0, 7); c.fill(); }
      else { c.fillStyle = C.pinkPop; c.beginPath(); c.arc(sx2, sy - 10, 6, 0, 7); c.arc(sx2 + 16, sy - 6, 5, 0, 7); c.fill(); }
    }
    // finish arch
    var fx = cs.finish - camX, fy = P().groundAt(cs, cs.finish).y - camY;
    for (k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#fff' : '#2b1d12'; c.fillRect(fx - 6, fy - 180 + k * 22, 12, 22); c.fillRect(fx + 194, fy - 180 + k * 22, 12, 22); }
    for (k = 0; k < 10; k++) { c.fillStyle = k % 2 ? '#fff' : '#2b1d12'; c.fillRect(fx - 6 + k * 21, fy - 190, 21, 18); }
  }
  function draw(c) {
    var cs = course(), st = O().stats(S.v);
    camX += (S.x - 380 - camX) * .15; camY += (S.y - 470 - camY) * .08;
    if (Math.abs(S.x - 380 - camX) > 600) camX = S.x - 380;
    scenery(c); terrain(c);
    cs.fruits.forEach(function (f, i) { if (!S.got[i] && f.x > camX - 40 && f.x < camX + W + 40) A.fruit(c, f.x - camX, f.y - camY + Math.sin(S.t * 3 + i) * 4, 17, ['fragola', 'banana', 'uva', 'mela'][i % 4]); });
    O().drawVehicle(c, S.v, S.x - camX, S.y - camY, { ang: S.ang, rot: S.rot, gas: inputs().gas, boost: S.rt > 0, spring: S.spring > 0, happy: S.phase === 'win' });
    if (S.phase === 'fail' && S.lastFail === 'water') { c.fillStyle = 'rgba(255,255,255,.8)'; for (var k = 0; k < 6; k++) { c.beginPath(); c.arc(S.x - camX - 40 + k * 16, S.y - camY - 20 - Math.sin(k) * 20 * (1.1 - S.timer), 8, 0, 7); c.fill(); } }
    pads(c, st); hud(c, cs);
    if (S.phase === 'win') {
      c.fillStyle = 'rgba(18,61,41,.66)'; c.fillRect(0, 0, W, H);
      c.fillStyle = C.cream; G.roundRect(c, 260, 130, 760, 460, 36); c.fill();
      G.text('Ce l\'hai fatta!', 640, 205, { size: 56, color: C.leafDeep });
      G.text(S.fruit + ' frutti raccolti', 640, 262, { size: 28, color: C.ink });
      var n = S.mi >= 0 ? stars() : 0;
      for (var s2 = 0; s2 < 3 && S.mi >= 0; s2++) A.star(c, 560 + s2 * 80, 330, 30, s2 < n ? C.sun : '#d8cdb8');
      var last = S.mi === P().MISSIONS.length - 1 || S.mi < 0;
      G.ui.button({ id: 'w-again', x: 290, y: 420, w: 220, h: 110, color: C.water, label: 'Riprova', onTap: function () { reset(S.mi, S.v); } });
      if (!last) G.ui.button({ id: 'w-next', x: 530, y: 420, w: 220, h: 110, color: C.leaf, label: 'Avanti', onTap: function () { G.go('officina', { mi: S.mi + 1 }); } });
      G.ui.button({ id: 'w-map', x: last ? 530 : 770, y: 420, w: 220, h: 110, color: C.tangerine, label: 'Mappa', onTap: function () { G.go('menu'); } });
    }
  }
  var PAD = { back: { x: 26, y: 560, w: 150, h: 140 }, gas: { x: 1086, y: 470, w: 170, h: 230 }, act: { cx: 920, cy: 620, r: 74 } };
  function pads(c, st) {
    var inp = inputs();
    function box(b, on, col, dir) {
      c.fillStyle = on ? col : 'rgba(255,246,224,.55)'; G.roundRect(c, b.x, b.y, b.w, b.h, 30); c.fill();
      c.strokeStyle = 'rgba(43,29,18,.35)'; c.lineWidth = 4; c.stroke();
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2; c.fillStyle = C.leafDeep; c.beginPath(); c.moveTo(cx + dir * 34, cy); c.lineTo(cx - dir * 24, cy - 38); c.lineTo(cx - dir * 24, cy + 38); c.fill();
    }
    box(PAD.back, inp.back, 'rgba(255,159,67,.85)', -1);
    box(PAD.gas, inp.gas, 'rgba(99,199,119,.9)', 1);
    if (st.rocket || st.spring) {
      var a = PAD.act, ready = st.rocket ? S.rcd <= 0 : S.on;
      c.fillStyle = ready ? 'rgba(232,83,107,.9)' : 'rgba(180,170,160,.7)'; c.beginPath(); c.arc(a.cx, a.cy, a.r, 0, 7); c.fill();
      O().drawPart(c, 'extra', st.rocket ? 'razzo' : 'molla', a.cx, a.cy, 70);
    }
  }
  function hud(c, cs) {
    c.fillStyle = 'rgba(23,63,55,.86)'; G.roundRect(c, 250, 10, 780, 76, 24); c.fill();
    A.fruit(c, 290, 48, 20, 'fragola'); G.text(String(S.fruit), 318, 49, { size: 32, color: C.cream, align: 'left' });
    c.fillStyle = 'rgba(255,246,224,.25)'; G.roundRect(c, 400, 40, 420, 18, 9); c.fill();
    c.fillStyle = C.sun; G.roundRect(c, 400, 40, 420 * G.clamp(S.x / cs.finish, 0, 1), 18, 9); c.fill();
    G.text(mission().name, 925, 49, { size: 24, color: C.cream, maxWidth: 190 });
    G.ui.button({ id: 'to-shop', x: 16, y: 8, w: 220, h: 84, r: 24, color: C.tangerine, label: 'Officina', fontSize: 30, onTap: function () { G.go('officina', { mi: S.mi, keep: true }); } });
    G.ui.button({ id: 'to-map', x: 1048, y: 8, w: 216, h: 84, r: 24, color: C.water, label: 'Mappa', fontSize: 30, onTap: function () { G.go('menu'); } });
    if (S.msgT > 0 && S.hint && S.phase !== 'win') {
      c.fillStyle = 'rgba(23,63,55,.9)'; G.roundRect(c, 250, 104, 780, 120, 26); c.fill();
      G.text(HINT[S.hint], 640, 138, { size: 27, color: C.cream, maxWidth: 740 });
      G.ui.button({ id: 'fix', x: 520, y: 160, w: 240, h: 56, r: 20, color: C.tangerine, label: 'Aggiusta', fontSize: 26, onTap: function () { G.go('officina', { mi: S.mi, keep: true, hint: S.hint }); } });
    }
  }

  function inputs() { var o = { gas: !!keys.gas, back: !!keys.back, act: !!keys.act }; for (var id in touches) o[touches[id]] = true; return o; }
  function ctrlAt(p) {
    function inR(b) { return p.x >= b.x - 12 && p.x <= b.x + b.w + 12 && p.y >= b.y - 12 && p.y <= b.y + b.h + 12; }
    if (inR(PAD.gas)) return 'gas';
    if (inR(PAD.back)) return 'back';
    var st = O().stats(S.v);
    if ((st.rocket || st.spring) && Math.hypot(p.x - PAD.act.cx, p.y - PAD.act.cy) < PAD.act.r + 14) return 'act';
    if (p.x > 640 && p.y > 240) return 'gas';    // the right half drives too: small hands miss pedals
    return null;
  }

  G.scene('strada', {
    hud: false, back: false,
    enter: function (o) { reset(o.mi, o.v); camX = S.x - 380; camY = S.y - 470; say('Tieni premuto il pedale verde!'); },
    update: function (dt) { acc += dt; var n = 0; while (acc >= DT && n < 4) { step(inputs()); acc -= DT; n++; } if (n === 4) acc = 0; },
    draw: draw,
    onDown: function (p) { var k = ctrlAt(p); if (k) touches[p.id] = k; },
    onMove: function (p) { if (touches[p.id] === 'gas' || touches[p.id] === 'back') { var k = ctrlAt(p); if (k === 'gas' || k === 'back') touches[p.id] = k; } },
    onUp: function (p) { delete touches[p.id]; },
    onCancel: function () { touches = {}; },
    exit: function () { touches = {}; keys = {}; }
  });
  var KEY = { ArrowRight: 'gas', d: 'gas', D: 'gas', ArrowLeft: 'back', a: 'back', A: 'back', ' ': 'act', ArrowUp: 'act', w: 'act', W: 'act' };
  window.addEventListener('keydown', function (e) { if (G.current !== 'strada') return; var k = KEY[e.key]; if (k) { e.preventDefault(); keys[k] = true; } });
  window.addEventListener('keyup', function (e) { var k = KEY[e.key]; if (k) keys[k] = false; });
  window.addEventListener('blur', function () { keys = {}; touches = {}; });

  G.strada = { reset: reset, step: step, state: function () { return S; }, quiet: function (q) { quiet = q; }, HINT: HINT, snap: function () { return JSON.stringify(S); }, load: function (s) { S = JSON.parse(s); } };
})();
