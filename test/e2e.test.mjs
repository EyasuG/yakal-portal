// Access-control test for the Yakal portal.
//
// The app is now a React/Vite build, so this suite exercises the demo data
// driver directly (the in-browser mirror of the database's Row-Level Security
// rules) by importing the real modules — no DOM needed. It asserts the three
// product guarantees: parents monitor their child's threads, staff visibility
// is scoped, and contact info is scanned + redacted.
//
//   npm test
//
import assert from 'node:assert/strict';
import { LocalDriver } from '../app/src/db.js';
import { scan, redact } from '../app/src/seed.js';

// The driver guards localStorage already; this just keeps Node quiet.
globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };

let pass = 0;
const check = async (label, fn) => { await fn(); pass++; console.log('  ✓ ' + label); };
const driver = () => LocalDriver();

// ---- message scanner (anti-disintermediation) ----
await check('scanner flags phone + off-platform language', () => {
  const r = scan('Actually just text me at 301-555-9999 so we can sort it off the app');
  assert.ok(r.includes('phone'), 'phone not flagged');
  assert.ok(r.includes('external_platform'), 'off-platform language not flagged');
});
await check('scanner flags payment handles and emails', () => {
  assert.ok(scan('venmo @beth').includes('payment_handle'));
  assert.ok(scan('reach me at beth@gmail.com').includes('email'));
});
await check('redact strips contact info', () => {
  const out = redact('call 301-555-9999 or beth@gmail.com');
  assert.ok(!out.includes('301-555-9999'), 'phone not redacted');
  assert.ok(!out.includes('beth@gmail.com'), 'email not redacted');
});

// ---- student visibility: admin all, tutor scoped, student self ----
await check('admin sees all students, tutor sees only assigned, student sees self', async () => {
  let d = driver(); await d.signInDemo('u-almaz');
  assert.equal((await d.listStudents()).length, 3, 'admin should see all 3 students');
  d = driver(); await d.signInDemo('u-beth');
  assert.equal((await d.listStudents()).length, 2, 'tutor Beth should see only her 2 students');
  d = driver(); await d.signInDemo('u-amen');
  assert.equal((await d.listStudents()).length, 1, 'student should see only themselves');
});

// ---- parent message monitoring ----
await check('parent monitors a thread about their child even as a non-participant', async () => {
  const d = driver(); await d.signInDemo('u-tigist');
  const convos = await d.conversations();
  const c1 = convos.find(c => c.id === 'c1');
  assert.ok(c1, 'Tigist should see c1 (about her child Amen)');
  assert.equal(c1.monitor, true, 'c1 should be flagged as monitored (she is not a participant)');
  assert.equal(convos.length, 3, "Tigist should see exactly her children's threads");
});
await check('an unrelated parent cannot see another child\'s thread', async () => {
  const d = driver(); await d.signInDemo('u-sara');
  const ids = (await d.conversations()).map(c => c.id);
  assert.ok(!ids.includes('c1'), 'Sara must not see c1');
});

// ---- contact info redacted in-thread for non-admins ----
await check('flagged message is redacted inside the conversation', async () => {
  const d = driver(); await d.signInDemo('u-beth');
  const { msgs } = await d.messages('c4');
  const rendered = msgs.map(m => m.t).join(' ');
  assert.ok(!rendered.includes('301-555-9999'), 'phone number leaked in the rendered thread');
});

console.log(`\nAll ${pass} access-control checks passed.`);
