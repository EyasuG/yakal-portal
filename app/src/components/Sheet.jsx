import { useEffect, useState } from 'react';
import { cap, initials } from '../lib/utils.js';

function Sheet({ data, onClose, onSend, onPreview, onExitPreview, onBook, role }) {
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
          ) : null}
        </div>
      </div>
    </>
  );
}

function BookForm({ data, onBook, onClose }) {
  const [studentId, setStudentId] = useState(data.students?.[0]?.id || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('16:00');
  const [durationMin, setDurationMin] = useState(60);
  const [mode, setMode] = useState('online');
  const [program, setProgram] = useState(data.program || 'tutoring');
  const [sessionType, setSessionType] = useState('individual');
  const [createRoom, setCreateRoom] = useState(true);
  const programLabel = program === 'admissions' ? 'Admissions' : 'Tutoring';

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
          <label className="block">
            <span className="text-sm font-medium text-slate-600">Student</span>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              {data.students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
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
          <button className="w-full rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white" onClick={() => onBook({ studentId, date, time, durationMin, mode, program, sessionType: program === 'tutoring' ? sessionType : 'individual', createRoom: mode === 'online' && createRoom })}>Book session</button>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">No students on your roster yet.</div>
      )}
    </div>
  );
}

export default Sheet;
