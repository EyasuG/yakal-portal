import { useEffect, useState } from 'react';
import { cap, initials } from '../lib/utils.js';

function Sheet({ data, onClose, onSend, onPreview, onExitPreview, onBook, onSaveSchool, onSaveEssay, onRemoveEssay, onSaveAcademics, role }) {
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setDraft('');
  }, [data]);

  if (!data) return null;

  return (
    <>
      <div id="sheetBack" className={`sheet-back ${data ? 'on' : ''}`} onClick={onClose} />
      <div id="sheet" className={`sheet ${data ? 'on' : ''}`}>
        <div id="sheetContent" className="mx-auto max-w-xl rounded-t-[22px] bg-white p-5 pt-4 shadow-xl">
          {data.type === 'conversation' ? (
            <div>
              <div className="mb-4 flex items-center gap-4 border-b border-slate-200 pb-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">{initials(data.conversation.withName)}</div>
                <div>
                  <div className="text-lg font-semibold text-slate-900">{data.conversation.withName}</div>
                  <div className="text-sm text-slate-500">{data.conversation.subject}</div>
                </div>
                <button className="ml-auto text-xl text-slate-400" onClick={onClose}>&times;</button>
              </div>
              <div className="space-y-3 pb-4">
                {data.conversation.msgs.map((msg, idx) => (
                  <div key={idx} className={`rounded-3xl p-4 ${msg.me ? 'ml-auto bg-teal-600 text-white' : 'bg-slate-100 text-slate-900'} max-w-[92%]`}>
                    <div>{msg.t}</div>
                    <div className="mt-2 text-xs text-slate-500">{msg.time}</div>
                    {msg.flag ? (
                      <div className="mt-2 rounded-2xl bg-pink-50 px-3 py-2 text-sm text-pink-700">contact details hidden</div>
                    ) : null}
                  </div>
                ))}
              </div>
              {data.conversation.readOnly ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">You are monitoring this conversation (read-only).</div>
              ) : (
                <div className="space-y-3">
                  <input
                    id="msgIn"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a message…"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSend(data.cid, draft);
                        setDraft('');
                      }
                    }}
                  />
                  <button
                    className="w-full rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white"
                    onClick={() => {
                      onSend(data.cid, draft);
                      setDraft('');
                    }}
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          ) : data.type === 'switch' ? (
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="text-lg font-semibold text-slate-900">Switch view</div>
                  <div className="text-sm text-slate-500">Preview the app as any role</div>
                </div>
                <button className="text-xl text-slate-400" onClick={onClose}>&times;</button>
              </div>
              <div className="space-y-3">
                {['admin', 'student', 'parent', 'tutor'].map((key) => (
                  <button
                    key={key}
                    className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
                    onClick={() => {
                      if (key === 'admin') onExitPreview(); else onPreview(key);
                    }}
                  >
                    <div className="font-semibold text-slate-900">{cap(key === 'admin' ? 'Admin console' : `${cap(key)} portal`)}</div>
                    <div className="text-sm text-slate-500">{key === 'admin' ? 'Return to admin view' : `Preview as a ${key}`}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : data.type === 'book' ? (
            <BookForm data={data} onBook={onBook} onClose={onClose} />
          ) : data.type === 'school' ? (
            <SchoolForm data={data} onSave={onSaveSchool} onClose={onClose} />
          ) : data.type === 'essay' ? (
            <EssayForm data={data} onSave={onSaveEssay} onRemove={onRemoveEssay} onClose={onClose} />
          ) : data.type === 'academics' ? (
            <AcademicsForm data={data} onSave={onSaveAcademics} onClose={onClose} />
          ) : data.type === 'notifications' ? (
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="text-lg font-semibold text-slate-900">Notifications</div>
                <button className="text-xl text-slate-400" onClick={onClose}>&times;</button>
              </div>
              {data.items && data.items.length ? (
                <div className="max-h-[70vh] space-y-2 overflow-y-auto">
                  {data.items.map((n) => (
                    <div key={n.id} className={`rounded-2xl border p-4 ${n.read ? 'border-slate-200 bg-white' : 'border-brand-pink/30 bg-brand-pink/5'}`}>
                      <div className="flex items-start gap-2">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-brand-pink'}`} />
                        <div className="grow">
                          <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                          {n.body ? <div className="mt-0.5 text-sm text-slate-500">{n.body}</div> : null}
                          <div className="mt-1 text-xs text-slate-400">{n.when}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">You're all caught up.</div>}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function BookForm({ data, onBook, onClose }) {
  const [studentIds, setStudentIds] = useState(data.students?.[0] ? [data.students[0].id] : []);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('16:00');
  const [durationMin, setDurationMin] = useState(60);
  const [mode, setMode] = useState('online');
  const [program, setProgram] = useState(data.program || 'tutoring');
  const [sessionType, setSessionType] = useState('individual');
  const [createRoom, setCreateRoom] = useState(true);
  const programLabel = program === 'admissions' ? 'Admissions' : 'Tutoring';
  const isGroup = program === 'tutoring' && sessionType !== 'individual';
  const toggleStudent = (id) => setStudentIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-lg font-semibold text-slate-900">Book a session</div>
          <div className="text-sm text-slate-500">{programLabel} · a Yakal-managed session</div>
        </div>
        <button className="text-xl text-slate-400" onClick={onClose}>&times;</button>
      </div>
      {data.students?.length ? (
        <div className="space-y-4">
          {data.canChooseProgram ? (
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Program</span>
              <select value={program} onChange={(e) => setProgram(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
                <option value="tutoring">Tutoring</option><option value="admissions">Admissions</option>
              </select>
            </label>
          ) : null}
          {program === 'tutoring' ? (
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Session type</span>
              <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
                <option value="individual">1-on-1 tutoring</option>
                <option value="group">Group session (our location)</option>
                <option value="camp">Summer camp</option>
                <option value="bootcamp">STEM bootcamp</option>
                <option value="math_lab">Math Lab</option>
              </select>
            </label>
          ) : null}
          {isGroup ? (
            <div>
              <div className="text-sm font-medium text-slate-600">Students <span className="text-slate-400">· {studentIds.length} selected</span></div>
              <div className="mt-1 max-h-44 space-y-1 overflow-y-auto rounded-2xl border border-slate-200 p-2">
                {data.students.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50">
                    <input type="checkbox" checked={studentIds.includes(s.id)} onChange={() => toggleStudent(s.id)} className="h-4 w-4 accent-teal-600" />
                    <span className="text-sm text-slate-800">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Student</span>
              <select value={studentIds[0] || ''} onChange={(e) => setStudentIds([e.target.value])} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
                {data.students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Time</span>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Duration</span>
              <select value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
                <option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option><option value={90}>90 min</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Mode</span>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
                <option value="online">Online</option><option value="in_person">In person</option>
              </select>
            </label>
          </div>
          {mode === 'online' ? (
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" checked={createRoom} onChange={(e) => setCreateRoom(e.target.checked)} className="h-4 w-4 accent-teal-600" />
              Create a Zoom room now
            </label>
          ) : null}
          <button className="w-full rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white" onClick={() => onBook({ studentIds, date, time, durationMin, mode, program, sessionType: program === 'tutoring' ? sessionType : 'individual', createRoom: mode === 'online' && createRoom })}>Book session</button>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">No students on your roster yet.</div>
      )}
    </div>
  );
}

const FLD = 'mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none';
const FLbl = ({ label, children }) => (
  <label className="block"><span className="text-sm font-medium text-slate-600">{label}</span>{children}</label>
);

function SchoolForm({ data, onSave, onClose }) {
  const s = data.school || {};
  const [f, setF] = useState({
    school_name: s.school_name || '', kind: s.kind || 'match', deadline_type: s.deadline_type || 'RD',
    deadline: s.deadline || '', status: s.status || 'todo', admissions_email: s.admissions_email || '',
    supplement_essays: s.supplement_essays ?? '', class_ratio: s.class_ratio || '', major_offered: s.major_offered || '',
    program_rank: s.program_rank || '', tours: s.tours || '', sticker_price: s.sticker_price ?? '',
    financial_aid: s.financial_aid || '', eval_sites: s.eval_sites || '', avg_gpa_sat: s.avg_gpa_sat || '', notes: s.notes || ''
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const submit = () => {
    if (!f.school_name.trim()) return;
    onSave({
      ...(s.id ? { id: s.id } : {}),
      school_name: f.school_name.trim(), kind: f.kind, deadline_type: f.deadline_type || null,
      deadline: f.deadline || null, status: f.status, admissions_email: f.admissions_email || null,
      supplement_essays: f.supplement_essays === '' ? null : Number(f.supplement_essays),
      class_ratio: f.class_ratio || null, major_offered: f.major_offered || null, program_rank: f.program_rank || null,
      tours: f.tours || null, sticker_price: f.sticker_price === '' ? null : Number(f.sticker_price),
      financial_aid: f.financial_aid || null, eval_sites: f.eval_sites || null, avg_gpa_sat: f.avg_gpa_sat || null, notes: f.notes || null
    }, data.studentId);
  };
  return (
    <div>
      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="text-lg font-semibold text-slate-900">{s.id ? 'Edit school' : 'Add a school'}</div>
        <button className="text-xl text-slate-400" onClick={onClose}>&times;</button>
      </div>
      <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
        <FLbl label="School name"><input value={f.school_name} onChange={set('school_name')} placeholder="e.g. Johns Hopkins University" className={FLD} /></FLbl>
        <div className="grid grid-cols-2 gap-3">
          <FLbl label="Category"><select value={f.kind} onChange={set('kind')} className={FLD}><option value="reach">Dream / Reach</option><option value="match">Target / Match</option><option value="safety">Safety</option></select></FLbl>
          <FLbl label="Status"><select value={f.status} onChange={set('status')} className={FLD}><option value="todo">To research</option><option value="in_progress">In progress</option><option value="done">Applied</option></select></FLbl>
          <FLbl label="Deadline type"><select value={f.deadline_type} onChange={set('deadline_type')} className={FLD}><option value="ED">Early Decision (ED)</option><option value="EA">Early Action (EA)</option><option value="RD">Regular Decision (RD)</option><option value="Rolling">Rolling</option></select></FLbl>
          <FLbl label="Deadline date"><input type="date" value={f.deadline} onChange={set('deadline')} className={FLD} /></FLbl>
        </div>
        <FLbl label="Admissions contact email"><input type="email" value={f.admissions_email} onChange={set('admissions_email')} placeholder="admissions@…" className={FLD} /></FLbl>
        <div className="grid grid-cols-2 gap-3">
          <FLbl label="Supplemental essays (#)"><input type="number" min="0" value={f.supplement_essays} onChange={set('supplement_essays')} className={FLD} /></FLbl>
          <FLbl label="Sticker price / yr ($)"><input type="number" min="0" value={f.sticker_price} onChange={set('sticker_price')} className={FLD} /></FLbl>
          <FLbl label="Avg GPA / SAT admitted"><input value={f.avg_gpa_sat} onChange={set('avg_gpa_sat')} placeholder="3.9 GPA / 1530" className={FLD} /></FLbl>
          <FLbl label="Class size / ratio"><input value={f.class_ratio} onChange={set('class_ratio')} placeholder="6:1" className={FLD} /></FLbl>
        </div>
        <FLbl label="Is your major offered? Program to apply to"><input value={f.major_offered} onChange={set('major_offered')} className={FLD} /></FLbl>
        <FLbl label="Program ranking"><input value={f.program_rank} onChange={set('program_rank')} placeholder="#3 Biomedical Engineering" className={FLD} /></FLbl>
        <div className="grid grid-cols-2 gap-3">
          <FLbl label="Tours / virtual tour"><input value={f.tours} onChange={set('tours')} className={FLD} /></FLbl>
          <FLbl label="% on aid / merit aid"><input value={f.financial_aid} onChange={set('financial_aid')} className={FLD} /></FLbl>
        </div>
        <FLbl label="Evaluative sites (Niche, College Navigator…)"><input value={f.eval_sites} onChange={set('eval_sites')} className={FLD} /></FLbl>
        <FLbl label="Notes"><textarea value={f.notes} onChange={set('notes')} rows={2} className={FLD} /></FLbl>
      </div>
      <button className="mt-4 w-full rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white" onClick={submit}>{s.id ? 'Save changes' : 'Add to list'}</button>
    </div>
  );
}

function EssayForm({ data, onSave, onRemove, onClose }) {
  const e = data.essay || {};
  const schools = data.schools || [];
  const [f, setF] = useState({
    title: e.title || '', prompt: e.prompt || '', status: e.status || 'todo',
    due_date: e.due_date || '', doc_url: e.doc_url || '',
    school_id: (e.school_id ?? data.schoolId ?? '') || ''
  });
  const set = (k) => (ev) => setF((p) => ({ ...p, [k]: ev.target.value }));
  const submit = () => {
    if (!f.title.trim()) return;
    onSave({
      ...(e.id ? { id: e.id } : {}),
      title: f.title.trim(), prompt: f.prompt.trim() || null, status: f.status,
      due_date: f.due_date || null, doc_url: f.doc_url.trim() || null,
      school_id: f.school_id || null
    }, data.studentId);
  };
  return (
    <div>
      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="text-lg font-semibold text-slate-900">{e.id ? 'Edit essay' : 'Add an essay'}</div>
        <button className="text-xl text-slate-400" onClick={onClose}>&times;</button>
      </div>
      <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
        <FLbl label="Essay title"><input value={f.title} onChange={set('title')} placeholder='e.g. "Why Hopkins?" supplement' className={FLD} /></FLbl>
        <FLbl label="Attach to">
          <select value={f.school_id} onChange={set('school_id')} className={FLD}>
            <option value="">Core / personal statement (all schools)</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
          </select>
        </FLbl>
        <FLbl label="Prompt / question"><textarea value={f.prompt} onChange={set('prompt')} rows={3} placeholder="Paste the essay prompt here…" className={FLD} /></FLbl>
        <div className="grid grid-cols-2 gap-3">
          <FLbl label="Status">
            <select value={f.status} onChange={set('status')} className={FLD}>
              <option value="todo">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </FLbl>
          <FLbl label="Due date"><input type="date" value={f.due_date} onChange={set('due_date')} className={FLD} /></FLbl>
        </div>
        <FLbl label="Document link (Google Doc, etc.)"><input type="url" value={f.doc_url} onChange={set('doc_url')} placeholder="https://docs.google.com/…" className={FLD} /></FLbl>
        <p className="text-xs text-slate-400">Paste a link to where you write the essay so you and your counselor can open and review the same draft. We never store the essay text.</p>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="grow rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white" onClick={submit}>{e.id ? 'Save changes' : 'Add essay'}</button>
        {e.id && onRemove ? <button className="rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:border-pink-300 hover:text-pink-600" onClick={() => { if (confirm('Remove this essay?')) { onRemove(e.id); onClose(); } }}>Remove</button> : null}
      </div>
    </div>
  );
}

function AcademicsForm({ data, onSave, onClose }) {
  const a = data.academics || {};
  const [f, setF] = useState({
    gpa_unweighted: a.gpa_unweighted || '', gpa_weighted: a.gpa_weighted || '', class_rank: a.class_rank || '',
    sat_total: a.sat_total ?? '', sat_ebrw: a.sat_ebrw ?? '', sat_math: a.sat_math ?? '', act_composite: a.act_composite ?? '',
    test_notes: a.test_notes || '', transcript_url: a.transcript_url || '', drive_folder_url: a.drive_folder_url || ''
  });
  const set = (k) => (ev) => setF((p) => ({ ...p, [k]: ev.target.value }));
  const num = (v) => (v === '' || v == null ? null : Number(v));
  const submit = () => {
    onSave({
      gpa_unweighted: f.gpa_unweighted.trim() || null, gpa_weighted: f.gpa_weighted.trim() || null, class_rank: f.class_rank.trim() || null,
      sat_total: num(f.sat_total), sat_ebrw: num(f.sat_ebrw), sat_math: num(f.sat_math), act_composite: num(f.act_composite),
      test_notes: f.test_notes.trim() || null, transcript_url: f.transcript_url.trim() || null, drive_folder_url: f.drive_folder_url.trim() || null
    }, data.studentId);
  };
  return (
    <div>
      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="text-lg font-semibold text-slate-900">Academics & documents</div>
        <button className="text-xl text-slate-400" onClick={onClose}>&times;</button>
      </div>
      <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">GPA</div>
        <div className="grid grid-cols-3 gap-3">
          <FLbl label="Unweighted"><input value={f.gpa_unweighted} onChange={set('gpa_unweighted')} placeholder="3.9" className={FLD} /></FLbl>
          <FLbl label="Weighted"><input value={f.gpa_weighted} onChange={set('gpa_weighted')} placeholder="4.3" className={FLD} /></FLbl>
          <FLbl label="Class rank"><input value={f.class_rank} onChange={set('class_rank')} placeholder="Top 5%" className={FLD} /></FLbl>
        </div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">SAT</div>
        <div className="grid grid-cols-3 gap-3">
          <FLbl label="Total"><input type="number" min="400" max="1600" value={f.sat_total} onChange={set('sat_total')} className={FLD} /></FLbl>
          <FLbl label="EBRW"><input type="number" min="200" max="800" value={f.sat_ebrw} onChange={set('sat_ebrw')} className={FLD} /></FLbl>
          <FLbl label="Math"><input type="number" min="200" max="800" value={f.sat_math} onChange={set('sat_math')} className={FLD} /></FLbl>
        </div>
        <FLbl label="ACT composite"><input type="number" min="1" max="36" value={f.act_composite} onChange={set('act_composite')} className={FLD} /></FLbl>
        <FLbl label="Other tests (AP / IB / TOEFL…)"><textarea value={f.test_notes} onChange={set('test_notes')} rows={2} placeholder="AP Calc BC 5 · AP Bio 5 · TOEFL 110" className={FLD} /></FLbl>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Documents (Google Drive)</div>
        <FLbl label="Transcript link"><input type="url" value={f.transcript_url} onChange={set('transcript_url')} placeholder="https://drive.google.com/file/…" className={FLD} /></FLbl>
        <FLbl label="Drive folder link"><input type="url" value={f.drive_folder_url} onChange={set('drive_folder_url')} placeholder="https://drive.google.com/drive/folders/…" className={FLD} /></FLbl>
        <p className="text-xs text-slate-400">Share a Google Drive folder (or a direct transcript link) with view access so your counselor can review it. Documents stay in your Drive — Yakal only keeps the link.</p>
      </div>
      <button className="mt-4 w-full rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white" onClick={submit}>Save</button>
    </div>
  );
}

export default Sheet;
