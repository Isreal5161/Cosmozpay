import { mockData } from '../data/mockData';

function ReportsPage() {
  const { reports } = mockData;

  return (
    <div>
      <h1 className="page-heading">Reports & Analytics</h1>

      <section className="panel">
        <h2 className="section-title">User Growth</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Total Users</th>
              <th>New Users</th>
            </tr>
          </thead>
          <tbody>
            {reports.userGrowth.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{row.total}</td>
                <td>{row.new}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 className="section-title">Transaction Trends</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Successful</th>
              <th>Failed</th>
            </tr>
          </thead>
          <tbody>
            {reports.transactionTrends.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{row.successful}</td>
                <td>{row.failed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 className="section-title">Revenue Analytics</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Revenue</th>
              <th>Fees</th>
            </tr>
          </thead>
          <tbody>
            {reports.revenueAnalytics.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>₦{row.revenue.toLocaleString()}</td>
                <td>₦{row.fees.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default ReportsPage;
