import { useCallback, useEffect, useState } from 'react';
import {
  fetchAdminDashboard,
  parseDashboardData,
  type AnalyticsBucket,
  type AnalyticsPeriod,
  type DashboardMetricName,
  type DashboardDataView,
} from '../services/adminDashboard';

function DashboardPage() {
  const [data, setData] = useState<DashboardDataView | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setIssues([]);
    try {
      const parsed = parseDashboardData(await fetchAdminDashboard());
      setData(parsed.data);
      setIssues(parsed.issues);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const formatCount = (value: number | undefined) =>
    value === undefined ? 'Unavailable' : value.toLocaleString();
  const formatAmount = (currency: string, amount: string) => `${currency} ${amount}`;
  const unavailableReason = (reason: string | undefined) =>
    reason ?? 'An unavailability reason was not provided.';

  const renderTrend = (metric: DashboardMetricName) => {
    const comparison = data?.metrics?.period_comparison?.[metric];
    if (
      !comparison ||
      comparison.change === null ||
      comparison.current_period === null ||
      comparison.previous_period === null
    ) {
      const reason = comparison?.unavailable_reason?.trim();
      return (
        <span style={{ color: '#6b7280' }}>
          Trend: — (Unavailable{reason ? `: ${reason}` : ' (no comparable period)'})
        </span>
      );
    }

    const change = comparison.change;
    const direction = change > 0 ? '↑' : change < 0 ? '↓' : '→';
    const amount = change > 0 ? `+${change.toLocaleString()}` : change.toLocaleString();
    const color = change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280';
    return <span style={{ color }}>Trend: {direction} {amount}</span>;
  };

  const renderVolume = (volumes: Array<{ currency: string; amount: string }>) =>
    volumes.length
      ? volumes.map((volume) => formatAmount(volume.currency, volume.amount)).join(', ')
      : 'No transaction volume recorded';

  const renderAnalytics = (period: AnalyticsPeriod, title: string) => {
    const rows = data?.analytics?.[period];
    return (
      <section className="panel" key={period}>
        <h2 className="section-title">{title}</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Registrations</th>
                <th>Transactions</th>
                <th>Volume by currency</th>
              </tr>
            </thead>
            <tbody>
              {rows?.length ? rows.map((row: AnalyticsBucket) => (
                <tr key={row.bucket}>
                  <td>{row.bucket}</td>
                  <td>{formatCount(row.registrations)}</td>
                  <td>{formatCount(row.transactions)}</td>
                  <td>{renderVolume(row.transaction_volume)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} style={{ color: '#6b7280' }}>
                    {rows ? 'No analytics available for this period.' : 'Analytics data unavailable.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const metricCards = [
    ['Total Users', 'total_users', data?.metrics?.total_users],
    ['Active Users Today', 'active_users_today', data?.metrics?.active_users_today],
    ['New Registrations Today', 'new_registrations_today', data?.metrics?.new_registrations_today],
    ['Total Transactions', 'total_transactions', data?.metrics?.total_transactions],
    ['Pending Transactions', 'pending_transactions', data?.metrics?.pending_transactions],
    ['Failed Transactions', 'failed_transactions', data?.metrics?.failed_transactions],
  ] as const;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <h1 className="page-heading" style={{ margin: 0 }}>Dashboard Overview</h1>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          style={{
            border: '1px solid #d1d5db',
            borderRadius: 8,
            padding: '9px 14px',
            background: loading ? '#f3f4f6' : '#ffffff',
            color: '#374151',
            font: 'inherit',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Loading…' : 'Retry'}
        </button>
      </div>

      {error && (
        <div role="alert" className="panel" style={{ color: '#b91c1c' }}>
          <strong>Dashboard could not be loaded.</strong>
          <p style={{ margin: '8px 0 0' }}>{error}</p>
        </div>
      )}
      {!error && loading && <p role="status" aria-live="polite">Loading dashboard data…</p>}
      {!error && !loading && issues.length > 0 && (
        <div role="status" className="panel" style={{ color: '#92400e' }}>
          Dashboard data is partial. Some values are unavailable because the response is incomplete or invalid.
        </div>
      )}

      <section className="panel panel-grid">
        {metricCards.map(([label, metric, value]) => (
          <div key={label} className="panel-card">
            <p className="panel-title">{label}</p>
            <p className="panel-value">{loading ? 'Loading…' : formatCount(value)}</p>
            <p style={{ margin: '4px 0', fontSize: 12 }}>
              {loading ? <span style={{ color: '#6b7280' }}>Trend: — (Unavailable)</span> : renderTrend(metric)}
            </p>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2 className="section-title">Wallet Balances</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr><th>Currency</th><th>Ledger Balance</th><th>Available Balance</th><th>Locked Balance</th></tr>
            </thead>
            <tbody>
              {data?.wallet_balances?.length ? data.wallet_balances.map((wallet, index) => (
                <tr key={`${wallet.currency}-${index}`}>
                  <td>{wallet.currency}</td>
                  <td>{formatAmount(wallet.currency, wallet.ledger_balance)}</td>
                  <td>{formatAmount(wallet.currency, wallet.available_balance)}</td>
                  <td>{formatAmount(wallet.currency, wallet.locked_balance)}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} style={{ color: '#6b7280' }}>
                  {data?.wallet_balances ? 'No wallet balances available.' : 'Wallet balances unavailable.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Transaction Volume by Currency</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>Currency</th><th>Transaction Volume</th></tr></thead>
            <tbody>
              {data?.transaction_volume?.length ? data.transaction_volume.map((volume, index) => (
                <tr key={`${volume.currency}-${index}`}>
                  <td>{volume.currency}</td>
                  <td>{formatAmount(volume.currency, volume.amount)}</td>
                </tr>
              )) : (
                <tr><td colSpan={2} style={{ color: '#6b7280' }}>
                  {data?.transaction_volume ? 'No transaction volume available.' : 'Transaction volume unavailable.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Financial Metrics</h2>
        <div className="panel-grid">
          <div className="panel-card">
            <p className="panel-title">Revenue</p>
            <p className="panel-value">
              {data?.financial_metrics?.revenue === null ? 'Unavailable' : '—'}
            </p>
            <p style={{ marginTop: 8, color: '#6b7280' }}>
              {unavailableReason(data?.financial_metrics?.revenue_unavailable_reason)}
            </p>
          </div>
          <div className="panel-card">
            <p className="panel-title">Profit</p>
            <p className="panel-value">
              {data?.financial_metrics?.profit === null ? 'Unavailable' : '—'}
            </p>
            <p style={{ marginTop: 8, color: '#6b7280' }}>
              {unavailableReason(data?.financial_metrics?.profit_unavailable_reason)}
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Category and Provider Transaction Volume</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr><th>Category</th><th>Provider</th><th>Currency</th><th>Transactions</th><th>Volume</th></tr>
            </thead>
            <tbody>
              {data?.category_breakdown?.length ? data.category_breakdown.map((item, index) => (
                <tr key={`${item.category}-${item.provider ?? 'all'}-${item.currency}-${index}`}>
                  <td>{item.category}</td>
                  <td>{item.provider ?? '—'}</td>
                  <td>{item.currency}</td>
                  <td>{formatCount(item.transaction_count)}</td>
                  <td>{formatAmount(item.currency, item.transaction_volume)}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ color: '#6b7280' }}>
                  {data?.category_breakdown ? 'No category volume available.' : 'Category volume unavailable.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {renderAnalytics('daily', 'Daily Analytics')}
      {renderAnalytics('weekly', 'Weekly Analytics')}
      {renderAnalytics('monthly', 'Monthly Analytics')}
    </div>
  );
}

export default DashboardPage;
