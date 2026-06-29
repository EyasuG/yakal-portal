import { initials } from '../lib/utils.js';

const DEMO_ACCOUNTS = [
  { id: 'u-almaz', name: 'Almaz T.', role: 'Administrator', color: 'bg-slate-900' },
  { id: 'u-tigist', name: 'Tigist Worku', role: 'Parent', color: 'bg-pink-500' },
  { id: 'u-amen', name: 'Amen Worku', role: 'Student', color: 'bg-teal-600' },
  { id: 'u-beth', name: 'Bethlehem A.', role: 'Tutor', color: 'bg-amber-600' }
];

function HomeScreen({ visible, onOpenAuth, onScroll }) {
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
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {['Algebra', 'Geometry', 'Pre-Calculus', 'Calculus', 'Physics', 'SAT Prep', 'ACT Prep', 'AP Courses', 'College Essays'].map((subject) => (
              <span key={subject} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">{subject}</span>
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
