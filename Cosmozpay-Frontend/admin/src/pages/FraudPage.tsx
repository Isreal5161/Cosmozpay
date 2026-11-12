import { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  fetchAdminFraud,
  reviewFraudSignal,
  type AdminFraudData,
  type FraudFilters,
  type FraudReviewAction,
  type FraudSignal,
} from '../services/adminFraud';

const riskBadgeStyle = (riskLevel: string) => {
  const level = riskLevel.toUpperCase();
  const color = level === 'CRITICAL' ? '#b91c1c' : level === 'HIGH' ? '#dc2626' : level === 'MEDIUM' ? '#d97706' : '#15803d';
  const background = level === 'CRITICAL' ? '#fee2e2' : level === 'HIGH' ? '#fef2f2' : level === 'MEDIUM' ? '#fef3c7' : '#dcfce7';
  return { background, color, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700, display: 'inline-block' };
};

const initialFilters: FraudFilters = { page: 1, page_size: 20, search: '', status: '', risk_level: '', event_type: '' };

function actionsFor(signal: FraudSignal): FraudReviewAction[] {
  const state = signal.investigation?.state ?? 'open';
  if (state === 'open') return ['review', 'dismiss', 'escalate'];
  if (state === 'in_review') return ['dismiss', 'escalate', 'resolve'];
  if (state === 'escalated') return ['review', 'dismiss', 'resolve'];
  return [];
}

function FraudPage() {
  const { admin } = useAdminAuth();
  const role = (admin?.role ?? '').trim().toLowerCase().replace(/ /g, '_');
  const canReview = role === 'admin' || role === 'super_admin';
  const [data, setData] = useState<AdminFraudData | null>(null);
  const [filters, setFilters] = useState<FraudFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingSignal, setPendingSignal] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchAdminFraud(filters)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load fraud data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  function updateFilter<K extends keyof FraudFilters>(key: K, value: FraudFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  }

  async function handleReview(signal: FraudSignal, action: FraudReviewAction) {
    if (pendingSignal) return;
    const confirmed = window.confirm(`Confirm ${action.replace('_', ' ')} for this suspicious signal?`);
    if (!confirmed) return;

    setPendingSignal(signal.signal_id);
    setError(null);
    try {
      const result = await reviewFraudSignal({ signal_id: signal.signal_id, action });
      setData((current) => current && ({
        ...current,
        items: current.items.map((item) => item.signal_id === result.signal_id
          ? { ...item, investigation: result.investigation }
          : item),
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save the investigation decision.');
    } finally {
      setPendingSignal(null);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 className="page-heading" style={{ margin: 0 }}>Fraud & Risk Management</h1>
          <p style={{ color: '#6b7280', margin: '6px 0 0' }}>Suspicious signals are indicators for investigation, not confirmed fraud.</p>
        </div>
        <button type="button" onClick={refresh} disabled={loading}>Refresh</button>
      </div>

      <section className="panel" aria-label="Fraud filters">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <label>
            Search
            <input aria-label="Search signals" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} />
          </label>
          <label>
            Evidence status
            <input aria-label="Filter by status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} />
          </label>
          <label>
            Risk level
            <select aria-label="Filter by risk level" value={filters.risk_level} onChange={(event) => updateFilter('risk_level', event.target.value as FraudFilters['risk_level'])}>
              <option value="">All levels</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </label>
          <label>
            Event type
            <input aria-label="Filter by event type" value={filters.event_type} onChange={(event) => updateFilter('event_type', event.target.value)} />
          </label>
        </div>
      </section>

      {error && (
        <div className="panel" role="alert" style={{ color: '#b91c1c' }}>
          <strong>Fraud data could not be loaded or updated.</strong>
          <p style={{ margin: '8px 0' }}>{error}</p>
          <button type="button" onClick={refresh}>Retry</button>
        </div>
      )}
      {loading && <p role="status" aria-live="polite">Loading fraud data…</p>}

      {data && (
        <>
          <section className="panel panel-grid">
            <div className="panel-card"><p className="panel-title">Filtered Alerts</p><p className="panel-value">{data.summary.total_alerts}</p></div>
            <div className="panel-card"><p className="panel-title">Suspicious Transactions</p><p className="panel-value">{data.summary.suspicious_transactions}</p></div>
            <div className="panel-card"><p className="panel-title">Accounts with Failed Logins</p><p className="panel-value">{data.summary.accounts_with_failed_logins}</p></div>
            <div className="panel-card"><p className="panel-title">Account Security Signals</p><p className="panel-value">{data.summary.account_security_signals}</p></div>
            <div className="panel-card"><p className="panel-title">High-risk Accounts</p><p className="panel-value">{data.summary.high_risk_accounts}</p></div>
          </section>

          <section className="panel">
            <h2 className="section-title">Risk Distribution (filtered results)</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Object.entries(data.summary.risk_flags).map(([level, count]) => (
                <span key={level} style={riskBadgeStyle(level)}>{level}: {count}</span>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2 className="section-title">Investigation Signals</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr><th>Signal</th><th>User</th><th>Status</th><th>Risk</th><th>Evidence</th><th>Time</th><th>Investigation</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {data.items.map((signal) => {
                    const actions = canReview ? actionsFor(signal) : [];
                    return (
                      <tr key={signal.signal_id}>
                        <td>{signal.signal_type === 'transaction' ? signal.txn_id : 'Account security signal'}</td>
                        <td>{signal.user}</td>
                        <td>{signal.status}</td>
                        <td><span style={riskBadgeStyle(signal.risk_level)}>{signal.risk_level} ({signal.risk_score})</span></td>
                        <td>
                          <div>{signal.risk_reasons.join(' ')}</div>
                          {signal.amount && <div>Amount: {signal.amount}</div>}
                          {signal.failed_attempts !== null && <div>Failed attempts: {signal.failed_attempts}</div>}
                        </td>
                        <td>
                          <div>{signal.date_label === 'transaction_created' ? 'Transaction created' : 'Account record updated'}</div>
                          <small>{signal.date ? new Date(signal.date).toLocaleString() : '—'}</small>
                        </td>
                        <td>
                          {signal.investigation ? (
                            <>
                              <div>{signal.investigation.state}</div>
                              <small>Reviewed by {signal.investigation.reviewed_by_admin_id}</small>
                            </>
                          ) : 'Open'}
                        </td>
                        <td>
                          {actions.length ? actions.map((action) => (
                            <button
                              key={action}
                              type="button"
                              disabled={pendingSignal !== null}
                              onClick={() => void handleReview(signal, action)}
                              aria-label={`${action} ${signal.signal_id}`}
                            >
                              {pendingSignal === signal.signal_id ? 'Saving…' : action}
                            </button>
                          )) : canReview ? 'No further actions' : 'Read-only access'}
                        </td>
                      </tr>
                    );
                  })}
                  {!data.items.length && !loading && <tr><td colSpan={8}>No matching suspicious signals found.</td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span>Page {data.page} of {data.total_pages} ({data.total} signals)</span>
              <div>
                <button type="button" onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))} disabled={loading || data.page <= 1}>Previous</button>
                <button type="button" onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} disabled={loading || data.page >= data.total_pages}>Next</button>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2 className="section-title">Device Activity</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead><tr><th>User</th><th>Device</th><th>State</th><th>IP on this device record</th><th>Last seen / first seen</th></tr></thead>
                <tbody>
                  {data.device_history.map((row) => (
                    <tr key={row.id}><td>{row.user}</td><td>{row.device}</td><td>{row.status}</td><td>{row.ip_address ?? '—'}</td><td>{new Date(row.time).toLocaleString()}</td></tr>
                  ))}
                  {!data.device_history.length && <tr><td colSpan={5}>No device activity recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <h2 className="section-title">IP Activity</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead><tr><th>User</th><th>IP address</th><th>Last seen / first seen</th></tr></thead>
                <tbody>
                  {data.ip_history.map((row) => (
                    <tr key={row.id}><td>{row.user}</td><td>{row.ip ?? '—'}</td><td>{new Date(row.time).toLocaleString()}</td></tr>
                  ))}
                  {!data.ip_history.length && <tr><td colSpan={3}>No IP activity recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default FraudPage;
