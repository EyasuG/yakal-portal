import { seed, scan, redact } from './seed.js';

export const SUPABASE_URL = 'https://kgttkhbqeyvupikgozfu.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtndHRraGJxZXl2dXBpa2dvemZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NTUzOTAsImV4cCI6MjA5ODAzMTM5MH0.fLAWA5WyU3UMoRvucBcXSWPgiDRZUDGh1s2U1Eu6g1I';
export const USE_SUPABASE = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

function safeJsonParse(value) {
  try { return JSON.parse(value); } catch (e) { return null; }
}

export function LocalDriver() {
  let S, me = null;
  try { const saved = localStorage.getItem('yakal_demo'); S = saved ? safeJsonParse(saved) || seed() : seed(); } catch (e) { S = seed(); }
  const save = () => { try { localStorage.setItem('yakal_demo', JSON.stringify(S)); } catch (e) {} };
  const prof = id => S.profiles.find(p => p.id === id);
  const name = id => (prof(id) || {}).full_name || 'Yakal';
  const myKids = () => S.guardianships.filter(g => g.parent === me.id).map(g => S.students.find(s => s.id === g.student));
  const isParentOf = sid => S.guardianships.some(g => g.parent === me.id && g.student === sid);
  const isTutorOf = sid => { const s = S.students.find(x => x.id === sid); return s && s.tutor === me.id; };
  const canSee = sid => me.role === 'admin' || isParentOf(sid) || isTutorOf(sid) || (S.students.find(s => s.id === sid) || {}).user_id === me.id;
  const studentOfUser = () => S.students.find(s => s.user_id === me.id);
  const convVisible = c => me.role === 'admin' || c.parts.includes(me.id) || (c.student && isParentOf(c.student));

  return {
    mode: 'demo',
    async signUp({ email, full_name, role, program }) {
      if (S.profiles.some(p => p.email === email)) throw new Error('An account with that email already exists.');
      const id = 'u-' + Math.random().toString(36).slice(2, 8);
      const p = { id, role, full_name, email, phone: '', metadata: program ? { interested_program: program } : {} };
      S.profiles.push(p);
      if (role === 'tutor') S.tutors[id] = { rating: 5.0, rate: 40, payout: 0, accepting: true, subjects: [] };
      me = p;
      save();
      return p;
    },
    async signIn({ email }) {
      const p = S.profiles.find(x => x.email === email);
      if (!p) throw new Error('No account found for that email. Try a demo account below.');
      me = p;
      return p;
    },
    async signInDemo(id) { me = prof(id); return me; },
    async signOut() { me = null; },
    me() { return me; },
    name,
    async adminOverview() {
      const openInv = S.invoices.filter(i => i.status !== 'paid').reduce((a, i) => a + i.amount, 0);
      return {
        students: S.students.length,
        tutors: Object.keys(S.tutors).length,
        active: S.students.filter(s => s.status !== 'alert').length,
        revenue: S.invoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0),
        outstanding: openInv,
        flags: S.conversations.flatMap(c => c.msgs.filter(m => m.flag)).length
      };
    },
    async listStudents() {
      return S.students.filter(s => canSee(s.id)).map(s => ({ ...s, tutorName: name(s.tutor), programs: s.programs || [] }));
    },
    async bookableStudents() { return this.listStudents(); },
    async bookSession({ student_id }) { return 'demo-' + student_id; },
    async listTutors() {
      return Object.entries(S.tutors).map(([id, t]) => ({ id, name: name(id), ...t, students: S.students.filter(s => s.tutor === id).length }));
    },
    async listParents() {
      return S.profiles.filter(p => p.role === 'parent').map(p => ({ ...p, kids: S.guardianships.filter(g => g.parent === p.id).map(g => name((S.students.find(s => s.id === g.student) || {}).user_id) || (S.students.find(s => s.id === g.student) || {}).name) }));
    },
    async adminFlags() {
      const out = [];
      S.conversations.forEach(c => c.msgs.forEach(m => { if (m.flag) out.push({ who: name(m.from), student: (S.students.find(s => s.id === c.student) || {}).name, reasons: m.flag, excerpt: m.t, time: m.time }); }));
      return out;
    },
    async tutorRisk() {
      const map = {};
      S.conversations.forEach(c => c.msgs.forEach(m => { if (m.flag && prof(m.from)?.role === 'tutor') { map[m.from] = (map[m.from] || 0) + 1; } }));
      return Object.entries(map).map(([id, n]) => ({ name: name(id), flags: n }));
    },
    async studentHome() {
      const s = studentOfUser();
      return {
        student: s,
        progress: S.progress[s.id] || [],
        homework: S.homework[s.id] || [],
        application: S.applications[s.id],
        tutorName: name(s.tutor),
        nextSession: { sessionId: 'demo-' + s.id, meetingUrl: s.meetingUrl || null }
      };
    },
    async ensureMeeting(sessionId) { return 'https://zoom.us/j/' + encodeURIComponent(sessionId); },
    async studentSessions() {
      const s = studentOfUser();
      const next = { sessionId: 'demo-' + s.id, subject: s.subjects[0], when: s.next, tutor: name(s.tutor), mode: s.mode, meetingUrl: s.meetingUrl || null };
      return {
        next,
        upcoming: [next],
        past: (S.sessionsPast[s.id] || []).map(p => [p[0], name(p[1]), p[2]])
      };
    },
    async toggleHomework(i) {
      const s = studentOfUser();
      if (S.homework[s.id] && S.homework[s.id][i]) {
        S.homework[s.id][i].done = !S.homework[s.id][i].done;
        save();
      }
    },
    async toggleAppItem(kind, i) {
      const s = studentOfUser();
      const a = S.applications[s.id];
      if (!a) return;
      if (kind === 'e') a.essays[i][1] = !a.essays[i][1];
      else a.tasks[i][1] = !a.tasks[i][1];
      save();
    },
    async parentChildren() {
      return myKids().map(s => ({ ...s, tutorName: name(s.tutor) }));
    },
    async childDetail(sid) {
      if (!canSee(sid)) throw new Error('Not authorized');
      const s = S.students.find(x => x.id === sid);
      return {
        ...s,
        tutorName: name(s.tutor),
        progress: S.progress[sid] || [],
        past: (S.sessionsPast[sid] || []).map(p => [p[0], name(p[1]), p[2]])
      };
    },
    async parentBilling() {
      const inv = S.invoices.find(i => i.parent === me.id);
      return { invoice: inv, history: S.payments[me.id] || [], kids: myKids().length };
    },
    async tutorHome() {
      const t = S.tutors[me.id];
      const mine = S.students.filter(s => s.tutor === me.id);
      return {
        tutor: t,
        students: mine.map(s => ({ ...s, parentName: name((S.guardianships.find(g => g.student === s.id) || {}).parent) })),
        today: mine.filter(s => s.next.includes('Today')),
        nextSession: { sessionId: 'demo-tutor-' + me.id, meetingUrl: null }
      };
    },
    async tutorStudents() {
      return S.students.filter(s => s.tutor === me.id).map(s => ({ ...s, parentName: name((S.guardianships.find(g => g.student === s.id) || {}).parent) }));
    },
    async tutorEarnings() {
      const t = S.tutors[me.id];
      return { payout: t.payout, rate: t.rate, students: S.students.filter(s => s.tutor === me.id).length, history: [['October payout', 'Oct 31', '$1,420'], ['September payout', 'Sep 30', '$1,260']] };
    },
    async toggleAvailability() {
      S.tutors[me.id].accepting = !S.tutors[me.id].accepting;
      save();
      return S.tutors[me.id].accepting;
    },
    async conversations() {
      return S.conversations.filter(convVisible).map(c => ({
        id: c.id,
        subject: c.subject,
        student: (S.students.find(s => s.id === c.student) || {}).name,
        withName: name(c.parts.find(p => p !== me.id) || c.parts[0]),
        last: c.msgs[c.msgs.length - 1],
        monitor: !c.parts.includes(me.id)
      }));
    },
    async messages(cid) {
      const c = S.conversations.find(x => x.id === cid);
      if (!convVisible(c)) throw new Error('Not authorized');
      return {
        subject: c.subject,
        withName: name(c.parts.find(p => p !== me.id) || c.parts[0]),
        readOnly: !c.parts.includes(me.id),
        msgs: c.msgs.map(m => ({
          me: m.from === me.id,
          who: name(m.from),
          t: m.flag ? redact(m.t) : m.t,
          time: m.time,
          flag: m.flag,
          raw: m.t
        }))
      };
    },
    async sendMessage(cid, body) {
      const c = S.conversations.find(x => x.id === cid);
      const flags = scan(body);
      const m = { from: me.id, t: body, time: 'Now' };
      if (flags.length) m.flag = flags;
      c.msgs.push(m);
      save();
      return flags;
    }
  };
}

export async function SupabaseDriver() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let prof = null;

  async function loadProfile() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    const { data } = await sb.from('profiles').select('*').eq('id', user.id).single();
    prof = data;
    return data;
  }

  await loadProfile();

  return {
    mode: 'live',
    async signUp({ email, password, full_name, role, program }) {
      const meta = { full_name, role };
      if (program) meta.program = program;
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: meta } });
      if (error) throw new Error(error.message);
      await loadProfile();
      return prof;
    },
    async signIn({ email, password }) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      await loadProfile();
      return prof;
    },
    async signInDemo() { throw new Error('Demo accounts are only available in demo mode.'); },
    async signOut() { await sb.auth.signOut(); prof = null; },
    me() { return prof; },
    name() { return prof?.full_name || 'Yakal'; },
    async adminOverview() {
      const [st, tu, inv] = await Promise.all([
        sb.from('students').select('id', { count: 'exact', head: true }),
        sb.from('tutor_profiles').select('profile_id', { count: 'exact', head: true }),
        sb.from('invoices').select('amount_cents,status')
      ]);
      const paid = (inv.data || []).filter(i => i.status === 'paid').reduce((a, i) => a + i.amount_cents, 0);
      const out = (inv.data || []).filter(i => i.status !== 'paid').reduce((a, i) => a + i.amount_cents, 0);
      const { count: flags } = await sb.from('message_flags').select('id', { count: 'exact', head: true });
      return { students: st.count, tutors: tu.count, active: st.count, revenue: paid, outstanding: out, flags: flags || 0 };
    },
    async listStudents() {
      const { data } = await sb.from('students').select('id,first_name,last_name,grade,status');
      const ids = (data || []).map(s => s.id);
      const progs = {};
      if (ids.length) {
        const { data: en } = await sb.from('enrollments').select('student_id,program').in('student_id', ids);
        (en || []).forEach(r => { (progs[r.student_id] = progs[r.student_id] || []).push(r.program); });
      }
      return (data || []).map(s => ({ id: s.id, name: `${s.first_name} ${s.last_name}`, grade: s.grade, status: 'ok', tutorName: '', progress: 0, subjects: [], next: '', mode: '', programs: progs[s.id] || [] }));
    },
    // Students the current user may book a session with (RLS-scoped roster).
    async bookableStudents() { return this.listStudents(); },
    async bookSession({ student_id, start, end, mode, program, sessionType }) {
      const isTutor = prof.role === 'tutor';
      const row = {
        org_id: prof.org_id, student_id, staff_id: prof.id,
        tutor_id: (program === 'tutoring' && isTutor) ? prof.id : null,
        scheduled_start: start, scheduled_end: end,
        mode, program, session_type: (program === 'tutoring' ? (sessionType || 'individual') : 'individual'),
        status: 'scheduled', created_by: prof.id
      };
      const { data, error } = await sb.from('sessions').insert(row).select('id').single();
      if (error) throw new Error(error.message);
      return data.id;
    },
    async listTutors() {
      const { data } = await sb.from('tutor_profiles').select('profile_id,rating,hourly_rate,accepting,profiles(full_name)');
      return (data || []).map(t => ({ id: t.profile_id, name: t.profiles?.full_name, rating: t.rating, rate: t.hourly_rate, payout: 0, accepting: t.accepting, subjects: [], students: 0 }));
    },
    async listParents() {
      const { data } = await sb.from('profiles').select('id,full_name,email').eq('role', 'parent');
      return (data || []).map(p => ({ ...p, kids: [] }));
    },
    async adminFlags() {
      const { data } = await sb.from('message_flags').select('kind,excerpt,created_at,profiles(full_name)').order('created_at', { ascending: false });
      return (data || []).map(f => ({ who: f.profiles?.full_name, reasons: [f.kind], excerpt: f.excerpt, time: new Date(f.created_at).toLocaleDateString() }));
    },
    async tutorRisk() {
      const { data } = await sb.from('admin_tutor_risk').select('*').gt('open_flags', 0);
      return (data || []).map(r => ({ name: r.full_name, flags: r.open_flags }));
    },
    async studentHome() {
      const { data: s } = await sb.from('students').select('*').limit(1).single();
      const [pr, hw, ap, ns] = await Promise.all([
        sb.from('progress_snapshots').select('percent,subjects(name)').eq('student_id', s.id),
        sb.from('homework').select('*').eq('student_id', s.id),
        sb.from('applications').select('*').eq('student_id', s.id).limit(1).maybeSingle(),
        sb.from('sessions').select('id,mode,meeting_url,scheduled_start').eq('student_id', s.id).gte('scheduled_start', new Date().toISOString()).order('scheduled_start', { ascending: true }).limit(1).maybeSingle()
      ]);
      const nx = ns.data;
      return {
        student: { id: s.id, name: `${s.first_name} ${s.last_name}`, grade: s.grade, subjects: [], next: nx ? new Date(nx.scheduled_start).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : '', mode: nx && nx.mode === 'in_person' ? 'In person' : 'Online' },
        progress: (pr.data || []).map(p => [p.subjects?.name || 'Subject', p.percent]),
        homework: (hw.data || []).map(h => ({ t: h.title, c: '', d: h.due_date || '', done: h.status === 'graded' })),
        application: ap.data,
        tutorName: '',
        nextSession: nx ? { sessionId: nx.id, meetingUrl: nx.meeting_url } : null
      };
    },
    async ensureMeeting(sessionId) {
      const { data, error } = await sb.functions.invoke('zoom-create-meeting', { body: { session_id: sessionId } });
      if (error) throw new Error(error.message);
      if (data && data.error) throw new Error(data.error);
      return data?.join_url;
    },
    async studentSessions() {
      const { data: s } = await sb.from('students').select('id,first_name').limit(1).single();
      const { data } = await sb.from('sessions').select('id,mode,status,meeting_url,scheduled_start,subjects(name)').eq('student_id', s.id).order('scheduled_start', { ascending: true });
      const now = Date.now();
      const fmt = (d) => new Date(d).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      const upcoming = (data || []).filter(x => new Date(x.scheduled_start).getTime() >= now && x.status !== 'canceled')
        .map(x => ({ sessionId: x.id, subject: x.subjects?.name || 'Session', when: fmt(x.scheduled_start), mode: x.mode === 'in_person' ? 'In person' : 'Online', meetingUrl: x.meeting_url }));
      const past = (data || []).filter(x => x.status === 'completed').map(x => [x.subjects?.name || 'Session', '', new Date(x.scheduled_start).toLocaleDateString()]);
      return { next: upcoming[0] || null, upcoming, past };
    },
    async toggleHomework() {},
    async toggleAppItem() {},
    async parentChildren() {
      const { data } = await sb.from('students').select('*');
      return (data || []).map(s => ({ id: s.id, name: `${s.first_name} ${s.last_name}`, grade: s.grade, status: 'ok', progress: 0, subjects: [], next: '', mode: '', tutorName: '' }));
    },
    async childDetail(sid) {
      const { data: s } = await sb.from('students').select('*').eq('id', sid).single();
      const { data: pr } = await sb.from('progress_snapshots').select('percent,subjects(name)').eq('student_id', sid);
      return { id: s.id, name: `${s.first_name} ${s.last_name}`, grade: s.grade, status: 'ok', progress: (pr || []).map(p => [p.subjects?.name || 'Subject', p.percent]), subjects: [], next: '', mode: '', tutorName: '', past: [] };
    },
    async parentBilling() {
      const { data } = await sb.from('invoices').select('*').order('created_at', { ascending: false });
      const inv = (data || [])[0];
      return { invoice: inv ? { period: inv.period, amount: inv.amount_cents, status: inv.status } : null, history: (data || []).filter(i => i.status === 'paid').map(i => [i.period, '', `$${(i.amount_cents / 100).toFixed(0)}`]), kids: 0 };
    },
    async tutorHome() {
      const { data: tp } = await sb.from('tutor_profiles').select('*').eq('profile_id', prof.id).single();
      const { data: asg } = await sb.from('tutoring_assignments').select('students(id,first_name,last_name,grade)').eq('tutor_id', prof.id).eq('status', 'active');
      const students = (asg || []).map(a => ({ id: a.students.id, name: `${a.students.first_name} ${a.students.last_name}`, grade: a.students.grade, status: 'ok', progress: 0, subjects: [], next: '', mode: '', parentName: '' }));
      const { data: nx } = await sb.from('sessions').select('id,mode,meeting_url,scheduled_start,students(first_name,last_name)').eq('tutor_id', prof.id).gte('scheduled_start', new Date().toISOString()).order('scheduled_start', { ascending: true }).limit(1).maybeSingle();
      return { tutor: { rating: tp.rating, rate: tp.hourly_rate, accepting: tp.accepting, payout: 0 }, students, today: [], nextSession: nx ? { sessionId: nx.id, meetingUrl: nx.meeting_url } : null };
    },
    async tutorStudents() { return (await this.tutorHome()).students; },
    async tutorEarnings() {
      const { data } = await sb.from('payouts').select('*').eq('tutor_id', prof.id).order('created_at', { ascending: false });
      const cur = (data || [])[0];
      return { payout: cur ? cur.amount_cents : 0, rate: 0, students: 0, history: (data || []).slice(1).map(p => [p.period, '', `$${(p.amount_cents / 100).toFixed(0)}`]) };
    },
    async toggleAvailability() {
      const { data: cur } = await sb.from('tutor_profiles').select('accepting').eq('profile_id', prof.id).single();
      await sb.from('tutor_profiles').update({ accepting: !cur.accepting }).eq('profile_id', prof.id);
      return !cur.accepting;
    },
    async conversations() {
      const { data } = await sb.from('conversations').select('id,subject,student_id,messages(body,created_at,sender_id,flagged)').order('created_at', { ascending: false });
      return (data || []).map(c => { const last = (c.messages || []).slice(-1)[0] || {}; return { id: c.id, subject: c.subject, student: '', withName: '', last: { from: last.sender_id, t: last.body, time: last.created_at ? new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '' }, monitor: false }; });
    },
    async messages(cid) {
      const { data } = await sb.from('messages').select('*,profiles(full_name)').eq('conversation_id', cid).order('created_at');
      return { subject: '', withName: '', readOnly: false, msgs: (data || []).map(m => ({ me: m.sender_id === prof.id, who: m.profiles?.full_name, t: m.redacted_body || m.body, time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), flag: m.flagged ? m.flag_reasons : null })) };
    },
    async sendMessage(cid, body) {
      const { error } = await sb.from('messages').insert({ conversation_id: cid, sender_id: prof.id, body });
      if (error) throw new Error(error.message);
      return scan(body);
    }
  };
}
