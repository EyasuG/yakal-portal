import { useEffect, useState } from 'react';
import Section from '../components/Section.jsx';

function ProgBar({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm"><span className="font-medium text-slate-700">{label}</span><span className="font-semibold text-teal-600">{value}%</span></div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-teal transition-all" style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function ProgramBadges({ programs }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {(programs || []).map((p) => (
        <span key={p} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p === 'admissions' ? 'bg-brand-pink/10 text-brand-pink' : 'bg-brand-teal/10 text-brand-teal'}`}>{p === 'admissions' ? 'Admissions' : 'Tutoring'}</span>
      ))}
    </span>
  );
}

export default function ChildDetailView({ db }) {
  const role = (db && db.me && db.me()) ? db.me().role : null;
  const backView = role === 'parent' ? 'pkids' : role === 'tutor' ? 'tstudents' : 'students';
  const [data, setData] = useState(null);

  useEffect(() => {
    const id = window.__childId;
    if (!id) { setData(false); return; }
    db.childOverview(id).then(setData).catch(() => setData(false));
  }, [db]);

  if (data === null) return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading…</div>;
  if (!data) return (
    <div className="space-y-4">
      <button className="text-sm font-semibold text-teal-700" onClick={() => window.go(backView)}>← Back</button>
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-600">Select a child to view their details.</div>
    </div>
  );

  const inTutoring = (data.programs || []).includes('tutoring');
  const inAdmissions = (data.programs || []).includes('admissions');
  const initials = data.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-6">
      <button className="text-sm font-semibold text-teal-700" onClick={() => window.go(backView)}>← Back</button>

      <div className="flex items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-brand-teal/10 text-xl font-bold text-brand-teal">{initials}</div>
        <div className="grow">
          <div className="text-2xl font-semibold text-slate-900">{data.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500"><span>{data.grade}</span><ProgramBadges programs={data.programs} /></div>
        </div>
      </div>

      {inTutoring ? (
        <Section title="Tutoring" actionLabel={data.conversations?.length ? undefined : undefined}>
          {data.upcoming ? (
            <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-brand-teal to-brand-tealdark p-5 text-white shadow-lg">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15">📅</div>
              <div><div className="text-xs uppercase tracking-wide text-teal-100">Next session</div><div className="font-semibold">{data.upcoming.subject}</div><div className="text-sm text-teal-100">{data.upcoming.when} · {data.upcoming.mode}</div></div>
            </div>
          ) : <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No upcoming session scheduled.</div>}

          {data.progress?.length ? (
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">{data.progress.map(([label, value]) => <ProgBar key={label} label={label} value={value} />)}</div>
          ) : null}

          {data.pastSessions?.length ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent sessions</div>
              <div className="space-y-2">{data.pastSessions.map((p, i) => <div key={i} className="flex items-center justify-between text-sm"><span className="text-slate-700">{p.subject}</span><span className="text-slate-400">{p.when}</span></div>)}</div>
            </div>
          ) : null}
        </Section>
      ) : null}

      {inAdmissions ? (
        <Section title="College Admissions" actionLabel="Open tracker" action={() => window.go('sadm')}>
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center"><div className="text-2xl font-bold text-slate-900">{data.admissions?.schools ?? 0}</div><div className="text-xs text-slate-500">Schools</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-slate-900">{data.admissions?.submitted ?? 0}</div><div className="text-xs text-slate-500">Submitted</div></div>
              <div className="text-center"><div className="text-lg font-bold text-brand-pink">{data.admissions?.nextDeadline ? new Date(data.admissions.nextDeadline.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</div><div className="text-xs text-slate-500">Next deadline</div></div>
            </div>
            {data.admissions?.nextDeadline ? <div className="mt-4 rounded-2xl bg-brand-pink/5 p-3 text-sm text-slate-600"><span className="font-semibold text-slate-800">{data.admissions.nextDeadline.school}</span> — {[data.admissions.nextDeadline.type, data.admissions.nextDeadline.date].filter(Boolean).join(' · ')}</div> : null}
          </div>
        </Section>
      ) : null}

      <Section title="Conversations">
        {data.conversations?.length ? (
          <div className="space-y-2">
            {data.conversations.map((c) => (
              <button key={c.id} className="flex w-full items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50" onClick={() => window.openConvo(c.id)}>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-teal/10 text-brand-teal">💬</div>
                <div className="grow"><div className="text-sm font-semibold text-slate-900">{c.subject}</div><div className="text-xs text-slate-400">Tap to monitor · read-only</div></div>
                <span className="text-slate-300">›</span>
              </button>
            ))}
          </div>
        ) : <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No conversations about {data.name.split(' ')[0]} yet.</div>}
      </Section>
    </div>
  );
}
