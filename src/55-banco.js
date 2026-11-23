/* A short test run for the vehicle assembled on the bench. Wheel contacts and
   thrust are applied at their mounted positions around the centre of mass. */
(function () {
  'use strict';
  var C = G.C, W = G.W, H = G.H, DT = 1 / 60, RADIUS = 26;
  var WHEEL = [-79, -26, 26, 79], WHEEL_Y = 25;
  var ROCKET = [{ x: -47, y: -55 }, { x: -47, y: 13 }];
  var GAP_START = 652, GAP_END = 742, FINISH = 1220;
  var S, build, selected, acc = 0, firePending = false, cam = 0;

  function ground(x) {
    if (x >= GAP_START && x < GAP_END) return null;
    if (x < 354) return 550;
    if (x < 537) {
      var p = (x - 354) / 183;
      return 550 - 36 * p * p * (3 - 2 * p);
    }
    return x < GAP_START ? 514 : 528;
  }
  function wheelGround(x) {
    var floor = ground(x);
    if (floor !== null) return floor;
    var left = x - GAP_START, right = GAP_END - x, distance = Math.min(left, right);
    if (distance >= RADIUS) return null;
    return (left < right ? ground(GAP_START - 1) : ground(GAP_END)) +
      RADIUS - Math.sqrt(RADIUS * RADIUS - distance * distance);
  }
  function layout() {
    var parts = [{ x: 0, y: 0, mass: 5, inertia: 16000 }];
    build.wheels.forEach(function (i) { parts.push({ x: WHEEL[i], y: WHEEL_Y, mass: .8, inertia: 230 }); });
    if (build.rocket !== null) parts.push({ x: ROCKET[build.rocket].x, y: ROCKET[build.rocket].y, mass: 1.1, inertia: 290 });
    var m = 0, x = 0, y = 0, I = 0;
    parts.forEach(function (p) { m += p.mass; x += p.x * p.mass; y += p.y * p.mass; });
    x /= m; y /= m;
    parts.forEach(function (p) { I += p.inertia + p.mass * (Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)); });
    return { x: x, y: y, mass: m, inertia: I };
  }
  function point(x, y) {
    var dx = x - S.layout.x, dy = y - S.layout.y, a = Math.cos(S.angle), b = Math.sin(S.angle);
    return { x: dx * a - dy * b, y: dx * b + dy * a };
  }
  function start() {
    var m = layout();
    S = { phase: 'drive', x: 135, y: ground(135) - WHEEL_Y - RADIUS + m.y, vx: 0, vy: 0,
      angle: 0, spin: 0, time: 0, stalled: 0, best: 135, thrust: 0, used: false, layout: m };
    acc = 0; firePending = false; cam = 0;
  }
  function stop(phase, reason) {
    S.phase = phase; S.reason = reason;
    if (phase === 'win') {
      G.officinaSave().bancoCleared = true; G.saveNow(); G.sfx('win'); G.fx.confetti();
    } else G.sfx('bad');
  }
  function step(fire) {
    if (S.phase !== 'drive') return;
    var fx = 0, fy = 1060 * S.layout.mass, torque = 0, contacts = 0;
    function force(p, x, y) { fx += x; fy += y; torque += p.x * y - p.y * x; }
    S.time += DT;
    build.wheels.forEach(function (i) {
      var p = point(WHEEL[i], WHEEL_Y), wx = S.x + p.x, floor = wheelGround(wx);
      if (floor === null) return;
      var compression = S.y + p.y + RADIUS + 8 - floor;
      if (compression <= 0) return;
      var normal = G.clamp(compression * 1150 + (S.vy + S.spin * p.x) * 115, 0, 11800);
      if (!normal) return;
      contacts++;
      var engine = G.clamp((225 - S.vx) * 17, -1600, 1310);
      force({ x: p.x, y: p.y + RADIUS * .35 }, Math.min(engine, normal * .30), -normal);
    });
    if (fire && !S.used && build.rocket !== null) {
      S.used = true; S.thrust = .71; G.sfx('whoosh');
    }
    if (S.thrust > 0) {
      var mount = ROCKET[build.rocket];
      force(point(mount.x, mount.y), Math.cos(S.angle - .16) * 5350, Math.sin(S.angle - .16) * 5350);
      S.thrust = Math.max(0, S.thrust - DT);
    }
    S.vx = G.clamp((S.vx + fx / S.layout.mass * DT) * .998, -180, 520);
    S.vy = Math.min(720, S.vy + fy / S.layout.mass * DT);
    S.spin = G.clamp((S.spin + torque / S.layout.inertia * DT) * (contacts ? .97 : .996), -8, 8);
    S.x += S.vx * DT; S.y += S.vy * DT; S.angle += S.spin * DT;
    if (S.x >= FINISH && Math.abs(S.angle) < .85) { stop('win'); return; }
    if (S.y > 650 || Math.abs(S.angle) > 1.28) {
      stop('fail', S.y > 650 ? 'Le ruote sono finite nel fosso.' : 'Il veicolo si è ribaltato.'); return;
    }
    // The underside of the chassis can catch on a bank.
    for (var tip = -1; tip <= 1; tip += 2) {
      var edge = point(tip * 93, 20), bottom = ground(S.x + edge.x);
      if (bottom === null || S.y + edge.y < bottom) continue;
      S.y = bottom - edge.y; S.vy = Math.min(0, S.vy * -.15);
      S.vx *= .70; S.spin += tip * .16;
    }
    if (S.x > S.best + 5) { S.best = S.x; S.stalled = 0; } else S.stalled += DT;
    if (S.stalled > 1.3 || S.time > 15) stop('fail', 'Il telaio si è incastrato.');
  }

  function saveBuild() {
    G.officinaSave().banco = { wheels: build.wheels.slice(), rocket: build.rocket }; G.saveNow();
  }
  function bench() { selected = null; S = { phase: 'build' }; }
  function moveWheel(i) {
    var target = build.wheels.indexOf(i);
    if (target >= 0) { selected = selected === i ? null : i; return; }
    if (selected === null) { G.say('Tocca prima la ruota da spostare.'); return; }
    build.wheels[build.wheels.indexOf(selected)] = i;
    build.wheels.sort(); selected = null;
    saveBuild(); G.sfx('pop');
  }

  function vehicle(c, scale, angle, x, y, t) {
    c.save(); c.translate(x, y); c.scale(scale, scale); c.rotate(angle);
    c.fillStyle = '#18394b'; G.roundRect(c, -97, -16, 194, 40, 14); c.fill();
    c.fillStyle = '#4eb9a4'; G.roundRect(c, -96, -22, 192, 31, 12); c.fill();
    c.fillStyle = '#d5f4cf'; c.fillRect(-74, -17, 46, 6);
    c.fillStyle = '#acd9ed'; G.roundRect(c, 40, -45, 37, 26, 9); c.fill();
    A.dino(c, 15, -17, 57, { t: t, facing: 1, hat: null, color: G.account && G.account.color });
    build.wheels.forEach(function (i) {
      var wx = WHEEL[i], wy = WHEEL_Y;
      c.fillStyle = '#1b263c'; c.beginPath(); c.arc(wx, wy, RADIUS, 0, 7); c.fill();
      c.fillStyle = '#aebfc9'; c.beginPath(); c.arc(wx, wy, RADIUS * .48, 0, 7); c.fill();
      c.strokeStyle = '#435c70'; c.lineWidth = 5; c.beginPath();
      c.moveTo(wx - 9 * Math.cos(t * 13), wy - 9 * Math.sin(t * 13));
      c.lineTo(wx + 9 * Math.cos(t * 13), wy + 9 * Math.sin(t * 13)); c.stroke();
    });
    if (build.rocket !== null) {
      var mount = ROCKET[build.rocket], rx = mount.x, ry = mount.y;
      c.fillStyle = '#ffe8a6'; G.roundRect(c, rx - 30, ry - 12, 55, 24, 11); c.fill();
      c.fillStyle = '#f37759'; c.beginPath(); c.moveTo(rx + 24, ry - 12); c.lineTo(rx + 40, ry); c.lineTo(rx + 24, ry + 12); c.fill();
      if (S.thrust > 0) {
        c.fillStyle = '#ffad53'; c.beginPath(); c.moveTo(rx - 28, ry - 9);
        c.lineTo(rx - 71 - 13 * Math.sin(t * 51), ry + 3); c.lineTo(rx - 28, ry + 9); c.fill();
      }
    }
    c.restore();
  }
  function drawBuild(c) {
    c.fillStyle = '#172c46'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#213f5a'; G.roundRect(c, 32, 114, 790, 556, 30); c.fill();
    c.fillStyle = '#2d506b';
    for (var gx = 48; gx < 810; gx += 26) c.fillRect(gx, 125, 1, 526);
    for (var gy = 132; gy < 661; gy += 26) c.fillRect(46, gy, 762, 1);
    G.ui.button({ id: 'bench-menu', x: 24, y: 16, w: 190, h: 72, color: '#356783', label: 'Mappa', onTap: function () { G.go('menu'); } });
    G.text('Banco di prova', 641, 54, { size: 53, color: '#fff3ce' });
    G.text(selected === null ? 'Tocca una ruota, poi un attacco libero' : 'Scegli il nuovo attacco', 427, 595, { size: 28, color: '#fff3ce' });
    var bx = 422, by = 411, scale = 2.65;
    vehicle(c, scale, 0, bx, by, 0);
    WHEEL.forEach(function (wx, i) {
      var x = bx + wx * scale, y = by + WHEEL_Y * scale, occupied = build.wheels.indexOf(i) >= 0;
      c.strokeStyle = selected === i ? '#ffda69' : '#aed6e5'; c.lineWidth = selected === i ? 8 : 4;
      c.beginPath(); c.arc(x, y, 44, 0, 7); c.stroke();
      if (!occupied) G.text('+', x, y, { size: 37, color: '#aed6e5' });
      var hitW = occupied ? 120 : 102, hitH = occupied ? 126 : 96;
      G.ui.button({ id: 'wheel-' + i, ghost: true, x: x - hitW / 2, y: y - hitH / 2, w: hitW, h: hitH, r: 24,
        onTap: function () { moveWheel(i); } });
    });
    ROCKET.forEach(function (p, i) {
      var x = bx + p.x * scale, y = by + p.y * scale;
      // Keep the low control clear of the wheel targets, with a line to its anchor.
      var signY = i ? 347 : y;
      if (i) {
        c.strokeStyle = '#e4b2ab'; c.lineWidth = 3; c.beginPath();
        c.moveTo(x - 43, signY + 25); c.lineTo(x - 57, y - 15); c.lineTo(x, y - 15); c.stroke();
      }
      c.strokeStyle = build.rocket === i ? '#ffda69' : '#e4b2ab'; c.lineWidth = 4;
      G.roundRect(c, x - 96, signY - 25, 192, 50, 14); c.stroke();
      G.text(i ? 'Razzo basso' : 'Razzo alto', x, signY, { size: 22, color: '#fff3ce', stroke: '#243a53', strokeWidth: 5 });
      G.ui.button({ id: 'rocket-' + i, ghost: true, x: x - 96, y: signY - 26, w: 192, h: 52, r: 14,
        onTap: function () { build.rocket = build.rocket === i ? null : i; saveBuild(); G.sfx('pop'); } });
    });
    c.fillStyle = '#fff1d2'; G.roundRect(c, 850, 114, 398, 556, 30); c.fill();
    G.text('Passa il fosso', 1049, 173, { size: 32, color: '#203650' });
    c.fillStyle = '#8bd3c5'; G.roundRect(c, 884, 222, 330, 191, 18); c.fill();
    c.fillStyle = '#545f8b';
    c.beginPath(); c.moveTo(884, 350); c.lineTo(968, 314); c.lineTo(1030, 314);
    c.lineTo(1030, 395); c.lineTo(1090, 395); c.lineTo(1090, 326); c.lineTo(1214, 326);
    c.lineTo(1214, 413); c.lineTo(884, 413); c.closePath(); c.fill();
    c.fillStyle = '#f5b452'; c.fillRect(1173, 265, 7, 63);
    c.beginPath(); c.moveTo(1180, 266); c.lineTo(1209, 275); c.lineTo(1180, 292); c.closePath(); c.fill();
    G.text(build.rocket === null ? 'Razzo facoltativo' : 'Razzo montato', 1049, 462, { size: 24, color: '#43546a' });
    G.ui.button({ id: 'bench-try', x: 885, y: 525, w: 328, h: 105, r: 26, color: '#16765f', label: 'Prova il veicolo', fontSize: 32, onTap: start });
  }
  function drawRoad(c) {
    cam += (Math.max(0, S.x - 385) - cam) * .19;
    var sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#6fb6cc'); sky.addColorStop(1, '#ffe6bd'); c.fillStyle = sky; c.fillRect(0, 0, W, H);
    c.fillStyle = '#68a8aa';
    for (var i = -1; i < 8; i++) {
      var x = 225 * i - (cam * .26) % 225;
      c.beginPath(); c.moveTo(x - 250, 580); c.quadraticCurveTo(x, 280 + (i % 2) * 60, x + 220, 580); c.fill();
    }
    c.fillStyle = '#507483'; c.fillRect(GAP_START - cam, 602, GAP_END - GAP_START, H - 602);
    var open = false;
    for (var sx = -8; sx <= W + 8; sx += 4) {
      var y = ground(cam + sx);
      if (y === null) {
        if (open) { c.lineTo(sx, H); c.closePath(); c.fill(); open = false; }
        continue;
      }
      if (!open) { c.fillStyle = '#375277'; c.beginPath(); c.moveTo(sx, H); open = true; }
      c.lineTo(sx, y);
    }
    if (open) { c.lineTo(W + 8, H); c.closePath(); c.fill(); }
    for (var wx = Math.floor(cam / 48) * 48; wx < cam + W; wx += 48) {
      var wy = ground(wx);
      if (wy !== null) { c.fillStyle = '#76ad95'; c.fillRect(wx - cam, wy + 3, 24, 4); }
    }
    var finish = FINISH - cam;
    c.fillStyle = '#f7c86d'; c.fillRect(finish, 391, 9, 137);
    c.beginPath(); c.moveTo(finish + 9, 392); c.lineTo(finish + 92, 408); c.lineTo(finish + 9, 441); c.closePath(); c.fill();
    if (build.rocket !== null) {
      var marker = 530 - cam;
      c.fillStyle = '#5b6377'; c.fillRect(marker - 4, 432, 8, 84);
      c.fillStyle = '#ffcf7c'; G.roundRect(c, marker - 68, 400, 136, 50, 14); c.fill();
      G.text('Razzo qui', marker, 425, { size: 22, color: '#243a50' });
    }
    var origin = point(0, 0);
    vehicle(c, 1, S.angle, S.x + origin.x - cam, S.y + origin.y, S.time);
    if (S.phase === 'drive') {
      G.ui.button({ id: 'bench-back', x: 24, y: 16, w: 248, h: 76, color: '#315976', label: 'Torna al banco', fontSize: 28, onTap: bench });
      if (build.rocket !== null) {
        var near = S.x >= 415 && S.x <= GAP_START - 13;
        G.ui.button({ id: 'bench-fire', x: 1002, y: 574, w: 244, h: 116, r: 26, color: S.used ? '#636b77' : near ? '#c16342' : '#ad543e',
          disabled: S.used, label: S.used ? 'Razzo usato' : 'Accendi razzo', onTap: function () { firePending = true; } });
      }
      return;
    }
    c.fillStyle = 'rgba(15,30,51,.65)'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#fff1d2'; G.roundRect(c, 302, 151, 676, 407, 34); c.fill();
    G.text(S.phase === 'win' ? 'Fosso superato!' : 'Prova un altro montaggio', 640, 223, { size: 45, color: '#203650' });
    G.text(S.reason || 'Il veicolo è arrivato alla bandiera.', 640, 302, { size: 28, color: '#43546a', maxWidth: 600 });
    G.ui.button({ id: 'bench-back', x: 336, y: 409, w: 291, h: 93, r: 23, color: '#16765f', label: 'Torna al banco', onTap: bench });
    G.ui.button({ id: 'bench-again', x: 652, y: 409, w: 291, h: 93, r: 23, color: '#315976', label: 'Riprova', onTap: start });
  }

  G.scene('banco', {
    hud: false, back: false,
    enter: function () {
      var saved = G.officinaSave().banco;
      build = saved ? { wheels: saved.wheels.slice(), rocket: saved.rocket } : { wheels: [1, 2], rocket: null };
      bench();
    },
    update: function (dt) {
      if (S.phase !== 'drive') return;
      acc = Math.min(acc + dt, 4 * DT);
      while (acc >= DT) { step(firePending); firePending = false; acc -= DT; }
    },
    draw: function (c) { if (S.phase === 'build') drawBuild(c); else drawRoad(c); }
  });
  window.addEventListener('keydown', function (e) {
    if (G.current !== 'banco' || e.repeat) return;
    if (e.key === 'Escape') { if (S.phase === 'build') G.go('menu'); else bench(); }
    if ((e.key === ' ' || e.key === 'ArrowUp') && S.phase === 'drive') { e.preventDefault(); firePending = true; }
  });
  G.banco = { start: start, step: step, state: function () { return S; }, build: function () { return build; } };
})();
