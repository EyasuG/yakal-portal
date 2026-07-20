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

// ---- college essays: core vs per-school, edit, and doc links ----
await check('college list returns essays; core vs supplement split by school_id', async () => {
  const d = driver(); await d.signInDemo('u-amen');
  const { schools, essays } = await d.collegeList();
  assert.ok(schools.length >= 1, 'schools should load');
  assert.ok(essays.length >= 1, 'essays should load');
  const core = essays.filter(e => !e.school_id);
  const supp = essays.filter(e => e.school_id);
  assert.ok(core.length >= 1, 'should have at least one core essay');
  assert.ok(supp.length >= 1, 'should have at least one supplemental essay attached to a school');
  assert.ok(supp.every(e => schools.some(s => s.id === e.school_id)), 'each supplement points at a real school');
  assert.ok(essays.some(e => e.doc_url), 'at least one essay carries a document link');
});
await check('saveEssay adds a supplement to a school, then edits its status + doc link', async () => {
  const d = driver(); await d.signInDemo('u-amen');
  const { schools } = await d.collegeList();
  const target = schools[0];
  const id = await d.saveEssay(null, { title: 'New supplement', school_id: target.id, status: 'todo' });
  let essays = (await d.collegeList()).essays;
  const added = essays.find(e => e.id === id);
  assert.ok(added && added.school_id === target.id, 'new essay attached to the school');
  await d.saveEssay(null, { id, status: 'in_progress', doc_url: 'https://docs.google.com/x' });
  essays = (await d.applicationDetail()).essays;
  const edited = essays.find(e => e.id === id);
  assert.equal(edited.status, 'in_progress', 'status persisted');
  assert.equal(edited.doc_url, 'https://docs.google.com/x', 'doc link persisted');
  await d.deleteEssay(id);
  assert.ok(!(await d.collegeList()).essays.some(e => e.id === id), 'essay removed');
});

// ---- academics: transcript + test scores ----
await check('academics returns seeded scores; saveAcademics updates them', async () => {
  const d = driver(); await d.signInDemo('u-amen');
  const a = await d.academics();
  assert.equal(a.gpa_unweighted, '3.9', 'seeded GPA present');
  assert.ok(a.transcript_url, 'seeded transcript link present');
  await d.saveAcademics(null, { sat_total: 1550, act_composite: 35 });
  const b = await d.academics();
  assert.equal(b.sat_total, 1550, 'SAT updated');
  assert.equal(b.act_composite, 35, 'ACT updated');
  assert.equal(b.gpa_unweighted, '3.9', 'unrelated field preserved on partial update');
});
await check('a parent can read their child\'s academics (read-only)', async () => {
  const d = driver(); await d.signInDemo('u-tigist');
  const a = await d.academics('s-amen');
  assert.ok(a && a.gpa_unweighted === '3.9', 'parent sees child academics');
});

// ---- recommendation letters ----
await check('recommendations load; add, edit status + Drive link, remove', async () => {
  const d = driver(); await d.signInDemo('u-amen');
  let recs = (await d.applicationDetail()).recs;
  assert.ok(recs.length >= 1, 'seeded recommenders load');
  assert.ok(recs.some(r => r.status === 'done' && r.doc_url), 'a received letter has a Drive link');
  const id = await d.saveRec(null, { recommender_name: 'Ms. New Rec', recommender_role: 'Physics teacher' });
  await d.setItemStatus('rec', id, 'in_progress');
  await d.saveRec(null, { id, doc_url: 'https://drive.google.com/file/x' });
  recs = (await d.applicationDetail()).recs;
  const added = recs.find(r => r.id === id);
  assert.equal(added.status, 'in_progress', 'status persisted');
  assert.equal(added.doc_url, 'https://drive.google.com/file/x', 'Drive link persisted');
  await d.deleteRec(id);
  assert.ok(!(await d.applicationDetail()).recs.some(r => r.id === id), 'recommendation removed');
});
await check('counselor sees the same recommendations for their student', async () => {
  const d = driver(); await d.signInDemo('u-hana');
  const recs = (await d.applicationDetail('s-amen')).recs;
  assert.ok(recs.length >= 1, 'counselor sees the student recommenders');
});

// ---- diagnostics: role-aware attribution ----
await check('a student self-assessment saves against their own record', async () => {
  const d = driver(); await d.signInDemo('u-amen'); // student
  const id = await d.saveDiagnostic({ subject: 'Physics', overall_mastery: 33, skill_gaps: ['Energy'], status: 'new' });
  const row = (await d.listDiagnostics()).find(r => r.id === id);
  assert.equal(row.student_id, 's-amen', 'student_id should be the student\'s own record');
  assert.equal(row.tutor_id, null, 'tutor_id should be null for a student self-assessment');
  assert.equal(row.overall_mastery, 33, 'the analysis is persisted');
});
await check('a tutor-run diagnostic saves as a lead (tutor_id set, no student_id)', async () => {
  const d = driver(); await d.signInDemo('u-beth'); // tutor
  const id = await d.saveDiagnostic({ subject: 'K-12 Math', overall_mastery: 80, prospect_student: 'Walk-in', status: 'new' });
  const row = (await d.listDiagnostics()).find(r => r.id === id);
  assert.equal(row.tutor_id, 'u-beth', 'tutor_id should be the tutor');
  assert.equal(row.student_id, null, 'student_id should be null for a lead');
});

console.log(`\nAll ${pass} checks passed.`);
