// Headless end-to-end test for the Yakal portal.
// Boots app/index.html in jsdom (demo driver) and walks every role's portal,
// the parent-monitoring view, the contact-redaction guard, and admin preview.
//
//   npm install && npm test
//
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
// This suite exercises the offline demo driver (the in-browser mirror of the
// RLS rules). Force demo mode even when live Supabase keys are configured in
// the app, so CI validates the access-control logic without a real backend.
const html = fs.readFileSync(path.join(here, '..', 'app', 'index.html'), 'utf8')
  .replace(/const SUPABASE_URL = "[^"]*"/, 'const SUPABASE_URL = ""')
  .replace(/const SUPABASE_ANON_KEY = "[^"]*"/, 'const SUPABASE_ANON_KEY = ""');

const errors = [];
const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/',
  beforeParse(w) { w.scrollTo = () => {}; w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} }); }
});
const w = dom.window, d = w.document;
w.onerror = (m) => errors.push('window.onerror: ' + m);
await new Promise(r => setTimeout(r, 150));

const run = async (label, fn) => { try { await fn(); } catch (e) { errors.push(label + ': ' + e.message); } };
const ev = (x) => w.eval(x);
const NAV = ev('NAV');
const meRole = () => ev('DB').me().role;

await run('boot: home visible', () => { if (!d.getElementById('screen-home').classList.contains('on')) throw new Error('home not shown'); });
await run('boot: demo driver', () => { if (ev('DB').mode !== 'demo') throw new Error('expected demo driver'); });

for (const [demoId, expectRole] of [['u-almaz', 'admin'], ['u-amen', 'student'], ['u-tigist', 'parent'], ['u-beth', 'tutor']]) {
  await run('login ' + expectRole, async () => {
    await w.demoLogin(demoId);
    if (meRole() !== expectRole) throw new Error('role=' + meRole());
    if (!d.getElementById('screen-app').classList.contains('on')) throw new Error('app not shown');
  });
  for (const item of NAV[expectRole]) {
    await run(`view ${expectRole}/${item[0]}`, async () => {
      await w.go(item[0]);
      const main = d.getElementById('main').innerHTML;
      if (!main || main.includes('Could not load')) throw new Error('render failed');
      if (main.includes('class="spin"')) throw new Error('stuck on spinner');
    });
  }
  await run('logout ' + expectRole, async () => {
    await w.logout();
    if (!d.getElementById('screen-home').classList.contains('on')) throw new Error('did not return home');
  });
}

await run('parent opens monitored convo', async () => {
  await w.demoLogin('u-tigist'); await w.go('msg'); await w.openConvo('c1');
  const sc = d.getElementById('sheetContent').innerHTML;
  if (!sc.includes('monitoring') && !sc.includes('read-only')) throw new Error('monitoring state missing');
});
await run('flagged message redacted in UI', async () => {
  await w.demoLogin('u-beth'); await w.go('msg'); await w.openConvo('c4');
  const sc = d.getElementById('sheetContent').innerHTML;
  if (sc.includes('301-555-9999')) throw new Error('phone NOT redacted');
  if (!sc.includes('contact details hidden')) throw new Error('flag note missing');
});
await run('sending contact info gets redacted', async () => {
  await w.demoLogin('u-beth'); await w.go('msg'); await w.openConvo('c4');
  d.getElementById('msgIn').value = 'reach me at venmo @beth or 240-555-1212';
  await w.sendMsg('c4');
  if (d.getElementById('sheetContent').innerHTML.includes('240-555-1212')) throw new Error('new phone NOT redacted');
});
await run('admin preview as student', async () => {
  await w.demoLogin('u-almaz'); w.preview('student');
  if (!d.getElementById('previewBar').classList.contains('on')) throw new Error('preview bar not shown');
  if (ev('role') !== 'student') throw new Error('role not switched');
});
await run('admin exit preview', async () => {
  w.exitPreview();
  if (d.getElementById('previewBar').classList.contains('on')) throw new Error('preview bar still on');
  if (ev('role') !== 'admin') throw new Error('did not return to admin');
});
await run('admin trust shows flag', async () => {
  await w.demoLogin('u-almaz'); await w.go('trust');
  const m = d.getElementById('main').innerHTML.toLowerCase();
  if (!m.includes('phone') && !m.includes('external')) throw new Error('flag not surfaced');
});

if (errors.length) { console.error('FAILURES:\n' + errors.join('\n')); process.exit(1); }
console.log('All end-to-end checks passed.');
