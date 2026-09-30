import { mockData } from '../data/mockData';

function SettingsPage() {
  const settings = mockData.settings || {};
  const isEmpty = Object.keys(settings).length === 0;

  return (
    <div>
      <h1 className="page-heading">System Settings</h1>
      <section className="panel">
        <h2 className="section-title">Platform Configuration</h2>
        {isEmpty ? (
          <div>No Settings available at the moment</div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            <div className="panel-card">
              <p className="panel-title">Platform Name</p>
              <p>{settings.platformName}</p>
            </div>
            <div className="panel-card">
              <p className="panel-title">Transaction Limit</p>
              <p>₦{settings.transactionLimit?.toLocaleString?.()}</p>
            </div>
            <div className="panel-card">
              <p className="panel-title">Daily Limit</p>
              <p>₦{settings.dailyLimit?.toLocaleString?.()}</p>
            </div>
            <div className="panel-card">
              <p className="panel-title">Monthly Fee</p>
              <p>₦{settings.monthlyFee}</p>
            </div>
            <div className="panel-card">
              <p className="panel-title">Commission Rate</p>
              <p>{settings.commissionRate}%</p>
            </div>
            <div className="panel-card">
              <p className="panel-title">Payment Gateway</p>
              <p>{settings.paymentGateway}</p>
            </div>
            <div className="panel-card">
              <p className="panel-title">Maintenance Mode</p>
              <p><span style={{ padding: '4px 8px', borderRadius: '4px', background: settings.maintenanceMode ? '#fee2e2' : '#d1fae5', fontSize: '12px', color: settings.maintenanceMode ? '#991b1b' : '#065f46' }}>{settings.maintenanceMode ? 'Enabled' : 'Disabled'}</span></p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default SettingsPage;
