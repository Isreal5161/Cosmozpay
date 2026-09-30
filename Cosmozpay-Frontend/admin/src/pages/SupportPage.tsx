import { mockData } from '../data/mockData';

function SupportPage() {
  const { support } = mockData;

  return (
    <div>
      <h1 className="page-heading">Customer Support</h1>
      <section className="panel">
        <h2 className="section-title">Support Tickets ({support.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>User</th>
              <th>Subject</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {support.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.id}</td>
                <td>{ticket.user}</td>
                <td>{ticket.subject}</td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: ticket.priority === 'Critical' ? '#fee2e2' : ticket.priority === 'High' ? '#fef3c7' : '#d1fae5', fontSize: '12px' }}>{ticket.priority}</span></td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: ticket.status === 'Resolved' ? '#d1fae5' : ticket.status === 'Open' ? '#fee2e2' : '#fef3c7', fontSize: '12px' }}>{ticket.status}</span></td>
                <td>{ticket.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default SupportPage;
