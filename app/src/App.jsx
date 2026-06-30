import { useEffect, useRef, useState } from 'react';
import { LocalDriver, SupabaseDriver, USE_SUPABASE } from './db.js';
import HomeScreen from './screens/HomeScreen.jsx';
import AuthScreen from './screens/AuthScreen.jsx';
import AppShell from './screens/AppShell.jsx';
import Sheet from './components/Sheet.jsx';
import Toast from './components/Toast.jsx';

const DEMO_ACCOUNTS = [
  { id: 'u-almaz', name: 'Almaz T.', role: 'Administrator', color: 'bg-slate-900' },
  { id: 'u-tigist', name: 'Tigist Worku', role: 'Parent', color: 'bg-pink-500' },
  { id: 'u-amen', name: 'Amen Worku', role: 'Student', color: 'bg-teal-600' },
  { id: 'u-beth', name: 'Bethlehem A.', role: 'Tutor', color: 'bg-amber-600' }
];

const NAV = {
  admin: [['overview', 'Home', 'grid'], ['students', 'Students', 'student'], ['tutors', 'Tutors', 'tutor'], ['msg', 'Messages', 'chat'], ['trust', 'Trust', 'shield']],
  student: [['shome', 'Home', 'grid'], ['ssessions', 'Sessions', 'cal'], ['college', 'College', 'cap'], ['sadm', 'My App', 'cap'], ['msg', 'Messages', 'chat']],
  parent: [['phome', 'Home', 'grid'], ['pkids', 'Children', 'student'], ['college', 'College', 'cap'], ['msg', 'Messages', 'chat'], ['pbill', 'Billing', 'wallet']],
  tutor: [['thome', 'Today', 'grid'], ['tstudents', 'Students', 'student'], ['tearn', 'Earnings', 'wallet'], ['msg', 'Messages', 'chat']]
};

function App() {
  const initialDb = !USE_SUPABASE ? LocalDriver() : null;
  const initialUser = initialDb?.me() || null;
  const [db, setDb] = useState(initialDb);
  const [user, setUser] = useState(initialUser);
  const [screen, setScreen] = useState('home');
  const [authMode, setAuthMode] = useState('login');
  const [signupRole, setSignupRole] = useState('student');
  const [authError, setAuthError] = useState('');
  const [modeNote, setModeNote] = useState('');
  const [role, setRole] = useState(initialUser?.role || 'admin');
  const [realRole, setRealRole] = useState(initialUser?.role || 'admin');
  const [previewing, setPreviewing] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [viewVersion, setViewVersion] = useState(0);
  const [sheetData, setSheetData] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeout = useRef(null);

  useEffect(() => {
    if (!USE_SUPABASE) {
      window.DB = initialDb;
      return;
    }

    async function init() {
      const driver = await SupabaseDriver();
      window.DB = driver;
      setDb(driver);

      const current = driver.me();
      if (current) {
        setUser(current);
        setRole(current.role);
        setRealRole(current.role);
        enterApp(current, driver);
      }
    }

    init();
  }, []);

  useEffect(() => {
    window.go = go;
    window.demoLogin = demoLogin;
    window.logout = logout;
    window.openConvo = openConvo;
    window.openChild = openChild;
    window.openTutorStudent = openTutorStudent;
    window.openSheet = openSheet;
    window.preview = preview;
    window.exitPreview = exitPreview;
    window.openAuth = openAuth;
    window.toast = toast;
    window.openMeeting = openMeeting;
    window.createRoom = createRoom;
    window.openSwitch = openSwitch;
    window.sendMsg = sendMsg;
  });

  const currentNav = NAV[role] || NAV.admin;

  function openAuth(mode, roleChoice) {
    if (roleChoice) {
      setSignupRole(roleChoice);
      mode = 'signup';
    }
    setScreen('auth');
    setAuthMode(mode);
    setAuthError('');
    setModeNote(USE_SUPABASE ? 'Connected to Supabase · live mode' : 'Running in demo mode · no backend required');
  }

  function goHome() {
    setScreen('home');
    setSheetData(null);
  }

  function enterApp(profile, driver = db) {
    const userProfile = profile || driver?.me();
    if (!userProfile) return;

    setUser(userProfile);
    setRole(userProfile.role);
    setRealRole(userProfile.role);
    setPreviewing(false);
    setScreen('app');
    setActiveView(NAV[userProfile.role][0][0]);
    setViewVersion((v) => v + 1);
    setSheetData(null);
  }

  function go(view) {
    setActiveView(view);
    setViewVersion((v) => v + 1);
    setSheetData(null);
  }

  function toast(message) {
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    setToastMessage(message);
    toastTimeout.current = setTimeout(() => setToastMessage(''), 2200);
  }

  async function demoLogin(id) {
    if (!db) return;

    if (USE_SUPABASE) {
      const creds = {
        'u-almaz': 'almaz@yakal.me',
        'u-tigist': 'tigist@email.com',
        'u-amen': 'amen@email.com',
        'u-beth': 'beth@yakal.me'
      };

      try {
        await db.signIn({ email: creds[id], password: 'demo-password' });
        enterApp(null, db);
      } catch (error) {
        setAuthError('Seed the demo users first (see the integration guide).');
      }
      return;
    }

    const profile = await db.signInDemo(id);
    setUser(profile);
    setRole(profile.role);
    setRealRole(profile.role);
    enterApp(profile, db);
  }

  async function doLogin(email, password) {
    if (!db) return;
    try {
      if (!email) return setAuthError('Enter your email.');
      await db.signIn({ email, password });
      enterApp(null, db);
    } catch (error) {
      setAuthError(error.message);
    }
  }

  async function doSignup(fullName, email, password) {
    if (!db) return;
    try {
      if (!fullName || !email) return setAuthError('Name and email are required.');
      if (USE_SUPABASE && password.length < 6) return setAuthError('Password must be at least 6 characters.');
      await db.signUp({ full_name: fullName, email, password, role: signupRole });
      toast('Welcome to Yakal!');
      enterApp(null, db);
    } catch (error) {
      setAuthError(error.message);
    }
  }

  async function logout() {
    await db?.signOut();
    setUser(null);
    setPreviewing(false);
    setRole('admin');
    setRealRole('admin');
    setScreen('home');
    setSheetData(null);
  }

  async function openConvo(cid) {
    const conversation = await db.messages(cid);
    setSheetData({ type: 'conversation', conversation, cid });
  }

  async function sendMsg(cid, body) {
    if (!body?.trim()) {
      body = document.getElementById('msgIn')?.value;
    }
    if (!body?.trim()) return;
    const flags = await db.sendMessage(cid, body);
    if (flags && flags.length) toast('Contact info was hidden & flagged');
    await openConvo(cid);
  }

  async function createRoom(sessionId) {
    try {
      toast('Creating video room…');
      const url = await db.ensureMeeting(sessionId);
      if (url) {
        openMeeting(url);
        toast('Video room ready');
      }
    } catch (error) {
      toast(error.message || 'Could not create the video room');
    }
  }

  function openMeeting(url) {
    if (url) window.open(url, '_blank', 'noopener');
  }

  function openSheet(data) {
    setSheetData(data);
  }

  async function openChild(id) {
    if (!db) return;
    const profile = await db.childDetail(id).catch(() => null);
    if (profile) {
      setSheetData({ type: 'profile', profile });
    }
  }

  async function openTutorStudent(id) {
    if (!db) return;
    const profile = await db.childDetail(id).catch(() => null);
    if (profile) {
      setSheetData({ type: 'profile', profile });
    }
  }

  async function preview(r) {
    setPreviewing(true);
    setRole(r);
    setActiveView(NAV[r][0][0]);
    setSheetData(null);
    if (db?.mode === 'demo') {
      const rep = { student: 'u-amen', parent: 'u-tigist', tutor: 'u-beth' }[r];
      if (rep) {
        const profile = await db.signInDemo(rep);
        setUser(profile);
      }
    }
  }

  async function exitPreview() {
    if (db?.mode === 'demo') {
      const profile = await db.signInDemo('u-almaz');
      setUser(profile);
    }
    setPreviewing(false);
    setRole(realRole);
    setActiveView(NAV[realRole][0][0]);
    setSheetData(null);
  }

  function openSwitch() {
    setSheetData({ type: 'switch' });
  }

  function scrollToId(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  const mainKey = `${activeView}-${viewVersion}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HomeScreen visible={screen === 'home'} onOpenAuth={openAuth} onScroll={scrollToId} />
      <AuthScreen
        visible={screen === 'auth'}
        authMode={authMode}
        signupRole={signupRole}
        onSwitchMode={setAuthMode}
        onPickRole={setSignupRole}
        onLogin={doLogin}
        onSignup={doSignup}
        onClose={goHome}
        onDemoLogin={demoLogin}
        demoAccounts={DEMO_ACCOUNTS}
        authError={authError}
        modeNote={modeNote}
      />
      <AppShell
        visible={screen === 'app'}
        user={user}
        role={role}
        previewing={previewing}
        activeView={activeView}
        navItems={currentNav}
        onNavigate={go}
        onLogout={logout}
        onOpenSwitch={openSwitch}
        mainKey={mainKey}
        viewVersion={viewVersion}
        onRefresh={() => setViewVersion((v) => v + 1)}
        db={db}
      />
      <Sheet
        data={sheetData}
        onClose={() => setSheetData(null)}
        onSend={sendMsg}
        onPreview={preview}
        onExitPreview={exitPreview}
        role={role}
      />
      <Toast message={toastMessage} />
    </div>
  );
}

export default App;
