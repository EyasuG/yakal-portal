import { useState } from 'react';
import { initials } from '../lib/utils.js';

const SubjIcon = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">{children}</svg>
);

const SUBJECTS = [
  { name: 'K-12 Math', accent: 'teal', desc: 'Number sense, fractions, pre-algebra and beyond — strong fundamentals built grade by grade, from elementary through high school.',
    icon: <SubjIcon><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></SubjIcon> },
  { name: 'K-12 ELA', accent: 'amber', desc: 'Reading comprehension, writing, grammar and vocabulary across elementary, middle, and high school English Language Arts.',
    icon: <SubjIcon><path d="M12 7c-1.6-1.2-4-2-6.5-2H4v13h1.5c2.5 0 4.9.8 6.5 2 1.6-1.2 4-2 6.5-2H20V5h-1.5c-2.5 0-4.9.8-6.5 2Z" /><path d="M12 7v13" /></SubjIcon> },
  { name: 'Algebra', accent: 'teal', desc: 'Equations, functions and problem-solving — the backbone that the rest of high-school math is built on.',
    icon: <SubjIcon><path d="M4 20V4M4 20h16" /><path d="M5 16c5 0 6-9 11-10" /></SubjIcon> },
  { name: 'Geometry', accent: 'teal', desc: 'Shapes, angles, proofs and spatial reasoning, taught with plenty of visual, hands-on practice.',
    icon: <SubjIcon><path d="M12 4 21 20H3z" /><path d="M12 4v16" /></SubjIcon> },
  { name: 'Pre-Calculus', accent: 'teal', desc: 'Trigonometry, sequences and advanced functions — the bridge from algebra into calculus.',
    icon: <SubjIcon><path d="M3 12c3-8 6-8 9 0s6 8 9 0" /></SubjIcon> },
  { name: 'Calculus', accent: 'teal', desc: 'Limits, derivatives and integrals taught step by step, with intuition before formulas.',
    icon: <SubjIcon><path d="M15 4c-2 0-2.5 1.6-2.5 4v8c0 2.4-.5 4-2.5 4" /><path d="M9 12h6" /></SubjIcon> },
  { name: 'Physics', accent: 'amber', desc: 'Mechanics, energy and electricity grounded in real-world intuition and exam technique.',
    icon: <SubjIcon><circle cx="12" cy="12" r="1.6" /><ellipse cx="12" cy="12" rx="9" ry="3.6" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" /></SubjIcon> },
  { name: 'SAT Prep', accent: 'pink', desc: 'Targeted strategy, content review and timed practice for the digital SAT, with progress tracking.',
    icon: <SubjIcon><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></SubjIcon> },
  { name: 'ACT Prep', accent: 'pink', desc: 'Section-by-section coaching and pacing strategy for the ACT, English through Science.',
    icon: <SubjIcon><circle cx="12" cy="13" r="8" /><path d="M12 13V9M9 2h6M18.5 5.5 17 7" /></SubjIcon> },
  { name: 'AP Courses', accent: 'pink', desc: 'Exam-focused support across AP subjects to deepen mastery and earn college credit.',
    icon: <SubjIcon><circle cx="12" cy="9" r="5" /><path d="m8.5 13-1.5 8 5-3 5 3-1.5-8" /></SubjIcon> },
  { name: 'College Essays', accent: 'pink', desc: 'One-on-one coaching to brainstorm, draft and polish authentic, standout application essays.',
    icon: <SubjIcon><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h5M8 17h3" /></SubjIcon> }
];

const ACCENT = {
  teal: { chip: 'bg-brand-teal/10 text-brand-teal', text: 'text-brand-teal', glow: 'from-brand-teal/25', ring: 'ring-brand-teal/40' },
  pink: { chip: 'bg-brand-pink/10 text-brand-pink', text: 'text-brand-pink', glow: 'from-brand-pink/25', ring: 'ring-brand-pink/40' },
  amber: { chip: 'bg-brand-amber/10 text-brand-amber', text: 'text-brand-amber', glow: 'from-brand-amber/25', ring: 'ring-brand-amber/40' }
};

function SubjectCard({ subject, open, onToggle }) {
  const a = ACCENT[subject.accent];
  return (
    <button onClick={onToggle} aria-expanded={open}
      className={`group relative flex flex-col items-start overflow-hidden rounded-3xl border bg-white p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${open ? `border-transparent ring-2 ${a.ring} shadow-xl` : 'border-slate-200'}`}>
      <span className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${a.glow} to-transparent blur-2xl transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`} />
      <span className={`relative grid h-14 w-14 place-items-center rounded-2xl ${a.chip} ring-1 ring-inset ring-white/40`}>{subject.icon}</span>
      <span className="relative mt-5 text-lg font-semibold text-slate-900">{subject.name}</span>
      <span className={`relative grid transition-all duration-300 ${open ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <span className="overflow-hidden text-sm leading-6 text-slate-600">{subject.desc}</span>
      </span>
      <span className={`relative mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${a.text}`}>
        {open ? 'Show less' : 'Learn more'}
        <span className={`transition-transform duration-300 ${open ? 'rotate-90' : ''}`}>→</span>
      </span>
    </button>
  );
}

const DEMO_ACCOUNTS = [
  { id: 'u-almaz', name: 'Almaz T.', role: 'Administrator', color: 'bg-slate-900' },
  { id: 'u-tigist', name: 'Tigist Worku', role: 'Parent', color: 'bg-pink-500' },
  { id: 'u-amen', name: 'Amen Worku', role: 'Student', color: 'bg-teal-600' },
  { id: 'u-beth', name: 'Bethlehem A.', role: 'Tutor', color: 'bg-amber-600' }
];

function HomeScreen({ visible, onOpenAuth, onScroll }) {
  const [openSubject, setOpenSubject] = useState(null);
  return (
    <div id="screen-home" className={`screen ${visible ? 'on' : ''}`}>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-600 text-white">Y</div>
            <div className="font-semibold text-slate-900">Yakal <span className="text-teal-600">Education</span></div>
          </div>
          <div className="ml-auto hidden items-center gap-6 text-sm text-slate-500 md:flex">
            <button onClick={() => onScroll('services')}>Services</button>
            <button onClick={() => onScroll('subjects')}>Subjects</button>
            <button onClick={() => onScroll('portal')}>Portal</button>
            <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-900 shadow-sm transition hover:border-teal-600 hover:text-teal-600" onClick={() => onOpenAuth('login')}>Log in</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-10">
        <section className="grid gap-16 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-4 py-2 text-sm font-semibold text-pink-600">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m12 2 2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z"/></svg>
              Inspiring hope, shaping futures
            </div>
            <h1 className="mt-8 text-5xl font-bold tracking-tight text-slate-950 md:text-6xl">Tutoring & college admissions, <span className="text-teal-600">done right.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">One-on-one tutoring and personalized admissions consulting in Silver Spring, MD — online and in person. Now with a portal that keeps students, parents, and tutors on the same page.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700" onClick={() => onOpenAuth('signup')}>Get started</button>
              <button className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-teal-600 hover:text-teal-600" onClick={() => onScroll('portal')}>Explore the portal</button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="text-3xl font-bold text-slate-900">6+</div>
                <div className="mt-2 text-sm text-slate-500">Subjects covered</div>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="text-3xl font-bold text-slate-900">1:1</div>
                <div className="mt-2 text-sm text-slate-500">Personalized sessions</div>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="text-3xl font-bold text-slate-900">K–12</div>
                <div className="mt-2 text-sm text-slate-500">& college prep</div>
              </div>
            </div>
          </div>
          <div className="rounded-[28px] bg-white p-8 shadow-2xl ring-1 ring-slate-200/80">
            <h3 className="text-sm font-semibold text-slate-500">Sign in to your portal</h3>
            <div className="mt-6 space-y-4">
              <PortalButton label="Student" description="Sessions, progress, tasks" accent="bg-teal-600" onClick={() => onOpenAuth('signup', 'student')} />
              <PortalButton label="Parent" description="Monitor your child & messages" accent="bg-pink-600" onClick={() => onOpenAuth('signup', 'parent')} />
              <PortalButton label="Tutor" description="Schedule, roster, earnings" accent="bg-amber-600" onClick={() => onOpenAuth('signup', 'tutor')} />
            </div>
          </div>
        </section>
        <section id="services" className="mt-28 space-y-10">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">Two services, one journey</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">Academic tutoring and college admissions consulting — distinct programs that reinforce each other, run through a single connected portal.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <ServiceCard
              accent="teal"
              eyebrow="Program 01"
              title="Tutoring & Enrichment"
              tagline="K-12 academics, test prep & STEM"
              copy="One-on-one sessions plus small-group classes, summer camps, STEM bootcamps and Math Labs at our Silver Spring location — in math, sciences, ELA and SAT/ACT prep, online or in person."
              offerings={['1-on-1 tutoring', 'Group sessions', 'Summer camps', 'STEM bootcamps', 'Math Labs']}
              roles={[['Tutors', 'lead sessions & log progress'], ['Parents', 'monitor grades & messages'], ['Students', 'attend & track homework']]}
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7"><path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2Z" /><path d="M8 7h7M8 11h5" /></svg>}
              cta="Get started" onCta={() => onOpenAuth('signup', 'parent', 'tutoring')}
              joinLabel="Become a tutor" onJoin={() => onOpenAuth('signup', 'tutor')}
            />
            <ServiceCard
              accent="pink"
              eyebrow="Program 02"
              title="College Admissions Consulting"
              tagline="Essentials · Premier · Elite"
              copy="Essays, balanced school lists, deadlines, and financial-aid timelines — guided one-on-one from sophomore year all the way to Decision Day."
              roles={[['Counselors', 'guide essays & applications'], ['Parents', 'monitor the roadmap'], ['Students', 'build their college list']]}
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7"><path d="M22 9 12 4 2 9l10 5 10-5Z" /><path d="M6 11v5c0 1 2.7 3 6 3s6-2 6-3v-5" /></svg>}
              cta="Get started" onCta={() => onOpenAuth('signup', 'parent', 'admissions')}
              joinLabel="Join our team" onJoin={() => onOpenAuth('signup', 'tutor')}
            />
          </div>
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-r from-brand-teal/5 via-white to-brand-pink/5 p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="inline-flex items-center gap-2 text-sm font-semibold">
                <span className="rounded-full bg-brand-teal/10 px-3 py-1 text-brand-teal">Tutoring</span>
                <span className="text-slate-400">+</span>
                <span className="rounded-full bg-brand-pink/10 px-3 py-1 text-brand-pink">Admissions</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900">Better together</h3>
              <p className="max-w-2xl leading-7 text-slate-600">Strong grades and test scores from tutoring become the foundation an admissions counselor builds on. A student can be enrolled in <span className="font-semibold text-slate-900">both</span> — and one family portal keeps tutors, counselors, parents, and students in sync, with parents able to monitor everything in one place.</p>
            </div>
          </div>
        </section>
        <section id="subjects" className="mt-28 rounded-[28px] bg-white p-10 shadow-sm">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-slate-900">Subjects we tutor</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">Building confidence one session at a time.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SUBJECTS.map((subject) => (
              <SubjectCard
                key={subject.name}
                subject={subject}
                open={openSubject === subject.name}
                onToggle={() => setOpenSubject(openSubject === subject.name ? null : subject.name)}
              />
            ))}
          </div>
        </section>
        <section id="portal" className="mt-28 rounded-[28px] bg-gradient-to-r from-teal-600 to-teal-900 px-8 py-14 text-white shadow-2xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold">The Yakal portal</h2>
            <p className="mt-4 text-lg leading-8 text-slate-100">Every family gets a private space. Students see their sessions and tasks, parents monitor progress and messages, tutors manage their day — and it all stays in sync.</p>
            <button className="mt-8 rounded-full bg-white px-8 py-3 text-sm font-semibold text-teal-900 shadow-lg" onClick={() => onOpenAuth('signup')}>Create your account</button>
          </div>
        </section>
      </main>
    </div>
  );
}

function PortalButton({ label, description, accent, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-left transition hover:bg-slate-100">
      <div className="flex items-center gap-4">
        <div className={`${accent} grid h-12 w-12 place-items-center rounded-2xl text-white`}>{label[0]}</div>
        <div>
          <div className="font-semibold text-slate-900">{label}</div>
          <div className="text-sm text-slate-500">{description}</div>
        </div>
      </div>
      <div className="text-slate-400">→</div>
    </button>
  );
}

const SERVICE_STYLE = {
  teal: { grad: 'from-brand-teal to-brand-tealdark', soft: 'bg-brand-teal/10 text-brand-teal' },
  pink: { grad: 'from-brand-pink to-brand-pinkdark', soft: 'bg-brand-pink/10 text-brand-pink' }
};

function ServiceCard({ accent, eyebrow, title, tagline, copy, roles, offerings, icon, cta, onCta, joinLabel, onJoin }) {
  const s = SERVICE_STYLE[accent];
  return (
    <div className="relative flex flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className={`pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br ${s.grad} opacity-10 blur-2xl`} />
      <div className="relative flex items-center gap-4">
        <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${s.grad} text-white shadow-lg`}>{icon}</div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</div>
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
        </div>
      </div>
      <div className={`relative mt-4 inline-flex w-fit rounded-full ${s.soft} px-3 py-1 text-xs font-semibold`}>{tagline}</div>
      <p className="relative mt-4 leading-7 text-slate-600">{copy}</p>
      {offerings ? (
        <div className="relative mt-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ways to learn</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {offerings.map((o) => <span key={o} className={`rounded-full ${s.soft} px-3 py-1 text-xs font-semibold`}>{o}</span>)}
          </div>
        </div>
      ) : null}
      <div className="relative mt-6 space-y-3 border-t border-slate-100 pt-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Who's involved</div>
        {roles.map(([r, d]) => (
          <div key={r} className="flex items-start gap-3">
            <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${s.soft} text-xs font-bold`}>{r[0]}</span>
            <div className="text-sm"><span className="font-semibold text-slate-900">{r}</span> <span className="text-slate-500">— {d}</span></div>
          </div>
        ))}
      </div>
      <div className="relative mt-7 flex flex-wrap gap-3">
        <button onClick={onCta} className={`rounded-full bg-gradient-to-r ${s.grad} px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95`}>{cta}</button>
        <button onClick={onJoin} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">{joinLabel}</button>
      </div>
    </div>
  );
}

export default HomeScreen;
