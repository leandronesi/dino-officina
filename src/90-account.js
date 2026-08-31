/* Dino Officina — profili locali. The profile gate is small on purpose: it
   keeps siblings' progress separate without adding libraries or a server. */
(function () {
  'use strict';
  var C = G.C, W = G.W, H = G.H;
  var list = G._profiles || [], pending = null;
  var draft = { name: 'Dino', color: C.green, level: 1, secret: [] };
  var secretShapes = ['cuore', 'stella', 'luna'];
  var gate = { hold: 0, unlocked: false };

  function persist() { try { localStorage.setItem(G._profilesKey, JSON.stringify(list)); } catch (e) {} }
  function idFor() { return 'p-' + Date.now().toString(36) + '-' + G.rndi(100, 999); }
  function nameFor() { try { if (typeof prompt === 'function') return String(prompt('Come si chiama il dino?', draft.name) || draft.name).slice(0, 18) || 'Dino'; } catch (e) {} return draft.name; }
  function profile(id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  G.accounts = {
    list: function () { return list.slice(); },
    create: function (o) {
      o = o || {}; var p = { id: o.id || idFor(), name: String(o.name || 'Dino').slice(0, 18), color: o.color || C.green, level: o.level === 2 ? 2 : 1, secret: Array.isArray(o.secret) ? o.secret.slice(0, 3) : [], created: Date.now() };
      list.push(p); persist();
      try { localStorage.setItem('dino-officina.save.' + p.id, JSON.stringify(G._blankSave())); } catch (e) {}
      return p;
    },
    update: function (id, patch) { var p = profile(id); if (!p) return null; patch = patch || {}; if (patch.name) p.name = String(patch.name).slice(0, 18); if (patch.color) p.color = patch.color; if (patch.level === 1 || patch.level === 2) p.level = patch.level; if (Array.isArray(patch.secret)) p.secret = patch.secret.slice(0, 3); persist(); if (G.account && G.account.id === id) { G.account = p; G.level = p.level; G.save.level = G.level; G.saveNow(); } return p; },
    remove: function (id) { var p = profile(id); if (!p) return false; list.splice(list.indexOf(p), 1); persist(); try { localStorage.removeItem('dino-officina.save.' + id); } catch (e) {} if (G.account && G.account.id === id) { G._profileLogout(); G.go('accesso'); } return true; },
    login: function (id) { var p = profile(id); if (!p) return false; if (p.secret && p.secret.length) { pending = p.id; G.go('segreto'); return true; } G._profileLogin(id); G.go('menu'); return true; },
    logout: function () { G._profileLogout(); G.go('accesso'); },
    last: function () { try { return localStorage.getItem('dino-officina.last'); } catch (e) { return null; } }
  };

  function icon(c, x, y, type, col) { c.save(); c.fillStyle = col || C.orange; c.strokeStyle = C.ink; c.lineWidth = 5; if (type === 'heart') { c.beginPath(); c.moveTo(x, y + 20); c.bezierCurveTo(x - 46, y - 10, x - 30, y - 42, x, y - 20); c.bezierCurveTo(x + 30, y - 42, x + 46, y - 10, x, y + 20); c.fill(); c.stroke(); } else if (type === 'star') { c.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 17 : 37; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke(); } else { c.beginPath(); c.arc(x, y, 36, 0, 7); c.fill(); c.stroke(); c.fillStyle = C.cream; c.beginPath(); c.arc(x + 12, y - 2, 30, 0, 7); c.fill(); c.restore(); } }
  function card(c, p, i, manage) { var x = 100 + i * 380; G.panel(x, 180, 340, 260, C.cream, 28); c.fillStyle = p.color; c.beginPath(); c.arc(x + 170, 260, 60, 0, 7); c.fill(); G.text(p.name, x + 170, 355, { size: 31, color: C.ink, max: 280 }); G.text(p.level === 2 ? 'Grande' : 'Piccolo', x + 170, 395, { size: 21, color: C.steel2 }); G.ui.button({ id: (manage ? 'use-' : 'login-') + p.id, x: x + 46, y: 465, w: 248, h: 88, r: 22, color: p.color, textColor: C.ink, label: manage ? 'SCEGLI' : 'GIOCA', fontSize: 27, onTap: function () { G.accounts.login(p.id); } }); }

  G.scene('accesso', { enter: function () { if (G.hush) G.hush(); }, draw: function (c) {
    G.workshopBg(); G.text('CHI GIOCA?', W / 2, 80, { size: 54, color: C.sun, stroke: C.ink, sw: 10 });
    if (!list.length) G.text('Crea il primo profilo', W / 2, 190, { size: 34, color: C.cream });
    list.slice(0, 3).forEach(function (p, i) { card(c, p, i, false); });
    G.ui.button({ id: 'new-profile', x: 460, y: 570, w: 360, h: 100, r: 26, color: C.green, label: 'NUOVO DINO', fontSize: 32, onTap: function () { G.go('nuovo'); } });
    if (list.length) G.ui.button({ id: 'manage-profile', x: 1010, y: 24, w: 240, h: 70, r: 20, color: C.steel2, label: 'GENITORI', fontSize: 23, onTap: function () { gate.hold = 0; gate.unlocked = false; G.go('genitori'); } });
  } });

  G.scene('nuovo', { enter: function () { draft = { name: 'Dino', color: C.green, level: 1, secret: [] }; }, draw: function (c) {
    G.workshopBg(); G.text('NUOVO DINO', W / 2, 74, { size: 50, color: C.sun, stroke: C.ink, sw: 9 });
    G.ui.button({ id: 'name', x: 180, y: 145, w: 420, h: 90, r: 22, color: C.cream, textColor: C.ink, label: draft.name, fontSize: 32, onTap: function () { draft.name = nameFor(); } });
    G.text('Scegli colore ed età', 850, 160, { size: 26, color: C.cream });
    [C.green, C.red, C.blue, C.orange].forEach(function (col, i) { G.ui.button({ id: 'col' + i, x: 660 + i * 125, y: 190, w: 100, h: 90, r: 22, color: col, label: '●', fontSize: 42, onTap: function () { draft.color = col; } }); });
    G.ui.button({ id: 'small', x: 650, y: 305, w: 260, h: 82, r: 22, color: draft.level === 1 ? C.green : C.steel2, label: 'PICCOLO', fontSize: 27, onTap: function () { draft.level = 1; } });
    G.ui.button({ id: 'big', x: 930, y: 305, w: 260, h: 82, r: 22, color: draft.level === 2 ? C.red : C.steel2, label: 'GRANDE', fontSize: 27, onTap: function () { draft.level = 2; } });
    G.text('Segreto facoltativo: tocca tre figure', W / 2, 420, { size: 25, color: C.cream });
    secretShapes.forEach(function (shape, i) { G.ui.button({ id: 'secret-' + i, x: 440 + i * 145, y: 450, w: 110, h: 90, r: 22, color: draft.secret.indexOf(i) >= 0 ? C.sun : C.steel2, label: shape === 'cuore' ? '♥' : shape === 'stella' ? '★' : '☾', textColor: C.ink, fontSize: 42, onTap: function () { if (draft.secret.length < 3 && draft.secret.indexOf(i) < 0) draft.secret.push(i); else if (draft.secret.indexOf(i) >= 0) draft.secret.splice(draft.secret.indexOf(i), 1); } }); });
    G.ui.button({ id: 'create-profile', x: 340, y: 590, w: 300, h: 92, r: 22, color: C.green, label: 'CREA', fontSize: 31, onTap: function () { var p = G.accounts.create(draft); G._profileLogin(p.id); G.go('menu'); } });
    G.ui.button({ id: 'cancel-profile', x: 680, y: 590, w: 300, h: 92, r: 22, color: C.steel2, label: 'INDIETRO', fontSize: 28, onTap: function () { G.go('accesso'); } });
  } });

  G.scene('segreto', { enter: function () { gate.hold = 0; }, draw: function (c) { G.workshopBg(); G.text('IL SEGRETO DEL DINO', W / 2, 100, { size: 43, color: C.sun, stroke: C.ink, sw: 9 }); G.text('Tocca le tre figure nell’ordine', W / 2, 170, { size: 28, color: C.cream }); secretShapes.forEach(function (shape, i) { G.ui.button({ id: 'check-' + i, x: 390 + i * 170, y: 275, w: 130, h: 130, r: 28, color: C.plum, label: shape === 'cuore' ? '♥' : shape === 'stella' ? '★' : '☾', fontSize: 56, onTap: function () { var p = profile(pending), want = p && p.secret ? p.secret : []; if (want[gate.hold] === i) { gate.hold++; if (gate.hold >= want.length) { var id = pending; pending = null; gate.hold = 0; G._profileLogin(id); G.go('menu'); } } else { gate.hold = 0; G.say('Riproviamo insieme.'); } } }); }); G.text(gate.hold ? 'Figure: ' + gate.hold + ' / 3' : 'Inizia dal primo simbolo', W / 2, 500, { size: 28, color: C.cream }); G.ui.button({ id: 'secret-back', x: 470, y: 590, w: 340, h: 90, r: 22, color: C.steel2, label: 'INDIETRO', fontSize: 28, onTap: function () { pending = null; G.go('accesso'); } }); } });

  G.scene('genitori', { update: function (dt) { if (!gate.unlocked && gate.hold > 0 && G.pointer.down) gate.hold = Math.max(0, gate.hold - dt); }, draw: function (c) {
    G.workshopBg(); G.text('AREA GENITORI', W / 2, 80, { size: 48, color: C.sun, stroke: C.ink, sw: 9 });
    if (!gate.unlocked) { G.text('Tieni premuto per entrare', W / 2, 220, { size: 34, color: C.cream }); G.ui.button({ id: 'unlock', x: 440, y: 300, w: 400, h: 140, r: 28, color: C.orange, label: gate.hold ? 'ANCORA…' : 'TIENI PREMUTO', fontSize: 30, onDown: function () { gate.hold = 1.6; }, onTap: function () { if (gate.hold <= 0) { gate.unlocked = true; G.sfx('snap'); } else G.say('Tieni ancora un pochino.'); } }); }
    else { G.text('Scegli il profilo e la difficoltà', W / 2, 145, { size: 28, color: C.cream }); list.slice(0, 3).forEach(function (p, i) { card(c, p, i, true); }); G.ui.button({ id: 'parents-back', x: 480, y: 610, w: 320, h: 78, r: 20, color: C.steel2, label: 'MENU', fontSize: 27, onTap: function () { G.go('menu'); } }); }
  } });
})();
