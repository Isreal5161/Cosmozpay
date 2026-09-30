import { mockData } from '../data/mockData';

function ApiPage() {
  const { api } = mockData;

  return (
    <div>
      <h1 className="page-heading">API Management</h1>

      <section className="panel panel-grid">
        <div className="panel-card">
          <p className="panel-title">Today Requests</p>
          <p className="panel-value">{api.usage.today.toLocaleString()}</p>
        </div>
        <div className="panel-card">
          <p className="panel-title">This Month</p>
          <p className="panel-value">{(api.usage.thisMonth / 1000000).toFixed(1)}M</p>
        </div>
        <div className="panel-card">
          <p className="panel-title">Rate Limit</p>
          <p className="panel-value">{(api.usage.rateLimit / 1000000).toFixed(1)}M</p>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">API Keys ({api.keys.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Last Used</th>
              <th>Requests</th>
            </tr>
          </thead>
          <tbody>
            {api.keys.map((key) => (
              <tr key={key.id}>
                <td>{key.id}</td>
                <td>{key.name}</td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: key.status === 'Active' ? '#d1fae5' : '#f3f4f6', fontSize: '12px' }}>{key.status}</span></td>
                <td>{key.lastUsed}</td>
                <td>{key.requests.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 className="section-title">Webhooks ({api.webhooks.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Event</th>
              <th>URL</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {api.webhooks.map((webhook) => (
              <tr key={webhook.id}>
                <td>{webhook.id}</td>
                <td>{webhook.event}</td>
                <td style={{ wordBreak: 'break-all' }}>{webhook.url}</td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: webhook.status === 'Active' ? '#d1fae5' : '#f3f4f6', fontSize: '12px' }}>{webhook.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default ApiPage;
