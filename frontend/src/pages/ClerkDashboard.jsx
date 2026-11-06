import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate, rupees } from '../utils/dates';
import TrackBar from '../components/TrackBar';
import StatsBar from '../components/StatsBar';
import Tag from '../components/Tag';
import Loading from '../components/Loading';
import Empty from '../components/Empty';

export default function ClerkDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('over');
  const [rtis, setRtis] = useState([]);
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [r, a, s] = await Promise.all([
        client.get('/rti/panchayat'),
        client.get('/applications/panchayat'),
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

  const flash = (ok, text) => {
    if (ok) { setMsg(text); setErr(''); }
    else { setErr(text); setMsg(''); }
  };

  const reply = async (id, text) => {
    try {
      await client.post(`/rti/${id}/reply`, { replyText: text });
      flash(true, 'Reply sent successfully.');
      load();
    } catch (ex) {
      flash(false, ex.response?.data?.message || 'Failed');
    }
  };

  const updateStatus = async (id, status, remark) => {
    try {
      await client.patch(`/applications/${id}/status`, { status, remark });
      flash(true, `Status updated to ${status}.`);
      load();
    } catch (ex) {
      flash(false, ex.response?.data?.message || 'Failed');
    }
  };

  const requestPay = async (id, amount, reason, days) => {
    try {
      await client.post(`/applications/${id}/request-payment`, { amount, reason, days });
      flash(true, 'Payment requested.');
      load();
    } catch (ex) {
      flash(false, ex.response?.data?.message || 'Failed');
    }
  };

  const complete = async (id, replyText) => {
    try {
      await client.post(`/applications/${id}/complete`, { reply: replyText });
      flash(true, 'Application completed.');
      load();
    } catch (ex) {
      flash(false, ex.response?.data?.message || 'Failed');
    }
  };

  const open = rtis.filter((r) => r.status === 'open');
  const pendingApps = apps.filter((a) => a.status === 'Submitted' || a.status === 'Payment received').length;
  const myHistory = rtis.filter((r) => r.status === 'replied');

  return (
    <main>
      <h2>Clerk dashboard · {user?.panchayatName}</h2>
      {msg && <div className="flash">{msg}</div>}
      {err && <div className="flash err">{err}</div>}

      <div className="tabs">
        <button className={tab === 'over' ? 'pri' : ''} onClick={() => setTab('over')}>Requests</button>
        <button className={tab === 'apps' ? 'pri' : ''} onClick={() => setTab('apps')}>
          Applications{pendingApps ? ` (${pendingApps})` : ''}
        </button>
        <button className={tab === 'his' ? 'pri' : ''} onClick={() => setTab('his')}>History</button>
      </div>

      {loading && <Loading />}

      {!loading && tab === 'over' && (
        <>
          <StatsBar stats={stats} />
          {open.length === 0 && <Empty icon="✅">No open requests. You're all caught up.</Empty>}
          {open.map((r) => (
            <div className="row" key={r.id}>
              <div className="top">
                <span><b>{r.id}</b> · {r.subject}</span>
                <Tag label={r.zone?.label} color={r.zone?.color} />
              </div>
              <TrackBar filedAt={r.filedAt} dueAt={r.dueAt} status={r.status} />
              <div className="top mut" style={{ fontSize: 13 }}>
                <span>{r.citizenName} · filed {formatDate(r.filedAt)} · due {formatDate(r.dueAt)}</span>
                <span>{r.daysLeft >= 0 ? `${r.daysLeft} days left` : `${-r.daysLeft} days overdue`}</span>
              </div>
              {r.nudge && <p className="nudge">⚠ Reminder from PDO: please reply to this request.</p>}
              <form onSubmit={(e) => { e.preventDefault(); reply(r._id, e.target.t.value); e.target.reset(); }}>
                <input name="t" placeholder="Type the reply to the citizen" required style={{ flex: 2 }} />
                <button className="pri">Send reply</button>
              </form>
            </div>
          ))}
        </>
      )}

      {!loading && tab === 'apps' && (
        <>
          <p className="lead">Scheme applications for {user?.panchayatName}. Update status, request payment, or complete after payment.</p>
          {apps.length === 0 && <Empty icon="📄">No applications yet.</Empty>}
          {apps.map((a) => (
            <div className="row" key={a.id}>
              <div className="top">
                <span>
                  <b>{a.id}</b> · {a.schemeName}{' '}
                  <Tag label={a.schemeLevel} color="mut" />
                </span>
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
                <span>{a.citizenName}{a.citizenPhone ? ` · ${a.citizenPhone}` : ''} · {a.citizenEmail}</span>
                <span>Applied {formatDate(a.filedAt)}</span>
              </div>
              {a.note && <p className="rp">Citizen note: {a.note}</p>}
              {a.payment && (
                <p className="rp">
                  {a.payment.paid
                    ? `✓ Paid ${rupees(a.payment.amount)} · ${a.payment.txnId}`
                    : `Payment: ${rupees(a.payment.amount)} for ${a.payment.reason}. Due ${formatDate(a.payment.dueAt)}`}
                </p>
              )}
              <ul style={{ marginTop: 8, fontSize: 13 }}>
                {(a.log || []).map((e, i) => (
                  <li key={i}><b>{formatDate(e.date)}</b> · {e.text}</li>
                ))}
              </ul>

              {a.status === 'Payment received' && (
                <form onSubmit={(e) => { e.preventDefault(); complete(a._id, e.target.rp.value); }}>
                  <input name="rp" placeholder="Reply / sanction details" required style={{ flex: 2 }} />
                  <button className="pri">Complete and reply</button>
                </form>
              )}
              {(a.status === 'Submitted' || a.status === 'Under review') && (
                <>
                  <p className="section-label">Update status</p>
                  <form onSubmit={(e) => { e.preventDefault(); updateStatus(a._id, e.target.st.value, e.target.rm.value); }}>
                    <select name="st">
                      <option>Under review</option>
                      <option>Approved</option>
                      <option>Rejected</option>
                    </select>
                    <input name="rm" placeholder="Remark (optional)" />
                    <button className="pri">Update</button>
                  </form>
                  <p className="section-label">Request payment</p>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    requestPay(a._id, e.target.amt.value, e.target.why.value, e.target.days.value);
                  }}>
                    <input name="amt" type="number" min="1" placeholder="Amount (₹)" required />
                    <input name="why" placeholder="Reason" required />
                    <input name="days" type="number" min="1" defaultValue="7" title="Days to pay" required style={{ maxWidth: 80 }} />
                    <button className="pri">Request payment</button>
                  </form>
                </>
              )}
            </div>
          ))}
        </>
      )}

      {!loading && tab === 'his' && (
        <div className="box">
          <h3>History · {user?.name}</h3>
          <p className="mut" style={{ marginBottom: 12 }}>RTIs you have replied to.</p>
          {myHistory.length === 0 && <Empty icon="📂">No solved requests yet.</Empty>}
          {myHistory.map((r) => (
            <div className="row" key={r.id}>
              <div className="top">
                <span><b>{r.id}</b> · {r.subject}</span>
                <span className="mut">{formatDate(r.repliedAt)}</span>
              </div>
              <p className="rp">{r.replyText}</p>
              <div className="mut" style={{ fontSize: 12.5, marginTop: 4 }}>
                {r.citizenName} · took {r.daysTaken} days
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
