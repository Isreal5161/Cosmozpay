import { mockData } from '../data/mockData';

function SecurityPage() {
  const { security } = mockData;

  return (
    <div>
      <h1 className="page-heading">Security</h1>

      <section className="panel panel-grid">
        <div className="panel-card">
          <p className="panel-title">2FA Enabled</p>
          <p className="panel-value">{security.twoFactorStatus.enabled}</p>
        </div>
        <div className="panel-card">
          <p className="panel-title">2FA Disabled</p>
          <p className="panel-value">{security.twoFactorStatus.disabled}</p>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Login Attempts ({security.loginAttempts.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Attempt</th>
              <th>IP Address</th>
              <th>Reason</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {security.loginAttempts.map((log, idx) => (
              <tr key={idx}>
                <td>{log.user}</td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: log.attempt === 'Success' ? '#d1fae5' : '#fee2e2', fontSize: '12px' }}>{log.attempt}</span></td>
                <td>{log.ip}</td>
                <td>{log.reason}</td>
                <td>{log.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 className="section-title">Device Management ({security.deviceManagement.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Device</th>
              <th>Last Active</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {security.deviceManagement.map((device, idx) => (
              <tr key={idx}>
                <td>User-{device.userId}</td>
                <td>{device.device}</td>
                <td>{device.lastActive}</td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: device.status === 'Active' ? '#d1fae5' : '#f3f4f6', fontSize: '12px' }}>{device.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default SecurityPage;
