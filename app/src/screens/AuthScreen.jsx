import { useEffect, useState } from 'react';
import { ROLE_META } from '../lib/utils.js';

function AuthScreen({ visible, authMode, signupRole, onSwitchMode, onPickRole, onLogin, onSignup, onClose, onDemoLogin, demoAccounts, authError, modeNote }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    setEmail('');
    setPassword('');
    setName('');
  }, [authMode]);

  return (
    <div id="screen-auth" className={`screen ${visible ? 'on' : ''}`}>
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-xl rounded-[28px] bg-white p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-600 text-white">Y</div>
            <div>
              <div className="text-xl font-semibold text-slate-900">Yakal Portal</div>
              <div className="text-sm text-slate-500">Welcome back to the portal.</div>
            </div>
            <button className="ml-auto text-2xl text-slate-400" onClick={onClose}>&times;</button>
          </div>
          <div className="flex overflow-hidden rounded-full border border-slate-200 bg-slate-100 p-1">
            <button className={`flex-1 rounded-full py-3 text-sm font-semibold ${authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`} onClick={() => onSwitchMode('login')}>Log in</button>
            <button className={`flex-1 rounded-full py-3 text-sm font-semibold ${authMode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`} onClick={() => onSwitchMode('signup')}>Sign up</button>
          </div>
          {authError ? <div className="mt-5 rounded-2xl bg-pink-50 p-4 text-sm font-semibold text-pink-700">{authError}</div> : null}
          <div className="mt-6">
            {authMode === 'login' ? (
              <div className="space-y-5">
                <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
                {typeof onLogin === 'function' ? null : null}
                <button className="w-full rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white" onClick={() => onLogin(email, password)}>Log in</button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {Object.keys(ROLE_META).map((r) => (
                    <button key={r} className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${signupRole === r ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600'}`} onClick={() => onPickRole(r)}>{ROLE_META[r].label}</button>
                  ))}
                </div>
                <Field label="Full name" value={name} onChange={setName} placeholder="Your name" />
                <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@email.com" />
                <button className="w-full rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white" onClick={() => onSignup(name, email, password)}>Create account</button>
              </div>
            )}
          </div>
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
            <div className="mb-3 font-semibold">Or explore instantly with a demo account</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {demoAccounts.map((account) => (
                <button key={account.id} className="flex items-center gap-3 rounded-3xl bg-white px-4 py-3 text-left shadow-sm transition hover:bg-slate-100" onClick={() => onDemoLogin(account.id)}>
                  <div className={`${account.color} grid h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-white`}>{ account.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() }</div>
                  <div>
                    <div className="font-semibold text-slate-900">{account.name}</div>
                    <div className="text-xs text-slate-500">{account.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-slate-500">{modeNote}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      <div className="mb-2">{label}</div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
    </label>
  );
}

export default AuthScreen;
