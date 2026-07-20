import { useEffect, useState } from 'react';
import Section from '../components/Section.jsx';

// ---------------------------------------------------------------------------
// Item bank. Banded K-12 Math & ELA; single-course diagnostics for the rest.
// Extend by adding { q, a, skill, ch:[...] } to a band's items array.
// ---------------------------------------------------------------------------
const DATA = {
  math: { name: 'K–12 Math', blurb: 'Number sense → Algebra & Geometry', bands: [
    { label: 'Gr 1–2', name: 'Number sense', items: [
      { q: 'What number comes right after 49?', a: '50', skill: 'Counting & place value', ch: ['48', '50', '59', '40'] },
      { q: '7 + 6 = ?', a: '13', skill: 'Addition within 20', ch: ['12', '13', '14', '11'] },
      { q: 'Which is greater: 38 or 41?', a: '41', skill: 'Comparing numbers', ch: ['38', '41', 'equal'] },
      { q: '12 − 5 = ?', a: '7', skill: 'Subtraction within 20', ch: ['6', '7', '8', '17'] },
      { q: 'Skip count by 2:  2, 4, 6, __', a: '8', skill: 'Skip counting', ch: ['7', '8', '10', '9'] },
      { q: 'How many tens are in 60?', a: '6', skill: 'Place value', ch: ['6', '60', '16', '0'] } ] },
    { label: 'Gr 3–5', name: 'Operations & fractions', items: [
      { q: '6 × 7 = ?', a: '42', skill: 'Multiplication facts', ch: ['42', '48', '36', '49'] },
      { q: 'What is 3/4 + 1/4?', a: '1', skill: 'Fraction addition', ch: ['4/8', '1', '3/8', '1/2'] },
      { q: '56 ÷ 8 = ?', a: '7', skill: 'Division', ch: ['6', '7', '8', '9'] },
      { q: 'Which is larger: 0.5 or 0.35?', a: '0.5', skill: 'Decimal comparison', ch: ['0.5', '0.35', 'equal'] },
      { q: 'Area of a 4 × 6 rectangle?', a: '24', skill: 'Area', ch: ['10', '20', '24', '46'] },
      { q: 'Round 472 to the nearest hundred.', a: '500', skill: 'Rounding', ch: ['400', '470', '500', '480'] } ] },
    { label: 'Gr 6–8', name: 'Pre-algebra', items: [
      { q: 'Solve for x:  3x + 5 = 20', a: 'x=5', skill: 'Linear equations', ch: ['x=5', 'x=15', 'x=45', 'x=3'] },
      { q: 'What is 20% of 150?', a: '30', skill: 'Percent', ch: ['15', '30', '20', '75'] },
      { q: 'Simplify:  −3 + 8 − 5', a: '0', skill: 'Integer operations', ch: ['0', '−6', '6', '10'] },
      { q: 'Ratio 2:3. If 2 corresponds to 8, what does 3 correspond to?', a: '12', skill: 'Proportional reasoning', ch: ['9', '12', '6', '18'] },
      { q: 'Evaluate  2³ + 4', a: '12', skill: 'Exponents', ch: ['10', '12', '14', '64'] },
      { q: 'Slope of the line through (1, 2) and (3, 8)?', a: '3', skill: 'Slope', ch: ['2', '3', '4', '6'] } ] },
    { label: 'Gr 8–10', name: 'Algebra I & Geometry', items: [
      { q: 'Factor:  x² + 5x + 6', a: '(x+2)(x+3)', skill: 'Factoring quadratics', ch: ['(x+2)(x+3)', '(x+1)(x+6)', '(x+5)(x+1)', '(x−2)(x−3)'] },
      { q: 'Solve:  x² − 9 = 0', a: 'x=±3', skill: 'Solving quadratics', ch: ['x=3 only', 'x=±3', 'x=9', 'x=±9'] },
      { q: 'Right triangle with legs 3 and 4 — length of hypotenuse?', a: '5', skill: 'Pythagorean theorem', ch: ['5', '7', '6', '12'] },
      { q: 'Line through (0, −1) with slope 2 — slope-intercept form?', a: 'y=2x−1', skill: 'Linear graphing', ch: ['y=2x−1', 'y=2x+1', 'y=−x+2', 'y=x−1'] },
      { q: 'Solve the system:  y = x + 1  and  y = 2x − 3', a: '(4, 5)', skill: 'Systems of equations', ch: ['(4, 5)', '(2, 3)', '(1, 2)', '(3, 4)'] },
      { q: 'Area of a circle with radius 5 (in terms of π)?', a: '25π', skill: 'Circle geometry', ch: ['10π', '25π', '5π', '50π'] } ] } ] },
  ela: { name: 'K–12 ELA', blurb: 'Phonics → rhetoric & analysis', bands: [
    { label: 'Gr 1–2', name: 'Early reading', items: [
      { q: 'Which word rhymes with “cat”:  dog, hat, sun?', a: 'hat', skill: 'Phonemic awareness', ch: ['dog', 'hat', 'sun'] },
      { q: 'What is the first sound in the word “ship”?', a: '/sh/', skill: 'Phonics', ch: ['/s/', '/sh/', '/p/', '/i/'] },
      { q: 'What is the plural of “box”?', a: 'boxes', skill: 'Grammar: plurals', ch: ['boxs', 'boxes', 'boxies', 'box'] },
      { q: 'Which is a complete sentence?', a: '“The dog ran.”', skill: 'Sentence structure', ch: ['“The dog.”', '“Ran fast.”', '“The dog ran.”', '“Big brown.”'] },
      { q: 'Read: “Maya found a red kite in the park.” — What did Maya find?', a: 'a red kite', skill: 'Literal comprehension', ch: ['a park', 'a red kite', 'a dog', 'a ball'] } ] },
    { label: 'Gr 3–5', name: 'Comprehension', items: [
      { q: 'A paragraph describes how bees make honey step by step. Its main idea?', a: 'How bees make honey', skill: 'Main idea', ch: ['Bees are yellow', 'How bees make honey', 'Honey is sweet', 'Flowers bloom'] },
      { q: 'Which is a synonym for “happy”?', a: 'joyful', skill: 'Vocabulary', ch: ['angry', 'joyful', 'tired', 'quiet'] },
      { q: 'Fix this sentence:  “Me and him went to the store.”', a: '“He and I went…”', skill: 'Grammar: pronouns', ch: ['“Him and me went…”', '“He and I went…”', '“Me and he went…”', 'already correct'] },
      { q: 'In the word “redo,” what does the prefix “re-” mean?', a: 'again', skill: 'Morphology', ch: ['not', 'again', 'before', 'under'] },
      { q: 'A text explaining how to plant a seed is written mainly to…', a: 'inform', skill: "Author's purpose", ch: ['entertain', 'inform', 'persuade', 'frighten'] } ] },
    { label: 'Gr 6–8', name: 'Analysis & mechanics', items: [
      { q: 'A story shows a character learning to forgive a friend. This is the…', a: 'theme', skill: 'Theme', ch: ['setting', 'theme', 'plot', 'narrator'] },
      { q: 'Which uses a semicolon correctly?', a: '“I was late; the bus never came.”', skill: 'Mechanics: semicolons', ch: ['“I was late; because…”', '“I was late; the bus never came.”', '“I was; late.”', '“I; was late.”'] },
      { q: 'Which word has a more negative connotation: “cheap” or “affordable”?', a: 'cheap', skill: 'Connotation & diction', ch: ['cheap', 'affordable', 'same', 'neither'] },
      { q: 'To support a claim, you should cite…', a: 'specific evidence from the text', skill: 'Textual evidence', ch: ['your opinion', 'a guess', 'specific evidence from the text', 'the title'] },
      { q: 'Fix the run-on:  “I like to read I go to the library often.”', a: 'Add a period or semicolon after “read”', skill: 'Sentence structure', ch: ["It's fine", 'Add a period or semicolon after “read”', 'Add more commas', 'Remove “I”'] } ] },
    { label: 'Gr 9–12', name: 'Rhetoric & argument', items: [
      { q: '“The wind whispered through the trees.” — What device is this?', a: 'personification', skill: 'Figurative language', ch: ['simile', 'personification', 'hyperbole', 'alliteration'] },
      { q: 'Which is an arguable thesis?', a: '“Schools should replace letter grades with narrative feedback.”', skill: 'Argumentation', ch: ['“The sky is blue.”', '“Schools should replace letter grades with narrative feedback.”', '“This essay is about school.”', '“Grades exist.”'] },
      { q: 'A passage uses short, clipped sentences in a chase scene. This creates a tone of…', a: 'tension/urgency', skill: 'Tone & style', ch: ['calm', 'tension/urgency', 'humor', 'boredom'] },
      { q: 'Fix the comma splice:  “The results were clear, we had to act.”', a: '“…clear; we had to act.”', skill: 'Mechanics: comma splice', ch: ["It's correct", '“…clear; we had to act.”', 'Add a comma', 'Remove “clear”'] },
      { q: 'In an argumentative essay, the second paragraph most likely functions to…', a: 'develop a supporting reason with evidence', skill: 'Text structure', ch: ['restate the title', 'develop a supporting reason with evidence', 'end the essay', 'list the author'] } ] } ] },
  physics: { name: 'Physics', blurb: 'Kinematics → energy & vectors', bands: [
    { label: 'Core', name: 'Mechanics fundamentals', items: [
      { q: 'A car travels 60 m in 3 s. Average speed?', a: '20 m/s', skill: 'Kinematics', ch: ['20 m/s', '180 m/s', '30 m/s', '2 m/s'] },
      { q: 'What are the SI units of force?', a: 'Newton', skill: 'Units & dimensions', ch: ['Joule', 'Newton', 'Watt', 'Pascal'] },
      { q: 'A net force of 10 N acts on a 2 kg mass. Acceleration?', a: '5 m/s²', skill: "Newton's 2nd law", ch: ['5 m/s²', '20 m/s²', '0.2 m/s²', '12 m/s²'] },
      { q: 'An object is dropped from rest. Speed after 2 s (g ≈ 10 m/s²)?', a: '20 m/s', skill: 'Free fall', ch: ['10 m/s', '20 m/s', '5 m/s', '40 m/s'] },
      { q: 'Kinetic energy of a 2 kg object at 3 m/s?', a: '9 J', skill: 'Energy', ch: ['6 J', '9 J', '18 J', '3 J'] },
      { q: 'Two perpendicular forces: 3 N right, 4 N up. Resultant magnitude?', a: '5 N', skill: 'Vectors', ch: ['7 N', '5 N', '1 N', '12 N'] } ] } ] },
  precalc: { name: 'Pre-Calculus', blurb: 'Functions, logs, trig', bands: [
    { label: 'Core', name: 'Functions & trig', items: [
      { q: 'If f(x) = x² − 1, what is f(3)?', a: '8', skill: 'Function evaluation', ch: ['8', '9', '5', '10'] },
      { q: 'Evaluate  log₂(8).', a: '3', skill: 'Logarithms', ch: ['2', '3', '4', '8'] },
      { q: 'What is the domain of  f(x) = 1/(x − 2)?', a: 'x ≠ 2', skill: 'Domain & range', ch: ['all reals', 'x ≠ 2', 'x > 2', 'x ≠ 0'] },
      { q: 'sin(30°) = ?', a: '1/2', skill: 'Trigonometry', ch: ['1/2', '√3/2', '1', '0'] },
      { q: 'Solve:  2ˣ = 16', a: 'x=4', skill: 'Exponential equations', ch: ['x=3', 'x=4', 'x=8', 'x=2'] },
      { q: 'Simplify:  (x² − 1)/(x − 1)', a: 'x+1', skill: 'Rational expressions', ch: ['x−1', 'x+1', 'x²', '1'] },
      { q: 'On the unit circle, cos(π) = ?', a: '−1', skill: 'Radians & unit circle', ch: ['0', '1', '−1', '1/2'] } ] } ] },
  calc: { name: 'Calculus', blurb: 'Limits, derivatives, integrals', bands: [
    { label: 'Core', name: 'Differential & integral', items: [
      { q: 'Find  d/dx [x³].', a: '3x²', skill: 'Power rule', ch: ['3x²', 'x²', '3x', 'x⁴/4'] },
      { q: 'Evaluate  lim(x→0) sin(x)/x.', a: '1', skill: 'Limits', ch: ['0', '1', '∞', 'undefined'] },
      { q: 'What is the derivative of  sin(x)?', a: 'cos(x)', skill: 'Trig derivatives', ch: ['cos(x)', '−cos(x)', '−sin(x)', 'tan(x)'] },
      { q: 'Evaluate  ∫ 2x dx.', a: 'x²+C', skill: 'Antiderivatives', ch: ['x²+C', '2+C', 'x+C', '2x²+C'] },
      { q: 'Find  d/dx [eˣ].', a: 'eˣ', skill: 'Exponential derivatives', ch: ['eˣ', 'x·eˣ⁻¹', '1', 'e'] },
      { q: 'Slope of the tangent to y = x² at x = 2?', a: '4', skill: 'Derivative applications', ch: ['2', '4', '8', '1'] },
      { q: 'Product rule:  d/dx [x·cos(x)].', a: 'cos(x) − x·sin(x)', skill: 'Product rule', ch: ['−sin(x)', 'cos(x) − x·sin(x)', 'cos(x)+x·sin(x)', 'x·sin(x)'] } ] } ] },
  chem: { name: 'Chemistry', blurb: 'Atoms, bonding, reactions', bands: [
    { label: 'Core', name: 'Foundations', items: [
      { q: 'What is the chemical symbol for sodium?', a: 'Na', skill: 'Element symbols', ch: ['So', 'Na', 'S', 'Sd'] },
      { q: 'How many protons are in a carbon atom (atomic number 6)?', a: '6', skill: 'Atomic structure', ch: ['6', '12', '4', '8'] },
      { q: 'Balance:  H₂ + O₂ → H₂O.  Coefficient on H₂O?', a: '2', skill: 'Balancing equations', ch: ['1', '2', '3', '4'] },
      { q: 'A solution with pH 7 is…', a: 'neutral', skill: 'Acids & bases', ch: ['acidic', 'basic', 'neutral', 'unstable'] },
      { q: 'Molar mass of H₂O (H = 1, O = 16 g/mol)?', a: '18', skill: 'Moles & molar mass', ch: ['17', '18', '16', '34'] },
      { q: 'Two nonmetals sharing electrons form what bond?', a: 'covalent', skill: 'Chemical bonding', ch: ['ionic', 'covalent', 'metallic', 'hydrogen'] },
      { q: 'In NaCl, what is the charge on the sodium ion?', a: '+1', skill: 'Ions', ch: ['+1', '−1', '+2', '0'] } ] } ] }
};

const SUBJECT_ICON = { math: '∑', ela: 'A', physics: '⚛', precalc: 'ƒ', calc: '∫', chem: '⚗' };

function tutorFor(s) {
  if (s === 'physics') return 'Hana Girma (Physics)';
  if (s === 'calc' || s === 'precalc') return 'Josh Tadesse (Pre-Calc & Calculus)';
  if (s === 'math') return 'Bethlehem Alemu (Algebra & Geometry) or Josh Tadesse';
  if (s === 'ela') return 'Matched ELA specialist · SAT prep with Daniel Asfaw';
  return 'Matched from subject bench';
}
function isHS(s, ceil) {
  if (['physics', 'precalc', 'calc', 'chem'].includes(s)) return true;
  if (s === 'math' && ceil >= 3) return true;
  if (s === 'ela' && ceil >= 3) return true;
  return false;
}

const card = 'rounded-3xl border border-slate-200 bg-white p-5';
const pill = 'rounded-full px-4 py-2 text-sm font-semibold transition';

function DiagnosticView({ db }) {
  const [step, setStep] = useState('subject'); // subject | band | run | extend | result
  const [subj, setSubj] = useState(null);
  const [bandIdx, setBandIdx] = useState(null);
  const [queue, setQueue] = useState([]);
  const [pos, setPos] = useState(0);
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(null); // the choice clicked for the current question
  const [extend, setExtend] = useState(null);
  const [computed, setComputed] = useState(null);
  const [lead, setLead] = useState({ student: '', grade: '', parent: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const v = subj ? DATA[subj] : null;
  const me = (db && db.me) ? db.me() : null;
  const isStudent = me?.role === 'student';
  const [programs, setPrograms] = useState(null);
  useEffect(() => {
    if (isStudent && db && db.myPrograms) db.myPrograms().then(setPrograms).catch(() => setPrograms([]));
  }, []);
  // A student in admissions-only should not run a subject-mastery diagnostic.
  const blockedStudent = isStudent && programs !== null && !programs.includes('tutoring');

  function reset() {
    setStep('subject'); setSubj(null); setBandIdx(null); setQueue([]); setPos(0);
    setResults([]); setPicked(null); setExtend(null); setComputed(null);
    setLead({ student: '', grade: '', parent: '', email: '', phone: '' }); setSaved(false);
  }
  function chooseSubject(k) { setSubj(k); setBandIdx(null); setStep('band'); }
  function bandItems(sk, i) { return DATA[sk].bands[i].items.map((it) => ({ ...it, bandIdx: i })); }
  function begin() { setQueue(bandItems(subj, bandIdx)); setPos(0); setResults([]); setPicked(null); setStep('run'); }

  // The student (or the tutor on their behalf) clicks a choice; it is graded
  // against the validated correct answer and fed into the mastery result.
  function choose(c) { if (picked === null) setPicked(c); }
  function next() {
    const q = queue[pos];
    mark(picked === q.a ? 'c' : 'x');
    setPicked(null);
  }
  function mark(m) {
    const q = queue[pos];
    const nextRes = [...results, { ...q, mark: m }];
    setResults(nextRes);
    if (pos + 1 >= queue.length) maybeExtend(nextRes);
    else setPos(pos + 1);
  }
  function bandScore(res, idx) {
    const r = res.filter((x) => x.bandIdx === idx);
    if (!r.length) return null;
    const pts = r.reduce((s, x) => s + (x.mark === 'c' ? 1 : x.mark === 'p' ? 0.5 : 0), 0);
    return { pct: Math.round((pts / r.length) * 100), n: r.length };
  }
  function maybeExtend(res) {
    const cur = bandIdx;
    const sc = bandScore(res, cur);
    const tested = [...new Set(res.map((x) => x.bandIdx))];
    const hasAbove = cur < v.bands.length - 1 && !tested.includes(cur + 1);
    const hasBelow = cur > 0 && !tested.includes(cur - 1);
    if (sc.pct >= 80 && hasAbove) { setExtend({ dir: 'up', to: cur + 1, pct: sc.pct }); setStep('extend'); return; }
    if (sc.pct < 50 && hasBelow) { setExtend({ dir: 'down', to: cur - 1, pct: sc.pct }); setStep('extend'); return; }
    finish(res);
  }
  function stepTo(i) { setBandIdx(i); setQueue(bandItems(subj, i)); setPos(0); setPicked(null); setStep('run'); }
  function finish(res) {
    const pts = res.reduce((s, x) => s + (x.mark === 'c' ? 1 : x.mark === 'p' ? 0.5 : 0), 0);
    const overall = Math.round((pts / res.length) * 100);
    const tested = [...new Set(res.map((x) => x.bandIdx))].sort((a, b) => a - b);
    let ceiling = tested[0];
    tested.forEach((i) => { const s = bandScore(res, i); if (s && s.pct >= 60) ceiling = Math.max(ceiling, i); });
    const gaps = [...new Set(res.filter((x) => x.mark !== 'c').map((x) => x.skill))];
    const cadence = overall >= 75 ? '1× per week (enrichment & pace)' : overall >= 50 ? '1–2× per week (targeted skill-building)' : '2× per week (foundation repair)';
    setComputed({
      overall, ceiling, tested, gaps, cadence,
      subject: v.name,
      entry_band: v.bands[tested[0]].label,
      ceiling_band: v.bands[ceiling].name,
      recommended_tutor: tutorFor(subj),
      admissions_bridge: isHS(subj, ceiling),
      band_scores: tested.map((i) => ({ label: v.bands[i].label, name: v.bands[i].name, pct: bandScore(res, i).pct }))
    });
    setStep('result');
  }

  async function save() {
    // Students save a self-assessment (tied to their own record by the driver);
    // staff capture a lead and need at least a name or contact.
    if (!isStudent && !(lead.student || lead.email || lead.phone)) { window.toast?.('Add a student name or a parent contact first'); return; }
    setSaving(true);
    try {
      await db.saveDiagnostic({
        prospect_student: isStudent ? (me?.full_name || null) : (lead.student || null),
        prospect_parent: lead.parent || null,
        prospect_email: lead.email || null,
        prospect_phone: lead.phone || null,
        grade_level: lead.grade || null,
        subject: computed.subject,
        entry_band: computed.entry_band,
        ceiling_band: computed.ceiling_band,
        overall_mastery: computed.overall,
        band_scores: computed.band_scores,
        skill_gaps: computed.gaps,
        recommended_cadence: computed.cadence,
        recommended_tutor: computed.recommended_tutor,
        admissions_bridge: computed.admissions_bridge,
        recommended_tier: null,
        status: 'new'
      });
      setSaved(true);
      window.toast?.(isStudent ? 'Saved — your results are shared with your tutor' : 'Saved — this lead is now in the funnel');
    } catch (e) {
      window.toast?.('Save failed: ' + (e.message || 'unknown error'));
    } finally { setSaving(false); }
  }

  // -- render ---------------------------------------------------------------
  if (blockedStudent) {
    return (
      <Section title="Subject-mastery diagnostic">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
          <div className="text-lg font-semibold text-slate-900">Available with tutoring</div>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">The subject-mastery diagnostic is part of the tutoring program. You&rsquo;re enrolled in college admissions — explore the College section, or ask an admin to add tutoring.</p>
        </div>
      </Section>
    );
  }
  if (step === 'subject') {
    return (
      <Section title="New diagnostic">
        <p className="text-sm text-slate-500 -mt-2">{isStudent ? 'Pick a subject to check your skills. About 6–10 questions, ~20 minutes — you’ll get a personalized plan at the end.' : 'Pick the subject the family came in for. Aim for 6–10 items in ~20 minutes, then read the recommendation together.'}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(DATA).map(([k, s]) => (
            <button key={k} className={`${card} text-left transition hover:bg-slate-50`} onClick={() => chooseSubject(k)}>
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-50 text-lg font-bold text-teal-700">{SUBJECT_ICON[k]}</div>
              <div className="mt-3 font-semibold text-slate-900">{s.name}</div>
              <div className="text-sm text-slate-500">{s.blurb}</div>
            </button>
          ))}
        </div>
      </Section>
    );
  }

  if (step === 'band') {
    return (
      <Section title={v.name} actionLabel="← Subjects" action={reset}>
        <p className="text-sm text-slate-500 -mt-2">{isStudent ? 'Start at your current grade level. Ace it and you’ll be offered the next level up; struggle and you can step down.' : "Start at the student's current grade level. Ace it and you'll be offered the next level up; struggle and you can step down."}</p>
        <div className="space-y-3">
          {v.bands.map((b, i) => (
            <button key={i} className={`w-full rounded-3xl border p-4 text-left transition ${bandIdx === i ? 'border-teal-600 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`} onClick={() => setBandIdx(i)}>
              <div className="flex items-center gap-4">
                <div className="grid h-9 w-14 place-items-center rounded-xl bg-teal-600 text-xs font-bold text-white">{b.label}</div>
                <div><div className="font-semibold text-slate-900">{b.name}</div><div className="text-sm text-slate-500">{b.items.length} items</div></div>
              </div>
            </button>
          ))}
        </div>
        <button className={`${pill} bg-teal-600 text-white disabled:opacity-40`} disabled={bandIdx === null} onClick={begin}>Begin diagnostic →</button>
      </Section>
    );
  }

  if (step === 'run') {
    const q = queue[pos];
    return (
      <Section title={v.name} actionLabel="← Change level" action={() => setStep('band')}>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${(pos / queue.length) * 100}%` }} /></div>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Question {pos + 1} of {queue.length}</span>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">{q.skill}</span>
        </div>
        <div className={card}>
          <div className="text-lg font-medium text-slate-900">{q.q}</div>
          <div className="mt-4 space-y-2">
            {q.ch.map((c, i) => {
              const isCorrect = c === q.a;
              const isPicked = picked === c;
              let cls = 'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ';
              if (picked === null) cls += 'border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50 cursor-pointer';
              else if (isCorrect) cls += 'border-green-300 bg-green-50 text-green-800 font-semibold';
              else if (isPicked) cls += 'border-red-300 bg-red-50 text-red-700';
              else cls += 'border-slate-200 text-slate-400';
              return (
                <button key={i} type="button" disabled={picked !== null} className={cls} onClick={() => choose(c)}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">{String.fromCharCode(65 + i)}</span>
                  <span className="grow">{c}</span>
                  {picked !== null && isCorrect ? <span>✓</span> : picked !== null && isPicked ? <span>✕</span> : null}
                </button>
              );
            })}
          </div>
          {picked === null
            ? <p className="mt-3 text-sm text-slate-500">Tap the answer the student chose — it's graded automatically.</p>
            : <div className={`mt-3 rounded-xl px-4 py-2.5 text-sm ${picked === q.a ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'}`}>{picked === q.a ? 'Correct — nice work.' : <>Not quite — the correct answer is <b>{q.a}</b>.</>}</div>}
        </div>
        {picked !== null
          ? <button className={`${pill} bg-teal-600 text-white`} onClick={next}>{pos + 1 >= queue.length ? 'See results →' : 'Next question →'}</button>
          : null}
      </Section>
    );
  }

  if (step === 'extend') {
    return (
      <Section title={v.name}>
        <div className="rounded-3xl border border-teal-200 bg-teal-50 p-5 text-teal-900">
          {extend.dir === 'up'
            ? <>Strong — <b>{extend.pct}%</b> at {v.bands[bandIdx].label}. Try the next level up to find the true ceiling?</>
            : <><b>{extend.pct}%</b> at {v.bands[bandIdx].label} suggests we should check the foundation below it.</>}
        </div>
        <div className="flex flex-wrap gap-3">
          <button className={`${pill} bg-teal-600 text-white`} onClick={() => stepTo(extend.to)}>{extend.dir === 'up' ? 'Step up' : 'Step down'} to {v.bands[extend.to].label} →</button>
          <button className={`${pill} border border-slate-200 text-slate-600`} onClick={() => finish(results)}>Stop here & see results</button>
        </div>
      </Section>
    );
  }

  // result
  const c = computed;
  const masteryColor = c.overall >= 75 ? 'text-green-600' : c.overall >= 50 ? 'text-amber-600' : 'text-red-600';
  const barColor = c.overall >= 75 ? 'bg-green-500' : c.overall >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <Section title={`${v.name} profile`} actionLabel="New diagnostic" action={reset}>
      <p className="text-sm text-slate-500 -mt-2">{c.overall >= 75 ? 'Solid command — the opportunity is pace and depth.' : c.overall >= 50 ? 'A workable foundation with specific, fixable gaps.' : 'Foundational gaps to repair first; the right cadence moves quickly.'}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className={card}><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall mastery</div><div className={`text-2xl font-bold ${masteryColor}`}>{c.overall}%</div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${barColor}`} style={{ width: `${c.overall}%` }} /></div></div>
        <div className={card}><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diagnosed ceiling</div><div className="text-xl font-bold text-slate-900">{c.ceiling_band}</div><div className="mt-1 text-sm text-slate-500">Where instruction should meet the student.</div></div>
      </div>
      <div className={card}>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Performance by level</div>
        <div className="mt-2 space-y-2">{c.tested.map((i) => { const sc = c.band_scores.find((b) => b.label === v.bands[i].label); const col = sc.pct >= 75 ? 'bg-green-500' : sc.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'; return (
          <div key={i} className="flex items-center gap-3"><span className="flex-1 text-sm font-medium text-slate-700">{sc.label} · {sc.name}</span><span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200"><span className={`block h-full ${col}`} style={{ width: `${sc.pct}%` }} /></span><span className="w-10 text-right text-sm font-bold text-slate-700">{sc.pct}%</span></div>); })}</div>
      </div>
      <div className="rounded-3xl border-2 border-teal-600 bg-teal-50 p-5">
        <div className="font-semibold text-teal-900">Recommended plan</div>
        <div className="mt-1 text-sm text-slate-700">{v.name} tutoring, meeting the student at <b>{c.ceiling_band}</b>.</div>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          <li>Cadence: <b>{c.cadence}</b></li>
          <li>Focus: {c.overall >= 75 ? 'accelerate into the next level and deepen problem-solving' : 'close the specific skill gaps below before moving forward'}</li>
          <li>Matched tutor: {c.recommended_tutor}</li>
        </ul>
        {c.gaps.length ? <div className="mt-3 flex flex-wrap gap-2">{c.gaps.slice(0, 6).map((g) => <span key={g} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">{g}</span>)}</div> : <div className="mt-2 text-sm font-medium text-green-600">No gaps flagged — ready to accelerate.</div>}
      </div>
      {c.admissions_bridge ? (
        <div className="rounded-3xl border-2 border-brand-pink bg-pink-50 p-5">
          <div className="font-semibold text-brand-pink">Admissions readiness</div>
          {isStudent ? (
            <p className="mt-1 text-sm text-slate-600">You&rsquo;re in the high-school window — a good time to start college planning. Explore the College section, or ask your counselor about admissions support.</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-slate-600">This student is in the high-school window. Open the college-admissions conversation and point the family to a tier:</p>
              <div className="mt-2 flex flex-wrap gap-2">{['Essentials · checkpoints', 'Premier · full-process', 'Elite · concierge'].map((t) => <span key={t} className="rounded-full border border-brand-pink bg-white px-3 py-1 text-xs font-semibold text-brand-pink">{t}</span>)}</div>
              <p className="mt-2 text-xs font-semibold text-brand-pink">Founding Family rate — 15% off any tier — closes July 31.</p>
            </>
          )}
        </div>
      ) : null}
      <div className={card}>
        {isStudent ? (
          <>
            <div className="text-sm font-semibold text-slate-900">Save your results</div>
            <div className="text-sm text-slate-500">Saves this diagnostic to your profile and shares it with your tutor so they can plan the right sessions.</div>
          </>
        ) : (
          <>
            <div className="text-sm font-semibold text-slate-900">Family details</div>
            <div className="text-sm text-slate-500">Capture enough to follow up. Saves this diagnostic to the funnel.</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[['student', 'Student name'], ['grade', 'Grade'], ['parent', 'Parent / guardian'], ['email', 'Parent email'], ['phone', 'Parent phone']].map(([k, label]) => (
                <label key={k} className={k === 'phone' ? 'sm:col-span-2' : ''}>
                  <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
                  <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={lead[k]} onChange={(e) => setLead({ ...lead, [k]: e.target.value })} />
                </label>
              ))}
            </div>
          </>
        )}
        <div className="mt-4 flex items-center gap-3">
          <button className={`${pill} bg-teal-600 text-white disabled:opacity-40`} disabled={saving || saved} onClick={save}>{saved ? 'Saved ✓' : saving ? 'Saving…' : (isStudent ? 'Save my results' : 'Save to funnel')}</button>
          {saved ? <span className="text-sm font-medium text-green-600">{isStudent ? 'Shared with your tutor.' : 'This lead is now in the Sales funnel.'}</span> : null}
        </div>
      </div>
    </Section>
  );
}

export default DiagnosticView;
