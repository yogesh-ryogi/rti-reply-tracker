import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PANCHAYATS } from '../utils/dates';

export default function Login() {
  const [params] = useSearchParams();
  const roleParam = params.get('role') || 'citizen';
  const modeParam = params.get('mode');
  const [role, setRole] = useState(roleParam);
  const [reg, setReg] = useState(modeParam === 'register');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [panchayat, setPanchayat] = useState('');
  const [clerks, setClerks] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const path = user.role === 'citizen' ? '/citizen' : user.role === 'clerk' ? '/clerk' : '/pdo';
      navigate(path, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (role === 'clerk' && panchayat) {
      client
        .get('/auth/clerks', { params: { panchayat } })
        .then((res) => setClerks(res.data.data.clerks))
        .catch(() => setClerks([]));
    } else setClerks([]);
  }, [role, panchayat]);

  const hint = () => {
    if (role === 'citizen') return 'Demo: ramesh@test.com / abc123  or  lakshmi@test.com / abc123';
    if (!panchayat)
      return role === 'clerk'
        ? 'Select a panchayat, then choose your email.'
        : 'Select your panchayat, then enter the PDO password.';
    if (role === 'pdo') {
      const map = { alpha: 'alphapdo123', beta: 'betapdo123', gamma: 'gammapdo123' };
      return `Demo password: ${map[panchayat]}`;
    }
    return 'Demo passwords: suresh123 (clerk.alpha), meena123 (clerk2.alpha), etc.';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (reg) {
        await register({ name, email, phone, password });
      } else {
        const payload = { password, role };
        if (role === 'pdo') payload.panchayat = panchayat;
        else {
          payload.email = email;
          if (role === 'clerk') payload.panchayat = panchayat;
        }
        await login(payload);
      }
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <button onClick={() => navigate('/')} style={{ marginBottom: 8 }}>← Back to home</button>
      <div className="narrow">
        <div className="box" style={{ marginBottom: 0 }}>
          <h2 style={{ marginBottom: 4 }}>
            {role.charAt(0).toUpperCase() + role.slice(1)} {reg ? 'registration' : 'login'}
          </h2>
          <p className="mut" style={{ marginBottom: 14, fontSize: 13.5 }}>
            {reg ? 'Create a citizen account to file RTIs and apply to schemes.' : 'Sign in to continue.'}
          </p>

          {reg ? (
            <form onSubmit={onSubmit}>
              <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              <input type="password" placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <button className="pri" disabled={busy}>{busy ? 'Please wait…' : 'Create account'}</button>
            </form>
          ) : (
            <form onSubmit={onSubmit}>
              {role !== 'citizen' && (
                <select value={panchayat} onChange={(e) => { setPanchayat(e.target.value); setEmail(''); }} required>
                  <option value="">Select your panchayat</option>
                  {PANCHAYATS.map((p) => (
                    <option key={p.key} value={p.key}>{p.name}</option>
                  ))}
                </select>
              )}
              {role === 'pdo' ? (
                <input type="password" placeholder="PDO password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              ) : role === 'clerk' ? (
                <select value={email} onChange={(e) => setEmail(e.target.value)} required>
                  <option value="">{panchayat ? 'Select your email' : 'Select a panchayat first'}</option>
                  {clerks.map((c) => (
                    <option key={c.email} value={c.email}>{c.email} ({c.name})</option>
                  ))}
                </select>
              ) : (
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              )}
              {role !== 'pdo' && (
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              )}
              <button className="pri" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
            </form>
          )}

          {err && <div className="flash err" style={{ marginTop: 12 }}>{err}</div>}
          <p className="mut" style={{ margin: '12px 0 0', fontSize: 12.5, lineHeight: 1.5 }}>{hint()}</p>

          {role === 'citizen' && (
            <p style={{ margin: '12px 0 0' }}>
              <button type="button" onClick={() => { setReg(!reg); setErr(''); }}>
                {reg ? '← Back to login' : 'New citizen? Register'}
              </button>
            </p>
          )}
        </div>

        <div className="role-picker">
          {['citizen', 'clerk', 'pdo'].map((r) => (
            <button
              key={r}
              className={role === r ? 'pri' : ''}
              onClick={() => { setRole(r); setReg(false); setErr(''); setPanchayat(''); setEmail(''); setPassword(''); }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
