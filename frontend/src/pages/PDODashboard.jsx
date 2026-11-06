import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/dates';
import TrackBar from '../components/TrackBar';
import StatsBar from '../components/StatsBar';
import Tag from '../components/Tag';
import Loading from '../components/Loading';
import Empty from '../components/Empty';

export default function PDODashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('over');
  const [rtis, setRtis] = useState([]);
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        client.get('/rti/panchayat'),
        client.get('/rti/stats'),
      ]);
      setRtis(r.data.data.rtis);
      setStats(s.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const nudge = async (id) => {
    try {
      await client.post(`/rti/${id}/nudge`);
      setMsg('Reminder sent to clerk.');
      load();
    } catch (ex) {
      setMsg(ex.response?.data?.message || 'Failed');
    }
  };

  const open = rtis.filter((r) => r.status === 'open');
  const attention = open.filter((r) => r.daysLeft != null && r.daysLeft <= 5);

  return (
    <main>
      <h2>PDO dashboard · {user?.panchayatName}</h2>
      {msg && <div className="flash">{msg}</div>}

      <div className="tabs">
        <button className={tab === 'over' ? 'pri' : ''} onClick={() => setTab('over')}>Overview</button>
        <button className={tab === 'rec' ? 'pri' : ''} onClick={() => setTab('rec')}>Records</button>
      </div>

      {loading && <Loading />}

      {!loading && tab === 'over' && (
        <>
          <StatsBar stats={stats} />
          <div className="box">
            <h3>Needs attention (≤ 5 days or overdue)</h3>
            {attention.length === 0 ? (
              <p>Nothing is close to lapsing. Good work.</p>
            ) : (
              <ul style={{ marginTop: 8 }}>
                {attention.map((r) => (
                  <li key={r.id} style={{ marginBottom: 6 }}>
                    <b>{r.id}</b> · {r.subject} ·{' '}
                    {r.daysLeft >= 0 ? `${r.daysLeft} days left` : `${-r.daysLeft} days overdue`}
                    {r.nudge ? (
                      <span className="mut"> · clerk reminded</span>
                    ) : (
                      <>
                        {' · '}
                        <button onClick={() => nudge(r._id)}>Remind clerk</button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <h3>Open requests</h3>
          {open.length === 0 && <Empty icon="✅">No open requests.</Empty>}
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
            </div>
          ))}
        </>
      )}

      {!loading && tab === 'rec' && (
        <div className="box">
          <h3>All records · {user?.panchayatName}</h3>
          <p className="mut" style={{ marginBottom: 12 }}>
            {rtis.length} requests · Access limited to PDO and clerks of this panchayat.
          </p>
          <div className="sc">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Citizen</th>
                  <th>Subject</th>
                  <th>Submitted</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Days</th>
                </tr>
              </thead>
              <tbody>
                {rtis.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.citizenName}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.subject}</td>
                    <td>{formatDate(r.filedAt)}</td>
                    <td>{formatDate(r.dueAt)}</td>
                    <td><Tag label={r.zone?.label} color={r.zone?.color} /></td>
                    <td>
                      {r.status === 'replied' ? r.daysTaken : r.daysLeft != null ? r.daysLeft : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
