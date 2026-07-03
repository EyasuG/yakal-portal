import { useEffect, useState } from 'react';
import Section from '../components/Section.jsx';

const CATS = [
  { key: 'reach', label: 'Dream / Reach', chip: 'bg-brand-pink/10 text-brand-pink', dot: 'bg-brand-pink' },
  { key: 'match', label: 'Target / Match', chip: 'bg-brand-teal/10 text-brand-teal', dot: 'bg-brand-teal' },
  { key: 'safety', label: 'Safety', chip: 'bg-brand-amber/10 text-brand-amber', dot: 'bg-brand-amber' }
];
const CAT_BY = Object.fromEntries(CATS.map((c) => [c.key, c]));

const RESOURCES = [
  { t: 'Dream, Target & Safety — how to choose', d: 'CollegeVine · the college list decoded', url: 'https://blog.collegevine.com/the-college-list-decoded-safeties-targets-and-reaches/' },
  { t: 'Picking your reach & realistic schools', d: 'CollegeXpress', url: 'https://www.collegexpress.com/articles-and-advice/admission/articles/find-college/safety-reach-and-realistic-schools-and-secret-picking-yours/' },
  { t: 'Dream / Match / Safety framework', d: 'Princeton Review', url: 'https://www.princetonreview.com/college-advice/dream-match-safety-schools' },
  { t: 'Supplemental essay prompt guides', d: 'CollegeEssayAdvisors — per-school prompts & tips', url: 'https://www.collegeessayadvisors.com/supplemental-essay/' },
  { t: 'Scholarship search — BigFuture', d: 'College Board · pay for college', url: 'https://bigfuture.collegeboard.org/pay-for-college' },
  { t: 'Free scholarship searches', d: 'college-scholarships.com', url: 'https://www.college-scholarships.com/scholarship-information/free-scholarship-searches/' }
];

const money = (n) => (n || n === 0 ? '$' + Number(n).toLocaleString() : '—');
const STATUS = { todo: { t: 'To research', c: 'bg-slate-100 text-slate-600' }, in_progress: { t: 'In progress', c: 'bg-brand-teal/10 text-brand-teal' }, done: { t: 'Applied', c: 'bg-emerald-100 text-emerald-700' } };

const COMPARE_FIELDS = [
  { label: 'Category', get: (s) => (CAT_BY[s.kind] || {}).label },
  { label: 'Deadline', get: (s) => [s.deadline_type, s.deadline].filter(Boolean).join(' · ') },
  { label: 'Avg GPA / SAT', get: (s) => s.avg_gpa_sat },
  { label: 'Sticker / yr', get: (s) => (s.sticker_price != null ? money(s.sticker_price) : '') },
  { label: 'Supp. essays', get: (s) => (s.supplement_essays != null ? String(s.supplement_essays) : '') },
  { label: 'Major / program', get: (s) => s.major_offered },
  { label: 'Program rank', get: (s) => s.program_rank },
  { label: 'Class ratio', get: (s) => s.class_ratio },
  { label: '% aid / merit', get: (s) => s.financial_aid },
  { label: 'Tours', get: (s) => s.tours },
  { label: 'Eval sites', get: (s) => s.eval_sites },
  { label: 'Contact', get: (s) => s.admissions_email }
];

const CSV_COLS = [
  ['School', 'school_name'], ['Category', 'kind'], ['Deadline type', 'deadline_type'], ['Deadline', 'deadline'],
  ['Status', 'status'], ['Admissions email', 'admissions_email'], ['Supp. essays', 'supplement_essays'],
  ['Class ratio', 'class_ratio'], ['Major offered', 'major_offered'], ['Program rank', 'program_rank'],
  ['Tours', 'tours'], ['Sticker price', 'sticker_price'], ['% aid / merit', 'financial_aid'],
  ['Eval sites', 'eval_sites'], ['Avg GPA/SAT', 'avg_gpa_sat'], ['Notes', 'notes']
];
function exportCsv(schools) {
  const catLabel = { reach: 'Dream/Reach', match: 'Target/Match', safety: 'Safety' };
  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const lines = [CSV_COLS.map((c) => c[0]).join(',')];
  for (const s of schools) lines.push(CSV_COLS.map(([, k]) => esc(k === 'kind' ? (catLabel[s.kind] || s.kind) : s[k])).join(','));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'college-list.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function Metric({ label, value }) {
  return <div><div className="text-xs text-slate-400">{label}</div><div className="mt-0.5 text-sm font-semibold text-slate-800">{value || '—'}</div></div>;
}

function SchoolCard({ school, open, onToggle, canEdit }) {
  const cat = CAT_BY[school.kind] || CATS[1];
  const st = STATUS[school.status] || STATUS.todo;
  return (
    <div className={`rounded-3xl border bg-white p-5 transition ${open ? 'border-slate-300 shadow-md' : 'border-slate-200'}`}>
      <button onClick={onToggle} className="flex w-full items-start gap-3 text-left">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${cat.dot}`} />
        <div className="grow">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">{school.school_name}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cat.chip}`}>{cat.label}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.c}`}>{st.t}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Deadline" value={[school.deadline_type, school.deadline].filter(Boolean).join(' · ')} />
            <Metric label="Avg GPA / SAT" value={school.avg_gpa_sat} />
            <Metric label="Sticker / yr" value={school.sticker_price != null ? money(school.sticker_price) : ''} />
            <Metric label="Supp. essays" value={school.supplement_essays != null ? String(school.supplement_essays) : ''} />
          </div>
        </div>
        <span className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
      </button>
      {open ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Major offered / program to apply to" value={school.major_offered} />
            <Metric label="Program ranking" value={school.program_rank} />
            <Metric label="Class size / student–teacher ratio" value={school.class_ratio} />
            <Metric label="% on financial aid / merit" value={school.financial_aid} />
            <Metric label="Admissions contact" value={school.admissions_email} />
            <Metric label="Tours" value={school.tours} />
            <Metric label="Evaluative sites" value={school.eval_sites} />
          </div>
          {school.notes ? <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600"><span className="font-semibold text-slate-700">Notes: </span>{school.notes}</div> : null}
          {canEdit ? (
            <div className="flex gap-2 pt-1">
              <button className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => window.openSchoolSheet(school)}>Edit</button>
              <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-pink-300 hover:text-pink-600" onClick={() => { if (confirm('Remove ' + school.school_name + ' from the list?')) window.removeSchool(school.id); }}>Remove</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function CollegeListView({ db }) {
  const role = (db && db.me && db.me()) ? db.me().role : null;
  const isStaff = ['counselor', 'admissions_admin', 'super_admin', 'admin', 'tutoring_admin'].includes(role);
  const canEdit = isStaff || role === 'student';
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [schools, setSchools] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const toggleCompare = (id) => setCompareIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : (prev.length >= 4 ? prev : [...prev, id]));

  useEffect(() => {
    let alive = true;
    if (isStaff) db.bookableStudents().then((list) => { if (!alive) return; setStudents(list); setStudentId((p) => p || list[0]?.id || null); });
    return () => { alive = false; };
  }, []);

  const targetId = isStaff ? studentId : null;
  const reload = () => db.collegeList(targetId).then((r) => setSchools(r.schools)).catch(() => setSchools([]));
  useEffect(() => {
    if (isStaff && !studentId) { setSchools([]); return; }
    reload();
    window.__collegeCtx = { studentId: targetId, reload };
    return () => { if (window.__collegeCtx && window.__collegeCtx.reload === reload) window.__collegeCtx = null; };
  }, [studentId]);

  if (schools === null && !(isStaff && !studentId)) return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading…</div>;

  const counts = CATS.map((c) => (schools || []).filter((s) => s.kind === c.key).length);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-r from-brand-teal to-brand-teal900 p-7 text-white shadow-xl">
        <div className="text-sm uppercase tracking-[0.2em] text-teal-100">College List</div>
        <div className="mt-2 text-2xl font-semibold">Research, compare & track every school</div>
        <div className="mt-2 max-w-2xl text-sm text-teal-100">Build a balanced list of Dream, Target and Safety schools — with deadlines, essays, cost, aid, fit and the numbers, all in one place.</div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {CATS.map((c, i) => (
            <div key={c.key} className="rounded-2xl bg-white/10 p-3 text-center">
              <div className="text-xl font-bold">{counts[i]}</div>
              <div className="text-xs text-teal-100">{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {isStaff ? (
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4">
          <span className="text-sm font-medium text-slate-600">Student</span>
          <select value={studentId || ''} onChange={(e) => setStudentId(e.target.value)} className="grow rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none">
            {students.length ? students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>) : <option value="">No students</option>}
          </select>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-slate-900">Schools</h2>
        <div className="flex flex-wrap gap-2">
          {(schools || []).length >= 2 ? (
            <button className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${compareOpen ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-300 text-slate-700 hover:border-slate-400'}`} onClick={() => setCompareOpen((o) => !o)}>{compareOpen ? 'Close compare' : 'Compare'}</button>
          ) : null}
          {(schools || []).length ? (
            <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400" onClick={() => exportCsv(schools)}>Export CSV</button>
          ) : null}
          {canEdit && (!isStaff || studentId) ? <button className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => window.openSchoolSheet(null)}>+ Add a school</button> : null}
        </div>
      </div>

      {compareOpen && (schools || []).length >= 2 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-slate-700">Select up to 4 schools to compare</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(schools || []).map((s) => {
              const on = compareIds.includes(s.id);
              return <button key={s.id} onClick={() => toggleCompare(s.id)} className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${on ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s.school_name}</button>;
            })}
          </div>
          {compareIds.length >= 2 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr><th className="p-2 text-left" /><>{compareIds.map((id) => { const s = (schools || []).find((x) => x.id === id); return s ? <th key={id} className="p-2 text-left font-semibold text-slate-900">{s.school_name}</th> : null; })}</></tr>
                </thead>
                <tbody>
                  {COMPARE_FIELDS.map((f) => (
                    <tr key={f.label} className="border-t border-slate-100">
                      <td className="whitespace-nowrap p-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{f.label}</td>
                      {compareIds.map((id) => { const s = (schools || []).find((x) => x.id === id); return s ? <td key={id} className="p-2 align-top text-slate-800">{f.get(s) || '—'}</td> : null; })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="mt-3 text-sm text-slate-500">Pick at least two schools to see them side by side.</div>}
        </div>
      ) : null}

      {(schools || []).length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <div className="text-lg font-semibold text-slate-900">No schools yet</div>
          <div className="mt-1 text-sm text-slate-500">{canEdit ? 'Add your first Dream, Target or Safety school to start researching.' : 'The college list is empty.'}</div>
        </div>
      ) : (
        CATS.map((c) => {
          const group = (schools || []).filter((s) => s.kind === c.key);
          if (!group.length) return null;
          return (
            <div key={c.key} className="space-y-3">
              <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} /><h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{c.label} · {group.length}</h3></div>
              {group.map((s) => <SchoolCard key={s.id} school={s} open={openId === s.id} onToggle={() => setOpenId(openId === s.id ? null : s.id)} canEdit={canEdit} />)}
            </div>
          );
        })
      )}

      <Section title="Research resources">
        <div className="grid gap-3 sm:grid-cols-2">
          {RESOURCES.map((r) => (
            <a key={r.t} href={r.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-teal/30 hover:shadow-md">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-teal/10 text-brand-teal">↗</span>
              <div><div className="text-sm font-semibold text-slate-900">{r.t}</div><div className="text-xs text-slate-500">{r.d}</div></div>
            </a>
          ))}
        </div>
      </Section>
    </div>
  );
}
