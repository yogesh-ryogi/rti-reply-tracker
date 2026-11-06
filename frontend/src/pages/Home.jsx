import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/dates';
import Tag from '../components/Tag';
import Loading from '../components/Loading';
import Empty from '../components/Empty';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    setLoading(true);
    client
      .get('/schemes', { params: { filter } })
      .then((res) => setSchemes(res.data.data.schemes))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  const dashPath =
    user?.role === 'citizen' ? '/citizen' : user?.role === 'clerk' ? '/clerk' : user?.role === 'pdo' ? '/pdo' : null;

  return (
    <main>
      <h1>Notifications</h1>
      <p className="lead">
        {user
          ? 'Alerts for your account and new schemes issued by the government.'
          : 'New schemes issued by the government. Use the menu (☰ top left) to sign up or log in.'}
      </p>

      {user && (
        <div className="box">
          <h3>Your alerts</h3>
          <p>Open your dashboard to see RTI deadlines, payment requests, and application updates.</p>
          {dashPath && (
            <p style={{ marginTop: 12 }}>
              <button className="pri" onClick={() => navigate(dashPath)}>
                Open my dashboard →
              </button>
            </p>
          )}
        </div>
      )}

      <h3>New government schemes</h3>
      <p className="mut" style={{ margin: '0 0 10px', fontSize: 13.5 }}>
        Sample schemes for the demo. Real schemes would come from government notifications.
      </p>

      <div className="filter-bar">
        {[
          ['all', 'All'],
          ['open', 'Open'],
          ['soon', 'Closing soon'],
          ['closed', 'Closed'],
        ].map(([v, label]) => (
          <button key={v} className={filter === v ? 'pri' : ''} onClick={() => setFilter(v)}>
            {label}
          </button>
        ))}
      </div>

      {loading && <Loading text="Loading schemes…" />}
      {!loading && schemes.length === 0 && <Empty icon="📋">No schemes match this filter.</Empty>}

      {schemes.map((s) => (
        <div className="box" key={s.id}>
          <div className="top">
            <span style={{ fontWeight: 600, fontSize: 15 }}>
              {s.name}
              {s.isNew && <Tag label="NEW" color="ac" />}
              {' '}
              <Tag label={s.level} color="mut" />
            </span>
            <Tag label={s.status} color={s.statusColor} />
          </div>
          <p style={{ marginTop: 8, color: 'var(--fg)', fontSize: 14 }}>{s.summary}</p>
          <div className="top mut" style={{ marginTop: 8, fontSize: 13 }}>
            <span>
              Issued {formatDate(s.issuedAt)} · Last date <b style={{ color: 'var(--fg)' }}>{formatDate(s.deadline)}</b>
            </span>
            <span>
              {s.daysLeft < 0
                ? `Closed ${-s.daysLeft}d ago`
                : s.daysLeft === 0
                  ? 'Closes today'
                  : `${s.daysLeft}d left`}
            </span>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => setOpenId(openId === s.id ? null : s.id)}>
              {openId === s.id ? 'Hide details' : 'View details'}
            </button>
            {s.daysLeft < 0 ? (
              <span className="mut" style={{ fontSize: 13 }}>Applications closed</span>
            ) : !user ? (
              <button className="pri" onClick={() => navigate('/login?role=citizen')}>
                Login to apply
              </button>
            ) : user.role !== 'citizen' ? (
              <span className="mut" style={{ fontSize: 13 }}>Only citizens can apply</span>
            ) : (
              <button className="pri" onClick={() => navigate('/citizen')}>
                Apply on dashboard
              </button>
            )}
          </div>
          {openId === s.id && (
            <ul style={{ marginTop: 12 }}>
              <li><b>Benefit:</b> {s.benefit}</li>
              <li><b>Who can apply:</b> {s.eligibility}</li>
              <li><b>Documents needed:</b> {s.documents}</li>
              <li><b>How to apply:</b> {s.howToApply}</li>
              <li><b>Last date:</b> {formatDate(s.deadline)} ({s.status})</li>
            </ul>
          )}
        </div>
      ))}
    </main>
  );
}
