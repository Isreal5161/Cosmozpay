import { mockData } from '../data/mockData';

function MonitoringPage() {
  const { monitoring } = mockData;

  return (
    <div>
      <h1 className="page-heading">System Monitoring</h1>

      <section className="panel panel-grid">
        <div className="panel-card">
          <p className="panel-title">System Status</p>
          <p style={{ fontSize: '16px', color: monitoring.serverStatus.status === 'Healthy' ? '#10b981' : '#ef4444' }}>
            {monitoring.serverStatus.status === 'Healthy' ? '✓ Healthy' : '✗ Issues'}
          </p>
          <p style={{ fontSize: '12px', margin: '8px 0 0' }}>CPU: {monitoring.serverStatus.cpu}% | Memory: {monitoring.serverStatus.memory}%</p>
        </div>
        <div className="panel-card">
          <p className="panel-title">Database</p>
          <p style={{ fontSize: '16px', color: monitoring.databaseHealth.status === 'Healthy' ? '#10b981' : '#ef4444' }}>
            {monitoring.databaseHealth.status === 'Healthy' ? '✓ Healthy' : '✗ Issues'}
          </p>
          <p style={{ fontSize: '12px', margin: '8px 0 0' }}>{monitoring.databaseHealth.connections}/{monitoring.databaseHealth.maxConnections} connections</p>
        </div>
        <div className="panel-card">
          <p className="panel-title">Uptime</p>
          <p className="panel-value" style={{ fontSize: '20px' }}>{monitoring.uptime}%</p>
        </div>
        <div className="panel-card">
          <p className="panel-title">Payment Gateway</p>
          <p style={{ fontSize: '16px', color: monitoring.paymentGatewayStatus.status === 'Operational' ? '#10b981' : '#ef4444' }}>
            {monitoring.paymentGatewayStatus.status === 'Operational' ? '✓ Operational' : '✗ Down'}
          </p>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Queue Status ({monitoring.queueStatus.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Queue</th>
              <th>Pending</th>
              <th>Processing</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {monitoring.queueStatus.map((queue, idx) => (
              <tr key={idx}>
                <td>{queue.queue}</td>
                <td>{queue.pending}</td>
                <td>{queue.processing}</td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: queue.status === 'Normal' ? '#d1fae5' : '#fef3c7', fontSize: '12px' }}>{queue.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 className="section-title">Error Logs ({monitoring.errorLogs.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Error</th>
              <th>Severity</th>
              <th>Resolved</th>
            </tr>
          </thead>
          <tbody>
            {monitoring.errorLogs.map((log, idx) => (
              <tr key={idx}>
                <td>{log.timestamp}</td>
                <td>{log.error}</td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: log.severity === 'Critical' ? '#fee2e2' : '#fef3c7', fontSize: '12px' }}>{log.severity}</span></td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: log.resolved ? '#d1fae5' : '#f3f4f6', fontSize: '12px' }}>{log.resolved ? 'Yes' : 'No'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default MonitoringPage;
