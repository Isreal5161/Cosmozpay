import { useMemo } from 'react';
import { mockData } from '../data/mockData';

function DashboardPage() {
  const { metrics, dailyAnalytics, weeklyAnalytics, monthlyAnalytics, profitSummary } = mockData.dashboard;
  const totalProfit = useMemo(
    () => profitSummary.reduce((sum, summary) => sum + summary.totalProfit, 0),
    [profitSummary]
  );

  return (
    <div>
      <h1 className="page-heading">Dashboard Overview</h1>

      {/* Key Metrics Grid */}
      <section className="panel panel-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="panel-card">
            <p className="panel-title">{metric.label}</p>
            <p className="panel-value">{metric.value}</p>
            <p style={{ margin: '4px 0', fontSize: '12px', color: metric.trend === 'up' ? '#10b981' : '#ef4444' }}>
              {metric.change} ({metric.trend === 'up' ? '↑' : '↓'})
            </p>
          </div>
        ))}
      </section>

      {/* Profit Cards Section */}
      <section className="panel">
        <h2 className="section-title">Profit Summary</h2>
        <div className="panel-grid">
          <div className="panel-card" style={{ gridColumn: 'span 2' }}>
            <p className="panel-title">Total Profit</p>
            <p className="panel-value">₦{totalProfit.toLocaleString()}</p>
            <p style={{ marginTop: 8, color: '#6b7280' }}>Combined profit across data, awoof, gift cards, electricity, and exam pins.</p>
          </div>
          {profitSummary.map((summary) => (
            <div key={summary.category} className="panel-card">
              <p className="panel-title">{summary.category}</p>
              <p className="panel-value">₦{summary.totalProfit.toLocaleString()}</p>
              <div style={{ marginTop: 10, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                {summary.providerProfits.map((item) => (
                  <div key={item.provider}>{item.provider}: ₦{item.profit.toLocaleString()}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Daily Analytics</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>New Users</th>
              <th>Revenue</th>
              <th>Transactions</th>
            </tr>
          </thead>
          <tbody>
            {dailyAnalytics.map((day) => (
              <tr key={day.date}>
                <td>{day.date}</td>
                <td>{day.users}</td>
                <td>₦{day.revenue.toLocaleString()}</td>
                <td>{day.transactions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 className="section-title">Weekly Analytics</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Week</th>
              <th>Users</th>
              <th>Revenue</th>
              <th>Transactions</th>
            </tr>
          </thead>
          <tbody>
            {weeklyAnalytics.map((week) => (
              <tr key={week.week}>
                <td>{week.week}</td>
                <td>{week.users}</td>
                <td>₦{week.revenue.toLocaleString()}</td>
                <td>{week.transactions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 className="section-title">Monthly Analytics</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Users</th>
              <th>Revenue</th>
              <th>Transactions</th>
            </tr>
          </thead>
          <tbody>
            {monthlyAnalytics.map((month) => (
              <tr key={month.month}>
                <td>{month.month}</td>
                <td>{month.users}</td>
                <td>₦{month.revenue.toLocaleString()}</td>
                <td>{month.transactions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default DashboardPage;
