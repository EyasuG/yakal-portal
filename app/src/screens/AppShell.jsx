import { useEffect, useState } from 'react';
import ViewRouter from './ViewRouter.jsx';
import { initials, svgIc, greetMessage, cap } from '../lib/utils.js';

function AppShell({ visible, user, role, previewing, activeView, navItems, onNavigate, onLogout, onOpenSwitch, mainKey, viewVersion, onRefresh, db }) {
  const currentNav = navItems || NAV[role] || NAV.admin;
  const [unread, setUnread] = useState(0);
  useEffect(() => { let on = true; if (db && db.notifications) db.notifications().then((r) => { if (on) setUnread(r.unread); }).catch(() => {}); return () => { on = false; }; }, [activeView, viewVersion, db]);
  const activeItem = currentNav.find((item) => item[0] === activeView) || currentNav[0];
  const greetText = activeView === currentNav[0][0] ? greetMessage() : ROLE_HI[role];
  const greetName = activeView === currentNav[0][0] ? user?.full_name || '—' : currentNav.find((item) => item[0] === activeView)?.[1] || '';

  return (
    <div id="screen-app" className={`screen ${visible ? 'on' : ''}`}>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
          <button className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-600 text-white" onClick={onOpenSwitch}>
            {user ? initials(user.full_name) : 'Y'}
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{greetText}</div>
            <div className="text-lg font-semibold text-slate-900">{greetName}</div>
          </div>
          <button className="relative grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50" title="Notifications" onClick={() => { if (window.openNotifications) window.openNotifications(); setUnread(0); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
            {unread > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-brand-pink px-1 text-[10px] font-bold text-white">{unread}</span> : null}
          </button>
          <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700" onClick={onLogout}>Sign out</button>
        </div>
      </header>
      {previewing ? (
        <div id="previewBar" className="mx-auto max-w-6xl px-5 py-3 text-sm font-semibold text-teal-900 on">Previewing the {cap(role)} portal · <button className="underline" onClick={onOpenSwitch}>Switch view</button></div>
      ) : null}
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 lg:flex">
          {currentNav.map(([key, label]) => (
            <button key={key} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${activeView === key ? 'bg-teal-50 text-teal-700' : 'hover:bg-slate-50'}`} onClick={() => onNavigate(key)}>
              <span dangerouslySetInnerHTML={{ __html: svgIc(label.toLowerCase() === 'home' ? 'grid' : key.includes('tutor') ? 'tutor' : 'grid', 18) }} />
              <span>{label}</span>
            </button>
          ))}
        </aside>
        <main className="space-y-6">
          <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:hidden">
            {currentNav.map(([key, label]) => (
              <button key={key} className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${activeView === key ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`} onClick={() => onNavigate(key)}>{label}</button>
            ))}
          </div>
          <div id="main" key={mainKey} className="space-y-6">
            <ViewRouter activeView={activeView} db={db} viewVersion={viewVersion} onRefresh={onRefresh} />
          </div>
        </main>
      </div>
    </div>
  );
}

const NAV = {
  admin: [['overview', 'Home'], ['students', 'Students'], ['tutors', 'Tutors'], ['tdiag', 'Diagnostic'], ['msg', 'Messages'], ['trust', 'Trust']],
  student: [['shome', 'Home'], ['ssessions', 'Sessions'], ['college', 'College'], ['clist', 'My List'], ['sadm', 'My App'], ['msg', 'Messages']],
  parent: [['phome', 'Home'], ['pkids', 'Children'], ['college', 'College'], ['sadm', 'Tracker'], ['msg', 'Messages'], ['pbill', 'Billing']],
  tutor: [['thome', 'Today'], ['tstudents', 'Students'], ['tdiag', 'Diagnostic'], ['tearn', 'Earnings'], ['msg', 'Messages']],
  super_admin: [['overview', 'Home'], ['students', 'Students'], ['tutors', 'Tutors'], ['tdiag', 'Diagnostic'], ['msg', 'Messages'], ['trust', 'Trust']],
  tutoring_admin: [['overview', 'Home'], ['students', 'Students'], ['tutors', 'Tutors'], ['tdiag', 'Diagnostic'], ['msg', 'Messages']],
  admissions_admin: [['overview', 'Home'], ['students', 'Students'], ['clist', 'College Lists'], ['sadm', 'Tracker'], ['college', 'College'], ['msg', 'Messages']],
  counselor: [['overview', 'Home'], ['students', 'Students'], ['clist', 'College Lists'], ['sadm', 'Tracker'], ['college', 'College'], ['msg', 'Messages']]
};

const ROLE_HI = {
  admin: 'Admin console', student: 'Your learning', parent: 'Your family', tutor: 'Your teaching',
  super_admin: 'Admin console', tutoring_admin: 'Tutoring admin', admissions_admin: 'Admissions admin', counselor: 'Admissions counseling'
};

export default AppShell;
