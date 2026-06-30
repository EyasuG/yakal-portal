import { useEffect, useState } from 'react';
import Section from '../components/Section.jsx';
import CollegeAdmissionsView from './CollegeAdmissionsView.jsx';

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Students</h2>
          <p className="text-sm text-slate-500">{students.length} total</p>
        </div>
      </div>
      <div className="space-y-3">
        {students.map((student) => (
          <button key={student.id} className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left transition hover:bg-slate-50" onClick={() => window.openSheet({ type: 'profile', profile: student })}>
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">{student.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div>
              <div className="grow">
                <div className="font-semibold text-slate-900">{student.name}</div>
                <div className="text-sm text-slate-500">{student.grade} · {student.tutorName}</div>
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
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">{tutor.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div>
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
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">📅</div>
            <div>
              <div className="font-semibold text-slate-900">{data.next.subject}</div>
              <div className="text-sm text-slate-500">{data.next.when} · {data.next.tutor}</div>
            </div>
          </div>
        </div>
      </Section>
      <Section title="Past sessions">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 space-y-3">{data.past.length ? data.past.map(([topic, who, when]) => <SessionRecord key={`${topic}-${when}`} topic={topic} who={who} when={when} />) : <div className="text-slate-500">No past sessions yet</div>}</div>
      </Section>
    </div>
  );
}

function StudentAdmissionsView({ db }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    db?.studentHome().then(setData).catch(() => setData(null));
  }, [db]);

  if (!data) return <LoadingCard />;
  if (!data.application) return <EmptyCard title="No application yet" subtitle="Your counselor will set this up." />;

  const application = data.application;
  const essays = application.essays || [];
  const tasks = application.tasks || [];
  const topName = application.top || application.target_school || 'Your application';
  const deadline = application.deadline || application.next_deadline || 'TBD';
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-pink-100 bg-pink-50 p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-pink-600">Your application</div>
        <div className="mt-3 text-2xl font-semibold text-slate-900">{topName}</div>
        <div className="mt-2 text-sm text-slate-600">{application.n ? `${application.n} colleges · ` : ''}next deadline {deadline}</div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatBox label="To deadline" value={application.days != null ? `${application.days}d` : '—'} />
        <StatBox label="Essays" value={`${essays.filter((a) => a[1]).length}/${essays.length}`} />
        <StatBox label="Tasks" value={`${tasks.filter((t) => t[1]).length}/${tasks.length}`} />
      </div>
      <Section title="Essays">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 space-y-3">{essays.length ? essays.map((item, index) => <ToggleRow key={index} label={item[0]} done={item[1]} onToggle={() => { db.toggleAppItem('e', index); setData((prev) => ({ ...prev, application: { ...prev.application, essays: (prev.application.essays || []).map((it, idx) => idx === index ? [it[0], !it[1]] : it) } })); }} />) : <div className="text-slate-500">No essays yet</div>}</div>
      </Section>
      <Section title="To-do">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 space-y-3">{tasks.length ? tasks.map((item, index) => <ToggleRow key={index} label={item[0]} done={item[1]} onToggle={() => { db.toggleAppItem('t', index); setData((prev) => ({ ...prev, application: { ...prev.application, tasks: (prev.application.tasks || []).map((it, idx) => idx === index ? [it[0], !it[1]] : it) } })); }} />) : <div className="text-slate-500">No tasks yet</div>}</div>
      </Section>
    </div>
  );
}

function ParentHomeView({ db }) {
  const [kids, setKids] = useState(null);

  useEffect(() => {
    db?.parentChildren().then(setKids).catch(() => setKids([]));
  }, [db]);

  if (!kids) return <LoadingCard />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatBox label="Children" value={kids.length} />
        <StatBox label="Sessions / week" value="3" />
        <StatBox label="Deadline soon" value="1" tone="pink" />
      </div>
      <Section title="Your children" actionLabel="All" action={() => window.go('pkids')}>
        <div className="space-y-3">{kids.map((child) => <button key={child.id} className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left transition hover:bg-slate-50" onClick={() => window.openChild(child.id)}><div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">{child.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div><div className="grow"><div className="font-semibold text-slate-900">{child.name}</div><div className="text-sm text-slate-500">{child.grade} · {child.tutorName}</div></div><div className="text-sm text-slate-500">{child.progress}%</div></div></button>)}</div>
      </Section>
      <Section title="Recent updates">
        <div className="space-y-3">
          <UpdateCard title="Saron scored 90% on the algebra quiz" subtitle="Today · from Josh" accent="emerald" />
          <UpdateCard title="Amen's JHU supplement reviewed" subtitle="Yesterday · from Hana" accent="teal" />
          <UpdateCard title="JHU deadline in 9 days" subtitle="Heads up" accent="amber" />
        </div>
      </Section>
    </div>
  );
}

function ParentKidsView({ db }) {
  const [kids, setKids] = useState(null);

  useEffect(() => {
    db?.parentChildren().then(setKids).catch(() => setKids([]));
  }, [db]);

  if (!kids) return <LoadingCard />;

  return (
    <div className="space-y-6">
      <Section title="Your children">
        <div className="space-y-3">{kids.map((child) => <button key={child.id} className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left transition hover:bg-slate-50" onClick={() => window.openChild(child.id)}><div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">{child.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div><div className="grow"><div className="font-semibold text-slate-900">{child.name}</div><div className="text-sm text-slate-500">{child.grade} · {child.tutorName}</div></div><div className="text-sm text-slate-500">{child.progress}%</div></div></button>)}</div>
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
        <div className="space-y-3">{data.students.map((student) => <button key={student.id} className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left transition hover:bg-slate-50" onClick={() => window.openTutorStudent(student.id)}><div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">{student.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div><div className="grow"><div className="font-semibold text-slate-900">{student.name}</div><div className="text-sm text-slate-500">{student.grade} · {student.subjects.join(', ')}</div></div><div className="text-sm text-slate-500">{student.progress}%</div></div></button>)}</div>
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
      <Section title="My students">
        <div className="space-y-3">{students.map((student) => <button key={student.id} className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left transition hover:bg-slate-50" onClick={() => window.openTutorStudent(student.id)}><div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">{student.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div><div className="grow"><div className="font-semibold text-slate-900">{student.name}</div><div className="text-sm text-slate-500">{student.grade} · {student.subjects.join(', ')}</div></div><div className="text-sm text-slate-500">{student.progress}%</div></div></button>)}</div>
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
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">{conv.withName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div>
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
  const bg = accent === 'emerald' ? 'bg-emerald-100 text-emerald-700' : accent === 'teal' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700';
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
