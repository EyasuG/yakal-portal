import { useEffect, useState } from 'react';
import { cap, initials } from '../lib/utils.js';

function Sheet({ data, onClose, onSend, onPreview, onExitPreview, role }) {
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
          ) : null}
        </div>
      </div>
    </>
  );
}

export default Sheet;
