#!/usr/bin/env node
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const root = __dirname, src = path.join(root, 'src');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const files = fs.readdirSync(src).filter(f => f.endsWith('.js')).sort();
const js = files.map(f => `\n/* ===== ${f} ===== */\n` + fs.readFileSync(path.join(src, f), 'utf8').trim() + '\n').join('\n');
try { new vm.Script(js, { filename:'bundle.js' }); } catch (e) { console.error('[BUILD FAILED] ' + e.message); process.exit(1); }
const html = read('shell.html').replace('/*STYLE*/', () => read('style.css')).replace('<!--BODY-->', () => read('body.html')).replace('/*SCRIPT*/', () => js);
fs.writeFileSync(path.join(root, 'index.html'), html);
const tpl = read('sw.template.js'), hash = crypto.createHash('sha1').update(html).update(tpl).digest('hex').slice(0,10);
const sw = tpl.replace('__VERSION__', () => hash); new vm.Script(sw, { filename:'sw.js' }); fs.writeFileSync(path.join(root, 'sw.js'), sw);
fs.mkdirSync(path.join(root, 'dist'), { recursive:true }); fs.writeFileSync(path.join(root, 'dist', 'embed.html'), `<style>\n${read('style.css')}\n</style>\n${read('body.html')}\n<script>\n${js}\n</script>\n`);
console.log(`built index.html (${files.length} modules, sw ${hash})`);
