function dueLabel(value) {
  if (!value) return 'No due date';
  return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const STATUS = {
  assigned: 'bg-slate-100 text-slate-700',
  due_soon: 'bg-amber-100 text-amber-800',
  turned_in: 'bg-teal-100 text-teal-700',
  graded: 'bg-emerald-100 text-emerald-700',
  missing: 'bg-rose-100 text-rose-700',
  late: 'bg-pink-100 text-pink-700'
};

const LABEL = {
  assigned: 'Assigned',
  due_soon: 'Due soon',
  turned_in: 'Turned in',
  graded: 'Graded',
  missing: 'Missing',
  late: 'Late'
};

function ClassroomStat({ label, value, tone = 'slate' }) {
  const toneClasses = tone === 'rose' ? 'text-rose-600' : tone === 'teal' ? 'text-teal-700' : 'text-slate-900';
  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/60">
      <div className={`text-2xl font-bold ${toneClasses}`}>{value}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
    </div>
  );
}

function ClassroomItem({ item }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-700">
        {item.kind === 'Question' ? '?' : item.kind === 'Quiz assignment' ? 'Q' : 'A'}
      </div>
      <div className="min-w-0 grow">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-semibold text-slate-900">{item.title}</div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[item.status] || STATUS.assigned}`}>{LABEL[item.status] || item.status}</span>
        </div>
        <div className="mt-1 text-sm text-slate-500">{item.kind} · Due {dueLabel(item.dueAt)}{item.points ? ` · ${item.points} pts` : ''}</div>
      </div>
      {item.linkUrl ? (
        <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700">
          Open ↗
        </a>
      ) : null}
    </div>
  );
}

function ClassroomTopic({ topic }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-lg font-semibold text-slate-900">{topic.title}</div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Topic</span>
      </div>
      {topic.summary ? <p className="mt-2 text-sm leading-6 text-slate-600">{topic.summary}</p> : null}
      <div className="mt-4 space-y-3">
        {(topic.items || []).map((item) => <ClassroomItem key={item.id} item={item} />)}
      </div>
    </div>
  );
}

function ClassroomConnect() {
  return (
    <div className="rounded-[30px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-teal-50 p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Google Classroom</div>
      <div className="mt-2 text-lg font-semibold text-slate-900">Connect your Google Classroom</div>
      <p className="mt-2 max-w-prose text-sm leading-6 text-slate-600">Link your Google Classroom account to pull your real topics, assignments, and due dates into session prep. Read-only — Yakal never posts, edits, or submits anything.</p>
      <button onClick={() => window.connectClassroom && window.connectClassroom()} className="mt-4 inline-flex items-center justify-center rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700">
        Connect Google Classroom
      </button>
    </div>
  );
}

function ClassroomPanel({ classroom, viewer = 'student' }) {
  if (!classroom) return null;
  if (!classroom.connected) return classroom.canConnect ? <ClassroomConnect /> : null;

  const statLabel = viewer === 'tutor' ? 'Needs review' : viewer === 'parent' ? 'Need attention' : 'To finish';
  const subtitle = classroom.sample
    ? `${classroom.viewLabel} · Sample layout — connect a real Google Classroom to see live coursework.`
    : `${classroom.viewLabel} · Live coursework synced for session planning.`;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[30px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-teal-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Google Classroom</span>
              {classroom.sample ? <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">Sample</span> : null}
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{classroom.courseName}</div>
            <div className="mt-2 text-sm text-slate-600">{subtitle}</div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Course code · {classroom.courseCode}</span>
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Next topic · {classroom.nextTopic}</span>
            </div>
          </div>
          <a href={classroom.launchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700">
            Open Classroom ↗
          </a>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ClassroomStat label="Due soon" value={classroom.dueSoon || 0} tone="teal" />
          <ClassroomStat label={statLabel} value={classroom.missing || 0} tone="rose" />
          <ClassroomStat label="Topics active" value={(classroom.topics || []).length} />
        </div>
      </div>
      <div className="space-y-4">
        {(classroom.topics || []).map((topic) => <ClassroomTopic key={topic.id} topic={topic} />)}
      </div>
    </div>
  );
}

export default ClassroomPanel;
