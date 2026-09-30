import { mockData } from '../data/mockData';

function PaymentsPage() {
  const { payments } = mockData;

  return (
    <div>
      <h1 className="page-heading">Payments</h1>
      <section className="panel">
        <h2 className="section-title">Recent Payments ({payments.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Recipient</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.id}</td>
                <td>{payment.type}</td>
                <td>₦{payment.amount}</td>
                <td>{payment.recipient}</td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: payment.status === 'Completed' ? '#d1fae5' : payment.status === 'Processing' ? '#fef3c7' : '#f3f4f6', fontSize: '12px' }}>{payment.status}</span></td>
                <td>{payment.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default PaymentsPage;
