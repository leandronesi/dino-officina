/* The road: drive what you built. Side view, the vehicle is a point on the
   ground line with a velocity — simple enough to be sure about, rich enough
   that every piece shows: grip on hills, speed, floating, flying.

   No punishment: falling in a river or a ravine puts you back just before it,
   with a hint about the piece that would help; being stuck on a hill for a few
   seconds offers to go back to the workshop and fix the vehicle.
   All rules live in S (plain data, fixed 1/60 s step) for test/smoke.js. */
(function () {
  'use strict';
  var C = G.C, W = G.W, H = G.H, DT = 1 / 60, GRAV = 1400, PICKUP_TIME = 1.05;
  var P = function () { return G.percorsi; }, O = function () { return G.officina; };
  var S = null, quiet = false, acc = 0, touches = {}, keys = {}, actPending = false;

  var HINT = {
    steep: 'Troppo ripida! Servono ruote più grandi.',
    vsteep: 'Ripidissima! Solo i cingoli si arrampicano qui.',
    water: 'Splash! Per l\'acqua serve la barca.',
    current: 'Monta l’elica per risalire la corrente.',
    cargo: 'Il cesto ha salvato l’uovo! Usa «Tieni l’uovo» al prossimo urto.',
    gap: 'Il burrone è largo: prova il razzo, le ali o i palloncini.',
    wall: 'Il muro è alto: serve la molla o il razzo.'
  };

  function sfx(n) { if (!quiet) G.sfx(n); }
  function say(s) { if (!quiet) G.say(s); }
  function course() { return mission().course; }
  function mission() { return P().mission(S.mi, S.track); }
  function rescue() { return S.mi === P().RESCUE_ID; }

  function reset(mi, v, track) {
    var m = P().mission(mi, track), cs = m.course;
    if (mi === P().RESCUE_ID) track = m.id;
    S = { mi: mi, v: v, track: track, phase: 'drive', t: 0, x: 120, y: P().groundAt(cs, 120).y, vx: 0, vy: 0, on: true, ang: 0, rot: 0, got: {}, fruit: 0, fails: 0, failAt: {},
      rt: 0, rcd: 0, spring: 0, maxX: 120, stuckT: 0, hint: null, msgT: 0, timer: 0, prevAct: false, lastFail: null, cruise: false,
      cargo: false, wobble: 0, wobbleSpeed: 0, assist: false, strain: 0, secured: false, jolt: 0 };
    acc = 0; clearControls();
  }

  function launchNearby(cs) {
    return cs.obst.some(function (o) {
      return (o.k === 'gap' || o.k === 'wall') && o.x0 - S.x >= -20 && o.x0 - S.x <= 95;
    });
  }
  function settleCargo() {
    S.cargo = true; S.phase = 'drive'; S.maxX = S.x; S.stuckT = 0; S.rcd = 0;
    say(S.track === 'fiume' ? 'Ora ci sono le onde! Premi «Tieni l’uovo» mentre le attraversi.' :
      'Al prossimo salto hai l’uovo con te! Premi «Tieni l’uovo» mentre atterri.');
  }
  function liftEgg() {
    if (S.phase !== 'island') return;
    S.phase = 'pickup'; S.timer = PICKUP_TIME; sfx('chime');
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
    if (S.cargo) cp = Math.max(cp, cs.pickup);
    S.x = Math.max(120, cp); S.y = P().groundAt(cs, S.x).y; S.vx = 0; S.vy = 0; S.on = true; S.rt = 0; S.rcd = 0; S.spring = 0; S.phase = 'drive';
    S.maxX = S.x; S.stuckT = 0; S.wobble = 0; S.wobbleSpeed = 0; S.assist = false; S.strain = 0; S.jolt = 0;
  }

  function step(inp) {
    S.t += DT; S.msgT = Math.max(0, S.msgT - DT);
    if (S.phase === 'win' && rescue()) {
      var eggWasClosed = S.timer < 1.15;
      S.timer += DT;
      if (eggWasClosed && S.timer >= 1.15) sfx('chime');
      return;
    }
    if (S.phase === 'fail') { if ((S.timer -= DT) <= 0) respawn(); return; }
    if (S.phase === 'island') { if (inp.fire) liftEgg(); return; }
    if (S.phase === 'pickup') { if ((S.timer -= DT) <= 0) settleCargo(); return; }
    if (S.phase !== 'drive') return;
    var cs = course(), st = O().stats(S.v), g = GRAV * st.gravity, gr = P().groundAt(cs, S.x), w = P().waterAt(cs, S.x);
    var previousVX = S.vx, previousX = S.x, landing = 0;
    if (S.cargo) {
      S.secured = !!inp.secure;
      S.jolt = Math.max(0, S.jolt - DT);
      S.strain = Math.max(0, S.strain - DT * (S.secured ? .36 : .018));
      st.speed *= S.secured && S.on ? .72 : .84; st.accel *= .78;
    }
    var actEdge = inp.fire || (inp.act && !S.prevAct); S.prevAct = !!inp.act;
    S.rcd = Math.max(0, S.rcd - DT); S.spring = Math.max(0, S.spring - DT);

    if (rescue() && G.level === 1 && st.rocket && S.on && S.rcd <= 0 && launchNearby(cs)) {
      if (!S.assist && !actEdge && !inp.back) say('Tocca il razzo!');
      S.assist = !inp.back;
      if (S.assist && !actEdge) { S.vx = 0; return; }
      if (S.assist) S.vx = Math.max(S.vx, st.speed * .85);
    }
    S.assist = false;
    // buttons: rocket and spring
    if (actEdge && st.rocket && S.rcd <= 0) { S.rt = 1.1; S.rcd = 2.6; S.vy = Math.min(-100, S.vy); sfx('whoosh'); }
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
        var current = rescue() ? 75 + 20 * Math.sin(S.t * 2) : 0;
        S.x += (S.vx - current) * DT; S.y = w.level; S.vy = 0; S.on = true; S.ang *= .9;
        S.rot += S.vx * DT / st.wheel;
        return after(cs, inp, previousVX, previousX, 0);
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
        if (here.zone !== 'gap' && here.y - ga.y > 26 && S.y > ga.y - 2) { S.vx = 0; S.y = ay; }   // hit the face of a wall
        else if (here.zone === 'gap' && S.y > ga.y + 20) { S.vx = 0; S.y = ay; }                            // under the far rim of a ravine
        else { landing = S.vy; S.x = ax; S.y = ga.y; S.on = true; S.vy = S.vx * ga.slope; if (!quiet && Math.abs(S.vy) < 600) sfx('tap'); }
      } else { S.x = ax; S.y = ay; }
      S.ang += (G.clamp(S.vy / 900, -.5, .5) - S.ang) * .08;
      if (S.y > lowest(cs) + 500) { fail('gap'); return; }
    }
    S.rot += S.vx * DT / st.wheel;
    after(cs, inp, previousVX, previousX, landing);
  }
  function after(cs, inp, previousVX, previousX, landing) {
    var start = S.cargo ? cs.pickup : 0;
    if (S.x < start) { S.x = start; S.vx = Math.max(0, S.vx); }
    if (S.cargo) {
      var lean = G.clamp((previousVX - S.vx) / 15, -.48, .48) - .55 * S.ang;
      S.wobbleSpeed += (lean - S.wobble) * 19 * DT;
      S.wobbleSpeed *= S.secured ? .86 : .93; S.wobble += S.wobbleSpeed * DT;
      var wave = cs.waves && cs.waves.some(function (crest) { return previousX < crest.x && S.x >= crest.x; });
      var impact = wave ? (Math.abs(S.x - previousX) / DT > 130 ? .43 : .21) : landing > 435 ? 1.06 : 0;
      if (impact) {
        S.strain += impact * (S.secured ? .12 : G.level === 1 && !wave ? .74 : 1);
        S.wobbleSpeed += S.secured ? .9 : 4.6;
        S.jolt = .36;
        sfx(S.secured ? 'tap' : 'pop');
        if (S.strain >= 1) { fail('cargo'); return; }
      }
    }
    if (rescue() && !S.cargo && S.x >= cs.pickup) {
      S.x = cs.pickup; S.vx = 0;
      if (S.on) {
        S.phase = 'island'; S.hint = null; S.msgT = 0;
        S.rt = 0; S.spring = 0; S.ang = 0; sfx('coin'); say('Tocca l’uovo per metterlo nel cesto!');
      }
      return;
    }
    // fruit
    cs.fruits.forEach(function (f, i) { if (!S.got[i] && Math.hypot(f.x - S.x, f.y - (S.y - 50)) < 62) { S.got[i] = 1; S.fruit++; sfx('coin'); } });
    // stuck on a hill: offer to fix the vehicle instead of letting the child push forever
    if (S.x > S.maxX + 4) { S.maxX = S.x; S.stuckT = 0; }
    else if (inp.gas) S.stuckT += DT;
    if (S.stuckT > 3.5 && S.msgT <= 0) {
      var o = P().obstacleAt(cs, S.x);
      S.hint = o ? o.k : 'steep';
      if (rescue() && S.hint === 'water' && S.v.telaio === 'barca') S.hint = 'current';
      S.msgT = 4; S.stuckT = 0; say(HINT[S.hint]);
    }
    if (S.x >= cs.finish) {
      if (rescue() && !S.on) { S.x = cs.finish; S.vx = 0; }
      else win();
    }
  }
  function lowest(cs) { if (cs.low === undefined) { cs.low = 0; cs.ys.forEach(function (y) { if (y < 5000 && y > cs.low) cs.low = y; }); } return cs.low; }
  function stars() { var n = course().fruits.length; var f = n ? S.fruit / n : 1; return f >= .8 ? 3 : f >= .45 ? 2 : 1; }
  function win() {
    S.phase = 'win'; S.timer = 0; sfx('win'); if (!quiet) G.fx.confetti();
    if (S.mi >= 0) {
      var sv = G.officinaSave(); sv.stars[S.mi] = Math.max(sv.stars[S.mi] || 0, stars()); sv.open = Math.max(sv.open, Math.min(P().MISSIONS.length - 1, S.mi + 1)); G.saveNow();
    } else if (rescue()) {
      var saved = G.officinaSave();
      saved.rescues[S.track] = 1; saved.rescueRoute = S.track; G.saveNow();
    }
    say(rescue() ? 'Missione compiuta! L’uovo è al sicuro nel nido.' : 'Ce l\'hai fatta! Che macchina!');
  }

  /* ================================================================ drawing */
  var camX = 0, camY = 0;
  function egg(c, x, y, r) {
    c.save(); c.translate(x, y); c.scale(r / 30, r / 30);
    c.fillStyle = '#fff0b9'; c.strokeStyle = '#5a4651'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, -35); c.bezierCurveTo(19, -35, 29, -7, 27, 12);
    c.bezierCurveTo(23, 37, -23, 37, -27, 12); c.bezierCurveTo(-29, -7, -19, -35, 0, -35);
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#6ab7ab';
    [[-13, 11, 6], [10, -8, 7], [11, 20, 4]].forEach(function (spot) {
      c.beginPath(); c.arc(spot[0], spot[1], spot[2], 0, 7); c.fill();
    });
    c.restore();
  }
  G.officinaEgg = egg;
  function nest(c, x, y, radius) {
    c.fillStyle = '#7a4536'; c.beginPath(); c.ellipse(x, y, radius, radius * .33, 0, 0, 7); c.fill();
    c.strokeStyle = '#bd814c'; c.lineWidth = 4;
    for (var i = -2; i <= 2; i++) {
      c.beginPath(); c.moveTo(x + i * radius * .35 - 8, y - radius * .19);
      c.lineTo(x + i * radius * .35 + 6, y + radius * .19); c.stroke();
    }
  }
  function hatch(c, x, y) {
    nest(c, x, y + 44, 70);
    if (S.timer >= 1.15) {
      var rise = Math.min(1, (S.timer - 1.15) * 5);
      A.dino(c, x + 8, y + 66 - rise * 30, 94, { pose: 'happy', hat: null, facing: 1, t: S.timer, color: '#7cd2a4' });
      c.fillStyle = '#fff0b9'; c.strokeStyle = '#76574a'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x - 33, y + 20); c.lineTo(x - 14, y + 28); c.lineTo(x + 1, y + 18);
      c.lineTo(x + 16, y + 29); c.lineTo(x + 32, y + 19);
      c.quadraticCurveTo(x + 30, y + 48, x, y + 49); c.quadraticCurveTo(x - 29, y + 48, x - 33, y + 20); c.closePath(); c.fill(); c.stroke();
    } else {
      var shake = S.timer > .55 ? Math.sin(S.timer * 34) * 4 : 0;
      egg(c, x + shake, y + 4, 39);
      if (S.timer > .55) {
        c.strokeStyle = '#9c6854'; c.lineWidth = 3; c.beginPath();
        c.moveTo(x - 24 + shake, y + 3); c.lineTo(x - 8 + shake, y + 1);
        c.lineTo(x + 2 + shake, y + 11); c.lineTo(x + 14 + shake, y + 4); c.lineTo(x + 28 + shake, y + 13); c.stroke();
      }
    }
  }
  function rescueLandmark(c, cs, marker, label) {
    var x = marker - camX, y = P().groundAt(cs, marker).y - camY;
    if (x < -150 || x > W + 150) return;
    c.fillStyle = '#714537'; c.fillRect(x - 5, y - 170, 10, 107);
    c.fillStyle = '#234355'; G.roundRect(c, x - 92, y - 196, 184, 48, 14); c.fill();
    G.text(label, x, y - 172, { size: 24, color: '#fff1bd' });
    c.fillStyle = '#e7bc76'; G.roundRect(c, x - 70, y - 61, 140, 48, 13); c.fill();
    nest(c, x, y - 63, 45);
    if (marker === cs.pickup && !S.cargo && S.phase !== 'pickup') {
      egg(c, x, y - 97 + Math.sin(S.t * 3) * 3, 30);
      A.star(c, x + 37, y - 123, 8 + 3 * Math.sin(S.t * 5), C.sun);
    } else if (marker === cs.finish) {
      A.dino(c, x + 115, y + 2, 85, { facing: -1, pose: S.phase === 'win' ? 'happy' : 'idle', t: S.t, color: '#f0a463', hat: null });
      if (S.phase === 'win') egg(c, x, y - 97, 30);
    }
  }
  function drawCargo(c, st, x, y) {
    if (S.phase === 'win' || (!S.cargo && S.phase !== 'pickup')) return;
    c.save(); c.translate(x, y); c.rotate(S.ang);
    var progress = S.cargo ? 1 : 1 - S.timer / PICKUP_TIME;
    var holderY = -st.wheel - 36, eggY = holderY - 27;
    nest(c, 63, holderY, 32);
    if (S.cargo) {
      c.translate(63, eggY - Math.sin(S.jolt / .36 * Math.PI) * (S.secured ? 4 : 16));
      c.rotate(S.wobble); egg(c, 0, 0, 25);
      if (S.secured) {
        c.strokeStyle = '#21686c'; c.lineWidth = 7; c.beginPath();
        c.moveTo(-20, 4); c.quadraticCurveTo(4, 19, 22, -5); c.stroke();
      }
    }
    else egg(c, progress * 63, -97 + progress * (eggY + 97) - 45 * Math.sin(progress * Math.PI), 30 - 5 * progress);
    c.restore();
  }
  function hash(n) { n = Math.imul(n ^ 0x5bd1e995, 0x27d4eb2d); n ^= n >>> 15; return ((n >>> 0) % 1000) / 1000; }
  function rescueScenery(c) {
    var high = S.track === 'rampa', g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, high ? '#717cc2' : '#70c8d0'); g.addColorStop(1, high ? '#ffcbaa' : '#f0ebba');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#fff0bd'; c.beginPath(); c.arc(high ? 980 : 1030, 167, 72, 0, 7); c.fill();
    for (var layer = 0; layer < 2; layer++) {
      c.fillStyle = layer === 0 ? (high ? '#9788ba' : '#7ab9ad') : (high ? '#737daa' : '#528f90');
      c.beginPath(); c.moveTo(0, H);
      for (var i = -1; i <= 9; i++) {
        var x = i * 175 - (camX * (.14 + layer * .13)) % 175;
        var y = 382 + layer * 66 + 35 * Math.sin(i * 2) - camY * (.10 + layer * .12);
        c.lineTo(x, y + 49); c.quadraticCurveTo(x + 45, y - 82 - hash(i + layer) * 47, x + 150, y + 55);
      }
      c.lineTo(W, H); c.closePath(); c.fill();
    }
    c.fillStyle = high ? '#669fab' : '#5daeb0'; c.fillRect(0, 535 - camY * .25, W, H);
    c.fillStyle = '#f6e5bd';
    for (var j = 0; j < 6; j++) {
      var ax = ((j * 319 - camX * .12) % 1510 + 1510) % 1510 - 190;
      var ay = 120 + (j % 3) * 63;
      c.beginPath(); c.ellipse(ax, ay, 71, 10, 0, 0, 7); c.ellipse(ax - 11, ay - 7, 36, 14, 0, 0, 7); c.fill();
    }
  }
  function scenery(c) {
    if (rescue()) { rescueScenery(c); return; }
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
    c.fillStyle = rescue() ? '#a97458' : '#9a6b3f';
    for (sx = x0; sx <= camX + W + 16; sx += 8) {
      var gr = P().groundAt(cs, sx);
      if (gr.zone === 'gap') { if (open) close(sx - camX); continue; }
      if (!open) { c.beginPath(); c.moveTo(sx - camX, H + 40); open = true; }
      c.lineTo(sx - camX, gr.y - camY);
    }
    if (open) close(camX + W + 16 - camX);
    // grass on top
    c.strokeStyle = rescue() ? '#64bc87' : '#4fae4a'; c.lineWidth = 12; c.lineJoin = 'round'; c.beginPath(); open = false;
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
      if (rescue()) {
        c.strokeStyle = '#d0f8ed'; c.lineWidth = 4;
        for (var wx = w.x0 + 50; wx < w.x1 - 30; wx += 145) {
          var lx = wx - camX - (S.t * 21) % 42, ly = w.level - camY + 40 + 10 * Math.sin(wx);
          c.beginPath(); c.moveTo(lx + 43, ly); c.lineTo(lx, ly); c.lineTo(lx + 9, ly - 7);
          c.moveTo(lx, ly); c.lineTo(lx + 9, ly + 7); c.stroke();
        }
      }
    });
    // trees and flowers on flat ground
    for (k = Math.floor(camX / 220); k < (camX + W) / 220 + 1; k++) {
      var tx = k * 220 + hash(k) * 120, tg = P().groundAt(cs, tx);
      if (tg.zone || Math.abs(tg.slope) > .25 || tx > cs.finish) continue;
      var sx2 = tx - camX, sy = tg.y - camY + 4;
      if (hash(k * 3) < .5) { c.fillStyle = '#7a4a26'; c.fillRect(sx2 - 5, sy - 46, 10, 46); c.fillStyle = '#2f8f4e'; c.beginPath(); c.arc(sx2, sy - 60, 28, 0, 7); c.fill(); }
      else { c.fillStyle = C.pinkPop; c.beginPath(); c.arc(sx2, sy - 10, 6, 0, 7); c.arc(sx2 + 16, sy - 6, 5, 0, 7); c.fill(); }
    }
    if (rescue()) {
      if (cs.waves) cs.waves.forEach(function (wave) {
        var x = wave.x - camX, y = wave.y - camY + 3;
        if (x < -85 || x > W + 85) return;
        var lift = 30 + Math.sin(S.t * 3.5 + wave.x) * 9;
        c.fillStyle = '#285e86'; c.strokeStyle = '#d7faf2'; c.lineWidth = 5;
        c.beginPath(); c.moveTo(x - 53, y + 11); c.quadraticCurveTo(x - 7, y + 9, x, y - lift);
        c.quadraticCurveTo(x + 26, y - lift - 8, x + 27, y + 2);
        c.quadraticCurveTo(x + 38, y + 10, x + 57, y + 13); c.quadraticCurveTo(x + 20, y + 29, x - 53, y + 11);
        c.fill(); c.stroke();
      });
      cs.obst.forEach(function (o) {
        if (o.k !== 'gap' || o.x1 < camX || o.x0 > camX + W) return;
        var surface = P().groundAt(cs, o.x1 + 8).y - camY + 100;
        c.fillStyle = '#55b1cf'; c.fillRect(o.x0 - camX, surface, o.x1 - o.x0, H);
        c.fillStyle = '#dcf9f1';
        for (var px = o.x0 + 24; px < o.x1 - 54; px += 77) c.fillRect(px - camX + Math.sin(S.t * 2 + px) * 10, surface + 9, 39, 3);
      });
      rescueLandmark(c, cs, cs.pickup, 'Isolotto');
      rescueLandmark(c, cs, cs.finish, 'Nido');
      return;
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
    if (rescue()) drawCargo(c, st, S.x - camX, S.y - camY);
    if (S.phase === 'fail' && S.lastFail === 'water') { c.fillStyle = 'rgba(255,255,255,.8)'; for (var k = 0; k < 6; k++) { c.beginPath(); c.arc(S.x - camX - 40 + k * 16, S.y - camY - 20 - Math.sin(k) * 20 * (1.1 - S.timer), 8, 0, 7); c.fill(); } }
    if (!rescue() || S.phase !== 'win') { pads(c, st); hud(c, cs); }
    if (S.phase === 'island') {
      c.fillStyle = 'rgba(17,48,65,.43)'; c.fillRect(0, 90, W, H - 90);
      c.fillStyle = '#fff1d1'; G.roundRect(c, 448, 187, 384, 299, 34); c.fill();
      G.text('Eccolo!', 640, 240, { size: 46, color: '#234355' });
      egg(c, 640, 326 + Math.sin(S.t * 3) * 7, 48);
      G.ui.button({ id: 'lift-egg', x: 480, y: 378, w: 320, h: 81, r: 26, label: 'Carica l’uovo', color: C.leaf, fontSize: 32, onTap: liftEgg });
      G.ui.button({ id: 'lift-egg-tap', ghost: true, x: 573, y: 267, w: 134, h: 111, r: 30, onTap: liftEgg });
    }
    if (S.phase === 'win') {
      c.fillStyle = 'rgba(18,61,41,.66)'; c.fillRect(0, 0, W, H);
      c.fillStyle = C.cream; G.roundRect(c, 260, 130, 760, 460, 36); c.fill();
      G.text(rescue() ? (S.timer >= 1.15 ? 'È nato!' : 'L’uovo è al sicuro!') : 'Ce l\'hai fatta!', 640, 205, { size: 56, color: C.leafDeep });
      G.text(rescue() ? mission().name + ' completata' : S.fruit + ' frutti raccolti', 640, 262, { size: 28, color: C.ink });
      var n = S.mi >= 0 ? stars() : 0;
      for (var s2 = 0; s2 < 3 && S.mi >= 0; s2++) A.star(c, 560 + s2 * 80, 330, 30, s2 < n ? C.sun : '#d8cdb8');
      if (rescue()) {
        hatch(c, 640, 337);
        A.star(c, 561, 333, 17, C.sun); A.star(c, 719, 333, 17, C.sun);
        if (S.timer < 1.15) return;
        G.ui.button({ id: 'w-again', x: 290, y: 420, w: 220, h: 110, color: C.water, label: 'Rigioca', onTap: function () { reset(S.mi, S.v, S.track); } });
        G.ui.button({ id: 'w-other', x: 530, y: 420, w: 220, h: 110, color: C.leaf, label: 'Altra via', onTap: function () { G.go('officina', { mi: S.mi, track: S.track === 'rampa' ? 'fiume' : 'rampa' }); } });
        G.ui.button({ id: 'w-map', x: 770, y: 420, w: 220, h: 110, color: C.tangerine, label: 'Mappa', onTap: function () { G.go('menu'); } });
        return;
      }
      var last = S.mi === P().MISSIONS.length - 1 || S.mi < 0;
      G.ui.button({ id: 'w-again', x: 290, y: 420, w: 220, h: 110, color: C.water, label: 'Riprova', onTap: function () { reset(S.mi, S.v, S.track); } });
      if (!last) G.ui.button({ id: 'w-next', x: 530, y: 420, w: 220, h: 110, color: C.leaf, label: 'Avanti', onTap: function () { G.go('officina', { mi: S.mi + 1 }); } });
      G.ui.button({ id: 'w-map', x: last ? 530 : 770, y: 420, w: 220, h: 110, color: C.tangerine, label: S.mi < 0 ? 'Officina' : 'Mappa', onTap: function () { if (S.mi < 0) G.go('officina', { mi: -1 }); else G.go('menu'); } });
    }
  }
  var PAD = { back: { x: 26, y: 560, w: 150, h: 140 }, gas: { x: 1086, y: 470, w: 170, h: 230 }, act: { cx: 306, cy: 612, r: 86 },
    secure: { x: 448, y: 559, w: 200, h: 141 } };
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
      var near = ready && launchNearby(course());
      c.fillStyle = ready ? '#fff1dc' : '#d6ccc1'; c.beginPath(); c.arc(a.cx, a.cy, a.r, 0, 7); c.fill();
      c.strokeStyle = near ? C.sun : ready ? C.berry : '#93887c'; c.lineWidth = near ? 12 : 5; c.stroke();
      if (st.rocket && !ready) {
        c.strokeStyle = C.berry; c.lineWidth = 9; c.beginPath();
        c.arc(a.cx, a.cy, a.r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * (1 - S.rcd / 2.6)); c.stroke();
      }
      O().drawPart(c, 'extra', st.rocket ? 'razzo' : 'molla', a.cx, a.cy - 20, 84);
      G.text(S.assist ? 'SALTA ORA!' : ready ? st.rocket ? 'RAZZO' : 'MOLLA' : st.rocket ? 'RICARICA' : 'IN VOLO', a.cx, a.cy + 41, { size: 22, color: C.ink });
    }
    if (S.cargo && S.phase !== 'win') {
      var b = PAD.secure, center = b.x + b.w / 2;
      var waves = course().waves;
      var impactSoon = !S.on && S.vy > 80 || waves && waves.some(function (wave) { return wave.x > S.x && wave.x - S.x < 210; });
      c.fillStyle = S.secured ? '#b2f1d3' : '#fff1d1';
      c.strokeStyle = S.secured ? '#316879' : S.strain > .66 ? '#ed6564' : impactSoon ? '#ffce65' : '#316879';
      c.lineWidth = impactSoon && !S.secured ? 9 : 5;
      G.roundRect(c, b.x, b.y, b.w, b.h, 27); c.fill(); c.stroke();
      egg(c, center, b.y + 37, 22);
      c.strokeStyle = '#316879'; c.lineWidth = 5; c.beginPath(); c.moveTo(center - 18, b.y + 45); c.lineTo(center + 17, b.y + 31); c.stroke();
      G.text(S.secured ? 'UOVO FISSATO' : 'TIENI L’UOVO', center, b.y + 84, { size: 21, color: '#214757' });
      G.text('Tieni premuto · ↓', center, b.y + 117, { size: 16, color: '#214757' });
      if (S.strain > 0) {
        c.fillStyle = '#f5c78c'; G.roundRect(c, b.x + 12, b.y + 3, (b.w - 24) * Math.min(1, S.strain), 8, 4); c.fill();
      }
    }
  }
  function hud(c, cs) {
    c.fillStyle = 'rgba(23,63,55,.86)'; G.roundRect(c, 250, 10, 780, 76, 24); c.fill();
    var progress = G.clamp(S.x / cs.finish, 0, 1);
    if (rescue()) {
      egg(c, 294, 49, 19);
      G.text(S.cargo ? 'Torna al nido' : S.phase === 'pickup' || S.phase === 'island' ? 'Uovo trovato!' : 'Raggiungi l’isolotto', 327, 49, { size: 25, color: C.cream, align: 'left' });
      c.fillStyle = 'rgba(255,246,224,.25)'; G.roundRect(c, 670, 40, 318, 18, 9); c.fill();
      c.fillStyle = S.cargo ? '#95e6b9' : C.sun; G.roundRect(c, 670, 40, 318 * progress, 18, 9); c.fill();
      c.fillStyle = C.cream; c.beginPath(); c.arc(670 + 318 * cs.pickup / cs.finish, 49, 7, 0, 7); c.fill();
    } else {
      A.fruit(c, 290, 48, 20, 'fragola'); G.text(String(S.fruit), 318, 49, { size: 32, color: C.cream, align: 'left' });
      c.fillStyle = 'rgba(255,246,224,.25)'; G.roundRect(c, 400, 40, 420, 18, 9); c.fill();
      c.fillStyle = C.sun; G.roundRect(c, 400, 40, 420 * progress, 18, 9); c.fill();
      G.text(mission().name, 925, 49, { size: 24, color: C.cream, maxWidth: 190 });
    }
    G.ui.button({ id: 'to-shop', x: 16, y: 8, w: 220, h: 84, r: 24, color: C.tangerine, label: 'Officina', fontSize: 30, onTap: function () { G.go('officina', { mi: S.mi, track: S.track }); } });
    G.ui.button({ id: 'to-map', x: 1048, y: 8, w: 216, h: 84, r: 24, color: C.water, label: 'Mappa', fontSize: 30, onTap: function () { G.go('menu'); } });
    if (S.phase !== 'win') {
      G.ui.button({ id: 'cruise', x: 1048, y: 104, w: 216, h: 64, r: 20, color: S.cruise ? C.berry : C.leafDeep,
        label: S.cruise ? 'Ferma il gas' : 'Gas automatico', fontSize: 23, onTap: function () { S.cruise = !S.cruise; } });
    }
    if (S.msgT > 0 && S.hint && S.phase !== 'win') {
      var canAdjust = S.hint !== 'cargo';
      c.fillStyle = 'rgba(23,63,55,.9)'; G.roundRect(c, 250, 104, 780, canAdjust ? 120 : 68, 26); c.fill();
      G.text(HINT[S.hint], 640, 138, { size: 27, color: C.cream, maxWidth: 740 });
      if (canAdjust) G.ui.button({ id: 'fix', x: 520, y: 160, w: 240, h: 56, r: 20, color: C.tangerine, label: 'Aggiusta', fontSize: 26, onTap: function () { G.go('officina', { mi: S.mi, track: S.track, hint: S.hint }); } });
    }
  }

  function inputs() {
    var o = { gas: !!keys.gas, back: !!keys.back, act: !!keys.act, secure: !!keys.secure };
    for (var id in touches) o[touches[id]] = true;
    o.gas = !o.back && (o.gas || S.cruise);
    return o;
  }
  function clearControls() { touches = {}; keys = {}; actPending = false; if (S) S.cruise = false; }
  function ctrlAt(p) {
    function inR(b) { return p.x >= b.x - 12 && p.x <= b.x + b.w + 12 && p.y >= b.y - 12 && p.y <= b.y + b.h + 12; }
    if (inR(PAD.gas)) return 'gas';
    if (inR(PAD.back)) return 'back';
    if (S.cargo && inR(PAD.secure)) return 'secure';
    var st = O().stats(S.v);
    if ((st.rocket || st.spring) && Math.hypot(p.x - PAD.act.cx, p.y - PAD.act.cy) < PAD.act.r + 14) return 'act';
    if (p.x > 640 && p.y > 240) return 'gas';    // the right half drives too: small hands miss pedals
    return null;
  }

  G.scene('strada', {
    hud: false, back: false,
    enter: function (o) {
      reset(o.mi, o.v, o.track); camX = S.x - 380; camY = S.y - 470;
      var st = O().stats(o.v);
      say(rescue() && G.level === 1 ? 'Raggiungi l’isolotto! Puoi usare il gas automatico.' :
        st.rocket ? 'Tieni premuto il pedale verde. Quando il razzo si illumina, toccalo!' :
        st.spring ? 'Tieni premuto il pedale verde. Tocca la molla per saltare!' : 'Tieni premuto il pedale verde!');
    },
    update: function (dt) {
      acc += dt; var n = 0;
      while (acc >= DT && n < 4) {
        var inp = inputs(); inp.fire = actPending; actPending = false;
        if (inp.back) S.cruise = false;
        step(inp); acc -= DT; n++;
      }
      if (n === 4) acc = 0;
    },
    draw: draw,
    onDown: function (p) { var k = ctrlAt(p); if (k) touches[p.id] = k; if (k === 'act') actPending = true; },
    onMove: function (p) {
      var prev = touches[p.id];
      if (!prev) return;
      var k = ctrlAt(p);
      if (!k || k === prev) return;
      touches[p.id] = k;
      if (k === 'act') actPending = true;
    },
    onUp: function (p) { delete touches[p.id]; },
    onCancel: function (p) { delete touches[p.id]; },
    exit: clearControls
  });
  var KEY = { ArrowRight: 'gas', d: 'gas', D: 'gas', ArrowLeft: 'back', a: 'back', A: 'back', ' ': 'act', ArrowUp: 'act', w: 'act', W: 'act', ArrowDown: 'secure' };
  window.addEventListener('keydown', function (e) {
    if (G.current !== 'strada') return;
    var k = KEY[e.key]; if (!k || (k === 'secure' && !rescue())) return;
    e.preventDefault();
    if (k === 'act' && !keys.act && !e.repeat) actPending = true;
    keys[k] = true;
  });
  window.addEventListener('keyup', function (e) { var k = KEY[e.key]; if (k) keys[k] = false; });
  window.addEventListener('blur', clearControls);
  document.addEventListener('visibilitychange', function () { if (document.hidden) clearControls(); });

  G.strada = { reset: reset, step: step, state: function () { return S; }, quiet: function (q) { quiet = q; }, HINT: HINT, snap: function () { return JSON.stringify(S); }, load: function (s) { S = JSON.parse(s); } };
})();
