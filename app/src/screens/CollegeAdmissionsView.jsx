import { useState } from 'react';
import Section from '../components/Section.jsx';

// A dedicated College Admissions hub — separate from K-12 tutoring. A
// grade-by-grade roadmap (Sophomore / Junior / Senior) with the SAT/ACT
// testing plan, key deadlines, and curated resources.

const GRADES = [
  { key: 'sophomore', label: 'Sophomore', sub: 'Grade 10 · Explore & build your foundation' },
  { key: 'junior', label: 'Junior', sub: 'Grade 11 · The pivotal testing & list-building year' },
  { key: 'senior', label: 'Senior', sub: 'Grade 12 · Apply, decide, and enroll' },
];

const TIMELINE = {
  sophomore: [
    { season: 'Fall', items: [
      { t: 'Take the PSAT 10', d: 'Low-stakes practice — use the score report to find your baseline.', kind: 'test' },
      { t: 'Protect your GPA & take rigor', d: 'Sophomore grades count. Add honors/AP where you can handle them.' },
      { t: 'Go deep in 2–3 activities', d: 'Depth and leadership beat a long, shallow list.' },
    ] },
    { season: 'Winter', items: [
      { t: 'Plan a challenging junior schedule', d: 'Meet your counselor; line up AP/honors and prerequisites.' },
      { t: 'Explore interests & possible majors', d: 'Clubs, reading, online courses, informational chats.' },
    ] },
    { season: 'Spring', items: [
      { t: 'Take a diagnostic SAT & ACT', d: 'A timed practice of each shows which test fits you best.', kind: 'test' },
      { t: 'Build rapport with teachers', d: 'They become your recommenders junior and senior year.' },
    ] },
    { season: 'Summer', items: [
      { t: 'Do something meaningful', d: 'Summer program, job, volunteering, research, or a personal project.' },
      { t: 'Start a college-interest list', d: 'Virtual tours; note size, location, cost, and programs.' },
    ] },
  ],
  junior: [
    { season: 'Fall', items: [
      { t: 'PSAT/NMSQT — October', d: 'The only year it counts for National Merit. Register through your school.', kind: 'test' },
      { t: 'Keep grades up in your hardest year', d: 'Junior rigor + GPA carry the most weight in admissions.' },
      { t: 'Choose SAT or ACT', d: 'Use your diagnostic and commit to one test to focus prep.', kind: 'test' },
    ] },
    { season: 'Winter', items: [
      { t: 'Start focused SAT/ACT prep', d: 'Begin 8–12 weeks out, using official Bluebook (SAT) / ACT materials.', kind: 'test' },
      { t: 'Register for a spring test', d: 'SAT: March, May, June. ACT: February, April, June.', kind: 'test' },
      { t: 'Draft a balanced college list', d: 'A mix of reach, match, and safety schools.' },
    ] },
    { season: 'Spring', items: [
      { t: 'Take the SAT and/or ACT', d: 'Spring of junior year is the ideal first sitting.', kind: 'test' },
      { t: 'AP exams in May', d: 'Strong scores can earn college credit and show rigor.' },
      { t: 'Ask two teachers for recommendations', d: 'Ask in person, late spring, before summer break.' },
      { t: 'Visit colleges over spring break', d: 'Tours + info sessions sharpen your list.' },
    ] },
    { season: 'Summer before senior year', items: [
      { t: 'Write your Common App essay', d: 'Draft the personal statement before senior year begins.' },
      { t: 'Retake the SAT/ACT if needed', d: 'A summer / early-fall retake lifts your score before deadlines.', kind: 'test' },
      { t: 'Finalize your list & start supplements', d: 'Research each school’s “why us” and essay prompts.' },
    ] },
  ],
  senior: [
    { season: 'Fall (Aug–Oct)', items: [
      { t: 'Final SAT/ACT — by October', d: 'Last sitting before Early deadlines. For Regular Decision, test by December.', kind: 'test' },
      { t: 'Open the FAFSA (Oct 1)', d: 'File early — some aid is first-come. Add the CSS Profile if schools require it.', kind: 'money' },
      { t: 'Request transcripts & rec letters', d: 'Give recommenders 3–4 weeks; confirm counselor documents.' },
      { t: 'Finish Common App + supplements', d: 'Proofread and have someone review your essays.' },
    ] },
    { season: 'November', items: [
      { t: 'Early Decision / Early Action — Nov 1', d: 'ED is binding, EA is not. Submit a polished application.', kind: 'deadline' },
    ] },
    { season: 'Winter (Dec–Jan)', items: [
      { t: 'Regular Decision — often Jan 1', d: 'Many deadlines fall on Jan 1 or Jan 15; submit a few days early.', kind: 'deadline' },
      { t: 'Submit FAFSA/CSS by priority dates', d: 'Check each school’s financial-aid deadline.', kind: 'money' },
    ] },
    { season: 'Spring (Feb–Apr)', items: [
      { t: 'Decisions arrive (Mar–Apr)', d: 'Compare admit offers and financial-aid packages.' },
      { t: 'Attend admitted-student days', d: 'Revisit your top choices before deciding.' },
    ] },
    { season: 'May', items: [
      { t: 'Decision Day — commit by May 1', d: 'Deposit at one school, decline the rest, send your final transcript.', kind: 'deadline' },
      { t: 'AP exams', d: 'Final chance for college credit.' },
    ] },
  ],
};

const TEST_PLAN = [
  { t: 'PSAT/NMSQT', when: 'October of junior year', d: 'National Merit qualifier. Take the PSAT 10 sophomore year for practice.' },
  { t: 'First SAT / ACT', when: 'Spring of junior year', d: 'March–June. Pick SAT or ACT from a diagnostic, then prep 8–12 weeks.' },
  { t: 'Retake', when: 'Fall of senior year', d: 'August–October — before Early deadlines (by December for Regular Decision).' },
];
const SAT_MONTHS = ['Aug', 'Oct', 'Nov', 'Dec', 'Mar', 'May', 'Jun'];
const ACT_MONTHS = ['Sep', 'Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Jul'];

const Ic = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">{children}</svg>
);
const ICN = {
  doc: <Ic><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></Ic>,
  aid: <Ic><path d="M12 2v20M16.5 6H9.75a3.25 3.25 0 0 0 0 6.5h4.5a3.25 3.25 0 0 1 0 6.5H7" /></Ic>,
  compass: <Ic><circle cx="12" cy="12" r="9" /><path d="m15 9-2 5-5 2 2-5 5-2Z" /></Ic>,
  target: <Ic><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></Ic>,
  clock: <Ic><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></Ic>,
  play: <Ic><circle cx="12" cy="12" r="9" /><path d="m10 9 5 3-5 3z" /></Ic>,
  info: <Ic><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Ic>
};
const RES_ACCENT = { teal: 'bg-brand-teal/10 text-brand-teal', pink: 'bg-brand-pink/10 text-brand-pink', amber: 'bg-brand-amber/10 text-brand-amber' };

const RESOURCES = [
  { t: 'Common App', d: 'Apply to 1,000+ colleges in one place', url: 'https://www.commonapp.org', accent: 'teal', icon: 'doc' },
  { t: 'FAFSA — Federal Student Aid', d: 'Federal grants, loans & work-study', url: 'https://studentaid.gov', accent: 'amber', icon: 'aid' },
  { t: 'CSS Profile', d: 'Institutional aid at many private colleges', url: 'https://cssprofile.collegeboard.org', accent: 'amber', icon: 'aid' },
  { t: 'BigFuture (College Board)', d: 'College search, planning & scholarships', url: 'https://bigfuture.collegeboard.org', accent: 'teal', icon: 'compass' },
  { t: 'Digital SAT & Bluebook', d: 'Register and practice for the digital SAT', url: 'https://satsuite.collegeboard.org/digital', accent: 'pink', icon: 'target' },
  { t: 'The ACT', d: 'Register and prep for the ACT', url: 'https://www.act.org', accent: 'pink', icon: 'clock' },
  { t: 'Khan Academy', d: 'Free SAT prep and academic help', url: 'https://www.khanacademy.org', accent: 'teal', icon: 'play' },
  { t: 'NACAC fee waivers', d: 'Application fee-waiver information', url: 'https://www.nacacnet.org', accent: 'amber', icon: 'info' },
  { t: 'Common App — recommenders', d: 'How counselor & teacher recommendations work', url: 'https://www.commonapp.org/counselors-and-recommenders/', accent: 'teal', icon: 'doc' },
  { t: 'How to file the FAFSA', d: 'College Essay Guy · step-by-step walkthrough', url: 'https://www.collegeessayguy.com/paying-for-college/fafsa/how-to', accent: 'amber', icon: 'aid' },
];

function Badge({ kind }) {
  if (kind === 'test') return <span className="ml-2 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">SAT / ACT</span>;
  if (kind === 'deadline') return <span className="ml-2 rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-semibold text-pink-600">Deadline</span>;
  if (kind === 'money') return <span className="ml-2 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Financial aid</span>;
  return null;
}

function dotColor(kind) {
  return kind === 'deadline' ? 'bg-pink-500' : kind === 'money' ? 'bg-amber-500' : kind === 'test' ? 'bg-teal-500' : 'bg-slate-300';
}

// Highlight the season the student is in RIGHT NOW so the timeline reads as a
// living plan, not a static article.
function isCurrentSeason(season) {
  const m = new Date().getMonth() + 1; // 1-12
  const s = season.toLowerCase();
  if (m >= 8 && m <= 10) return s.includes('fall');
  if (m === 11) return s.includes('november') || s.includes('fall');
  if (m === 12 || m === 1) return s.includes('winter') || s.includes('dec');
  if (m >= 2 && m <= 4) return s.includes('spring') || s.includes('feb');
  if (m === 5) return s === 'may' || s.includes('spring');
  return s.includes('summer'); // 6-7
}

function KeyStat({ label, value, tone = 'teal' }) {
  const t = tone === 'pink' ? 'text-pink-600' : tone === 'amber' ? 'text-amber-600' : 'text-teal-600';
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center">
      <div className={`text-2xl font-semibold ${t}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}

export default function CollegeAdmissionsView() {
  const [grade, setGrade] = useState('junior');
  const phases = TIMELINE[grade];
  const sub = GRADES.find((g) => g.key === grade).sub;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-r from-pink-500 to-pink-700 p-8 text-white shadow-2xl">
        <div className="text-sm uppercase tracking-[0.2em] text-pink-100">College Admissions</div>
        <div className="mt-3 text-3xl font-semibold">Your roadmap to college</div>
        <div className="mt-3 max-w-xl text-sm text-pink-100">A year-by-year plan for high school — coursework, testing, essays, applications, and financial aid. Built for the admissions journey, separate from K-12 tutoring.</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KeyStat label="FAFSA opens" value="Oct 1" tone="amber" />
        <KeyStat label="Early apps (ED / EA)" value="Nov 1" tone="pink" />
        <KeyStat label="Decision Day" value="May 1" tone="teal" />
      </div>

      <Section title="Grade-by-grade timeline">
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => (
            <button key={g.key} onClick={() => setGrade(g.key)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${grade === g.key ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{g.label}</button>
          ))}
        </div>
        <div className="text-sm text-slate-500">{sub}</div>
        <div className="space-y-5">
          {phases.map((ph) => (
            <div key={ph.season} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-teal-700">
                {ph.season}
                {isCurrentSeason(ph.season) ? <span className="rounded-full bg-brand-pink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Now</span> : null}
              </div>
              <div className="divide-y divide-slate-100 rounded-3xl border border-slate-200 bg-white">
                {ph.items.map((it, i) => (
                  <div key={i} className="flex gap-4 p-4">
                    <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotColor(it.kind)}`} />
                    <div>
                      <div className="font-semibold text-slate-900">{it.t}<Badge kind={it.kind} /></div>
                      <div className="mt-1 text-sm text-slate-600">{it.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="SAT & ACT testing plan">
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="space-y-4">
            {TEST_PLAN.map((p) => (
              <div key={p.t} className="flex gap-4">
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                  <span className="text-[10px] font-bold leading-none">SAT<br />ACT</span>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{p.t} <span className="font-normal text-slate-500">· {p.when}</span></div>
                  <div className="mt-1 text-sm text-slate-600">{p.d}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Typical test months</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">SAT</span>
              {SAT_MONTHS.map((m) => <span key={`s${m}`} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{m}</span>)}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-pink-50 px-3 py-1 text-sm font-medium text-pink-600">ACT</span>
              {ACT_MONTHS.map((m) => <span key={`a${m}`} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{m}</span>)}
            </div>
            <div className="mt-3 text-xs text-slate-500">The SAT is now digital (College Board’s Bluebook app). Always confirm exact dates on the official sites.</div>
          </div>
        </div>
      </Section>

      <Section title="Key resources">
        <div className="grid gap-3 sm:grid-cols-2">
          {RESOURCES.map((r) => (
            <a key={r.t} href={r.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-lg">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${RES_ACCENT[r.accent]}`}>{ICN[r.icon]}</span>
              <div className="grow">
                <div className="font-semibold text-slate-900">{r.t}</div>
                <div className="mt-0.5 text-sm text-slate-500">{r.d}</div>
              </div>
              <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-teal">↗</span>
            </a>
          ))}
        </div>
      </Section>
    </div>
  );
}
