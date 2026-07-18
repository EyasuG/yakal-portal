import { useEffect, useState } from 'react';
import Section from '../components/Section.jsx';
import CollegeAdmissionsView from './CollegeAdmissionsView.jsx';
import CollegeListView from './CollegeListView.jsx';
import ChildDetailView from './ChildDetailView.jsx';
import DiagnosticView from './DiagnosticView.jsx';
import { initials } from '../lib/utils.js';

function ViewRouter({ activeView, db, viewVersion, onRefresh }) {
  switch (activeView) {
    case 'overview':
      return <OverviewView db={db} key={viewVersion} onOpenSwitch={() => window.openSwitch()} />;
    case 'students':
      return <StudentsView db={db} key={viewVersion} />;
    case 'tutors':
      return <TutorsView db={db} key={viewVersion} />;
    case 'trust':
      return <TrustView db={db} key={viewVersion} />;
    case 'shome':
      return <StudentHomeView db={db} key={viewVersion} />;
    case 'ssessions':
      return <StudentSessionsView db={db} key={viewVersion} />;
    case 'sadm':
      return <StudentAdmissionsView db={db} key={viewVersion} />;
    case 'college':
      return <CollegeAdmissionsView key={viewVersion} />;
    case 'clist':
      return <CollegeListView db={db} key={viewVersion} />;
    case 'child':
      return <ChildDetailView db={db} key={viewVersion} />;
    case 'phome':
      return <ParentHomeView db={db} key={viewVersion} />;
    case 'pkids':
      return <ParentKidsView db={db} key={viewVersion} />;
    case 'pbill':
      return <ParentBillingView db={db} key={viewVersion} />;
    case 'thome':
      return <TutorHomeView db={db} key={viewVersion} />;
    case 'tstudents':
      return <TutorStudentsView db={db} key={viewVersion} />;
    case 'tdiag':
      return <DiagnosticView db={db} key={viewVersion} />;
    case 'tearn':
      return <TutorEarningsView db={db} key={viewVersion} />;
    case 'msg':
      return <MessagesView db={db} key={viewVersion} onOpenConvo={(id) => window.openConvo(id)} />;
    default:
      return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600">View not found.</div>;
  }
}

function LoadingCard({ label = 'Loading…' }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">{label}</div>;
}

function ProgramBadges({ programs }) {
  if (!programs || !programs.length) return null;
  return (
    <span className="flex flex-wrap gap-1.5">
      {programs.map((p) => (
        <span key={p} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p === 'admissions' ? 'bg-pink-50 text-pink-600' : 'bg-teal-50 text-teal-700'}`}>
          {p === 'admissions' ? 'Admissions' : 'Tutoring'}
        </span>
      ))}
    </span>
  );
}

function OverviewView({ db }) {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    db?.adminOverview().then(setOverview).catch(() => setOverview(null));
  }, [db]);

  if (!overview) return <LoadingCard />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Active students" value={overview.students} note="+2 this term" />
        <Kpi label="Tutors" value={overview.tutors} note="4 accepting" />
        <Kpi label="Revenue (paid)" value={money(overview.revenue)} note="this term" />
        <Kpi label="Outstanding" value={money(overview.outstanding)} note={overview.outstanding ? '1 invoice open' : 'all clear'} tone={overview.outstanding ? 'pink' : 'green'} />
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold text-slate-900">Needs attention</div>
            <div className="mt-2 text-sm text-slate-500">Review open flags and the role portals.</div>
          </div>
          <button className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700" onClick={() => window.openSwitch()}>Preview</button>
        </div>
        {overview.flags ? (
          <button className="mt-6 w-full rounded-3xl border border-pink-200 bg-pink-50 p-5 text-left text-slate-900" onClick={() => window.go('trust')}>
            <div className="text-lg font-semibold">{overview.flags} flagged message{overview.flags > 1 ? 's' : ''}</div>
            <div className="mt-1 text-sm text-slate-600">Possible off-platform contact — review in Trust</div>
          </button>
        ) : (
          <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-slate-600">No current flags. The portal is clean.</div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, note, tone = 'teal' }) {
  const toneClasses = tone === 'pink' ? 'text-pink-600' : tone === 'green' ? 'text-emerald-600' : 'text-teal-600';
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className={`mt-3 text-3xl font-semibold ${toneClasses}`}>{value}</div>
      <div className="mt-2 text-sm text-slate-500">{note}</div>
    </div>
  );
}

function StudentsView({ db }) {
  const [students, setStudents] = useState(null);

  useEffect(() => {
    db?.listStudents().then(setStudents).catch(() => setStudents([]));
  }, [db]);

  if (!students) return <LoadingCard />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Students</h2>
          <p className="text-sm text-slate-500">{students.length} total</p>
        </div>
        <button className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => window.openBookSheet()}>+ Book a session</button>
      </div>
      <div className="space-y-3">
        {students.map((student) => (
          <button key={student.id} className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left transition hover:bg-slate-50" onClick={() => window.openChild(student.id)}>
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">{initials(student.name)}</div>
              <div className="grow">
                <div className="font-semibold text-slate-900">{student.name}</div>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <span>{student.grade}</span>
                  <ProgramBadges programs={student.programs} />
                </div>
              </div>
              <div className="text-sm text-slate-500">{student.progress ? student.progress + '%' : ''}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TutorsView({ db }) {
  const [tutors, setTutors] = useState(null);

  useEffect(() => {
    db?.listTutors().then(setTutors).catch(() => setTutors([]));
  }, [db]);

  if (!tutors) return <LoadingCard />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Tutors</h2>
          <p className="text-sm text-slate-500">{tutors.length} total</p>
        </div>
      </div>
      <div className="space-y-3">
        {tutors.map((tutor) => (
          <div key={tutor.id} className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">{initials(tutor.name)}</div>
                <div>
                  <div className="font-semibold text-slate-900">{tutor.name}</div>
                  <div className="text-sm text-slate-500">★ {tutor.rating} · {tutor.students} students · ${tutor.rate}/hr</div>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tutor.accepting ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{tutor.accepting ? 'Accepting' : 'Full'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustView({ db }) {
  const [flags, setFlags] = useState(null);
  const [risk, setRisk] = useState(null);

  useEffect(() => {
    db?.adminFlags().then(setFlags).catch(() => setFlags([]));
    db?.tutorRisk().then(setRisk).catch(() => setRisk([]));
  }, [db]);

  if (!flags || !risk) return <LoadingCard />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Trust & safety</h2>
        <p className="mt-2 text-sm text-slate-500">Messages are scanned for off-platform contact attempts. Contact details are auto-redacted for members and logged here for review.</p>
      </div>
      {flags.length ? (
        <div className="space-y-3">
          {flags.map((flag, idx) => (
            <div key={idx} className="rounded-3xl border border-pink-200 bg-pink-50 p-5">
              <div className="font-semibold text-slate-900">{flag.who} · re {flag.student || '—'}</div>
              <div className="mt-1 text-sm text-slate-600">{flag.time}</div>
              <div className="mt-3 text-slate-700 italic">"{flag.excerpt}"</div>
              <div className="mt-3 flex flex-wrap gap-2">{flag.reasons.map((reason) => <span key={reason} className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">{reason.replace('_', ' ')}</span>)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">No flags. Communications look clean.</div>
      )}
      {risk.length ? (
        <div className="space-y-3">
          <div className="text-xl font-semibold text-slate-900">Tutor risk</div>
          {risk.map((item, idx) => (
            <div key={idx} className="rounded-3xl border border-pink-200 bg-pink-50 p-5">
              <div className="font-semibold text-slate-900">{item.name}</div>
              <div className="text-sm text-slate-600">{item.flags} open flag{item.flags > 1 ? 's' : ''}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StudentHomeView({ db }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    db?.studentHome().then(setData).catch(() => setData(null));
  }, [db]);

  if (!data) return <LoadingCard />;

  return (
    <div className="space-y-6">
      <SessionHero student={data.student} tutorName={data.tutorName} nextSession={data.nextSession} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatBox value="12" label="Sessions" />
        <StatBox value="18h" label="This term" />
        <StatBox value="5" label="Day streak" />
      </div>
      <Section title="Subjects & progress">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">{data.progress.map(([label, value]) => <ProgressBar key={label} label={label} value={value} />)}</div>
      </Section>
      <Section title="Assignments due">
        <div className="rounded-3xl border border-slate-200 bg-white p-4">{data.homework.length ? data.homework.map((item, index) => <ChecklistItem key={index} item={item} onToggle={() => { db.toggleHomework(index); setData((prev) => ({ ...prev, homework: prev.homework.map((h, idx) => idx === index ? { ...h, done: !h.done } : h) })); }} />) : <div className="text-slate-500">No assignments</div>}</div>
      </Section>
      {(data.deadlines && data.deadlines.length) ? (
        <Section title="Upcoming application deadlines" actionLabel="College list" action={() => window.go('clist')}>
          <div className="space-y-2">
            {data.deadlines.map((d, i) => {
              const days = Math.ceil((new Date(d.date) - Date.now()) / 86400000);
              const soon = days <= 30;
              return (
                <div key={i} className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${soon ? 'bg-brand-pink/10 text-brand-pink' : 'bg-brand-teal/10 text-brand-teal'}`}>📅</div>
                  <div className="grow">
                    <div className="font-semibold text-slate-900">{d.school}</div>
                    <div className="text-sm text-slate-500">{[d.type, new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div className={`shrink-0 text-sm font-semibold ${soon ? 'text-brand-pink' : 'text-slate-500'}`}>{days <= 0 ? 'Due' : `${days}d left`}</div>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}
      {data.application ? (
        <button className="flex w-full items-center justify-between rounded-3xl bg-pink-50 p-5 text-left transition hover:bg-pink-100" onClick={() => window.go('sadm')}>
          <div>
            <div className="font-semibold text-slate-900">Your college applications</div>
            <div className="mt-2 text-sm text-slate-600">{data.application.top} · deadline in {data.application.days} days</div>
          </div>
          <span className="text-slate-400">→</span>
        </button>
      ) : null}
    </div>
  );
}

function StudentSessionsView({ db }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    db?.studentSessions().then(setData).catch(() => setData(null));
  }, [db]);

  if (!data) return <LoadingCard />;

  return (
    <div className="space-y-6">
      <Section title="Upcoming">
        <div className="space-y-3">
          {(data.upcoming && data.upcoming.length) ? data.upcoming.map((sess) => (
            <div key={sess.sessionId} className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">📅</div>
              <div className="grow">
                <div className="font-semibold text-slate-900">{sess.subject}</div>
                <div className="text-sm text-slate-500">{sess.when} · {sess.mode}</div>
              </div>
              {sess.mode !== 'In person' ? (
                <button className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => sess.meetingUrl ? window.openMeeting(sess.meetingUrl) : window.toast('Your tutor will open the video room at session time')}>Join</button>
              ) : null}
            </div>
          )) : <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">No upcoming sessions yet.</div>}
        </div>
      </Section>
      <Section title="Past sessions">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 space-y-3">{data.past.length ? data.past.map(([topic, who, when]) => <SessionRecord key={`${topic}-${when}`} topic={topic} who={who} when={when} />) : <div className="text-slate-500">No past sessions yet</div>}</div>
      </Section>
    </div>
  );
}

// Per-school application requirements — the checklist best-in-class trackers
// (Scoir/Naviance-style) keep for every school on the list.
const REQS = [
  ['app_submitted', 'Application'], ['essays_done', 'Essays'], ['recs_requested', 'Recs requested'],
  ['recs_received', 'Recs received'], ['transcript_sent', 'Transcript'], ['scores_sent', 'Test scores'],
  ['fafsa_submitted', 'FAFSA'], ['css_submitted', 'CSS Profile']
];
const DECISIONS = [['', '— Decision —'], ['accepted', 'Accepted 🎉'], ['waitlisted', 'Waitlisted'], ['denied', 'Denied'], ['enrolled', 'Enrolled ✅']];
const DECISION_CHIP = { accepted: 'bg-emerald-100 text-emerald-700', enrolled: 'bg-emerald-600 text-white', waitlisted: 'bg-amber-100 text-amber-700', denied: 'bg-slate-200 text-slate-600' };

function ScorePill({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2 text-center">
      <div className="text-lg font-bold text-slate-900">{value || '—'}</div>
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}

function DocLink({ href, label, icon }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-brand-teal/10 px-4 py-2 text-sm font-semibold text-brand-teal transition hover:bg-brand-teal/20">
      <span>{icon}</span>{label} ↗
    </a>
  );
}

const REC_STATUS = [['todo', 'Not requested'], ['in_progress', 'Requested'], ['done', 'Received']];
const REC_CHIP = { todo: 'bg-slate-100 text-slate-600', in_progress: 'bg-brand-teal/10 text-brand-teal', done: 'bg-emerald-100 text-emerald-700' };

function RecRow({ rec, canEdit, onStatus }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="min-w-0 grow">
        <div className="text-sm font-semibold text-slate-900">{rec.recommender_name}</div>
        <div className="text-xs text-slate-500">{[rec.recommender_role, rec.due_date ? `due ${rec.due_date}` : null].filter(Boolean).join(' · ') || 'Recommender'}</div>
      </div>
      {rec.doc_url ? <a href={rec.doc_url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-semibold text-brand-teal transition hover:bg-brand-teal/20">Open ↗</a> : null}
      {canEdit ? (
        <select value={rec.status} onChange={(e) => onStatus(rec, e.target.value)} className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold outline-none">
          {REC_STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${REC_CHIP[rec.status] || REC_CHIP.todo}`}>{(REC_STATUS.find(([v]) => v === rec.status) || REC_STATUS[0])[1]}</span>}
      {canEdit ? <button onClick={() => window.openRecSheet(rec)} className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Edit</button> : null}
    </div>
  );
}

function AcademicsCard({ acad, canEdit, studentId }) {
  if (acad === null) return null; // still loading
  const a = acad || {};
  const sat = a.sat_total ? `${a.sat_total}` : '';
  const satParts = [a.sat_ebrw ? `EBRW ${a.sat_ebrw}` : null, a.sat_math ? `Math ${a.sat_math}` : null].filter(Boolean).join(' · ');
  const hasScores = a.gpa_unweighted || a.gpa_weighted || a.sat_total || a.act_composite || a.test_notes;
  const hasDocs = a.transcript_url || a.drive_folder_url;
  const hasAny = hasScores || hasDocs;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Academics & documents</h3>
          <p className="text-xs text-slate-400">Test scores and transcript colleges will see</p>
        </div>
        {canEdit ? <button onClick={() => window.openAcademicsSheet(a, studentId)} className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white">{hasAny ? 'Edit' : 'Add'}</button> : null}
      </div>
      {hasAny ? (
        <>
          {hasScores ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <ScorePill label="GPA (UW)" value={a.gpa_unweighted} />
              <ScorePill label="GPA (W)" value={a.gpa_weighted} />
              <ScorePill label="SAT" value={sat} />
              <ScorePill label="ACT" value={a.act_composite ? String(a.act_composite) : ''} />
            </div>
          ) : null}
          {satParts ? <div className="mt-2 text-xs text-slate-500">SAT breakdown: {satParts}{a.class_rank ? ` · Class rank ${a.class_rank}` : ''}</div> : (a.class_rank ? <div className="mt-2 text-xs text-slate-500">Class rank {a.class_rank}</div> : null)}
          {a.test_notes ? <div className="mt-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600"><span className="font-semibold text-slate-700">Other tests: </span>{a.test_notes}</div> : null}
          {hasDocs ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <DocLink href={a.transcript_url} label="Transcript" icon="📄" />
              <DocLink href={a.drive_folder_url} label="Drive folder" icon="📁" />
            </div>
          ) : (canEdit ? <div className="mt-3 text-xs text-slate-400">No transcript link yet — add a Google Drive link so counselors can review it.</div> : null)}
        </>
      ) : (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{canEdit ? 'Add your GPA, test scores and a link to your transcript (Google Drive) so your counselor and colleges have them in one place.' : 'No scores or documents on file yet.'}</div>
      )}
    </div>
  );
}

function StudentAdmissionsView({ db }) {
  const me = (db && db.me && db.me()) || {};
  const isStaff = ['counselor', 'admissions_admin', 'super_admin', 'admin'].includes(me.role);
  const isParent = me.role === 'parent';
  const needsPicker = isStaff || isParent;
  const canEdit = isStaff || me.role === 'student';
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [data, setData] = useState(null);

  const [acad, setAcad] = useState(null);
  useEffect(() => { if (needsPicker) (isParent ? db.parentChildren() : db.bookableStudents()).then((l) => { setStudents(l); setStudentId((p) => p || l[0]?.id || null); }); }, []);
  const targetId = needsPicker ? studentId : null;
  const reload = () => db.applicationDetail(targetId).then(setData).catch(() => setData({ schools: [], essays: [], tasks: [] }));
  const reloadAcad = () => db.academics(targetId).then(setAcad).catch(() => setAcad({}));
  useEffect(() => {
    if (needsPicker && !studentId) return;
    reload();
    reloadAcad();
    const both = () => { reload(); reloadAcad(); };
    window.__academicsCtx = { studentId: targetId, reload: reloadAcad };
    window.__trackerCtx = { studentId: targetId, reload: both };
    return () => {
      if (window.__academicsCtx && window.__academicsCtx.reload === reloadAcad) window.__academicsCtx = null;
      if (window.__trackerCtx && window.__trackerCtx.reload === both) window.__trackerCtx = null;
    };
  }, [studentId]);

  if (!data) return <LoadingCard />;
  const { schools, essays, tasks, recs = [] } = data;
  const reqDone = (s) => REQS.filter(([k]) => (s.requirements || {})[k]).length;
  const submitted = schools.filter((s) => (s.requirements || {}).app_submitted).length;
  const accepted = schools.filter((s) => s.decision === 'accepted' || s.decision === 'enrolled').length;

  const toggleReq = async (school, key) => {
    if (!canEdit) return;
    const requirements = { ...(school.requirements || {}), [key]: !(school.requirements || {})[key] };
    setData((p) => ({ ...p, schools: p.schools.map((x) => x.id === school.id ? { ...x, requirements } : x) }));
    try { await db.setSchoolTracking(school.id, { requirements }); } catch (e) { window.toast(e.message); reload(); }
  };
  const setDecision = async (school, decision) => {
    setData((p) => ({ ...p, schools: p.schools.map((x) => x.id === school.id ? { ...x, decision: decision || null } : x) }));
    try { await db.setSchoolTracking(school.id, { decision: decision || null }); } catch (e) { window.toast(e.message); reload(); }
  };
  const toggleItem = async (kind, item) => {
    if (!canEdit) return;
    const status = item.status === 'done' ? 'todo' : 'done';
    setData((p) => ({ ...p, [kind === 'essay' ? 'essays' : 'tasks']: p[kind === 'essay' ? 'essays' : 'tasks'].map((x) => x.id === item.id ? { ...x, status } : x) }));
    try { await db.setItemStatus(kind, item.id, status); } catch (e) { window.toast(e.message); reload(); }
  };
  const setRecStatus = async (rec, status) => {
    if (!canEdit) return;
    setData((p) => ({ ...p, recs: (p.recs || []).map((x) => x.id === rec.id ? { ...x, status } : x) }));
    try { await db.setItemStatus('rec', rec.id, status); } catch (e) { window.toast(e.message); reload(); }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-r from-brand-pink to-brand-pinkdark p-7 text-white shadow-xl">
        <div className="text-sm uppercase tracking-[0.2em] text-pink-100">Application Tracker</div>
        <div className="mt-2 text-2xl font-semibold">Every school, every requirement</div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/10 p-3 text-center"><div className="text-xl font-bold">{schools.length}</div><div className="text-xs text-pink-100">Schools</div></div>
          <div className="rounded-2xl bg-white/10 p-3 text-center"><div className="text-xl font-bold">{submitted}</div><div className="text-xs text-pink-100">Submitted</div></div>
          <div className="rounded-2xl bg-white/10 p-3 text-center"><div className="text-xl font-bold">{accepted}</div><div className="text-xs text-pink-100">Accepted</div></div>
        </div>
      </div>

      {needsPicker ? (
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4">
          <span className="text-sm font-medium text-slate-600">{isParent ? 'Child' : 'Student'}</span>
          <select value={studentId || ''} onChange={(e) => setStudentId(e.target.value)} className="grow rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none">
            {students.length ? students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>) : <option value="">{isParent ? 'No children' : 'No students'}</option>}
          </select>
          {isParent ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">View only</span> : null}
        </div>
      ) : null}

      <AcademicsCard acad={acad} canEdit={canEdit} studentId={targetId} />

      {schools.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <div className="text-lg font-semibold text-slate-900">No schools on the list yet</div>
          <div className="mt-1 text-sm text-slate-500">{canEdit ? 'Build the college list first — the tracker follows it.' : 'The college list is empty.'}</div>
          {canEdit ? <button className="mt-4 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white" onClick={() => window.go('clist')}>Open the College List</button> : null}
        </div>
      ) : (
        <Section title="Per-school requirements">
          <div className="space-y-3">
            {schools.map((s) => (
              <div key={s.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">{s.school_name}</span>
                  {s.deadline ? <span className="text-xs text-slate-500">{[s.deadline_type, s.deadline].filter(Boolean).join(' · ')}</span> : null}
                  <span className="ml-auto text-xs font-semibold text-slate-500">{reqDone(s)}/{REQS.length}</span>
                  {canEdit ? (
                    <select value={s.decision || ''} onChange={(e) => setDecision(s, e.target.value)} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold outline-none">
                      {DECISIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  ) : (s.decision ? <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${DECISION_CHIP[s.decision] || ''}`}>{s.decision}</span> : null)}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-teal transition-all" style={{ width: `${(reqDone(s) / REQS.length) * 100}%` }} /></div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {REQS.map(([k, label]) => {
                    const on = !!(s.requirements || {})[k];
                    return <button key={k} disabled={!canEdit} onClick={() => toggleReq(s, k)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${on ? 'bg-brand-teal text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{on ? '✓ ' : ''}{label}</button>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={`Essays · ${essays.filter((e) => e.status === 'done').length}/${essays.length}`}>
          <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-4">{essays.length ? essays.map((e) => <ToggleRow key={e.id} label={e.title + (e.due_date ? ` · due ${e.due_date}` : '')} done={e.status === 'done'} onToggle={() => toggleItem('essay', e)} />) : <div className="text-sm text-slate-500">No essays yet</div>}</div>
        </Section>
        <Section title={`To-do · ${tasks.filter((t) => t.status === 'done').length}/${tasks.length}`}>
          <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-4">{tasks.length ? tasks.map((t) => <ToggleRow key={t.id} label={t.title + (t.due_date ? ` · due ${t.due_date}` : '')} done={t.status === 'done'} onToggle={() => toggleItem('task', t)} />) : <div className="text-sm text-slate-500">No tasks yet</div>}</div>
        </Section>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recommendation letters</h3>
            <p className="text-xs text-slate-400">Recommenders and where each letter lives in Google Drive</p>
          </div>
          {canEdit ? <button onClick={() => window.openRecSheet(null)} className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white">+ Add</button> : null}
        </div>
        {recs.length ? (
          <div className="mt-3 space-y-2">{recs.map((r) => <RecRow key={r.id} rec={r} canEdit={canEdit} onStatus={setRecStatus} />)}</div>
        ) : (
          <div className="mt-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{canEdit ? 'Add each teacher or counselor writing a letter, then drop the signed letter in the student’s Drive folder and paste its link.' : 'No recommendation letters tracked yet.'}</div>
        )}
      </div>
    </div>
  );
}

function ChildProgramBadges({ programs }) {
  if (!programs || !programs.length) return null;
  return (
    <span className="flex flex-wrap gap-1.5">
      {programs.map((p) => (
        <span key={p} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p === 'admissions' ? 'bg-brand-pink/10 text-brand-pink' : 'bg-brand-teal/10 text-brand-teal'}`}>{p === 'admissions' ? 'Admissions' : 'Tutoring'}</span>
      ))}
    </span>
  );
}

function ChildCard({ child }) {
  const dl = child.nextDeadline;
  const dlDays = dl ? Math.ceil((new Date(dl.date) - Date.now()) / 86400000) : null;
  return (
    <button className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left transition hover:border-brand-teal/40 hover:bg-slate-50" onClick={() => window.openChild(child.id)}>
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 font-semibold text-teal-700">{initials(child.name)}</div>
        <div className="grow">
          <div className="flex items-center gap-2"><span className="font-semibold text-slate-900">{child.name}</span>{child.grade ? <span className="text-sm text-slate-400">· {child.grade}</span> : null}</div>
          <div className="mt-1.5"><ChildProgramBadges programs={child.programs} /></div>
        </div>
        {child.unread ? <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-brand-pink px-1.5 text-xs font-bold text-white" title="Unread messages">{child.unread}</span> : null}
        <span className="text-slate-300">›</span>
      </div>
      {(child.nextSession || dl) ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-xs">
          {child.nextSession ? <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 font-medium text-teal-700">📅 {child.nextSession.subject} · {child.nextSession.when}</span> : null}
          {dl ? <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 font-medium text-pink-700">🎯 {dl.school}{dlDays != null ? ` · ${dlDays}d` : ''}</span> : null}
        </div>
      ) : null}
    </button>
  );
}

function ParentHomeView({ db }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    db?.parentOverview().then(setData).catch(() => setData({ children: [], stats: { children: 0, upcomingSessions: 0, upcomingDeadlines: 0, unread: 0 }, updates: [] }));
  }, [db]);

  if (!data) return <LoadingCard />;
  const { children, stats, updates } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatBox label="Children" value={stats.children} />
        <StatBox label="Sessions this week" value={stats.upcomingSessions} />
        <StatBox label="Deadlines soon" value={stats.upcomingDeadlines} tone={stats.upcomingDeadlines ? 'pink' : undefined} />
        <StatBox label="Unread messages" value={stats.unread} tone={stats.unread ? 'pink' : undefined} />
      </div>
      <Section title="Your children" actionLabel={children.length > 1 ? 'All' : undefined} action={children.length > 1 ? () => window.go('pkids') : undefined}>
        {children.length ? (
          <div className="space-y-3">{children.map((child) => <ChildCard key={child.id} child={child} />)}</div>
        ) : <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No children linked to your account yet.</div>}
      </Section>
      {updates.length ? (
        <Section title="Recent updates">
          <div className="space-y-3">{updates.map((u, i) => <UpdateCard key={i} title={u.title} subtitle={u.subtitle} accent={u.accent} />)}</div>
        </Section>
      ) : null}
    </div>
  );
}

function ParentKidsView({ db }) {
  const [kids, setKids] = useState(null);

  useEffect(() => {
    db?.parentOverview().then((d) => setKids(d.children)).catch(() => setKids([]));
  }, [db]);

  if (!kids) return <LoadingCard />;

  return (
    <div className="space-y-6">
      <Section title="Your children">
        {kids.length ? (
          <div className="space-y-3">{kids.map((child) => <ChildCard key={child.id} child={child} />)}</div>
        ) : <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No children linked to your account yet.</div>}
      </Section>
    </div>
  );
}

function ParentBillingView({ db }) {
  const [billing, setBilling] = useState(null);

  useEffect(() => {
    db?.parentBilling().then(setBilling).catch(() => setBilling(null));
  }, [db]);

  if (!billing) return <LoadingCard />;
  const paid = billing.invoice?.status === 'paid';

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-sm font-semibold text-slate-500">Current balance</div>
        <div className="mt-3 text-4xl font-semibold text-slate-900">{paid ? '$0.00' : money(billing.invoice?.amount || 0)}</div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">{paid ? 'Paid in full' : 'Due soon'}</div>
      </div>
      <Section title="Plan">
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-2">
          <BillingRow label="Package" value="Admissions + tutoring" />
          <BillingRow label="Children" value={billing.kids} />
          <BillingRow label="Billing" value="Monthly" />
        </div>
      </Section>
      <Section title="Payment history">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 space-y-3">
          {billing.history.length ? billing.history.map((item, index) => <PaymentRow key={index} item={item} />) : <div className="text-slate-500">No payments yet</div>}
        </div>
      </Section>
      <button className="w-full rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white" onClick={() => window.toast('Payment methods opened')}>Manage payment</button>
    </div>
  );
}

function TutorHomeView({ db }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    db?.tutorHome().then(setData).catch(() => setData(null));
  }, [db]);

  if (!data) return <LoadingCard />;

  return (
    <div className="space-y-6">
      {data.students.length ? <SessionHero student={data.students[0]} tutorName={data.tutor.name} nextSession={data.nextSession} /> : <EmptyCard title="No students yet" subtitle="Your roster is empty." />}
      <div className="grid gap-4 md:grid-cols-3">
        <StatBox label="Students" value={data.students.length} />
        <StatBox label="Rating" value={`★ ${data.tutor.rating}`} />
        <StatBox label="This month" value={money(data.tutor.payout)} />
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">Accepting new students</div>
            <div className="text-sm text-slate-500">{data.tutor.accepting ? 'Families can request you' : 'Paused'}</div>
          </div>
          <button className={`relative inline-flex h-12 w-20 items-center rounded-full transition ${data.tutor.accepting ? 'bg-teal-600' : 'bg-slate-300'}`} onClick={async () => { await db.toggleAvailability(); setData((prev) => ({ ...prev, tutor: { ...prev.tutor, accepting: !prev.tutor.accepting } })); window.toast(data.tutor.accepting ? 'New bookings paused' : 'Accepting new bookings'); }}>
            <span className={`inline-block h-10 w-10 rounded-full bg-white transition ${data.tutor.accepting ? 'translate-x-8' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
      <Section title="Your students">
        <div className="space-y-3">{data.students.map((student) => <button key={student.id} className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left transition hover:bg-slate-50" onClick={() => window.openTutorStudent(student.id)}><div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">{initials(student.name)}</div><div className="grow"><div className="font-semibold text-slate-900">{student.name}</div><div className="text-sm text-slate-500">{student.grade} · {student.subjects.join(', ')}</div></div><div className="text-sm text-slate-500">{student.progress}%</div></div></button>)}</div>
      </Section>
    </div>
  );
}

function TutorStudentsView({ db }) {
  const [students, setStudents] = useState(null);

  useEffect(() => {
    db?.tutorStudents().then(setStudents).catch(() => setStudents([]));
  }, [db]);

  if (!students) return <LoadingCard />;

  return (
    <div className="space-y-6">
      <Section title="My students" actionLabel="+ Book a session" action={() => window.openBookSheet()}>
        <div className="space-y-3">{students.map((student) => <button key={student.id} className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left transition hover:bg-slate-50" onClick={() => window.openTutorStudent(student.id)}><div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">{initials(student.name)}</div><div className="grow"><div className="font-semibold text-slate-900">{student.name}</div><div className="text-sm text-slate-500">{student.grade} · {student.subjects.join(', ')}</div></div><div className="text-sm text-slate-500">{student.progress}%</div></div></button>)}</div>
      </Section>
    </div>
  );
}

function TutorEarningsView({ db }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    db?.tutorEarnings().then(setData).catch(() => setData(null));
  }, [db]);

  if (!data) return <LoadingCard />;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-teal-600 to-teal-900 p-6 text-white shadow-sm">
        <div className="text-sm uppercase tracking-[0.24em] text-teal-100">Earnings · November</div>
        <div className="mt-4 text-4xl font-semibold">{money(data.payout)}</div>
        <div className="mt-2 text-sm text-teal-100">across 35 sessions · ${data.rate}/hr</div>
        <button className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-teal-900" onClick={() => window.toast('Payout request submitted')}>Request payout</button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatBox label="Sessions" value="35" />
        <StatBox label="Per hour" value={`$${data.rate}`} />
        <StatBox label="Students" value={data.students} />
      </div>
      <Section title="Payout history">
        <div className="space-y-3">{data.history.map((item, index) => <PaymentRow key={index} item={item} />)}</div>
      </Section>
    </div>
  );
}

function MessagesView({ db, onOpenConvo }) {
  const [messages, setMessages] = useState(null);

  useEffect(() => {
    db?.conversations().then(setMessages).catch(() => setMessages([]));
  }, [db]);

  if (!messages) return <LoadingCard />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Messages</h2>
        <p className="mt-2 text-sm text-slate-500">Follow every conversation for your role.</p>
      </div>
      <div className="space-y-3">
        {messages.length ? messages.map((conv) => (
          <button key={conv.id} className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left transition hover:bg-slate-50" onClick={() => onOpenConvo(conv.id)}>
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">{initials(conv.withName)}</div>
              <div className="grow">
                <div className="font-semibold text-slate-900">{conv.withName} {conv.monitor ? <span className="ml-2 rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">monitoring</span> : null}</div>
                <div className="text-sm text-slate-500">{conv.last?.t}</div>
              </div>
              <div className="text-sm text-slate-500">{conv.last?.time}</div>
            </div>
          </button>
        )) : <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No messages yet</div>}
      </div>
    </div>
  );
}

function SessionHero({ student, tutorName, nextSession }) {
  const ns = nextSession || {};
  const role = window.DB?.me?.()?.role;
  const canCreate = (role === 'tutor' || role === 'admin') && ns.sessionId;
  let label = 'Join session';
  let onClick = () => window.toast('Your tutor will open the video room at session time');
  if (ns.meetingUrl) { onClick = () => window.openMeeting(ns.meetingUrl); }
  else if (canCreate) { label = 'Create video room'; onClick = () => window.createRoom(ns.sessionId); }
  return (
    <div className="rounded-[28px] bg-gradient-to-r from-teal-600 to-teal-800 p-8 text-white shadow-2xl">
      <div className="text-sm uppercase tracking-[0.2em] text-teal-200">Next session</div>
      <div className="mt-4 text-3xl font-semibold">{student?.subjects?.[0] || student?.name || 'Session'}</div>
      <div className="mt-3 text-sm text-teal-100">with {tutorName || 'your tutor'}</div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="When" value={student?.next || 'Soon'} />
        <StatCard label="Mode" value={student?.mode || 'Online'} />
        <button className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-teal-900" onClick={onClick}>{label}</button>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4 text-slate-900">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}

function StatBox({ label, value, tone = 'teal' }) {
  const toneClasses = tone === 'pink' ? 'text-pink-600' : tone === 'green' ? 'text-emerald-600' : 'text-teal-600';
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-3 text-3xl font-semibold ${toneClasses}`}>{value}</div>
    </div>
  );
}

function ProgressBar({ label, value }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-600"><span>{label}</span><span>{value}%</span></div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-teal-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ChecklistItem({ item, onToggle }) {
  return (
    <button className="flex w-full items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50" onClick={onToggle}>
      <div className={`grid h-10 w-10 place-items-center rounded-2xl ${item.done ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{item.done ? '✓' : ''}</div>
      <div>
        <div className="font-medium text-slate-900">{item.t}</div>
        <div className="text-sm text-slate-500">{item.c} · {item.d}</div>
      </div>
    </button>
  );
}

function SessionRecord({ topic, who, when }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="font-semibold text-slate-900">{topic}</div>
      <div className="mt-1 text-sm text-slate-500">{who} · {when}</div>
    </div>
  );
}

function EmptyCard({ title, subtitle }) {
  return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-600"><div className="text-xl font-semibold text-slate-900">{title}</div><div className="mt-2 text-sm">{subtitle}</div></div>;
}

function ToggleRow({ label, done, onToggle }) {
  return (
    <button className="flex w-full items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50" onClick={onToggle}>
      <div className={`grid h-10 w-10 place-items-center rounded-2xl ${done ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{done ? '✓' : ''}</div>
      <div>
        <div className="font-medium text-slate-900">{label}</div>
        <div className="text-sm text-slate-500">{done ? 'Complete' : 'In progress'}</div>
      </div>
    </button>
  );
}

function UpdateCard({ title, subtitle, accent }) {
  const bg = accent === 'emerald' ? 'bg-emerald-100 text-emerald-700' : accent === 'teal' ? 'bg-teal-100 text-teal-700' : accent === 'pink' ? 'bg-pink-100 text-pink-700' : 'bg-amber-100 text-amber-700';
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${bg}`}>Update</div>
      <div className="font-semibold text-slate-900">{title}</div>
      <div className="mt-2 text-sm text-slate-500">{subtitle}</div>
    </div>
  );
}

function BillingRow({ label, value }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function PaymentRow({ item }) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <div className="font-semibold text-slate-900">{item[0]}</div>
        <div className="text-sm text-slate-500">{item[1]}</div>
      </div>
      <div className="font-semibold text-slate-900">{item[2]}</div>
    </div>
  );
}

function money(c) {
  return '$' + (c / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default ViewRouter;
