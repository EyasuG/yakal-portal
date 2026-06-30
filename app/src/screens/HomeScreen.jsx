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
  teal: 'bg-teal-50 text-teal-700',
  pink: 'bg-pink-50 text-pink-600',
  amber: 'bg-amber-50 text-amber-700'
};

function SubjectCard({ subject, open, onToggle }) {
  return (
    <button onClick={onToggle} aria-expanded={open} className={`flex flex-col items-start rounded-3xl border bg-white p-6 text-left transition hover:shadow-md ${open ? 'border-teal-300 shadow-md' : 'border-slate-200 hover:border-teal-200'}`}>
      <span className={`grid h-12 w-12 place-items-center rounded-2xl ${ACCENT[subject.accent]}`}>{subject.icon}</span>
      <span className="mt-4 text-base font-semibold text-slate-900">{subject.name}</span>
      {open
        ? <span className="mt-2 text-sm leading-6 text-slate-600">{subject.desc}</span>
        : <span className="mt-1 text-sm font-medium text-teal-700">Learn more →</span>}
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
        <section id="services" className="mt-28 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-slate-900">How we help</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">From weekly tutoring to the full college application journey.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <FeatureCard title="1:1 Tutoring" copy="Math, sciences, and test prep tailored to each student, online or in person." accent="bg-teal-100" />
            <FeatureCard title="Admissions consulting" copy="Essays, school lists, and deadlines — productized into Essentials, Premier & Elite." accent="bg-pink-100" />
            <FeatureCard title="Progress you can see" copy="Parents track sessions, grades, and messages from one simple dashboard." accent="bg-amber-100" />
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

function FeatureCard({ title, copy, accent }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accent} text-teal-900`}>✓</div>
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 text-slate-600">{copy}</p>
    </div>
  );
}

export default HomeScreen;
