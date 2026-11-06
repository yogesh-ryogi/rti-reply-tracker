import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate, PANCHAYATS, rupees } from '../utils/dates';
import TrackBar from '../components/TrackBar';
import StatsBar from '../components/StatsBar';
import Tag from '../components/Tag';
import Loading from '../components/Loading';
import Empty from '../components/Empty';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [rtis, setRtis] = useState([]);
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState(null);
  const [subject, setSubject] = useState('');
  const [panchayat, setPanchayat] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [r, a, s] = await Promise.all([
        client.get('/rti/mine'),
        client.get('/applications/mine'),
        client.get('/rti/stats'),
      ]);
      setRtis(r.data.data.rtis);
      setApps(a.data.data.applications);
      setStats(s.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fileRTI = async (e) => {
    e.preventDefault();
    setMsg(''); setErr(''); setBusy(true);
    try {
      await client.post('/rti', { panchayat, subject });
      setSubject(''); setPanchayat('');
      setMsg('RTI request filed successfully. The 30-day clock has started.');
      load();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Failed to file');
    } finally {
      setBusy(false);
    }
  };

  const pay = async (id, method) => {
    setMsg(''); setErr('');
    try {
      const res = await client.post(`/applications/${id}/pay`, { method });
      setMsg(res.data.message);
      load();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Payment failed');
    }
  };

  const ini = (user?.name || 'C').split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();

  return (
    <main>
      <h2>Citizen dashboard</h2>
      {msg && <div className="flash">{msg}</div>}
      {err && <div className="flash err">{err}</div>}

      <div className="box prof">
        <div className="av">{ini}</div>
        <div>
          <h3 style={{ margin: 0 }}>{user?.name}</h3>
          <p style={{ margin: '2px 0', fontSize: 13.5 }}>
            {user?.email}{user?.phone ? ` · ${user.phone}` : ''}
          </p>
          <p className="mut" style={{ fontSize: 13 }}>Citizen · Member since {formatDate(user?.joinedAt)}</p>
        </div>
        {stats && (
          <div className="pc">
            <div><b>{stats.total}</b>Filed</div>
            <div><b>{stats.open}</b>Open</div>
            <div><b>{stats.replied}</b>Replied</div>
          </div>
        )}
      </div>

      <div className="box">
        <h3>File a new RTI request</h3>
        <form onSubmit={fileRTI}>
          <select value={panchayat} onChange={(e) => setPanchayat(e.target.value)} required>
            <option value="">1. Select panchayat</option>
            {PANCHAYATS.map((p) => (
              <option key={p.key} value={p.key}>{p.name}</option>
            ))}
          </select>
          <input
            placeholder="2. What information do you need?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <button className="pri" disabled={busy}>{busy ? 'Submitting…' : 'Submit request'}</button>
        </form>
        <p style={{ marginTop: 10 }}>The 30-day deadline starts when you submit. Only the clerk and PDO of the chosen panchayat can see the request.</p>
      </div>

      <h3>My scheme applications</h3>
      {apps.length === 0 && <Empty icon="📄">No scheme applications yet. Open Home to browse schemes.</Empty>}
      {apps.map((a) => (
        <div className="row" key={a.id}>
          <div className="top">
            <span><b>{a.id}</b> · {a.schemeName}</span>
            <Tag
              label={a.status}
              color={
                a.status === 'Approved' ? 'ok' :
                a.status === 'Rejected' ? 'bad' :
                a.status === 'Payment requested' ? 'crit' :
                a.status === 'Payment received' ? 'ac' : 'warn'
              }
            />
          </div>
          <div className="top mut" style={{ marginTop: 6, fontSize: 13 }}>
            <span>{a.panchayatName} · applied {formatDate(a.filedAt)}</span>
          </div>
          {a.payment && (
            <p className="rp">
              {a.payment.paid
                ? `✓ Paid ${rupees(a.payment.amount)} for ${a.payment.reason} on ${formatDate(a.payment.paidAt)} via ${a.payment.method} (${a.payment.txnId})`
                : `Payment requested: ${rupees(a.payment.amount)} for ${a.payment.reason}. Pay by ${formatDate(a.payment.dueAt)}`}
            </p>
          )}
          {a.status === 'Payment requested' && (
            <form onSubmit={(e) => { e.preventDefault(); pay(a._id, e.target.mth.value); }}>
              <select name="mth">
                <option>UPI</option>
                <option>Debit card</option>
                <option>Net banking</option>
              </select>
              <button className="pri">Pay {rupees(a.payment.amount)} (demo)</button>
            </form>
          )}
          {a.status === 'Approved' && a.reply && (
            <p className="rp"><b>Reply:</b> {a.reply}{a.sanctionRef ? ` · Ref ${a.sanctionRef}` : ''}</p>
          )}
        </div>
      ))}

      <h3>My RTI requests</h3>
      {loading && <Loading />}
      {!loading && rtis.length === 0 && <Empty icon="📬">No RTI requests yet. File one above.</Empty>}
      {rtis.map((r) => (
        <div className="row" key={r.id}>
          <div className="top">
            <span><b>{r.id}</b> · {r.subject}</span>
            <Tag label={r.zone?.label} color={r.zone?.color} />
          </div>
          <TrackBar filedAt={r.filedAt} dueAt={r.dueAt} status={r.status} />
          <div className="top mut" style={{ fontSize: 13 }}>
            <span>{r.panchayatName} · filed {formatDate(r.filedAt)} · due {formatDate(r.dueAt)}</span>
            <span>
              {r.status === 'replied'
                ? `Replied ${formatDate(r.repliedAt)}${r.repliedByName ? ` by ${r.repliedByName}` : ''}`
                : r.daysLeft >= 0 ? `${r.daysLeft} days left` : `${-r.daysLeft} days overdue`}
            </span>
          </div>
          {r.replyText && <p className="rp"><b>Reply:</b> {r.replyText}</p>}
        </div>
      ))}
    </main>
  );
}
