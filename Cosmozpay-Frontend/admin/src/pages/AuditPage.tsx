import { mockData } from '../data/mockData';

function AuditPage() {
  const { audit } = mockData;

  return (
    <div>
      <h1 className="page-heading">Audit Logs</h1>
      <section className="panel">
        <h2 className="section-title">Admin Action Log ({audit.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Audit ID</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Target</th>
              <th>Timestamp</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {audit.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{log.admin}</td>
                <td>{log.action}</td>
                <td>{log.target}</td>
                <td>{log.timestamp}</td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: '#d1fae5', fontSize: '12px' }}>{log.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default AuditPage;
