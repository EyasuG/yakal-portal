export function seed() {
  return {
    org: { id: 'o1', name: 'Yakal Education Services' },
    profiles: [
      { id: 'u-almaz', role: 'admin', full_name: 'Almaz Tadesse', email: 'almaz@yakal.me', phone: '301-555-0001' },
      { id: 'u-beth', role: 'tutor', full_name: 'Bethlehem Alemu', email: 'beth@yakal.me', phone: '301-555-0002' },
      { id: 'u-josh', role: 'tutor', full_name: 'Eyasu (Josh) Tadesse', email: 'josh@yakal.me', phone: '301-555-0003' },
      { id: 'u-hana', role: 'counselor', full_name: 'Hana Girma', email: 'hana@yakal.me', phone: '301-555-0004' },
      { id: 'u-daniel', role: 'tutor', full_name: 'Daniel Asfaw', email: 'daniel@yakal.me', phone: '301-555-0005' },
      { id: 'u-mesfin', role: 'tutoring_admin', full_name: 'Mesfin Tadesse', email: 'tadmin@yakal.me', phone: '301-555-0006' },
      { id: 'u-selam', role: 'admissions_admin', full_name: 'Selam Abebe', email: 'aadmin@yakal.me', phone: '301-555-0007' },
      { id: 'u-tigist', role: 'parent', full_name: 'Tigist Worku', email: 'tigist@email.com', phone: '301-555-0010' },
      { id: 'u-sara', role: 'parent', full_name: 'Sara Mekonnen', email: 'sara@email.com', phone: '301-555-0011' },
      { id: 'u-amen', role: 'student', full_name: 'Amen Worku', email: 'amen@email.com', phone: '301-555-0012' }
    ],
    tutors: {
      'u-beth': { rating: 4.9, rate: 45, payout: 157500, accepting: true, subjects: ['Algebra', 'SAT Math', 'Geometry'] },
      'u-josh': { rating: 5.0, rate: 50, payout: 72000, accepting: true, subjects: ['Algebra', 'Pre-Calculus'] },
      'u-hana': { rating: 4.8, rate: 55, payout: 90000, accepting: false, subjects: ['College Essays', 'Admissions'] },
      'u-daniel': { rating: 4.7, rate: 42, payout: 48000, accepting: true, subjects: ['Physics', 'Calculus'] }
    },
    students: [
      {
        id: 's-amen', user_id: 'u-amen', name: 'Amen Worku', grade: 'Grade 12', tutor: 'u-beth', progress: 78, status: 'ok',
        subjects: ['College Essays', 'SAT Prep'], next: 'Thu · 6:00 PM', mode: 'Online', programs: ['tutoring', 'admissions']
      },
      {
        id: 's-saron', user_id: null, name: 'Saron Worku', grade: 'Grade 9', tutor: 'u-josh', progress: 85, status: 'ok',
        subjects: ['Algebra I'], next: 'Wed · 4:30 PM', mode: 'In person', programs: ['tutoring']
      },
      {
        id: 's-liya', user_id: null, name: 'Liya Mekonnen', grade: 'Grade 11', tutor: 'u-beth', progress: 64, status: 'warn',
        subjects: ['Geometry', 'SAT Math'], next: 'Today · 4:00 PM', mode: 'Online', programs: ['tutoring', 'admissions']
      }
    ],
    guardianships: [
      { parent: 'u-tigist', student: 's-amen' },
      { parent: 'u-tigist', student: 's-saron' },
      { parent: 'u-sara', student: 's-liya' }
    ],
    progress: {
      's-amen': [['College Essays', 72], ['SAT Prep', 61], ['Applications', 80]],
      's-saron': [['Algebra I', 85], ['Study skills', 74]],
      's-liya': [['Geometry', 58], ['SAT Math', 66]]
    },
    homework: {
      's-amen': [
        { t: 'Common App essay — draft 2', c: 'College Essays', d: 'Due Fri', done: false },
        { t: 'SAT practice test 3', c: 'SAT Prep', d: 'Due Tue', done: false },
        { t: 'Revise activities list', c: 'Applications', d: 'Completed', done: true }
      ]
    },
    applications: {
      's-amen': {
        top: 'Johns Hopkins University', n: 8, deadline: 'Jan 2', days: 9,
        essays: [['Common App personal statement', true], ['JHU "why us" supplement', false], ['Activities descriptions', true]],
        tasks: [['Request recommendation letters', true], ['Finalize school list', false], ['Submit FAFSA', false]],
        counselor: 'u-hana'
      }
    },
    sessionsPast: {
      's-amen': [['Essay structure', 'u-hana', 'Oct 24'], ['SAT timing drills', 'u-beth', 'Oct 19'], ['Personal statement review', 'u-hana', 'Oct 12']],
      's-liya': [['Geometry proofs', 'u-beth', 'Oct 22'], ['SAT math section', 'u-beth', 'Oct 15']]
    },
    conversations: [
      {
        id: 'c1', subject: 'Essay & SAT help', student: 's-amen', parts: ['u-beth', 'u-amen'], msgs: [
          { from: 'u-beth', t: 'Nice work on draft 1. Tighten the opening before Thursday.', time: '10:02 AM' },
          { from: 'u-amen', t: "Got it — I'll revise the intro tonight.", time: '10:20 AM' }
        ]
      },
      {
        id: 'c2', subject: 'Admissions updates', student: 's-amen', parts: ['u-hana', 'u-tigist'], msgs: [
          { from: 'u-hana', t: "Amen's JHU supplement looks strong. Comments are in the doc.", time: '9:12 AM' },
          { from: 'u-tigist', t: 'Thank you! When is the next session?', time: '9:30 AM' },
          { from: 'u-hana', t: 'Thursday at 6 PM — we will finalize the supplement.', time: '9:34 AM' }
        ]
      },
      {
        id: 'c3', subject: 'Saron — algebra', student: 's-saron', parts: ['u-josh', 'u-tigist'], msgs: [
          { from: 'u-josh', t: 'Saron did great today — 90% on the quiz!', time: 'Yesterday' },
          { from: 'u-tigist', t: 'Wonderful news, thank you.', time: 'Yesterday' }
        ]
      },
      {
        id: 'c4', subject: 'Liya — scheduling', student: 's-liya', parts: ['u-beth', 'u-sara'], msgs: [
          { from: 'u-sara', t: 'Could we move Liya to 4:30 next week?', time: '8:40 AM' },
          { from: 'u-beth', t: 'Sure, 4:30 Tuesday works.', time: '8:52 AM' },
          { from: 'u-beth', t: 'Actually just text me at 301-555-9999 so we can sort it off the app.', time: '8:55 AM', flag: ['phone', 'external_platform'] }
        ]
      }
    ],
    invoices: [
      { id: 'i1', parent: 'u-tigist', period: 'November 2026', amount: 48000, status: 'paid' },
      { id: 'i2', parent: 'u-sara', period: 'November 2026', amount: 36000, status: 'open' }
    ],
    payments: {
      'u-tigist': [['November tuition', 'Nov 1', '$480'], ['October tuition', 'Oct 1', '$480'], ['September tuition', 'Sep 1', '$480']]
    },
    payouts: [
      { id: 'po1', tutor: 'u-beth', period: 'November', amount: 157500, sessions: 35 },
      { id: 'po2', tutor: 'u-josh', period: 'November', amount: 72000, sessions: 16 },
      { id: 'po3', tutor: 'u-hana', period: 'November', amount: 90000, sessions: 18 }
    ]
  };
}

export function scan(body) {
  const f = [];
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(body)) f.push('email');
  if (/\+?\d[\d\s().-]{8,}\d/.test(body)) f.push('phone');
  if (/venmo|cash ?app|zelle|paypal|\$[a-z0-9]{2,}/i.test(body)) f.push('payment_handle');
  if (/whats ?app|telegram|signal|text me|call me|off the app|pay me directly/i.test(body)) f.push('external_platform');
  return f;
}

export function redact(body) {
  return body
    .replace(/\+?\d[\d\s().-]{8,}\d/g, '[contact removed]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[contact removed]');
}
