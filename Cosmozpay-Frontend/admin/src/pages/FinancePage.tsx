import { mockData } from '../data/mockData';

function FinancePage() {
  const { finance } = mockData;

  return (
    <div>
      <h1 className="page-heading">Revenue & Finance</h1>
      <section className="panel panel-grid">
        <div className="panel-card">
          <p className="panel-title">Company Earnings</p>
          <p className="panel-value">₦{finance.companyEarnings.toLocaleString()}</p>
        </div>
        <div className="panel-card">
          <p className="panel-title">Fees Collected</p>
          <p className="panel-value">₦{finance.feesCollected.toLocaleString()}</p>
        </div>
        <div className="panel-card">
          <p className="panel-title">Commissions</p>
          <p className="panel-value">₦{finance.commissionsReceived.toLocaleString()}</p>
        </div>
        <div className="panel-card">
          <p className="panel-title">Profit</p>
          <p className="panel-value">₦{finance.profit.toLocaleString()}</p>
        </div>
        <div className="panel-card">
          <p className="panel-title">Taxes</p>
          <p className="panel-value">₦{finance.taxes.toLocaleString()}</p>
        </div>
        <div className="panel-card">
          <p className="panel-title">Scheduled Payout</p>
          <p className="panel-value">₦{finance.payoutScheduled.toLocaleString()}</p>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Financial Reports</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Earnings</th>
              <th>Fees</th>
              <th>Commissions</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {finance.reports.map((report) => (
              <tr key={report.period}>
                <td>{report.period}</td>
                <td>₦{report.earnings.toLocaleString()}</td>
                <td>₦{report.fees.toLocaleString()}</td>
                <td>₦{report.commissions.toLocaleString()}</td>
                <td>₦{report.profit.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default FinancePage;
